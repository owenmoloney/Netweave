# Contributing to Netweave

Thank you for your interest in contributing! Netweave is a self-hosted professional network visualization tool. Contributions that improve reliability, usability, and self-hosting are especially welcome.

## Getting Started

1. Fork the repository and clone your fork
2. Install dependencies: `npx pnpm@9 install`
3. Set up environment files:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
4. Run migrations: `cd server && npx pnpm@9 db:migrate`
5. Start dev servers: `cd .. && npx pnpm@9 dev`

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for more detail on the codebase and feature history.

## Development Workflow

1. Create a branch from `main`: `git checkout -b feat/your-feature`
2. Make your changes with clear, focused commits
3. Run checks locally before opening a PR:
   ```bash
   npx pnpm@9 lint
   npx pnpm@9 test
   npx pnpm@9 build
   ```
4. Open a pull request with a concise description of what changed and why

## Code Conventions

- TypeScript strict mode throughout — no `any`
- Match existing patterns in `client/`, `server/`, and `shared/`
- Shared Zod schemas live in `shared/src/schemas.ts`
- React components use PascalCase; hooks use `use` prefix
- Keep PRs focused — one logical change per PR when possible

## Tests

- **Unit tests:** `npx pnpm@9 test` (Vitest)
- **E2E tests:** `cd client && npx pnpm@9 test:e2e` (Playwright — starts client + server)

Add or update tests when changing behavior that is already covered, or when fixing a bug.

## Questions

Open a GitHub Issue with the "question" label, or start a Discussion if enabled on the repo.
