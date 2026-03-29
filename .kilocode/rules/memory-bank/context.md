# Context: Current State of OpenTCGS

## Current Work Focus
Inventory management feature is now complete with a full-stack implementation including database schema, GraphQL API, service layer, resolvers, and a full-featured UI page with 34 test cases. The project continues to mature with robust monorepo architecture using pnpm workspaces. Focus is shifting toward integration testing, checkout/payment processing, and other planned features.

## Recent Changes
- **Complete Inventory Management System**: Database schema, GraphQL API (queries + mutations), service layer, resolvers, and full UI page
- **Employee Role with Access Control**: Better Auth configured with employee role and access control for inventory operations
- **Inventory UI Page**: Full CRUD operations, filtering by condition/product type, search, pagination, and bulk actions (update/delete)
- **Product Type Filtering**: Singles vs sealed product type filter added to both inventory and cards pages
- **Import Inventory Placeholder**: Placeholder page for future inventory import functionality
- **Comprehensive Test Coverage**: 34 test cases (20 inventory service tests + 14 UI component tests)
- **Shopping Cart Backend**: All GraphQL mutations and queries implemented (addToCart, removeFromCart, updateItemInCart, clearCart, checkoutWithCart, getShoppingCart)
- **Shopping Cart Service Layer**: Business logic abstracted into dedicated service for better maintainability
- **Development Orchestration**: Tilt configured for multi-service development workflow

## Next Steps
- Integration testing across frontend and backend
- Implement checkout process and payment integration
- Connect frontend UI to shopping cart GraphQL mutations
- Add barcode scanning functionality
- Create customer management system
- Build analytics dashboard
- Implement login UI
- Implement user settings UI
- Admin UI for user and settings management

## Current Status
- **Authentication**: ✅ Implemented with Better Auth (including anonymous users and employee role)
- **Access Control**: ✅ Role-based access control with employee role for inventory operations
- **Database**: ✅ Complete schemas (auth, TCG data, shopping cart, inventory with relations)
- **UI Framework**: ✅ Lit with Web Awesome components
- **Routing**: ✅ Koa.js server with page routing
- **GraphQL**: ✅ Complete setup with type generation and resolvers
- **Shopping Cart Backend**: ✅ Complete GraphQL API with service layer
- **TCG Data Schema**: ✅ Categories, groups, products, prices with relations
- **Card Details UI**: ✅ Implemented with cart functionality placeholders
- **Inventory Backend**: ✅ Complete GraphQL API with service layer (CRUD + bulk operations + search + pagination)
- **Inventory UI**: ✅ Full-featured page with filters, search, pagination, bulk actions, add/edit/delete dialogs
- **Inventory Tests**: ✅ 34 test cases (20 service + 14 UI component)
- **Cards Page**: ✅ With product type filtering (singles vs sealed)
- **Sales UI**: 🔄 Backend complete, frontend integration pending
- **Analytics UI**: ❌ Not implemented
- **Barcode Scanning**: ❌ Not implemented
- **Login UI**: ❌ Not implemented
- **User Settings UI**: ❌ Not implemented
- **Admin UI - Users**: ❌ Not implemented
- **Admin UI - Settings**: ❌ Not implemented
- **Testing Framework**: ✅ Vitest with browser and Node.js support
