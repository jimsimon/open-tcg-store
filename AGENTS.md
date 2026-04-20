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
- **TCG Data DB** (`packages/api/src/db/tcg-data/drizzle.config.ts`): Uses tracked migrations in `packages/api/src/db/tcg-data/migrations/`. Schema source: `schema.ts`. DB file: `sqlite-data/tcg-data.sqlite`.

**Workflow**: Changing any `*-schema.ts` in `packages/api/src/db/otcgs/` auto-generates and stages a migration via the pre-commit hook. CI verifies committed migrations match the schema — PRs fail if migrations are missing or stale. Use `db:push:main` for local dev (bypasses migrations); use `db:generate` + `db:migrate` for tracked changes. For TCG Data DB schema changes, use `db:generate:tcg-data` + `db:migrate:tcg-data`.

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
pnpm --filter @open-tcgs/api db:generate:tcg-data # Generate TCG data migration
pnpm --filter @open-tcgs/api db:migrate:tcg-data  # Apply pending TCG data migrations
pnpm --filter @open-tcgs/api db:check:tcg-data    # Verify TCG data migration integrity
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

## Button Guidelines

All buttons use `<wa-button>` from Web Awesome. Only use valid attribute values.

**Valid API**: `variant` = `neutral` | `brand` | `success` | `warning` | `danger`. `appearance` = `accent` (default) | `filled` | `outlined` | `plain`. `size` = `small` | `medium` (default) | `large`. Icon slots: `start`, `end`, or default.

**Appearance hierarchy** (most → least prominent): `accent` (default) → `filled` → `outlined` → `plain`.

| Action Type                                 | variant   | appearance       | size    | Icon                         | Notes                                           |
| ------------------------------------------- | --------- | ---------------- | ------- | ---------------------------- | ----------------------------------------------- |
| Primary page CTA (Add, Create)              | `brand`   | accent (default) | default | `plus slot="start"`          | —                                               |
| Form save (Save, Update)                    | `brand`   | accent (default) | default | `floppy-disk slot="start"`   | Use `?loading`                                  |
| Destructive confirm (Delete, Remove dialog) | `danger`  | accent (default) | default | `trash`/`xmark slot="start"` | —                                               |
| Dialog cancel/dismiss                       | `neutral` | accent (default) | default | none                         | Use `autofocus` when cancel is the safe default |
| Table row Edit                              | `neutral` | accent (default) | `small` | `pen-to-square slot="start"` | —                                               |
| Table row Delete/Remove                     | `danger`  | accent (default) | `small` | `trash`/`xmark slot="start"` | —                                               |
| Table row Complete                          | `success` | accent (default) | `small` | `check slot="start"`         | —                                               |
| Table row Re-open                           | `neutral` | accent (default) | `small` | `rotate-left slot="start"`   | —                                               |
| Warning confirm                             | `warning` | accent (default) | default | —                            | e.g., "Keep $0 Cost Basis"                      |
| Inline remove (editable list row)           | `danger`  | `plain`          | `small` | `trash`                      | Minimal styling                                 |
| Inline reset/utility                        | `neutral` | `plain`          | `small` | varies                       | Minimal styling                                 |
| Nav arrows & calendar controls              | `neutral` | `plain`          | `small` | chevron icons                | —                                               |
| Back/Previous navigation                    | `neutral` | `outlined`       | default | `arrow-left slot="start"`    | Subtle is appropriate                           |
| Quantity stepper (+/−)                      | `neutral` | `outlined`       | `small` | `minus`/`plus`               | —                                               |
| Pagination active page                      | `brand`   | accent (default) | `small` | —                            | —                                               |
| Pagination inactive page                    | `neutral` | accent (default) | `small` | —                            | —                                               |
| Pagination prev/next                        | `neutral` | `plain`          | `small` | chevron icons                | —                                               |
| Toggle group selected                       | `brand`   | `filled`         | `small` | —                            | In `<wa-button-group>`                          |
| Toggle group unselected                     | `neutral` | `filled`         | `small` | —                            | In `<wa-button-group>`                          |
| Storefront Add to Cart                      | `brand`   | accent (default) | varies  | `cart-plus`                  | Icon-only on grid cards                         |
| Inline edit cancel (not dialog)             | `neutral` | `outlined`       | `small` | none                         | Pairs with Save/primary                         |

**Key rules**: Never use `appearance="outlined"` on action buttons (too subtle). Never use invalid values (`variant="text"`, `variant="ghost"`, `variant="default"`, `appearance="text"`). Always specify `variant` explicitly. Use `slot="start"` for icons (never `slot="prefix"`).

## Code Owner

`@jimsimon`
