import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAuth } from '../middleware/auth.js';
import {
  HttpError,
  isTime,
  isCategory,
  isDayOfWeek,
  requireString,
} from '../lib/validate.js';
import logger from '../logger.js';

const router = Router();
router.use(requireAuth);

// GET /api/routine[?day=N] — without `day`, returns every slot. With
// `day`, returns slots scoped to that weekday plus the every-day slots
// (day_of_week IS NULL), so the Today view shows one combined list.
router.get('/', async (req, res, next) => {
  try {
    const dayRaw = req.query.day;
    let query = supabaseAdmin
      .from('routine_slots')
      .select('id, time, label, note, category, position, day_of_week')
      .eq('user_id', req.user.id)
      .order('time', { ascending: true })
      .order('position', { ascending: true });

    if (dayRaw !== undefined) {
      const day = Number(dayRaw);
      if (!isDayOfWeek(day)) throw new HttpError(400, 'day must be 0..6');
      query = query.or(`day_of_week.is.null,day_of_week.eq.${day}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { time, label, note, category, position, day_of_week } = req.body ?? {};
    if (!isTime(time)) throw new HttpError(400, 'time must be HH:MM');
    requireString(label, 'label', { max: 120 });
    if (!isCategory(category)) throw new HttpError(400, 'category invalid');
    if (note !== undefined && note !== null && typeof note !== 'string') {
      throw new HttpError(400, 'note invalid');
    }
    if (day_of_week !== undefined && day_of_week !== null && !isDayOfWeek(day_of_week)) {
      throw new HttpError(400, 'day_of_week must be 0..6 or null');
    }

    const row = {
      user_id: req.user.id,
      time,
      label: label.trim(),
      note: note ?? null,
      category,
      position: Number.isInteger(position) ? position : 0,
      day_of_week: day_of_week ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from('routine_slots')
      .insert(row)
      .select('id, time, label, note, category, position, day_of_week')
      .single();
    if (error) throw error;

    logger.info('routine slot created', { user_id: req.user.id, slot_id: data.id });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// IMPORTANT: must be declared before '/:id' so 'reorder' isn't treated as an id.
router.put('/reorder', async (req, res, next) => {
  try {
    const { items } = req.body ?? {};
    if (!Array.isArray(items) || items.length === 0) {
      throw new HttpError(400, 'items array required');
    }
    for (const it of items) {
      if (!it || typeof it.id !== 'string' || !Number.isInteger(it.position)) {
        throw new HttpError(400, 'each item needs id and integer position');
      }
    }

    const results = await Promise.all(
      items.map((it) =>
        supabaseAdmin
          .from('routine_slots')
          .update({ position: it.position })
          .eq('id', it.id)
          .eq('user_id', req.user.id),
      ),
    );
    const failed = results.find((r) => r.error);
    if (failed) throw failed.error;

    logger.info('routine reordered', { user_id: req.user.id, count: items.length });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/routine/copy { from: 0..6, to: 0..6 } — replace `to`-day's
// single-day slots with copies of `from`-day's single-day slots. Slots
// with day_of_week=null aren't touched (they already apply to every day).
router.post('/copy', async (req, res, next) => {
  try {
    const { from, to } = req.body ?? {};
    if (!isDayOfWeek(from)) throw new HttpError(400, 'from must be 0..6');
    if (!isDayOfWeek(to)) throw new HttpError(400, 'to must be 0..6');
    if (from === to) throw new HttpError(400, 'from and to must differ');

    const { data: source, error: srcErr } = await supabaseAdmin
      .from('routine_slots')
      .select('time, label, note, category, position')
      .eq('user_id', req.user.id)
      .eq('day_of_week', from);
    if (srcErr) throw srcErr;

    const { error: delErr } = await supabaseAdmin
      .from('routine_slots')
      .delete()
      .eq('user_id', req.user.id)
      .eq('day_of_week', to);
    if (delErr) throw delErr;

    let inserted = [];
    if (source.length > 0) {
      const rows = source.map((s) => ({
        user_id: req.user.id,
        time: s.time,
        label: s.label,
        note: s.note,
        category: s.category,
        position: s.position,
        day_of_week: to,
      }));
      const { data: ins, error: insErr } = await supabaseAdmin
        .from('routine_slots')
        .insert(rows)
        .select('id, time, label, note, category, position, day_of_week');
      if (insErr) throw insErr;
      inserted = ins;
    }

    logger.info('routine day copied', {
      user_id: req.user.id,
      from,
      to,
      count: inserted.length,
    });
    res.json({ inserted });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { time, label, note, category, position, day_of_week } = req.body ?? {};
    const patch = {};
    if (time !== undefined) {
      if (!isTime(time)) throw new HttpError(400, 'time must be HH:MM');
      patch.time = time;
    }
    if (label !== undefined) {
      requireString(label, 'label', { max: 120 });
      patch.label = label.trim();
    }
    if (note !== undefined) {
      if (note !== null && typeof note !== 'string') throw new HttpError(400, 'note invalid');
      patch.note = note;
    }
    if (category !== undefined) {
      if (!isCategory(category)) throw new HttpError(400, 'category invalid');
      patch.category = category;
    }
    if (position !== undefined) {
      if (!Number.isInteger(position)) throw new HttpError(400, 'position must be integer');
      patch.position = position;
    }
    if (day_of_week !== undefined) {
      if (day_of_week !== null && !isDayOfWeek(day_of_week)) {
        throw new HttpError(400, 'day_of_week must be 0..6 or null');
      }
      patch.day_of_week = day_of_week;
    }
    if (Object.keys(patch).length === 0) throw new HttpError(400, 'nothing to update');

    const { data, error } = await supabaseAdmin
      .from('routine_slots')
      .update(patch)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('id, time, label, note, category, position, day_of_week')
      .single();
    if (error) throw error;
    if (!data) throw new HttpError(404, 'not found');

    logger.info('routine slot updated', { user_id: req.user.id, slot_id: id });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, count } = await supabaseAdmin
      .from('routine_slots')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', req.user.id);
    if (error) throw error;
    if (!count) throw new HttpError(404, 'not found');

    logger.info('routine slot deleted', { user_id: req.user.id, slot_id: id });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
