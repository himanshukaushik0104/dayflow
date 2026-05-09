import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../lib/validate.js';
import logger from '../logger.js';

const router = Router();
router.use(requireAuth);

const ALLOWED = new Set(['login', 'signup']);

// Auth happens client-side via supabase-js, so the server never sees
// it directly. The client posts here after a successful auth so the
// "user logged in" / "user signed up" events hit Winston.
router.post('/log', (req, res, next) => {
  try {
    const { event } = req.body ?? {};
    if (!ALLOWED.has(event)) throw new HttpError(400, 'event invalid');
    const message = event === 'signup' ? 'user signed up' : 'user logged in';
    logger.info(message, { user_id: req.user.id, email: req.user.email });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
