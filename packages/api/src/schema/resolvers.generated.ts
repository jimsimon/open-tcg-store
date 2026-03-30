/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
    import type   { Resolvers } from './types.generated';
    import    { getCard as Query_getCard } from './cards/resolvers/Query/getCard';
import    { getInventory as Query_getInventory } from './inventory/resolvers/Query/getInventory';
import    { getOrders as Query_getOrders } from './orders/resolvers/Query/getOrders';
import    { getProduct as Query_getProduct } from './cards/resolvers/Query/getProduct';
import    { getProductListings as Query_getProductListings } from './cards/resolvers/Query/getProductListings';
import    { getSets as Query_getSets } from './cards/resolvers/Query/getSets';
import    { getShoppingCart as Query_getShoppingCart } from './shopping/resolvers/Query/getShoppingCart';
import    { getSingleCardInventory as Query_getSingleCardInventory } from './cards/resolvers/Query/getSingleCardInventory';
import    { isSetupPending as Query_isSetupPending } from './setup/resolvers/Query/isSetupPending';
import    { searchProducts as Query_searchProducts } from './inventory/resolvers/Query/searchProducts';
import    { addInventoryItem as Mutation_addInventoryItem } from './inventory/resolvers/Mutation/addInventoryItem';
import    { addToCart as Mutation_addToCart } from './shopping/resolvers/Mutation/addToCart';
import    { bulkDeleteInventory as Mutation_bulkDeleteInventory } from './inventory/resolvers/Mutation/bulkDeleteInventory';
import    { bulkUpdateInventory as Mutation_bulkUpdateInventory } from './inventory/resolvers/Mutation/bulkUpdateInventory';
import    { cancelOrder as Mutation_cancelOrder } from './orders/resolvers/Mutation/cancelOrder';
import    { checkoutWithCart as Mutation_checkoutWithCart } from './shopping/resolvers/Mutation/checkoutWithCart';
import    { clearCart as Mutation_clearCart } from './shopping/resolvers/Mutation/clearCart';
import    { deleteInventoryItem as Mutation_deleteInventoryItem } from './inventory/resolvers/Mutation/deleteInventoryItem';
import    { firstTimeSetup as Mutation_firstTimeSetup } from './setup/resolvers/Mutation/firstTimeSetup';
import    { removeFromCart as Mutation_removeFromCart } from './shopping/resolvers/Mutation/removeFromCart';
import    { submitOrder as Mutation_submitOrder } from './orders/resolvers/Mutation/submitOrder';
import    { updateInventoryItem as Mutation_updateInventoryItem } from './inventory/resolvers/Mutation/updateInventoryItem';
import    { updateItemInCart as Mutation_updateItemInCart } from './shopping/resolvers/Mutation/updateItemInCart';
import    { updateOrderStatus as Mutation_updateOrderStatus } from './orders/resolvers/Mutation/updateOrderStatus';
import    { CancelOrderResult } from './orders/resolvers/CancelOrderResult';
import    { Card } from './cards/resolvers/Card';
import    { CardImages } from './cards/resolvers/CardImages';
import    { CartItemOutput } from './shopping/resolvers/CartItemOutput';
import    { ConditionInventories } from './cards/resolvers/ConditionInventories';
import    { ConditionInventory } from './cards/resolvers/ConditionInventory';
import    { InsufficientItem } from './orders/resolvers/InsufficientItem';
import    { InventoryItem } from './inventory/resolvers/InventoryItem';
import    { InventoryPage } from './inventory/resolvers/InventoryPage';
import    { Order } from './orders/resolvers/Order';
import    { OrderItem } from './orders/resolvers/OrderItem';
import    { OrderPage } from './orders/resolvers/OrderPage';
import    { ProductConditionPrice } from './cards/resolvers/ProductConditionPrice';
import    { ProductDetail } from './cards/resolvers/ProductDetail';
import    { ProductInventoryRecord } from './cards/resolvers/ProductInventoryRecord';
import    { ProductListing } from './cards/resolvers/ProductListing';
import    { ProductListingPage } from './cards/resolvers/ProductListingPage';
import    { ProductPrice } from './inventory/resolvers/ProductPrice';
import    { ProductSearchResult } from './inventory/resolvers/ProductSearchResult';
import    { Set } from './cards/resolvers/Set';
import    { ShoppingCart } from './shopping/resolvers/ShoppingCart';
import    { SubmitOrderResult } from './orders/resolvers/SubmitOrderResult';
import    { UpdateOrderStatusResult } from './orders/resolvers/UpdateOrderStatusResult';
    export const resolvers: Resolvers = {
      Query: { getCard: Query_getCard,getInventory: Query_getInventory,getOrders: Query_getOrders,getProduct: Query_getProduct,getProductListings: Query_getProductListings,getSets: Query_getSets,getShoppingCart: Query_getShoppingCart,getSingleCardInventory: Query_getSingleCardInventory,isSetupPending: Query_isSetupPending,searchProducts: Query_searchProducts },
      Mutation: { addInventoryItem: Mutation_addInventoryItem,addToCart: Mutation_addToCart,bulkDeleteInventory: Mutation_bulkDeleteInventory,bulkUpdateInventory: Mutation_bulkUpdateInventory,cancelOrder: Mutation_cancelOrder,checkoutWithCart: Mutation_checkoutWithCart,clearCart: Mutation_clearCart,deleteInventoryItem: Mutation_deleteInventoryItem,firstTimeSetup: Mutation_firstTimeSetup,removeFromCart: Mutation_removeFromCart,submitOrder: Mutation_submitOrder,updateInventoryItem: Mutation_updateInventoryItem,updateItemInCart: Mutation_updateItemInCart,updateOrderStatus: Mutation_updateOrderStatus },
      
      CancelOrderResult: CancelOrderResult,
Card: Card,
CardImages: CardImages,
CartItemOutput: CartItemOutput,
ConditionInventories: ConditionInventories,
ConditionInventory: ConditionInventory,
InsufficientItem: InsufficientItem,
InventoryItem: InventoryItem,
InventoryPage: InventoryPage,
Order: Order,
OrderItem: OrderItem,
OrderPage: OrderPage,
ProductConditionPrice: ProductConditionPrice,
ProductDetail: ProductDetail,
ProductInventoryRecord: ProductInventoryRecord,
ProductListing: ProductListing,
ProductListingPage: ProductListingPage,
ProductPrice: ProductPrice,
ProductSearchResult: ProductSearchResult,
Set: Set,
ShoppingCart: ShoppingCart,
SubmitOrderResult: SubmitOrderResult,
UpdateOrderStatusResult: UpdateOrderStatusResult
    }