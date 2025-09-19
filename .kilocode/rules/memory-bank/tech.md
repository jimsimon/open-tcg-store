# Technology Stack: OpenTCGS

## Core Technologies

### Frontend
- **Lit**: Modern, lightweight web component framework
- **TypeScript**: Type-safe JavaScript development
- **Web Awesome**: UI component library for consistent design
- **Vite**: Fast build tool and development server
- **Lit SSR**: Server-side rendering for Lit components

### Backend
- **Koa.js**: Web framework for Node.js
- **GraphQL**: API schema and query language
- **Better Auth**: Authentication and session management
- **Drizzle ORM**: TypeScript-first ORM for PostgreSQL

### Database
- **PostgreSQL**: Primary database for production
- **libsql**: SQLite-compatible database for development
- **Drizzle ORM**: TypeScript-first ORM with comprehensive relations
- **Drizzle Kit**: Database schema management and migrations

### Development Tools
- **Biome**: Linter and code formatter
- **Prettier**: Code formatting
- **GraphQL Codegen**: Type-safe GraphQL code generation
- **TypeScript**: Static type checking
- **Vitest**: Testing framework for both Node.js and browser environments

## Testing Framework

### Vitest Configuration
- **Browser Testing**: Uses Playwright for browser-based tests
- **Node.js Testing**: Uses Node.js environment for server-side tests
- **Test Location**: Test files are co-located with source files (`.test.ts` suffix)
- **Coverage**: V8 coverage provider with HTML, JSON, and text reporters

### Test Scripts
```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage",
  "test:browser": "vitest --browser",
  "test:browser:run": "vitest run --browser"
}
```

### Test Dependencies
```json
{
  "vitest": "^latest",
  "@vitest/browser": "^latest",
  "playwright": "^latest"
}
```

### Test Structure
- **Component Tests**: Browser-based tests for Lit components using Vitest's browser mode
- **Page Tests**: Browser-based tests for page components
- **Database Tests**: Node.js tests for database operations
- **Utility Tests**: Node.js tests for GraphQL and other utilities

## Key Dependencies

### Monorepo Dependencies
```json
{
  "lit": "^3.3.1",
  "@awesome.me/webawesome": "3.0.0-beta.5",
  "@lit-labs/ssr": "^3.3.1",
  "vite": "^7.1.3",
  "koa": "^3.0.1",
  "better-auth": "^1.3.11",
  "drizzle-orm": "^0.44.4",
  "@libsql/client": "^0.15.14",
  "graphql-http": "^1.22.4",
  "@graphql-tools/schema": "^10.0.25",
  "graphql-scalars": "^1.24.2"
}
```

### Development Dependencies
```json
{
  "@biomejs/biome": "^2.2.2",
  "typescript": "^5.9.2",
  "@graphql-codegen/cli": "^5.0.7",
  "drizzle-kit": "^0.31.4",
  "vitest": "^latest",
  "@vitest/browser": "^latest",
  "playwright": "^latest"
}
```

## Technical Constraints
- **TypeScript required**: All code must be type-safe
- **Modern JavaScript**: ES2022 target with ESNext modules
- **Component-based architecture**: All UI elements are Lit custom elements
- **GraphQL-first**: All API communication through GraphQL endpoints
- **Service Layer Pattern**: Business logic abstracted from GraphQL resolvers
- **Testing**: Vitest for both browser and Node.js environments

## Build System
- **Development**: Vite dev server with HMR
- **Production**: TypeScript compilation + Vite build
- **Code Generation**: GraphQL codegen for types and resolvers
- **Database**: Drizzle Kit for schema migrations
- **Testing**: Vitest with browser and Node.js environments
- **Development Orchestration**: Tilt for coordinated multi-service development

## Environment Setup
- **Node.js**: Version specified in `.nvmrc`
- **TypeScript**: Strict mode enabled
- **Database**: libsql (SQLite-compatible) for development
- **Hot Module Replacement**: Enabled for development
- **Development Orchestration**: Tilt for multi-service development
- **Package Management**: pnpm with workspace support

## GraphQL Architecture
- **Schema-First Design**: GraphQL schemas define API contracts
- **Type Generation**: Automatic TypeScript type generation from schemas
- **Resolver Pattern**: Clean separation of concerns in resolvers
- **Service Layer**: Business logic abstracted into service classes
- **Error Handling**: Standardized error responses across all operations
- **Authentication Context**: User context passed through GraphQL execution context