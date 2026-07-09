# Development History

This document tracks implementation phases for contributors. See [CONTRIBUTING.md](../CONTRIBUTING.md) for how to run and test the project locally.

## Phase 2 (Core Graph)

- Full CRUD API for nodes and edges with Zod validation
- TanStack Query mutation hooks with optimistic updates
- Add Person / Add Company modals
- Add Connection modal from detail panel
- Node detail panel with view/edit/delete
- Position save on node drag (debounced 500ms)
- Save status indicator in header

## Phase 3 (Polish & Search)

- Edge pulse animation (4s sine cycle, stronger edges pulse brighter)
- Node glow and edge brighten on hover, relationship tooltip on edges
- Smooth `focusNode` pan/zoom animation
- Search bar (`Cmd+K`) with Fuse.js fuzzy search
- Enhanced connection details in node panel
- Error toast notifications
- Responsive layout (panel overlays on narrow screens)

## Phase 4 (Hardening)

- Unit tests: Zustand store, Zod schemas, sanitization
- Integration tests: auth flow, node CRUD, edge cascade (Vitest + Supertest)
- E2E tests: add person/company, detail panel, search, delete (Playwright)
- Canvas error boundary
- Loading skeleton for initial graph fetch
- Disconnected / offline state with retry
- 404 page for unknown routes
- Input sanitization on backend (HTML strip)
- `.env.example` files documented

## Architecture

```
/client   — React frontend (Vite, Tailwind, Zustand, D3 canvas)
/server   — Express API (Prisma, JWT auth)
/shared   — Shared types and Zod schemas
```

The full product specification lives in [SPEC.md](SPEC.md).

## Local Development

```bash
# Install dependencies
npx pnpm@9 install

# Run database migration
cd server && npx pnpm@9 db:migrate

# Seed demo user (optional — register also creates demo data)
npx pnpm@9 db:seed

# Start dev servers (client + server)
cd .. && npx pnpm@9 dev
```

- **Client:** http://localhost:5173
- **Server:** http://localhost:3001

### Demo credentials (dev/seed only)

- Email: `demo@netweave.app`
- Password: `password123`

Or register a new account — a Self node plus demo Person/Company nodes are created automatically.

### Running tests

```bash
# All unit + integration tests
npx pnpm@9 test

# E2E (starts client + server automatically)
cd client && npx pnpm@9 test:e2e
```
