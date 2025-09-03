# Architecture: OpenTCGS System Design

## System Architecture Overview
OpenTCGS is a full-stack web application built with a modern technology stack using a component-based architecture. The system follows a client-server model with server-side rendering (SSR) using Lit and Koa.js.

### Core Components
1. **Frontend**: Lit-based web components with Web Awesome UI framework
2. **Backend**: Koa.js server with GraphQL API
3. **Database**: PostgreSQL with Drizzle ORM
4. **Authentication**: Better Auth with email/password
5. **Build Tool**: Vite for development and bundling
6. **Testing Framework**: Vitest for both Node.js and browser testing

## Directory Structure
```
src/
├── auth.ts                 # Better Auth configuration
├── server.ts              # Koa.js server entry point
├── shell.ts               # HTML shell template for SSR
├── components/            # Reusable UI components
│   ├── ogs-page.ts        # Main layout component
│   ├── ogs-wizard.ts      # Multi-step wizard component
│   └── ogs-two-pane-panel.ts # Two-column layout component
├── pages/                 # Page components (server + client)
│   ├── home/              # Dashboard page
│   ├── inventory/         # Inventory management
│   ├── sales/             # Sales processing
│   ├── settings/          # Settings page
│   └── first-time-setup/  # Initial setup wizard
├── db/                    # Database schema and connection
│   ├── index.ts           # Database connection
│   ├── auth-schema.ts     # Authentication schema
│   └── schema.ts          # Business logic schema (empty)
├── graphql/               # GraphQL setup and codegen
│   ├── schema.graphql     # GraphQL schema definition
│   ├── resolvers.generated.ts  # Generated resolvers
│   ├── typeDefs.generated.ts   # Generated type definitions
│   └── gql.ts             # GraphQL document map
├── schema/                # GraphQL resolvers
│   ├── base/              # Base GraphQL schema
│   ├── setup/             # Setup-related resolvers
│   └── resolvers.generated.ts  # Auto-generated resolvers
├── lib/                   # Utility libraries
│   └── graphql.ts         # GraphQL execution utility
└── *.test.ts              # Test files co-located with source files

# Configuration Files
├── vite.config.ts         # Vite and Vitest configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Project dependencies and scripts
└── drizzle.config.ts      # Drizzle ORM configuration
```

## Data Flow
1. **Request**: HTTP request to Koa.js server
2. **Routing**: Koa router determines appropriate page handler
3. **SSR**: Server-side render page using Lit components
4. **Response**: Send HTML to client
5. **Hydration**: Client-side JavaScript hydrates components
6. **API**: Client communicates via GraphQL endpoints

## Component Architecture
- **ogs-page**: Main layout with navigation and theme switching
- **Page Components**: Each page has server.ts and client.ts files
- **Custom Elements**: All components use Lit custom elements
- **Web Awesome**: UI components from Web Awesome framework

## Authentication Flow
1. First-time setup creates admin user via Better Auth
2. Subsequent logins use email/password authentication
3. Session management handled by Better Auth
4. Protected routes enforced by middleware

## Database Schema
- **User Management**: Better Auth provides user, session, account tables
- **Business Logic**: Empty schema.ts needs inventory, sales, customer tables
- **Adapter**: Drizzle ORM with PostgreSQL via PGlite

## Build System
- **Development**: Vite dev server with hot module replacement
- **Production**: TypeScript compilation + Vite build
- **Code Generation**: GraphQL codegen for types and resolvers
- **Database**: Drizzle Kit for schema migrations

## Testing Framework
- **Component Tests**: Browser-based tests using Vitest's browser mode with Playwright
- **Page Tests**: Browser-based tests for page components
- **Database Tests**: Node.js tests for database operations
- **Utility Tests**: Node.js tests for GraphQL and other utilities
- **Test Location**: Test files co-located with source files (`.test.ts` suffix)
- **Coverage**: V8 coverage provider with HTML, JSON, and text reporters