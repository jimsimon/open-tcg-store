/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
    import type   { Resolvers } from './types.generated';
    import    { getActiveStoreLocation as Query_getActiveStoreLocation } from './store-locations/resolvers/Query/getActiveStoreLocation';
import    { getAllStoreLocations as Query_getAllStoreLocations } from './store-locations/resolvers/Query/getAllStoreLocations';
import    { getBackupSettings as Query_getBackupSettings } from './settings/resolvers/Query/getBackupSettings';
import    { getCard as Query_getCard } from './cards/resolvers/Query/getCard';
import    { getEmployeeStoreLocations as Query_getEmployeeStoreLocations } from './store-locations/resolvers/Query/getEmployeeStoreLocations';
import    { getIntegrationSettings as Query_getIntegrationSettings } from './settings/resolvers/Query/getIntegrationSettings';
import    { getInventory as Query_getInventory } from './inventory/resolvers/Query/getInventory';
import    { getInventoryItem as Query_getInventoryItem } from './inventory/resolvers/Query/getInventoryItem';
import    { getInventoryItemDetails as Query_getInventoryItemDetails } from './inventory/resolvers/Query/getInventoryItemDetails';
import    { getOrders as Query_getOrders } from './orders/resolvers/Query/getOrders';
import    { getProduct as Query_getProduct } from './cards/resolvers/Query/getProduct';
import    { getProductListings as Query_getProductListings } from './cards/resolvers/Query/getProductListings';
import    { getSets as Query_getSets } from './cards/resolvers/Query/getSets';
import    { getShoppingCart as Query_getShoppingCart } from './shopping/resolvers/Query/getShoppingCart';
import    { getSingleCardInventory as Query_getSingleCardInventory } from './cards/resolvers/Query/getSingleCardInventory';
import    { getStoreLocation as Query_getStoreLocation } from './store-locations/resolvers/Query/getStoreLocation';
import    { getStoreSettings as Query_getStoreSettings } from './settings/resolvers/Query/getStoreSettings';
import    { getTransactionLogs as Query_getTransactionLogs } from './transaction-log/resolvers/Query/getTransactionLogs';
import    { isSetupPending as Query_isSetupPending } from './setup/resolvers/Query/isSetupPending';
import    { lookupSalesTax as Query_lookupSalesTax } from './settings/resolvers/Query/lookupSalesTax';
import    { searchProducts as Query_searchProducts } from './inventory/resolvers/Query/searchProducts';
import    { addInventoryItem as Mutation_addInventoryItem } from './inventory/resolvers/Mutation/addInventoryItem';
import    { addStock as Mutation_addStock } from './inventory/resolvers/Mutation/addStock';
import    { addStoreLocation as Mutation_addStoreLocation } from './store-locations/resolvers/Mutation/addStoreLocation';
import    { addToCart as Mutation_addToCart } from './shopping/resolvers/Mutation/addToCart';
import    { bulkDeleteStock as Mutation_bulkDeleteStock } from './inventory/resolvers/Mutation/bulkDeleteStock';
import    { bulkUpdateStock as Mutation_bulkUpdateStock } from './inventory/resolvers/Mutation/bulkUpdateStock';
import    { cancelOrder as Mutation_cancelOrder } from './orders/resolvers/Mutation/cancelOrder';
import    { checkoutWithCart as Mutation_checkoutWithCart } from './shopping/resolvers/Mutation/checkoutWithCart';
import    { clearCart as Mutation_clearCart } from './shopping/resolvers/Mutation/clearCart';
import    { deleteInventoryItem as Mutation_deleteInventoryItem } from './inventory/resolvers/Mutation/deleteInventoryItem';
import    { deleteStock as Mutation_deleteStock } from './inventory/resolvers/Mutation/deleteStock';
import    { firstTimeSetup as Mutation_firstTimeSetup } from './setup/resolvers/Mutation/firstTimeSetup';
import    { removeFromCart as Mutation_removeFromCart } from './shopping/resolvers/Mutation/removeFromCart';
import    { removeStoreLocation as Mutation_removeStoreLocation } from './store-locations/resolvers/Mutation/removeStoreLocation';
import    { setActiveStoreLocation as Mutation_setActiveStoreLocation } from './store-locations/resolvers/Mutation/setActiveStoreLocation';
import    { submitOrder as Mutation_submitOrder } from './orders/resolvers/Mutation/submitOrder';
import    { triggerBackup as Mutation_triggerBackup } from './settings/resolvers/Mutation/triggerBackup';
import    { triggerRestore as Mutation_triggerRestore } from './settings/resolvers/Mutation/triggerRestore';
import    { updateBackupSettings as Mutation_updateBackupSettings } from './settings/resolvers/Mutation/updateBackupSettings';
import    { updateInventoryItem as Mutation_updateInventoryItem } from './inventory/resolvers/Mutation/updateInventoryItem';
import    { updateItemInCart as Mutation_updateItemInCart } from './shopping/resolvers/Mutation/updateItemInCart';
import    { updateOrderStatus as Mutation_updateOrderStatus } from './orders/resolvers/Mutation/updateOrderStatus';
import    { updateQuickBooksIntegration as Mutation_updateQuickBooksIntegration } from './settings/resolvers/Mutation/updateQuickBooksIntegration';
import    { updateShopifyIntegration as Mutation_updateShopifyIntegration } from './settings/resolvers/Mutation/updateShopifyIntegration';
import    { updateStock as Mutation_updateStock } from './inventory/resolvers/Mutation/updateStock';
import    { updateStoreLocation as Mutation_updateStoreLocation } from './store-locations/resolvers/Mutation/updateStoreLocation';
import    { updateStoreSettings as Mutation_updateStoreSettings } from './settings/resolvers/Mutation/updateStoreSettings';
import    { updateStripeIntegration as Mutation_updateStripeIntegration } from './settings/resolvers/Mutation/updateStripeIntegration';
    export const resolvers: Resolvers = {
      Query: { getActiveStoreLocation: Query_getActiveStoreLocation,getAllStoreLocations: Query_getAllStoreLocations,getBackupSettings: Query_getBackupSettings,getCard: Query_getCard,getEmployeeStoreLocations: Query_getEmployeeStoreLocations,getIntegrationSettings: Query_getIntegrationSettings,getInventory: Query_getInventory,getInventoryItem: Query_getInventoryItem,getInventoryItemDetails: Query_getInventoryItemDetails,getOrders: Query_getOrders,getProduct: Query_getProduct,getProductListings: Query_getProductListings,getSets: Query_getSets,getShoppingCart: Query_getShoppingCart,getSingleCardInventory: Query_getSingleCardInventory,getStoreLocation: Query_getStoreLocation,getStoreSettings: Query_getStoreSettings,getTransactionLogs: Query_getTransactionLogs,isSetupPending: Query_isSetupPending,lookupSalesTax: Query_lookupSalesTax,searchProducts: Query_searchProducts },
      Mutation: { addInventoryItem: Mutation_addInventoryItem,addStock: Mutation_addStock,addStoreLocation: Mutation_addStoreLocation,addToCart: Mutation_addToCart,bulkDeleteStock: Mutation_bulkDeleteStock,bulkUpdateStock: Mutation_bulkUpdateStock,cancelOrder: Mutation_cancelOrder,checkoutWithCart: Mutation_checkoutWithCart,clearCart: Mutation_clearCart,deleteInventoryItem: Mutation_deleteInventoryItem,deleteStock: Mutation_deleteStock,firstTimeSetup: Mutation_firstTimeSetup,removeFromCart: Mutation_removeFromCart,removeStoreLocation: Mutation_removeStoreLocation,setActiveStoreLocation: Mutation_setActiveStoreLocation,submitOrder: Mutation_submitOrder,triggerBackup: Mutation_triggerBackup,triggerRestore: Mutation_triggerRestore,updateBackupSettings: Mutation_updateBackupSettings,updateInventoryItem: Mutation_updateInventoryItem,updateItemInCart: Mutation_updateItemInCart,updateOrderStatus: Mutation_updateOrderStatus,updateQuickBooksIntegration: Mutation_updateQuickBooksIntegration,updateShopifyIntegration: Mutation_updateShopifyIntegration,updateStock: Mutation_updateStock,updateStoreLocation: Mutation_updateStoreLocation,updateStoreSettings: Mutation_updateStoreSettings,updateStripeIntegration: Mutation_updateStripeIntegration },
      
      
    }