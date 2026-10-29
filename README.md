# Netweave

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Personal professional network graph** — map people, companies, and how you met them on an interactive force-directed canvas.

Your graph is private to your account. Data lives in **Supabase Postgres** (survives deploys). The UI is a Vite app you run locally or host on **Vercel**.

---

## Quick Start

1. Create a free [Supabase](https://supabase.com) project.
2. In **SQL Editor**, paste and run `supabase/migrations/20261029120000_init.sql`.
3. In **Authentication → Providers → Email**, turn off **Confirm email** for personal use (otherwise signup waits on a confirmation mail).
4. Copy the project URL and anon key from **Project Settings → API**.

```bash
git clone https://github.com/owenmoloney/Netweave.git
cd netweave
npx pnpm@9 install

cp client/.env.example client/.env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

npx pnpm@9 dev
```

Open **http://localhost:5173**, register an account, and start mapping your network.

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for tests and architecture.

---

## Using Netweave When Networking

**After a conference or meetup**

1. Click **+** → **Add Person** — name, title, optional company
2. Open their detail panel → **Add Connection** — record how/where you met, date, and context
3. Set **strength** (1–5) to signal follow-up priority

**Ongoing**

- Link people to **Company** nodes to see clusters form on the canvas
- Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux) to fuzzy-search anyone in your network
- Drag nodes to arrange the graph; positions auto-save
- Click a node to browse all their connections and jump between contacts

---

## Privacy

- Contact data is stored in **your** Supabase project
- Row Level Security limits each account to its own nodes and edges
- Never put the Supabase **service role** key in the frontend or Vercel env

## Backup

Use the Supabase dashboard to export Postgres, or `pg_dump` from the database connection string.

---

## Deployment

Vercel hosts the client. Supabase hosts auth and the database. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

Report security issues per [SECURITY.md](SECURITY.md) — do not file public issues for vulnerabilities.

## License

[MIT](LICENSE)
