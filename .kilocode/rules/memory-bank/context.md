# Context: Current State of OpenTCGS

## Current Work Focus

Inventory schema restructuring completed. Price moved from per-lot to per-product+condition level. `inventory_item` is now a parent table (one per productId+condition with price), and `inventory_item_stock` is a child table (many per parent with quantity, costBasis, acquisitionDate, notes).

## Recent Changes

- **Role System Overhaul (2026-04-05)**: Standardized 3-role permission system
  - **Root cause fix**: Admin plugin's `createUser` endpoint was checking `{ user: ["create"] }` permission, but custom AC statement didn't include admin plugin's `defaultStatements` (`user`, `session` resources). Merged both org and admin plugin default statements into the AC statement.
  - **Role rename**: `admin` → `manager` (Store Manager). The org plugin uses `Object.keys(options.roles)` for pre-defined roles, so custom names are safe. No hardcoded dependency on `"admin"` in the org plugin.
  - **Permissions**: `ownerRole` gets `...adminAc.statements` for full admin plugin access. `managerRole` has inventory + orders + transactionLog read. `memberRole` has inventory + orders only.
  - **Auth config** (`auth.ts`): Added `adminRoles: ['owner']` to admin plugin for impersonation protection.
  - **First-time setup**: Initial user now gets `role: 'owner'` (was `'admin'`).
  - **Nav sections renamed**: "Management" → "Employees", "Settings" → "Owner".
  - **New permission flag**: `canViewDashboard` added to all 16 page components and ogs-page (gates Dashboard link for owner/manager only).
  - **UI fixes**: `roleLabel()` and `roleBadgeVariant()` in settings-users now correctly distinguish owner/manager/member. Stats count owners only. Type casts include all 3 roles.
  - **Server-side**: `server-helpers.ts` derives permissions from role (isOwner, isManagerOrAbove, isEmployee). `server.ts` permission map uses `['owner']` for settings/userMgmt, `['owner', 'manager']` for transactionLog, `['owner', 'manager', 'member']` for inventory/orders.
  - **Tests**: All settings page tests use `userRole = 'owner'`. Permissions test updated for `managerRole`.

- **Inventory Schema Restructuring (2026-04-03)**: Split inventory_item into parent + stock
  - **Database**: New `inventory_item_stock` table; removed `quantity`, `costBasis`, `acquisitionDate`, `notes` from `inventory_item`; unique constraint changed to `(orgId, productId, condition)`; added `inventoryItemStockId` to `order_item` for FIFO lot tracking
  - **GraphQL**: Removed `GroupedInventoryItem`/`GroupedInventoryPage`; added `InventoryItemStock` type and `InventoryStockPage`; added stock mutations (`addStock`, `updateStock`, `deleteStock`, `bulkUpdateStock`, `bulkDeleteStock`); `getInventoryItemDetails` now takes `inventoryItemId` and returns stock entries
  - **Services**: Major rewrite of `inventory-service.ts` (parent+stock creation, condition merge, stock CRUD/bulk ops); updated `shopping-cart-service.ts` (derives qty from stock SUM); updated `order-service.ts` (FIFO on stock entries, `inventoryItemStockId` tracking, restocking via stock entries)
  - **Card Resolvers**: All 4 card query resolvers updated to JOIN through stock for quantity derivation
  - **Inventory Resolvers**: New resolvers for stock mutations; `getInventoryItem(id)` query added
  - **UI**: Inventory list pages show single Price (not range); detail page shows stock entries with parent price in header; all dialogs/bulk ops work on stock entries
  - **Tests**: 229 tests pass (service tests + UI tests fully updated for new schema)

- **Settings Pages (2026-03-31)**: Complete settings section implementation
  - **Database**: New `store_settings` wide table with store info, backup config, integration credentials, OAuth tokens
  - **Encryption**: AES-256-GCM encryption utility for sensitive settings (API keys, OAuth tokens)
  - **GraphQL**: New settings schema with queries/mutations for store settings, backup settings, integrations, sales tax lookup
  - **Services**: `settings-service.ts` (CRUD, sales tax via `sales-tax` package), `backup-service.ts` (Google Drive, Dropbox, OneDrive OAuth + upload/download)
  - **Access Control**: Admin-only at 3 layers: UI nav visibility, route middleware (403), GraphQL resolvers
  - **Navigation**: Settings section in sidebar (admin-only) with sub-links for all 5 pages
  - **Routes**: `/settings/*` with `requireAdmin` middleware
  - **Pages**: General (store info + auto sales tax), Backup & Restore (OAuth connect + backup/restore), Autoprice (stub), Integrations (Stripe/Shopify), User Accounts (Better Auth admin APIs)
  - **Dependencies**: Added `sales-tax`, `googleapis`, `dropbox`, `@microsoft/microsoft-graph-client`, `@azure/msal-node`
  - **Environment**: Added `ENCRYPTION_KEY`, `API_BASE_URL`, Google/Dropbox/OneDrive OAuth credentials to `.env`

- **Dependency Upgrade (2026-03-31)**: Complete upgrade of all dependencies
  - **Vite 7→8**: Rolldown replaces esbuild/Rollup as bundler
  - **Vitest 3→4**: Replaced `@vitest/browser` with `@vitest/browser-playwright`
  - **Web Awesome 3.0.0-beta.5→3.4.0**: Upgraded from beta to stable release
  - **TypeScript 5→6**: Updated to TypeScript 6.0.2
  - **Biome+Prettier→oxlint+oxfmt**: Migrated linting/formatting toolchain

## Next Steps

- Fix Web Awesome 3.4.0 UI test failures (inventory-sealed, inventory-singles, home page tests need selector updates for WA component changes)
- Integration testing across frontend and backend for cart drawer and order flow
- Implement checkout process and payment integration (using Stripe integration from settings)
- Add barcode scanning functionality
- Create customer management system
- Build analytics dashboard
- Implement login UI improvements
- Implement Autoprice feature (currently stubbed)

## Current Status

- **Authentication**: ✅ Implemented with Better Auth (email/password, anonymous users, organization plugin, admin plugin)
- **Access Control**: ✅ 3-role system (owner, manager, member) with custom AC merging org + admin plugin statements
- **Database**: ✅ Complete schemas (auth, TCG data, shopping cart, inventory, orders, store settings)
- **UI Framework**: ✅ Lit with Web Awesome components
- **Routing**: ✅ Koa.js server with page routing and role-based `requirePermission()` middleware
- **GraphQL**: ✅ Complete setup with type generation and resolvers
- **Shopping Cart Backend**: ✅ Complete GraphQL API with service layer
- **Shopping Cart UI**: ✅ Cart drawer with quantity controls, remove, customer name, submit order
- **Order System**: ✅ Complete (database, service, GraphQL API, UI page)
- **TCG Data Schema**: ✅ Categories, groups, products, prices with relations
- **Card Details UI**: ✅ Implemented with cart functionality
- **Inventory Backend**: ✅ Complete GraphQL API with service layer (parent inventory_item + child inventory_item_stock)
- **Inventory UI**: ✅ Full-featured pages (singles list, sealed list, detail with stock entries, bulk ops)
- **Inventory Tests**: ✅ 229 tests pass (service + UI fully updated for parent/stock schema)
- **Cards Page**: ✅ With product type filtering (singles vs sealed)
- **Orders UI**: ✅ Paginated table with expandable order item details
- **Settings - General**: ✅ Store name, address, EIN, auto sales tax rate
- **Settings - Backup & Restore**: ✅ Google Drive, Dropbox, OneDrive OAuth + backup/restore
- **Settings - Autoprice**: ⏳ Stubbed (placeholder page)
- **Settings - Integrations**: ✅ Stripe, Shopify with encrypted credentials
- **Settings - User Accounts**: ✅ List, create, edit role, activate/deactivate users
- **Encryption**: ✅ AES-256-GCM for sensitive settings
- **Analytics UI**: ❌ Not implemented
- **Barcode Scanning**: ❌ Not implemented
- **Login UI**: ❌ Not implemented
- **Testing Framework**: ✅ Vitest 4 with browser-playwright and Node.js support
- **Linting/Formatting**: ✅ oxlint + oxfmt
