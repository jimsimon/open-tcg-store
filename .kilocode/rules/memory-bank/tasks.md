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