# Netweave

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Self-hosted professional network graph** — map people, companies, and how you met them on an interactive force-directed canvas.

Netweave is a **single-user, local-first** tool. Your network lives in your own database, on your machine or server — not on a shared social platform.

---

## Quick Start (Docker)

The fastest way to run your own instance:

```bash
git clone https://github.com/owenmoloney/Netweave.git
cd netweave

# Set a strong secret before running in production
export JWT_SECRET="your-random-64-char-secret"

docker compose up -d
```

Open **http://localhost:8080**, register an account, and start mapping your network.

To stop: `docker compose down` (your data is kept in the `netweave-data` Docker volume).

---

## Quick Start (Developers)

```bash
git clone https://github.com/owenmoloney/Netweave.git
cd netweave
npx pnpm@9 install

cp server/.env.example server/.env
cp client/.env.example client/.env

cd server && npx pnpm@9 db:migrate && cd ..
npx pnpm@9 dev
```

- **Client:** http://localhost:5173
- **API:** http://localhost:3001

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for tests, demo credentials, and architecture.

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

## Privacy & Self-Hosting

- All contact data is stored in a **SQLite database you control**
- Each instance is **private to one user account** — no multi-tenant sharing
- Change `JWT_SECRET` before exposing the app beyond localhost
- Use HTTPS if you deploy to a public URL

## Backup Your Data

**Docker:** the database file lives in the `netweave-data` volume at `/data/netweave.db` inside the container.

```bash
# Example: copy DB to your machine
docker compose cp netweave:/data/netweave.db ./netweave-backup.db
```

**Local dev:** copy `server/prisma/dev.db` (or your configured `DATABASE_URL` path) regularly.

---

## Deployment

For cloud hosting (Render, Railway, etc.), persistent storage, and production environment variables, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

Report security issues per [SECURITY.md](SECURITY.md) — do not file public issues for vulnerabilities.

## License

[MIT](LICENSE)
