# Deployment Guide

Netweave is a Vite client on **Vercel** plus **Supabase** (Auth + Postgres). There is no Express server to host. The browser talks to Supabase directly; **Row Level Security** is the security model.

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/20261029120000_init.sql` in the SQL Editor
3. Authentication → Providers → Email: disable **Confirm email** unless you want that flow
4. Project Settings → API: copy **Project URL** and **anon public** key
5. Do not expose the **service_role** key

Confirm RLS is enabled on `nodes` and `edges` (Table Editor → a table → RLS). A second test account must not see the first account’s graph.

## 2. Local

```bash
cp client/.env.example client/.env
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...

npx pnpm@9 dev
```

## 3. Vercel

1. Import the GitHub repo
2. Framework: Vite. Install/build come from `vercel.json` (repo root, pnpm workspace)
3. Environment variables (Production and Preview):

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | anon public key |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web client ID (optional; Import from Google) |

4. Deploy and register at the Vercel URL

If you enable email confirmation, add the Vercel URL under Supabase **Authentication → URL Configuration** (`Site URL` and redirect allow list).

## 4. Google Calendar + Gmail import

Gmail is a **restricted** OAuth scope. Keep the consent screen in **Testing** and add your Google account as a test user. Do not publish this as a public Gmail app.

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Google Calendar API** and **Gmail API**
3. OAuth consent screen → External → User type Testing → add yourself as a test user
4. Credentials → Create credentials → OAuth client ID → **Web application**
5. Authorized JavaScript origins:
   - `http://localhost:5173`
   - `https://your-app.vercel.app`
6. Copy the client ID into `VITE_GOOGLE_CLIENT_ID` locally and on Vercel
7. In Supabase SQL editor, also run `supabase/migrations/20261029123000_person_email_unique.sql`

The access token stays in memory for one import. Netweave login stays email/password; Google is only linked for that button.

## Production checklist

- [ ] SQL migration applied
- [ ] RLS enabled; second account cannot read the first graph
- [ ] Confirm email setting matches how you want signup to work
- [ ] Anon key only in Vercel (never service role)
- [ ] You have a backup plan for the Supabase database
