/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
    import type   { Resolvers } from './types.generated';
    import    { getCard as Query_getCard } from './cards/resolvers/Query/getCard';
import    { getInventory as Query_getInventory } from './inventory/resolvers/Query/getInventory';
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
import    { checkoutWithCart as Mutation_checkoutWithCart } from './shopping/resolvers/Mutation/checkoutWithCart';
import    { clearCart as Mutation_clearCart } from './shopping/resolvers/Mutation/clearCart';
import    { deleteInventoryItem as Mutation_deleteInventoryItem } from './inventory/resolvers/Mutation/deleteInventoryItem';
import    { firstTimeSetup as Mutation_firstTimeSetup } from './setup/resolvers/Mutation/firstTimeSetup';
import    { removeFromCart as Mutation_removeFromCart } from './shopping/resolvers/Mutation/removeFromCart';
import    { updateInventoryItem as Mutation_updateInventoryItem } from './inventory/resolvers/Mutation/updateInventoryItem';
import    { updateItemInCart as Mutation_updateItemInCart } from './shopping/resolvers/Mutation/updateItemInCart';
import    { Card } from './cards/resolvers/Card';
import    { CardImages } from './cards/resolvers/CardImages';
import    { CartItemOutput } from './shopping/resolvers/CartItemOutput';
import    { ConditionInventories } from './cards/resolvers/ConditionInventories';
import    { ConditionInventory } from './cards/resolvers/ConditionInventory';
import    { InventoryItem } from './inventory/resolvers/InventoryItem';
import    { InventoryPage } from './inventory/resolvers/InventoryPage';
import    { ProductDetail } from './cards/resolvers/ProductDetail';
import    { ProductInventoryRecord } from './cards/resolvers/ProductInventoryRecord';
import    { ProductListing } from './cards/resolvers/ProductListing';
import    { ProductListingPage } from './cards/resolvers/ProductListingPage';
import    { ProductPrice } from './inventory/resolvers/ProductPrice';
import    { ProductSearchResult } from './inventory/resolvers/ProductSearchResult';
import    { Set } from './cards/resolvers/Set';
import    { ShoppingCart } from './shopping/resolvers/ShoppingCart';
    export const resolvers: Resolvers = {
      Query: { getCard: Query_getCard,getInventory: Query_getInventory,getProduct: Query_getProduct,getProductListings: Query_getProductListings,getSets: Query_getSets,getShoppingCart: Query_getShoppingCart,getSingleCardInventory: Query_getSingleCardInventory,isSetupPending: Query_isSetupPending,searchProducts: Query_searchProducts },
      Mutation: { addInventoryItem: Mutation_addInventoryItem,addToCart: Mutation_addToCart,bulkDeleteInventory: Mutation_bulkDeleteInventory,bulkUpdateInventory: Mutation_bulkUpdateInventory,checkoutWithCart: Mutation_checkoutWithCart,clearCart: Mutation_clearCart,deleteInventoryItem: Mutation_deleteInventoryItem,firstTimeSetup: Mutation_firstTimeSetup,removeFromCart: Mutation_removeFromCart,updateInventoryItem: Mutation_updateInventoryItem,updateItemInCart: Mutation_updateItemInCart },
      
      Card: Card,
CardImages: CardImages,
CartItemOutput: CartItemOutput,
ConditionInventories: ConditionInventories,
ConditionInventory: ConditionInventory,
InventoryItem: InventoryItem,
InventoryPage: InventoryPage,
ProductDetail: ProductDetail,
ProductInventoryRecord: ProductInventoryRecord,
ProductListing: ProductListing,
ProductListingPage: ProductListingPage,
ProductPrice: ProductPrice,
ProductSearchResult: ProductSearchResult,
Set: Set,
ShoppingCart: ShoppingCart
    }