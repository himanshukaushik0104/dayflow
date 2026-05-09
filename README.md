# DayFlow

A daily routine tracker with a unified timeline. Authenticated, multi-user, with theme support and full profile management.

- **Frontend**: React + Vite (deployed on Vercel)
- **Backend**: Node.js + Express (deployed on Render)
- **Data + Auth + Storage**: Supabase (Postgres, Supabase Auth, Supabase Storage)
- **Logging**: Winston (structured JSON in production)

---

## Repo layout

```
.
├── client/                React + Vite app
│   ├── src/
│   ├── .env.example
│   └── vite.config.js
├── server/                Express + Winston API
│   ├── src/
│   └── .env.example
├── supabase/              SQL migrations + setup README
│   └── migrations/
├── DESIGN.md              Design system (source of truth for colors/spacing)
├── stitch-today.html      Visual reference for the Today view
└── package.json           npm workspaces root
```

## Prerequisites

- Node 18+
- A Supabase project (free tier is fine)

## Local development

### 1. Install dependencies

```bash
npm install
```

This installs both workspaces (`client` and `server`) thanks to npm workspaces.

### 2. Set up Supabase

Follow `supabase/README.md` to:

1. Create the project and copy the URL + anon + service_role keys.
2. Run the four SQL migrations in `supabase/migrations/` in order.
3. Enable the Google OAuth provider (optional, but the app's "Continue with Google" button needs it).

### 3. Configure environment

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Fill them in (see [Environment variables](#environment-variables) below).

### 4. Run

```bash
npm run dev
```

This boots both servers in parallel:

- Client → <http://localhost:5173>
- API → <http://localhost:8080> (configurable via `PORT`)

Or run them individually:

```bash
npm run dev:client
npm run dev:server
```

---

## Deployment

### Frontend on Vercel

1. Import the repo in Vercel.
2. **Root directory**: `client`
3. **Build command**: `npm run build`
4. **Output directory**: `dist`
5. Add the three `VITE_*` env vars under Project → Settings → Environment Variables. `VITE_API_URL` should point to your Render backend URL (e.g. `https://dayflow-api.onrender.com`).
6. Add the deployed Vercel URL to Supabase → Authentication → URL Configuration → Site URL / Redirect URLs so OAuth works.

### Backend on Render

1. New → Web Service → connect the repo.
2. **Root directory**: `server`
3. **Build command**: `npm install`
4. **Start command**: `npm start`
5. Add the `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `PORT` env vars (Render sets `PORT` automatically; you can leave it unset and the app falls back to 8080).
6. Set `NODE_ENV=production` so Winston emits structured JSON logs (the Render dashboard parses them).

After both are live, update `VITE_API_URL` on Vercel to point at the Render URL and redeploy the frontend.

---

## Environment variables

### `client/.env`

| Variable | Required | Example | Notes |
|---|---|---|---|
| `VITE_SUPABASE_URL` | yes | `https://abc123.supabase.co` | From Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | yes | `eyJhbGc…` | The **anon** public key. Safe to ship in the bundle. |
| `VITE_API_URL` | yes | `http://localhost:8080` | The Express API base URL. Production: your Render URL. |

### `server/.env`

| Variable | Required | Example | Notes |
|---|---|---|---|
| `SUPABASE_URL` | yes | `https://abc123.supabase.co` | Same project as the client. |
| `SUPABASE_SERVICE_KEY` | yes | `eyJhbGc…` | The **service_role** key. **Never expose to the browser.** Bypasses RLS, so route handlers always scope queries by `req.user.id`. |
| `PORT` | no | `8080` | Defaults to 8080. Render sets this automatically. |
| `NODE_ENV` | no | `production` | Switches Winston to JSON output. |
| `LOG_LEVEL` | no | `debug` | Override the default level (`debug` in dev, `info` in prod). |

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run both client and server in parallel |
| `npm run dev:client` | Vite dev server |
| `npm run dev:server` | API with `node --watch` |
| `npm run build:client` | Build the frontend (`client/dist`) |

---

## Notes

- **Service-role key never leaves the server.** The client uses the anon key + Supabase Auth; protected API calls go via `Authorization: Bearer <jwt>`. The Express middleware (`server/src/middleware/auth.js`) verifies the JWT through the service-role admin client and attaches `req.user` for handlers.
- **Row Level Security** is enabled on every table. The service-role key bypasses it, so handlers must (and do) include `eq('user_id', req.user.id)` on every query.
- **Theme persistence**: localStorage wins on first paint (no flash); after sign-in the server-side `profiles.theme` reconciles across devices.
- **Routine vs. tasks**: routine slots are a repeating template; daily completions are stored separately so reordering or editing a slot tomorrow doesn't rewrite history. Tasks are one-off and live on a single date.
