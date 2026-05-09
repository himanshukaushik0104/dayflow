import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import logger from '../logger.js';

// Verifies a Supabase access token and attaches { id, email } to req.user.
// On any failure responds 401 — never reveals why.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    logger.warn('auth failed', { reason: error?.message });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = { id: data.user.id, email: data.user.email };
  next();
}
