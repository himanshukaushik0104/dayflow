import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, isTime, isCategory, requireString } from '../lib/validate.js';
import logger from '../logger.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('routine_slots')
      .select('id, time, label, note, category, position')
      .eq('user_id', req.user.id)
      .order('time', { ascending: true })
      .order('position', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { time, label, note, category, position } = req.body ?? {};
    if (!isTime(time)) throw new HttpError(400, 'time must be HH:MM');
    requireString(label, 'label', { max: 120 });
    if (!isCategory(category)) throw new HttpError(400, 'category invalid');
    if (note !== undefined && note !== null && typeof note !== 'string') {
      throw new HttpError(400, 'note invalid');
    }

    const row = {
      user_id: req.user.id,
      time,
      label: label.trim(),
      note: note ?? null,
      category,
      position: Number.isInteger(position) ? position : 0,
    };

    const { data, error } = await supabaseAdmin
      .from('routine_slots')
      .insert(row)
      .select('id, time, label, note, category, position')
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

    // One UPDATE per item, all scoped to this user. Small N (a single
    // user's routine), so a loop is fine and avoids the upsert-NOT-NULL
    // gotcha (insert path would need every column).
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

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { time, label, note, category, position } = req.body ?? {};
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
    if (Object.keys(patch).length === 0) throw new HttpError(400, 'nothing to update');

    const { data, error } = await supabaseAdmin
      .from('routine_slots')
      .update(patch)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('id, time, label, note, category, position')
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
