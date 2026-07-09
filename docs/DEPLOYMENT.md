# Deployment Guide

Netweave is designed to be **self-hosted**. Each deployment is a private instance with its own SQLite database.

## Deployment Options

| Method | Best for | Data persistence |
|--------|----------|------------------|
| **Docker Compose** | Most users, home server | Named volume (`netweave-data`) |
| **Local dev (`pnpm dev`)** | Development only | `server/prisma/dev.db` |
| **Cloud (Render, Railway)** | Remote access | Requires persistent disk |

---

## Docker (Recommended)

See the root [README.md](../README.md). Before production use:

1. Set a strong `JWT_SECRET` (64+ random characters)
2. Set `CORS_ORIGIN` to your public URL if not using `http://localhost:8080`
3. Back up the `/data/netweave.db` file regularly

```bash
export JWT_SECRET="$(openssl rand -base64 48)"
docker compose up -d --build
```

---

## Render

Render can run Netweave from the included `Dockerfile`. **You must attach a persistent disk** or your database will be wiped on every redeploy.

### Steps

1. Create a new **Web Service** connected to your GitHub repo
2. Set **Environment** to **Docker**
3. Add a **Persistent Disk**:
   - Mount path: `/data`
   - Size: 1 GB is plenty for personal use
4. Set environment variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `DATABASE_URL` | `file:/data/netweave.db` |
| `CLIENT_DIST_PATH` | `/app/client/dist` |
| `JWT_SECRET` | *(generate a random secret)* |
| `CORS_ORIGIN` | `https://your-app.onrender.com` |

5. Deploy and register your account at the service URL

### render.yaml (optional)

You can use [render.yaml](../render.yaml) as a blueprint. Update the `CORS_ORIGIN` value to match your Render URL before deploying.

---

## Railway

1. Create a new project from the GitHub repo
2. Railway detects the `Dockerfile` automatically
3. Add a **volume** mounted at `/data`
4. Set the same environment variables as the Render table above
5. Set `CORS_ORIGIN` to your Railway public URL

Without a volume, SQLite data will not survive redeploys.

---

## Production Checklist

Before sharing your instance or announcing it publicly:

- [ ] `JWT_SECRET` is a unique, random value (not the example default)
- [ ] `CORS_ORIGIN` matches your actual frontend URL
- [ ] Database is on a persistent volume or disk
- [ ] HTTPS is enabled (most cloud platforms do this automatically)
- [ ] You have a backup plan for `netweave.db`
- [ ] Demo/seed credentials are not used in production

---

## Environment Variables Reference

### Server

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite path, e.g. `file:/data/netweave.db` |
| `JWT_SECRET` | Yes | Secret for signing auth tokens |
| `PORT` | No | Default `3001` (Docker uses `8080`) |
| `NODE_ENV` | Prod | Set to `production` to serve the built client |
| `CORS_ORIGIN` | Prod | Allowed browser origin, e.g. `https://app.example.com` |
| `CLIENT_DIST_PATH` | Prod | Path to Vite build output (Docker: `/app/client/dist`) |

### Client (build time)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API base URL. Use `/api/v1` for same-origin Docker/production builds |

---

## PostgreSQL

The original spec mentions PostgreSQL for production, but **v1 uses SQLite only**. Docker with a persistent volume is sufficient for personal and small-team self-hosting. PostgreSQL support can be added later if you need multi-region cloud hosting.

---

## Troubleshooting

**Blank page after deploy**

- Confirm `NODE_ENV=production` and `CLIENT_DIST_PATH` point to a built `client/dist`
- Check server logs for static file errors

**CORS errors in browser**

- `CORS_ORIGIN` must exactly match the URL in your browser (scheme + host + port)

**Data lost after redeploy**

- SQLite file was on ephemeral filesystem — attach a persistent volume at `/data`

**Migrations failed on startup**

- Ensure `DATABASE_URL` directory exists and is writable
- Check `docker compose logs` for Prisma errors
