# Architecture: OpenTCGS System Design

## System Architecture Overview
OpenTCGS is a full-stack web application built with a modern monorepo architecture using pnpm workspaces. The system follows a client-server model with server-side rendering (SSR) using Lit and Koa.js, featuring separate API and UI packages with comprehensive GraphQL integration.

### Core Components
1. **Frontend**: Lit-based web components with Web Awesome UI framework
2. **Backend**: Koa.js server with GraphQL API
3. **Database**: PostgreSQL with Drizzle ORM (using libsql/sqlite for development)
4. **Authentication**: Better Auth with email/password and anonymous users
5. **Build Tool**: Vite for development and bundling
6. **Testing Framework**: Vitest for both Node.js and browser testing
7. **Development Orchestration**: Tilt for multi-service development

## Monorepo Structure
```
packages/
├── api/                   # Backend API package
│   ├── package.json       # API-specific dependencies
│   └── src/
│       ├── auth.ts        # Better Auth configuration
│       ├── server.ts      # Koa.js server entry point
│       ├── db/            # Database schemas and connections
│       │   ├── index.ts   # Database connection and exports
│       │   └── otcgs/     # OTCGS-specific schemas
│       │       ├── auth-schema.ts      # Better Auth schema
│       │       ├── tcg-schema.ts       # TCG data schema
│       │       ├── shopping-schema.ts  # Shopping cart schema
│       │       ├── tcg-relations.ts    # TCG data relations
│       │       ├── shopping-relations.ts # Shopping cart relations
│       │       └── drizzle.config.ts   # Drizzle configuration
│       ├── schema/        # GraphQL resolvers
│       │   ├── base/      # Base GraphQL schema
│       │   ├── setup/     # Setup-related resolvers
│       │   ├── cards/     # Card-related resolvers
│       │   ├── shopping/  # Shopping cart resolvers
│       │   ├── resolvers.generated.ts # Generated resolver types
│       │   └── types.generated.ts     # Generated GraphQL types
│       └── services/      # Business logic services
│           └── shopping-cart-service.ts # Shopping cart business logic
├── ui/                    # Frontend UI package
│   ├── package.json       # UI-specific dependencies
│   ├── codegen.ts         # GraphQL codegen configuration
│   └── src/
│       ├── auth-client.ts # Authentication client
│       ├── server.ts      # UI server entry point
│       ├── shell.ts       # HTML shell template for SSR
│       ├── components/    # Reusable UI components
│       │   ├── ogs-page.ts        # Main layout component
│       │   ├── ogs-wizard.ts      # Multi-step wizard component
│       │   └── ogs-two-pane-panel.ts # Two-column layout component
│       ├── pages/         # Page components (server + client)
│       │   ├── home/      # Dashboard page
│       │   ├── cards/     # Card browsing page
│       │   ├── card-details/ # Individual card details with cart
│       │   ├── sales/     # Sales processing
│       │   ├── settings/  # Settings page
│       │   └── first-time-setup/ # Initial setup wizard
│       ├── graphql/       # GraphQL client setup
│       │   ├── gql.ts     # GraphQL document map
│       │   ├── graphql.ts # Generated types
│       │   └── fragment-masking.ts # Fragment utilities
│       └── lib/           # Utility libraries
│           └── graphql.ts # GraphQL execution utility

# Root Configuration Files
├── package.json           # Workspace root configuration
├── pnpm-workspace.yaml    # pnpm workspace configuration
├── Tiltfile              # Development server orchestration
├── vite.config.ts        # Vite and Vitest configuration
├── tsconfig.json         # TypeScript configuration
└── scripts/              # Utility scripts
    └── populate-tcg-data.ts # TCG data population script
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
3. Anonymous users supported for guest shopping
4. Session management handled by Better Auth
5. Protected routes enforced by middleware

## Database Schema
- **Authentication**: Better Auth provides user, session, account tables with anonymous user support
- **TCG Data**: Complete schema for categories, groups, products, prices, presale info, and extended data
- **Shopping Cart**: Cart and cart item tables with user and product relations, unique constraints on cart-product combinations
- **Relations**: Comprehensive Drizzle ORM relations connecting all schemas
- **Adapter**: Drizzle ORM with libsql (SQLite-compatible) for development

## Shopping Cart Architecture
- **Service Layer**: `shopping-cart-service.ts` abstracts business logic from GraphQL resolvers
- **GraphQL Operations**: Complete CRUD operations (addToCart, removeFromCart, updateItemInCart, clearCart, checkoutWithCart, getShoppingCart)
- **User Context**: Cart operations isolated per user through authentication context
- **Anonymous Support**: Guest users can maintain shopping carts through anonymous authentication
- **Error Handling**: Comprehensive validation and error responses for all operations
- **Type Safety**: Full TypeScript integration with generated GraphQL types

## Build System
- **Development**: Vite dev server with hot module replacement
- **Production**: TypeScript compilation + Vite build
- **Code Generation**: GraphQL codegen for types and resolvers
- **Database**: Drizzle Kit for schema migrations
- **Development Orchestration**: Tilt for multi-service development workflow

## Testing Framework
- **Component Tests**: Browser-based tests using Vitest's browser mode with Playwright
- **Page Tests**: Browser-based tests for page components
- **Database Tests**: Node.js tests for database operations
- **Service Tests**: Node.js tests for shopping cart service layer
- **Utility Tests**: Node.js tests for GraphQL and other utilities
- **Test Location**: Test files co-located with source files (`.test.ts` suffix)
- **Coverage**: V8 coverage provider with HTML, JSON, and text reporters