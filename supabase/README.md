# Supabase setup for DayFlow

Migrations live in `supabase/migrations/` and are designed to be run in order in the Supabase **SQL Editor** (Dashboard → SQL → New query → paste → Run). They are idempotent — safe to re-run.

## 1. Create the project
1. Go to <https://supabase.com> → New project.
2. Pick a region close to you. Save the **Project URL** and **anon** + **service_role** keys (Settings → API).
3. Fill in:
   - `client/.env` → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - `server/.env` → `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

## 2. Run the migrations (in order)
| # | File | What it does |
|---|------|--------------|
| 1 | `0001_schema.sql` | Creates `profiles`, `routine_slots`, `daily_completions`, `tasks` + indexes + `updated_at` trigger |
| 2 | `0002_rls.sql` | Enables RLS on all four tables and adds owner-only policies |
| 3 | `0003_profile_trigger.sql` | Auto-creates a `profiles` row on every new `auth.users` insert |
| 4 | `0004_storage_avatars.sql` | Creates the `avatars` bucket (public-read) with owner-folder write policies |

Open each file, paste the contents into the SQL editor, click **Run**.

## 3. Enable Google OAuth (dashboard only)
1. Authentication → Providers → **Google** → toggle on.
2. In Google Cloud Console, create an OAuth 2.0 Client ID (Web application). Authorized redirect URI:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
3. Paste the Google **Client ID** and **Client Secret** into the Supabase Google provider page.
4. Authentication → URL Configuration → add your local + production site URLs (`http://localhost:5173`, your Vercel URL).

## 4. Verify
Run this in the SQL editor — should return four rows, all `rls_enabled = true`:
```sql
select tablename, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles','routine_slots','daily_completions','tasks');
```

And confirm the avatars bucket exists:
```sql
select id, name, public from storage.buckets where id = 'avatars';
```
