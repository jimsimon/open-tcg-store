# Architecture: OpenTCGS System Design

## System Architecture Overview

OpenTCGS is a full-stack web application built with a modern monorepo architecture using pnpm workspaces. The system follows a client-server model with server-side rendering (SSR) using Lit and Koa.js, featuring separate API and UI packages with comprehensive GraphQL integration.

### Core Components

1. **Frontend**: Lit-based web components with Web Awesome UI framework
2. **Backend**: Koa.js server with GraphQL API
3. **Database**: PostgreSQL with Drizzle ORM (using libsql/sqlite for development)
4. **Authentication**: Better Auth with email/password, anonymous users, and employee role with access control
5. **Build Tool**: Vite for development and bundling
6. **Testing Framework**: Vitest for both Node.js and browser testing
7. **Development Orchestration**: Tilt for multi-service development

## Monorepo Structure

```
packages/
├── api/                   # Backend API package
│   ├── package.json       # API-specific dependencies
│   └── src/
│       ├── auth.ts        # Better Auth configuration (with access control + employee role)
│       ├── auth-client.ts # Better Auth client (with access control plugin)
│       ├── server.ts      # Koa.js server entry point
│       ├── db/            # Database schemas and connections
│       │   ├── index.ts   # Database connection and exports
│       │   └── otcgs/     # OTCGS-specific schemas
│       │       ├── auth-schema.ts          # Better Auth schema
│       │       ├── tcg-schema.ts           # TCG data schema
│       │       ├── shopping-schema.ts      # Shopping cart schema
│       │       ├── shopping-relations.ts   # Shopping cart relations
│       │       ├── inventory-schema.ts     # Inventory item schema
│       │       ├── inventory-relations.ts  # Inventory relations
│       │       ├── order-schema.ts        # Order and order item schema
│       │       ├── order-relations.ts     # Order relations
│       │       ├── settings-schema.ts     # Store settings wide table
│       │       ├── schema.ts              # Combined schema exports
│       │       ├── index.ts               # Combined relations and exports
│       │       └── drizzle.config.ts      # Drizzle configuration
│       ├── lib/           # Utility libraries
│       │   └── encryption.ts              # AES-256-GCM encryption for sensitive settings
│       ├── schema/        # GraphQL resolvers
│       │   ├── base/      # Base GraphQL schema
│       │   ├── setup/     # Setup-related resolvers
│       │   ├── cards/     # Card-related resolvers (with product type filtering)
│       │   ├── shopping/  # Shopping cart resolvers
│       │   ├── inventory/ # Inventory management resolvers
│       │   │   ├── schema.graphql         # Inventory GraphQL schema
│       │   │   └── resolvers/             # Query + Mutation resolvers
│       │   ├── orders/   # Order management resolvers
│       │   │   ├── schema.graphql         # Orders GraphQL schema
│       │   │   └── resolvers/             # Query + Mutation resolvers
│       │   ├── settings/ # Settings management resolvers
│       │   │   ├── schema.graphql         # Settings GraphQL schema
│       │   │   └── resolvers/             # Query + Mutation resolvers
│       │   ├── resolvers.generated.ts # Generated resolver types
│       │   └── types.generated.ts     # Generated GraphQL types
│       └── services/      # Business logic services
│           ├── shopping-cart-service.ts # Shopping cart business logic (includes price + availability)
│           ├── inventory-service.ts    # Inventory management business logic
│           ├── order-service.ts        # Order creation, validation, inventory decrement
│           ├── settings-service.ts    # Store settings CRUD, sales tax lookup, integration management
│           └── backup-service.ts      # Backup/restore with Google Drive, Dropbox, OneDrive OAuth
├── ui/                    # Frontend UI package
│   ├── package.json       # UI-specific dependencies
│   ├── codegen.ts         # GraphQL codegen configuration
│   └── src/
│       ├── auth-client.ts # Authentication client (with access control plugin)
│       ├── server.ts      # UI server entry point
│       ├── shell.ts       # HTML shell template for SSR
│       ├── components/    # Reusable UI components
│       │   ├── ogs-page.ts        # Main layout component (role-based nav with icons, hover/active states)
│       │   ├── ogs-wizard.ts      # Multi-step wizard component
│       │   └── ogs-two-pane-panel.ts # Two-column layout component
│       ├── pages/         # Page components (server + client)
│       │   ├── home/      # Dashboard page
│       │   ├── cards/     # Card browsing page (with product type filter)
│       │   ├── card-details/ # Individual card details with cart
│       │   ├── inventory/    # Inventory management page
│       │   │   ├── inventory.client.ts      # Full-featured inventory UI
│       │   │   ├── inventory.client.test.ts # 14 UI component tests
│       │   │   └── inventory.server.ts      # Server template
│       │   ├── inventory-import/ # Inventory import placeholder
│       │   │   ├── inventory-import.client.ts  # Import UI placeholder
│       │   │   └── inventory-import.server.ts  # Server template
│       │   ├── orders/    # Orders page (renamed from sales)
│       │   ├── settings-general/     # General settings (store info, address, EIN, sales tax)
│       │   ├── settings-backup/      # Backup & Restore (OAuth, cloud providers)
│       │   ├── settings-autoprice/   # Autoprice (stub)
│       │   ├── settings-integrations/ # Integrations (Stripe, Shopify, QuickBooks)
│       │   ├── settings-users/       # User Accounts (Better Auth admin APIs)
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

- **ogs-page**: Main layout with polished sidebar navigation (icons, hover/active states, section labels) and theme switching; role-based nav links (inventory visible to employees); cart drawer (wa-drawer placement=end) with quantity controls, customer name, order submission; settings section visible to admin only
- **Page Components**: Each page has server.ts and client.ts files
- **Custom Elements**: All components use Lit custom elements
- **Web Awesome**: UI components from Web Awesome framework

### Inventory Page Components

- **Filters Bar**: Condition dropdown, product type filter (singles/sealed), search input
- **Data Table**: Sortable columns with product name, condition, quantity, price, cost basis, updated date
- **Bulk Actions**: Select-all checkbox, bulk update and bulk delete operations
- **Pagination**: Page size selector, page navigation controls
- **Dialogs**: Add inventory item (with product search), edit item, delete confirmation
- **Empty State**: Guidance when no inventory items exist

## Authentication Flow

1. First-time setup creates admin user via Better Auth
2. Subsequent logins use email/password authentication
3. Anonymous users supported for guest shopping
4. Employee role with access control for inventory operations
5. Session management handled by Better Auth
6. Protected routes enforced by middleware

## Database Schema

- **Authentication**: Better Auth provides user, session, account tables with anonymous user support
- **TCG Data**: Complete schema for categories, groups, products, prices, presale info, and extended data
- **Shopping Cart**: Cart and cart item tables with user and inventory item relations, unique constraint on cartId+inventoryItemId
- **Inventory**: inventory_item table with productId, condition, quantity, price, costBasis, createdAt, updatedAt; unique constraint on productId+condition+costBasis combination
- **Orders**: order table with orderNumber, customerName, userId, status, totalAmount, createdAt; order_item table with orderId, productId, productName, condition, quantity, unitPrice
- **Settings**: store_settings wide table (single-row pattern) with store info (name, address, EIN, sales tax rate), backup config (provider, frequency, OAuth tokens), integration credentials (Stripe, Shopify, QuickBooks with encrypted API keys)
- **Relations**: Comprehensive Drizzle ORM relations connecting all schemas (inventory items → products, orders → users, order items → orders/products)
- **Adapter**: Drizzle ORM with libsql (SQLite-compatible) for development

## Shopping Cart Architecture

- **Service Layer**: `shopping-cart-service.ts` abstracts business logic from GraphQL resolvers
- **Inventory Item Tracking**: Cart items reference `inventoryItemId` (FK to inventory_item.id) instead of productId+condition, enabling precise inventory tracking
- **GraphQL Operations**: Complete CRUD operations (addToCart, removeFromCart, updateItemInCart, clearCart, checkoutWithCart, getShoppingCart)
- **User Context**: Cart operations isolated per user through authentication context
- **Anonymous Support**: Guest users can maintain shopping carts through anonymous authentication
- **Error Handling**: Comprehensive validation and error responses for all operations
- **Type Safety**: Full TypeScript integration with generated GraphQL types

## Inventory Management Architecture

- **Service Layer**: `inventory-service.ts` abstracts all inventory business logic from GraphQL resolvers
- **GraphQL Operations**: Full CRUD (addInventoryItem, updateInventoryItem, deleteInventoryItem) plus bulk operations (bulkUpdateInventory, bulkDeleteInventory), paginated queries (getInventory), and product search (searchProducts)
- **Access Control**: Employee role required for all inventory mutations via Better Auth access control plugin
- **Pagination**: Server-side pagination with configurable page size and offset
- **Filtering**: By condition, product type (singles vs sealed), and text search
- **Unique Constraints**: productId + condition + costBasis combination ensures no duplicate entries
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
- **Service Tests**: Node.js tests for shopping cart and inventory service layers
- **Utility Tests**: Node.js tests for GraphQL and other utilities
- **Test Location**: Test files co-located with source files (`.test.ts` suffix)
- **Coverage**: V8 coverage provider with HTML, JSON, and text reporters
