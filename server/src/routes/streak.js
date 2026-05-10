import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, isDate } from '../lib/validate.js';

const router = Router();
router.use(requireAuth);

const MAX_LOOKBACK_DAYS = 365;

function shiftDate(yyyymmdd, deltaDays) {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function dayOfWeekFor(yyyymmdd) {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// GET /api/streak?date=YYYY-MM-DD — consecutive fully-complete days
// ending today (or yesterday, if today isn't done yet so the streak
// doesn't visually drop to 0 first thing in the morning).
router.get('/', async (req, res, next) => {
  try {
    const today = req.query.date;
    if (!isDate(today)) throw new HttpError(400, 'date query param must be YYYY-MM-DD');

    const startDate = shiftDate(today, -MAX_LOOKBACK_DAYS);

    const [slotsRes, compsRes, tasksRes] = await Promise.all([
      supabaseAdmin
        .from('routine_slots')
        .select('id, day_of_week')
        .eq('user_id', req.user.id),
      supabaseAdmin
        .from('daily_completions')
        .select('date, slot_id, completed')
        .eq('user_id', req.user.id)
        .gte('date', startDate)
        .lte('date', today),
      supabaseAdmin
        .from('tasks')
        .select('date, done')
        .eq('user_id', req.user.id)
        .gte('date', startDate)
        .lte('date', today),
    ]);
    if (slotsRes.error) throw slotsRes.error;
    if (compsRes.error) throw compsRes.error;
    if (tasksRes.error) throw tasksRes.error;

    // Index slots once: map slot_id -> day_of_week (null = every day)
    // and pre-compute the active count per day-of-week (0..6) so the
    // per-date check is a quick lookup.
    const slotDow = new Map();
    const countByDow = [0, 0, 0, 0, 0, 0, 0];
    for (const s of slotsRes.data) {
      slotDow.set(s.id, s.day_of_week);
      if (s.day_of_week === null) {
        for (let i = 0; i < 7; i++) countByDow[i] += 1;
      } else {
        countByDow[s.day_of_week] += 1;
      }
    }

    const byDate = new Map();
    const ensure = (d) => {
      let entry = byDate.get(d);
      if (!entry) {
        entry = { completedSlots: new Set(), taskCount: 0, taskUndone: 0 };
        byDate.set(d, entry);
      }
      return entry;
    };
    for (const c of compsRes.data) {
      // Only count completions tied to a slot that's relevant for that
      // date's weekday — i.e., the slot is every-day, or its day matches.
      const slotDay = slotDow.get(c.slot_id);
      if (slotDay === undefined) continue; // slot was deleted
      const dateDow = dayOfWeekFor(c.date);
      if (slotDay !== null && slotDay !== dateDow) continue;
      const entry = ensure(c.date);
      if (c.completed) entry.completedSlots.add(c.slot_id);
    }
    for (const t of tasksRes.data) {
      const entry = ensure(t.date);
      entry.taskCount += 1;
      if (!t.done) entry.taskUndone += 1;
    }

    const isDayComplete = (dateStr) => {
      const entry = byDate.get(dateStr);
      const taskCount = entry?.taskCount ?? 0;
      const taskUndone = entry?.taskUndone ?? 0;
      const completedSlots = entry?.completedSlots.size ?? 0;
      const routineCount = countByDow[dayOfWeekFor(dateStr)];
      const total = routineCount + taskCount;
      if (total === 0) return false;
      return completedSlots >= routineCount && taskUndone === 0;
    };

    let cursor = today;
    if (!isDayComplete(cursor)) cursor = shiftDate(cursor, -1);

    let streak = 0;
    while (isDayComplete(cursor)) {
      streak += 1;
      cursor = shiftDate(cursor, -1);
      if (streak >= MAX_LOOKBACK_DAYS) break;
    }

    res.json({ streak });
  } catch (err) {
    next(err);
  }
});

export default router;
