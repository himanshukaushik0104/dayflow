import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, isDate } from '../lib/validate.js';
import logger from '../logger.js';

const router = Router();
router.use(requireAuth);

// GET /api/completions/:date — returns the slot_ids the user has marked
// complete on that date. Frontend zips this with the routine list.
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    if (!isDate(date)) throw new HttpError(400, 'date must be YYYY-MM-DD');

    const { data, error } = await supabaseAdmin
      .from('daily_completions')
      .select('slot_id')
      .eq('user_id', req.user.id)
      .eq('date', date)
      .eq('completed', true);
    if (error) throw error;

    res.json({ date, slot_ids: data.map((r) => r.slot_id) });
  } catch (err) {
    next(err);
  }
});

// POST /api/completions { date, slot_id, completed } — upsert on
// (user_id, date, slot_id). One unique row per slot per day per user.
router.post('/', async (req, res, next) => {
  try {
    const { date, slot_id, completed } = req.body ?? {};
    if (!isDate(date)) throw new HttpError(400, 'date must be YYYY-MM-DD');
    if (typeof slot_id !== 'string' || !slot_id) throw new HttpError(400, 'slot_id required');
    if (typeof completed !== 'boolean') throw new HttpError(400, 'completed must be boolean');

    // Defence in depth: confirm the slot belongs to this user before
    // writing the completion. RLS would catch it too, but service-role
    // bypasses RLS, so we check here.
    const { data: slot, error: slotErr } = await supabaseAdmin
      .from('routine_slots')
      .select('id')
      .eq('id', slot_id)
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (slotErr) throw slotErr;
    if (!slot) throw new HttpError(404, 'slot not found');

    const { data, error } = await supabaseAdmin
      .from('daily_completions')
      .upsert(
        { user_id: req.user.id, date, slot_id, completed },
        { onConflict: 'user_id,date,slot_id' },
      )
      .select('slot_id, completed')
      .single();
    if (error) throw error;

    logger.info('completion toggled', {
      user_id: req.user.id,
      slot_id,
      date,
      completed,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
