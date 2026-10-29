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

4. Deploy and register at the Vercel URL

If you enable email confirmation, add the Vercel URL under Supabase **Authentication → URL Configuration** (`Site URL` and redirect allow list).

## Production checklist

- [ ] SQL migration applied
- [ ] RLS enabled; second account cannot read the first graph
- [ ] Confirm email setting matches how you want signup to work
- [ ] Anon key only in Vercel (never service role)
- [ ] You have a backup plan for the Supabase database
