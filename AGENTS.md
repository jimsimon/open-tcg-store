# AGENTS.md — OpenTCGS

Full-stack TCG store management app. Monorepo with `packages/api` (Koa + GraphQL) and `packages/ui` (Lit SSR + Web Awesome).

## Tech Stack

Lit 3 + Web Awesome 3.4 | Koa.js 3 + GraphQL | PostgreSQL / libsql via Drizzle ORM | Better Auth (anonymous, organization, admin plugins) | Vite 8 | TypeScript 6 | Vitest 4 + Playwright | oxlint + oxfmt | Tilt | pnpm 10

## Key Directories

- `packages/api/src/services/` — Business logic (never put DB queries in resolvers)
- `packages/api/src/schema/<domain>/` — GraphQL schemas + resolvers per domain
- `packages/api/src/db/otcgs/` — Drizzle schemas and relations
- `packages/api/src/lib/permissions.ts` — Role definitions (owner, manager, member, user)
- `packages/ui/src/pages/` — Page components (`<name>.server.ts` + `<name>.client.ts`)
- `packages/ui/src/components/` — Shared components (ogs-page, ogs-wizard, ogs-two-pane-panel)
- `packages/ui/src/graphql/` — Generated client types
- `scripts/populate-tcg-data.ts` — TCG data fetcher

## Patterns

**Service layer**: All business logic in `packages/api/src/services/`. Resolvers delegate to services.

**Schema-first GraphQL**: Define `.graphql` in `packages/api/src/schema/<domain>/`, add resolvers in `resolvers/`, run `pnpm graphql:generate`. API types go to `packages/api/src/schema/`, UI types to `packages/ui/src/graphql/`.

**SSR + Hydration**: HTTP → Koa → Lit SSR → HTML → client hydration → GraphQL for data ops.

**New page**: Create `packages/ui/src/pages/<name>/<name>.server.ts` + `<name>.client.ts`, add route in `packages/ui/src/server.ts`.

**New DB table**: Create `<name>-schema.ts` + `<name>-relations.ts` in `packages/api/src/db/otcgs/`, export from `schema.ts` and `index.ts`, run `pnpm --filter @open-tcgs/api db:push:main`.

**Access control** (3 layers): UI nav visibility (`ogs-page.ts`), route middleware (`requirePermission()` in `server.ts`), GraphQL resolver checks. Roles: `owner` (full), `manager` (dashboard/inventory/orders/transaction log), `member` (inventory/orders), `user` (shop/cart).

## Migrations

Two separate SQLite databases, each with its own Drizzle config:

- **Main DB** (`packages/api/src/db/otcgs/drizzle.config.ts`): Uses tracked migrations in `packages/api/src/db/otcgs/migrations/`. Schema source: `schema.ts`. DB file: `sqlite-data/otcgs.sqlite`.
- **TCG Data DB** (`packages/api/src/db/tcg-data/drizzle.config.ts`): Push-only (no tracked migrations). DB file: `sqlite-data/tcg-data.sqlite`.

**Workflow**: Changing any `*-schema.ts` in `packages/api/src/db/otcgs/` auto-generates and stages a migration via the pre-commit hook. CI verifies committed migrations match the schema — PRs fail if migrations are missing or stale. Use `db:push:main` for local dev (bypasses migrations); use `db:generate` + `db:migrate` for tracked changes.

## Commands

```bash
pnpm install                                     # Install deps
tilt up                                          # Dev servers (API then UI)
pnpm graphql:generate                            # Generate GraphQL types
pnpm --filter @open-tcgs/api db:push:main        # Push schema to dev DB
pnpm --filter @open-tcgs/api db:push:tcg-data    # Push TCG data schema
pnpm --filter @open-tcgs/api db:generate         # Generate migration from schema diff
pnpm --filter @open-tcgs/api db:migrate          # Apply pending migrations
pnpm --filter @open-tcgs/api db:check            # Verify migration metadata integrity
pnpm test:run                                    # All tests once
pnpm vitest run --project API                    # API tests (Node.js)
pnpm vitest run --project UI                     # UI tests (Playwright)
pnpm test:coverage                               # Coverage (60% threshold)
pnpm lint && pnpm format                         # Lint + format
pnpm --filter @open-tcgs/api build               # Build API
pnpm --filter @open-tcgs/ui build                # Build UI
```

## Testing

- **API tests**: `packages/api/src/**/*.test.ts` — Node.js environment
- **UI tests**: `packages/ui/src/components/**/*.test.ts` and `packages/ui/src/**/*.client.test.ts` — browser mode (Playwright/chromium)
- Co-located with source files (`.test.ts` suffix)

## CI

GitHub Actions on PRs/pushes to `main`: lint + format check, API tests + coverage, UI browser tests, migration check.

## Pre-Commit (Husky)

1. `pnpm graphql:generate` + stage generated files
2. Auto-generate migrations if `*-schema.ts` changed
3. lint-staged (oxlint + oxfmt)

## Code Owner

`@jimsimon`
