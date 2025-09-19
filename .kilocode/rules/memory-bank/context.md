# Context: Current State of OpenTCGS

## Current Work Focus
Shopping cart implementation is now complete with a fully functional GraphQL API backend. The project has a robust monorepo architecture using pnpm workspaces and comprehensive database schemas. The focus is now shifting toward frontend integration of shopping cart functionality and expanding the user interface capabilities.

## Recent Changes
- **Complete Shopping Cart Backend**: All GraphQL mutations and queries implemented (addToCart, removeFromCart, updateItemInCart, clearCart, checkoutWithCart, getShoppingCart)
- **Shopping Cart Service Layer**: Business logic abstracted into dedicated service for better maintainability
- **Database Schema Completion**: Shopping cart schema with proper relations to users and products
- **GraphQL Type Generation**: Fully typed GraphQL operations with codegen
- **Anonymous User Support**: Better Auth configured for guest shopping experiences
- **Error Handling**: Comprehensive error handling in shopping cart operations
- **Development Orchestration**: Tilt configured for multi-service development workflow

## Next Steps
- Connect frontend UI to shopping cart GraphQL mutations
- Implement checkout process and payment integration
- Add real-time cart updates and synchronization
- Implement inventory management for store owners
- Add barcode scanning functionality
- Create customer management system
- Build analytics dashboard
- Expand test coverage for shopping cart frontend integration

## Current Status
- **Authentication**: ✅ Implemented with Better Auth (including anonymous users)
- **Database**: ✅ Complete schemas (auth, TCG data, shopping cart with relations)
- **UI Framework**: ✅ Lit with Web Awesome components
- **Routing**: ✅ Koa.js server with page routing
- **GraphQL**: ✅ Complete setup with type generation and resolvers
- **Shopping Cart Backend**: ✅ Complete GraphQL API with service layer
- **TCG Data Schema**: ✅ Categories, groups, products, prices with relations
- **Card Details UI**: ✅ Implemented with cart functionality placeholders
- **Inventory UI**: ✅ Mock implementation (cards page)
- **Sales UI**: 🔄 Backend complete, frontend integration pending
- **Analytics UI**: ❌ Not implemented
- **Barcode Scanning**: ❌ Not implemented
- **Login UI**: ❌ Not implemented
- **User Settings UI**: ❌ Not implemented
- **Admin UI - Users**: ❌ Not implemented
- **Admin UI - Settings**: ❌ Not implemented
- **Testing Framework**: ✅ Vitest with browser and Node.js support