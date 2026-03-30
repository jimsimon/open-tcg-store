# Context: Current State of OpenTCGS

## Current Work Focus
Inventory ID tracking refactor completed. The entire cart → order → cancel flow now tracks `inventoryItemId` instead of `productId + condition`, eliminating FIFO lookup ambiguity and enabling precise inventory restocking on order cancellation.

## Recent Changes
- **Inventory ID Tracking Refactor**: Complete refactor of cart/order system to track `inventoryItemId` throughout
  - `cartItem` table: replaced `productId` + `condition` columns with `inventoryItemId` (FK to inventory_item.id)
  - `cartItem` unique constraint: changed from `cartId+productId+condition` to `cartId+inventoryItemId`
  - Shopping relations: `cartItem.product` relation replaced with `cartItem.inventoryItem` relation
  - `CartItemInput` GraphQL type: changed from `{productId, condition, quantity}` to `{inventoryItemId, quantity}`
  - `CartItemOutput` GraphQL type: added `inventoryItemId` field (keeps productId, productName, condition for display)
  - Shopping cart service: joins through `inventoryItem → product` for display data (no more separate inventory queries)
  - Cart resolvers (add/update/remove): all use `inventoryItemId` for matching and upsert
  - Order service `submitOrder()`: validates directly against `inventoryItem.quantity`, decrements by `inventoryItemId` (no more FIFO)
  - `ProductInventoryRecord` GraphQL type: added `inventoryItemId` field
  - `ProductConditionPrice` GraphQL type: added `inventoryItemId` field (lowest-priced item per condition)
  - `ProductListing` GraphQL type: added `lowestPriceInventoryItemId` field (for sealed products)
  - `getProduct` resolver: includes `inventory_item.id` in records
  - `getProductListings` resolver: includes `inventoryItemId` in condition prices
  - Frontend `CartItem` interface: added `inventoryItemId` field
  - All product pages (singles, sealed, details) and cart drawer: pass `inventoryItemId` in addToCart/updateItemInCart/removeFromCart mutations
  - Database migration: recreated `cartItem` table with new schema

## Next Steps
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
- **Testing Framework**: ✅ Vitest with browser and Node.js support
