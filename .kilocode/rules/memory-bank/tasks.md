# Tasks: OpenTCGS Development Workflows

## Shopping Cart GraphQL Implementation
**Last performed:** 2025-09-19
**Description:** Complete implementation of shopping cart functionality with GraphQL mutations and database schema

**Files modified:**
- `packages/api/src/db/otcgs/shopping-schema.ts` - Cart and cart item database schema
- `packages/api/src/db/otcgs/shopping-relations.ts` - Drizzle ORM relations for shopping cart
- `packages/api/src/schema/shopping/schema.graphql` - GraphQL schema for shopping operations
- `packages/api/src/schema/shopping/resolvers/` - All mutation and query resolvers
- `packages/api/src/services/shopping-cart-service.ts` - Business logic service layer
- `packages/api/src/db/index.ts` - Export new schemas and relations

**Steps followed:**
1. **Database Schema**: Created cart and cartItem tables with proper foreign keys and indexes
2. **Relations**: Defined Drizzle ORM relations connecting carts to users and products
3. **GraphQL Schema**: Defined input/output types and mutations (addToCart, removeFromCart, updateItemInCart, clearCart, checkoutWithCart)
4. **Service Layer**: Created shopping cart service for business logic abstraction
5. **Resolvers**: Implemented all GraphQL resolvers using the service layer
6. **Authentication**: Integrated with Better Auth for user-specific carts
7. **Anonymous Support**: Better Auth configured to support anonymous users for guest shopping

**Key Implementation Patterns:**
- Service layer pattern for business logic separation
- GraphQL-first API design with type generation
- Drizzle ORM relations for type-safe database queries
- Foreign key constraints and indexes for data integrity
- User-specific cart isolation through authentication context

**Important Notes:**
- Anonymous users are supported for guest shopping carts
- Cart items are unique per product (no duplicate products, use quantity updates)
- All mutations return the updated cart state for optimistic UI updates
- Service layer abstracts database operations from GraphQL resolvers
- Comprehensive error handling for missing carts and products

## Inventory Management Implementation
**Last performed:** 2026-03-29
**Description:** Complete inventory management feature with role-based access, database schema, GraphQL API, service layer, and full-featured UI

**Files created:**
- `packages/api/src/db/otcgs/inventory-schema.ts` - Inventory database schema
- `packages/api/src/db/otcgs/inventory-relations.ts` - Drizzle ORM relations
- `packages/api/src/schema/inventory/schema.graphql` - GraphQL schema
- `packages/api/src/schema/inventory/resolvers/` - All resolvers (Query + Mutation)
- `packages/api/src/services/inventory-service.ts` - Business logic service
- `packages/ui/src/pages/inventory/inventory.client.ts` - Main inventory page
- `packages/ui/src/pages/inventory/inventory.server.ts` - Server template
- `packages/ui/src/pages/inventory-import/` - Import placeholder page
- Test files for service and UI component

**Files modified:**
- `packages/api/src/auth.ts` - Added access control with employee role
- `packages/api/src/auth-client.ts` - Added access control to API client
- `packages/ui/src/auth-client.ts` - Added access control to UI client
- `packages/api/src/db/otcgs/schema.ts` - Export inventory schema
- `packages/api/src/db/otcgs/index.ts` - Import inventory relations
- `packages/ui/src/components/ogs-page.ts` - Role-based inventory nav link
- `packages/ui/src/server.ts` - Inventory routes
- `packages/api/src/schema/cards/schema.graphql` - Product type filters
- `packages/api/src/schema/cards/resolvers/Query/getSingleCardInventory.ts` - Product type filtering
- `packages/ui/src/pages/cards/cards.client.ts` - Product type filter UI

**Steps followed:**
1. **Access Control**: Configured Better Auth with employee role and access control plugin
2. **Database Schema**: Created inventory_item table with productId, condition, quantity, price, costBasis, unique constraint on productId+condition+costBasis
3. **Relations**: Defined Drizzle ORM relations connecting inventory items to products
4. **GraphQL Schema**: Defined types, inputs, queries (getInventory, searchProducts), and mutations (addInventoryItem, updateInventoryItem, deleteInventoryItem, bulkUpdateInventory, bulkDeleteInventory)
5. **Service Layer**: Created inventory service with all business logic (CRUD, bulk ops, pagination, filtering)
6. **Resolvers**: Implemented all GraphQL resolvers using the service layer with access control checks
7. **UI Page**: Built full-featured inventory page with filters, search, table, pagination, dialogs, bulk actions
8. **Product Type Filtering**: Added singles vs sealed filtering to both inventory and cards pages
9. **Import Placeholder**: Created placeholder page for future inventory import functionality
10. **Testing**: 20 service layer tests + 14 UI component tests

**Key Implementation Patterns:**
- Service layer pattern for business logic separation
- Role-based access control with Better Auth employee role
- Server-side pagination with configurable page size and offset
- Filtering by condition, product type (singles vs sealed), and text search
- Bulk operations for efficient multi-item updates and deletes
- Unique constraint on productId+condition+costBasis to prevent duplicates
- Dialog-based CRUD operations with product search integration

**Important Notes:**
- Employee role required for all inventory mutations
- Inventory items have a unique constraint on productId + condition + costBasis
- Product search supports autocomplete for adding inventory items
- Bulk actions require row selection via checkboxes
- Pagination is server-side with page size options (10, 25, 50, 100)
- Product type filter distinguishes singles from sealed products
- Import inventory page is a placeholder for future implementation

## Database Schema Extension Pattern
**Description:** Pattern for extending database schemas with new business entities

**Steps:**
1. Create new schema file in `packages/api/src/db/otcgs/`
2. Define relations file connecting to existing schemas
3. Export from `packages/api/src/db/index.ts`
4. Create corresponding GraphQL schema in `packages/api/src/schema/`
5. Generate types with `pnpm graphql:generate`
6. Implement resolvers following the service layer pattern
7. Update database with `pnpm db:push`

**Testing Pattern:**
- Co-locate test files with source files (`.test.ts` suffix)
- Use Vitest browser mode for UI components
- Use Node.js environment for database and service tests
- Mock GraphQL operations for isolated component testing
