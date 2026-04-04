# Contributing to OpenTCGS

Thank you for your interest in contributing to OpenTCGS! This guide covers everything you need to get started.

## Tech Stack

| Layer             | Technology                                                                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend          | [Lit](https://lit.dev/) web components, [Web Awesome](https://www.webawesome.com/) UI library                                                                         |
| Backend           | [Koa.js](https://koajs.com/) with [GraphQL](https://graphql.org/) API                                                                                                 |
| Database          | [PostgreSQL](https://www.postgresql.org/) (production) / [libsql](https://github.com/tursodatabase/libsql) (development) via [Drizzle ORM](https://orm.drizzle.team/) |
| Auth              | [Better Auth](https://www.better-auth.com/) with access control plugin                                                                                                |
| Build             | [Vite](https://vite.dev/) 8, [TypeScript](https://www.typescriptlang.org/) 6                                                                                          |
| Testing           | [Vitest](https://vitest.dev/) 4 (Node.js + browser via Playwright)                                                                                                    |
| Linting           | [oxlint](https://oxc.rs/docs/guide/usage/linter) + [oxfmt](https://oxc.rs/docs/guide/usage/formatter)                                                                 |
| Dev Orchestration | [Tilt](https://tilt.dev/)                                                                                                                                             |
| Package Manager   | [pnpm](https://pnpm.io/) 10 with workspaces                                                                                                                           |

## Getting Started

### Prerequisites

- **Node.js** ^20.19.0 or >=22.12.0
- **pnpm** >= 10 (the project uses pnpm 10.33.0 via `packageManager` in `package.json`)
- **Tilt** (optional, for multi-service dev orchestration)

### Setup

```bash
git clone https://github.com/jimsimon/open-tcg-store.git
cd open-tcg-store
pnpm install
```

### Running the Dev Environment

The recommended approach uses Tilt to orchestrate the API and UI servers together:

```bash
tilt up
```

Alternatively, start each individually:

```bash
# Terminal 1 -- API server
pnpm --filter @open-tcgs/api run dev

# Terminal 2 -- UI server (start after API is running)
pnpm --filter @open-tcgs/ui run dev
```

## Project Layout

The monorepo has two packages under `packages/`:

- **`packages/api`** -- Backend: Koa.js server, GraphQL schema/resolvers, Drizzle ORM schemas, service layer, authentication
- **`packages/ui`** -- Frontend: Lit web components, page components (SSR + client pairs), GraphQL client, Web Awesome UI

Shared configuration lives at the repository root (`vite.config.ts`, `tsconfig.json`, `codegen.ts`, etc.).

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b your-feature-name
```

### 2. Make Your Changes

Follow the patterns established in the codebase:

- **New pages** -- Create `page-name.server.ts` and `page-name.client.ts` in `packages/ui/src/pages/<page-name>/`, then add a route in `packages/ui/src/server.ts`
- **New GraphQL operations** -- Add a `.graphql` schema file in `packages/api/src/schema/<domain>/`, implement resolvers in a `resolvers/` subdirectory, and create or update the corresponding service in `packages/api/src/services/`
- **New database tables** -- Create schema and relations files in `packages/api/src/db/otcgs/`, export them from `schema.ts` and `index.ts`, then run `pnpm db:push`

### 3. Generate Types

After modifying GraphQL schemas, regenerate the TypeScript types:

```bash
pnpm graphql:generate
```

### 4. Lint and Format

The project uses **oxlint** for linting and **oxfmt** for formatting:

```bash
pnpm lint        # Lint and auto-fix
pnpm format      # Format code
```

CI runs the check-only variants (`pnpm lint:check` and `pnpm format:check`), so make sure these pass before pushing.

### 5. Run Tests

Tests use **Vitest** with two project configurations:

- **API** -- Node.js environment for database, service, and utility tests
- **UI** -- Browser environment (Playwright) for Lit component and page tests

```bash
# Run all tests in watch mode
pnpm test

# Run all tests once
pnpm test:run

# Run only API tests
pnpm vitest run --project API

# Run only UI browser tests
pnpm vitest run --project UI

# Run tests with coverage
pnpm test:coverage
```

Test files are co-located with source files using a `.test.ts` suffix.

### 6. Push and Open a Pull Request

```bash
git push -u origin your-feature-name
```

Open a pull request against `main`. CI will automatically run linting, formatting, API tests, and UI browser tests.

## Coding Standards

### General

- **TypeScript** is required for all code. Enable strict mode and avoid `any` types.
- **ES modules** -- the project uses `"type": "module"` and ESNext module syntax.
- Follow existing code patterns and naming conventions.

### Frontend (UI)

- All UI elements must be **Lit custom elements**.
- Use **Web Awesome** components for consistent styling.
- Each page needs a server template (`*.server.ts`) and a client component (`*.client.ts`).
- Use the GraphQL client utilities in `packages/ui/src/lib/graphql.ts` for data fetching.

### Backend (API)

- **Service layer pattern** -- keep business logic in `packages/api/src/services/`, not in GraphQL resolvers.
- **GraphQL-first** -- define schemas before implementing resolvers.
- Use **Drizzle ORM** for all database operations with proper relations.
- Protect mutations with **Better Auth access control** where appropriate (e.g., employee role for inventory operations, admin role for settings).

### Testing

- Co-locate test files alongside source files (`foo.ts` -> `foo.test.ts`).
- Use Vitest's browser mode (Playwright) for UI component tests.
- Use the Node.js environment for service and database tests.
- Aim for meaningful coverage of business logic and user-facing behavior.

## Architecture

OpenTCGS follows a **monorepo** architecture with pnpm workspaces, separating the API and UI into independent packages.

- **Service layer pattern** -- business logic is decoupled from GraphQL resolvers
- **Monorepo boundary** -- `api` and `ui` are independent packages. Avoid importing directly between them; communicate through the GraphQL API.
- **Schema-first GraphQL** -- changes to the API start with editing `.graphql` schema files, then generating types, then implementing resolvers.
- **SSR + Hydration** -- pages are server-rendered with Lit SSR and hydrated on the client. Keep this in mind when writing components (e.g., avoid browser-only APIs in server render paths).
- **Role-based access** -- enforce access control at three layers: UI visibility, route middleware, and GraphQL resolvers.

### Data Flow

1. HTTP request hits the Koa server
2. Router dispatches to the appropriate page handler
3. Server-side renders the page using Lit components
4. HTML response sent to the client
5. Client-side JavaScript hydrates interactive components
6. Subsequent data operations go through the GraphQL API

## Reporting Issues

If you find a bug or have a feature request, please [open an issue](https://github.com/jimsimon/open-tcg-store/issues) with a clear description and steps to reproduce (if applicable).

## Questions?

Feel free to open a discussion or issue if you have questions about the codebase or contribution process.
