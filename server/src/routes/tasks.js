import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, isDate, isTime, isCategory, requireString } from '../lib/validate.js';
import logger from '../logger.js';

const router = Router();
router.use(requireAuth);

router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    if (!isDate(date)) throw new HttpError(400, 'date must be YYYY-MM-DD');

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('id, date, time, label, note, category, done, created_at')
      .eq('user_id', req.user.id)
      .eq('date', date)
      .order('time', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;

    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { date, time, label, note, category } = req.body ?? {};
    if (!isDate(date)) throw new HttpError(400, 'date must be YYYY-MM-DD');
    if (!isTime(time)) throw new HttpError(400, 'time must be HH:MM');
    requireString(label, 'label', { max: 120 });
    if (note !== undefined && note !== null && typeof note !== 'string') {
      throw new HttpError(400, 'note invalid');
    }
    if (category !== undefined && category !== null && !isCategory(category)) {
      throw new HttpError(400, 'category invalid');
    }

    const row = {
      user_id: req.user.id,
      date,
      time,
      label: label.trim(),
      note: note ?? null,
      category: category ?? null,
      done: false,
    };

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert(row)
      .select('id, date, time, label, note, category, done, created_at')
      .single();
    if (error) throw error;

    logger.info('task created', { user_id: req.user.id, task_id: data.id, date });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { time, label, note, category, done } = req.body ?? {};
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
      if (category !== null && !isCategory(category)) throw new HttpError(400, 'category invalid');
      patch.category = category;
    }
    if (done !== undefined) {
      if (typeof done !== 'boolean') throw new HttpError(400, 'done must be boolean');
      patch.done = done;
    }
    if (Object.keys(patch).length === 0) throw new HttpError(400, 'nothing to update');

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select('id, date, time, label, note, category, done, created_at')
      .single();
    if (error) throw error;
    if (!data) throw new HttpError(404, 'not found');

    logger.info('task updated', { user_id: req.user.id, task_id: id, fields: Object.keys(patch) });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, count } = await supabaseAdmin
      .from('tasks')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', req.user.id);
    if (error) throw error;
    if (!count) throw new HttpError(404, 'not found');

    logger.info('task deleted', { user_id: req.user.id, task_id: id });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
