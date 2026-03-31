# Context: Current State of OpenTCGS

## Current Work Focus

Major dependency upgrade completed. All dependencies updated to latest versions including three major version bumps (Vite 7→8, Vitest 3→4, Web Awesome beta→3.4.0) and tooling migration from Biome+Prettier to oxlint+oxfmt.

## Recent Changes

- **Dependency Upgrade (2026-03-31)**: Complete upgrade of all dependencies
  - **Vite 7→8**: Rolldown replaces esbuild/Rollup as bundler; removed root build/preview scripts (run from packages)
  - **Vitest 3→4**: Replaced `@vitest/browser` with `@vitest/browser-playwright`; provider changed from string `"playwright"` to `playwright()` function; tsconfig types changed from `@vitest/browser/context` to `vitest/browser`
  - **Web Awesome 3.0.0-beta.5→3.4.0**: Upgraded from beta to stable release; some UI test failures due to component internal changes (attribute reflection, button text content)
  - **TypeScript 5→6**: Updated to TypeScript 6.0.2
  - **Biome+Prettier→oxlint+oxfmt**: Migrated linting/formatting toolchain; created `oxlint.config.ts` and `oxfmt.config.ts`; deleted `biome.json` and `prettier.config.js`; updated package.json scripts and VS Code settings
  - **Added missing deps**: `graphql` and `@graphql-typed-document-node/core` added as explicit dependencies (were previously transitive)
  - **Lint fixes**: Removed unused imports across 10+ files, deleted empty utils.ts, prefixed unused params with `_`
  - **Codebase reformatted**: All 145 files reformatted with oxfmt (printWidth: 120)

## Next Steps

- Fix Web Awesome 3.4.0 UI test failures (inventory-sealed, inventory-singles, home page tests need selector updates for WA component changes)
- Integration testing across frontend and backend for cart drawer and order flow
- Implement checkout process and payment integration
- Add barcode scanning functionality
- Create customer management system
- Build analytics dashboard
- Implement login UI improvements
- Implement user settings UI
- Admin UI for user and settings management

## Current Status

- **Authentication**: ✅ Implemented with Better Auth (including anonymous users and employee role)
- **Access Control**: ✅ Role-based access control with employee role for inventory operations
- **Database**: ✅ Complete schemas (auth, TCG data, shopping cart, inventory, orders with relations)
- **UI Framework**: ✅ Lit with Web Awesome components
- **Routing**: ✅ Koa.js server with page routing
- **GraphQL**: ✅ Complete setup with type generation and resolvers
- **Shopping Cart Backend**: ✅ Complete GraphQL API with service layer (includes price + availability)
- **Shopping Cart UI**: ✅ Cart drawer with quantity controls, remove, customer name, submit order
- **Order System**: ✅ Complete (database, service, GraphQL API, UI page with expandable order details)
- **TCG Data Schema**: ✅ Categories, groups, products, prices with relations
- **Card Details UI**: ✅ Implemented with cart functionality
- **Inventory Backend**: ✅ Complete GraphQL API with service layer (CRUD + bulk operations + search + pagination)
- **Inventory UI**: ✅ Full-featured page with filters, search, pagination, bulk actions, add/edit/delete dialogs
- **Inventory Tests**: ✅ 34 test cases (20 service + 14 UI component)
- **Cards Page**: ✅ With product type filtering (singles vs sealed)
- **Orders UI**: ✅ Paginated table with expandable order item details (employee/admin only)
- **Analytics UI**: ❌ Not implemented
- **Barcode Scanning**: ❌ Not implemented
- **Login UI**: ❌ Not implemented
- **User Settings UI**: ❌ Not implemented
- **Admin UI - Users**: ❌ Not implemented
- **Admin UI - Settings**: ❌ Not implemented
- **Testing Framework**: ✅ Vitest 4 with browser-playwright and Node.js support
- **Linting/Formatting**: ✅ oxlint + oxfmt (migrated from Biome + Prettier)
