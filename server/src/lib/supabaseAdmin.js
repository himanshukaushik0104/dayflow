import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars. Copy server/.env.example to server/.env and fill in.',
  );
}

// Service-role client. Bypasses RLS, so route handlers must always
// scope queries by req.user.id (set by the auth middleware).
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
