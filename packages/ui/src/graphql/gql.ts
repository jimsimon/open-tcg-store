/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation UpdateItemInCart($cartItem: CartItemInput!) {\n    updateItemInCart(cartItem: $cartItem) {\n      items {\n        inventoryItemId\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        maxAvailable\n      }\n    }\n  }\n": typeof types.UpdateItemInCartDocument,
    "\n  mutation RemoveFromCart($cartItem: CartItemInput!) {\n    removeFromCart(cartItem: $cartItem) {\n      items {\n        inventoryItemId\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        maxAvailable\n      }\n    }\n  }\n": typeof types.RemoveFromCartDocument,
    "\n  mutation SubmitOrder($input: SubmitOrderInput!) {\n    submitOrder(input: $input) {\n      id\n      orderNumber\n      customerName\n      totalAmount\n      createdAt\n    }\n  }\n": typeof types.SubmitOrderDocument,
    "\n  query GetShoppingCartQuery {\n    getShoppingCart {\n      items {\n        inventoryItemId\n        quantity\n        productId\n        productName\n        condition\n        unitPrice\n        maxAvailable\n      }\n    }\n  }\n": typeof types.GetShoppingCartQueryDocument,
    "\n  query GetAllStoreLocations {\n    getAllStoreLocations {\n      id\n      name\n      slug\n      city\n      state\n    }\n  }\n": typeof types.GetAllStoreLocationsDocument,
    "\n  query GetEmployeeStoreLocations {\n    getEmployeeStoreLocations {\n      id\n      name\n      slug\n      city\n      state\n    }\n  }\n": typeof types.GetEmployeeStoreLocationsDocument,
    "\n  query UserPermissions {\n    userPermissions {\n      canManageInventory\n      canManageLots\n      canViewDashboard\n      canAccessSettings\n      canManageStoreLocations\n      canManageUsers\n      canViewTransactionLog\n    }\n  }\n": typeof types.UserPermissionsDocument,
    "\n  query GetSupportedGames {\n    getSupportedGames {\n      categoryId\n      name\n      displayName\n    }\n  }\n": typeof types.GetSupportedGamesDocument,
    "\n  mutation AddToCart($cartItem: CartItemInput!) {\n    addToCart(cartItem: $cartItem) {\n      items {\n        inventoryItemId\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        maxAvailable\n      }\n    }\n  }\n": typeof types.AddToCartDocument,
    "\n  query GetPublicBuyRates {\n    getPublicBuyRates {\n      games {\n        categoryId\n        gameName\n        gameDisplayName\n        entries {\n          id\n          description\n          fixedRateCents\n          percentageRate\n          type\n          sortOrder\n        }\n      }\n    }\n  }\n": typeof types.GetPublicBuyRatesDocument,
    "\n  query GetAvailableGames {\n    getAvailableGames {\n      categoryId\n      name\n      displayName\n    }\n  }\n": typeof types.GetAvailableGamesDocument,
    "\n      mutation FirstTimeSetupMutation(\n        $userDetails: UserDetails!\n        $company: CompanySettings!\n        $store: InitialStoreLocation!\n        $supportedGameCategoryIds: [Int!]!\n      ) {\n        firstTimeSetup(\n          userDetails: $userDetails\n          company: $company\n          store: $store\n          supportedGameCategoryIds: $supportedGameCategoryIds\n        )\n      }\n    ": typeof types.FirstTimeSetupMutationDocument,
    "\n  query GetInventory($filters: InventoryFilters, $pagination: PaginationInput) {\n    getInventory(filters: $filters, pagination: $pagination) {\n      items {\n        id\n        productId\n        productName\n        gameName\n        setName\n        rarity\n        isSingle\n        isSealed\n        condition\n        price\n        totalQuantity\n        entryCount\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n": typeof types.GetInventoryDocument,
    "\n  query GetInventoryItem($id: Int!) {\n    getInventoryItem(id: $id) {\n      id\n      productId\n      productName\n      gameName\n      setName\n      rarity\n      isSingle\n      isSealed\n      condition\n      price\n      totalQuantity\n      entryCount\n    }\n  }\n": typeof types.GetInventoryItemDocument,
    "\n  query GetInventoryItemDetails($inventoryItemId: Int!, $pagination: PaginationInput) {\n    getInventoryItemDetails(inventoryItemId: $inventoryItemId, pagination: $pagination) {\n      items {\n        id\n        inventoryItemId\n        quantity\n        costBasis\n        acquisitionDate\n        notes\n        createdAt\n        updatedAt\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n": typeof types.GetInventoryItemDetailsDocument,
    "\n  query SearchProducts($searchTerm: String!, $game: String) {\n    searchProducts(searchTerm: $searchTerm, game: $game) {\n      id\n      name\n      gameName\n      setName\n      rarity\n      imageUrl\n      isSingle\n      isSealed\n      prices {\n        subTypeName\n        lowPrice\n        midPrice\n        highPrice\n        marketPrice\n        directLowPrice\n      }\n    }\n  }\n": typeof types.SearchProductsDocument,
    "\n  mutation AddInventoryItem($input: AddInventoryItemInput!) {\n    addInventoryItem(input: $input) {\n      id\n      productId\n      productName\n      gameName\n      setName\n      rarity\n      condition\n      price\n      totalQuantity\n      entryCount\n    }\n  }\n": typeof types.AddInventoryItemDocument,
    "\n  mutation UpdateInventoryItem($input: UpdateInventoryItemInput!) {\n    updateInventoryItem(input: $input) {\n      id\n      productId\n      productName\n      condition\n      price\n      totalQuantity\n      entryCount\n    }\n  }\n": typeof types.UpdateInventoryItemDocument,
    "\n  mutation DeleteInventoryItem($id: Int!) {\n    deleteInventoryItem(id: $id)\n  }\n": typeof types.DeleteInventoryItemDocument,
    "\n  mutation AddStock($input: AddStockInput!) {\n    addStock(input: $input) {\n      id\n      inventoryItemId\n      quantity\n      costBasis\n      acquisitionDate\n      notes\n    }\n  }\n": typeof types.AddStockDocument,
    "\n  mutation UpdateStock($input: UpdateStockInput!) {\n    updateStock(input: $input) {\n      id\n      inventoryItemId\n      quantity\n      costBasis\n      acquisitionDate\n      notes\n    }\n  }\n": typeof types.UpdateStockDocument,
    "\n  mutation DeleteStock($id: Int!) {\n    deleteStock(id: $id)\n  }\n": typeof types.DeleteStockDocument,
    "\n  mutation BulkUpdateStock($input: BulkUpdateStockInput!) {\n    bulkUpdateStock(input: $input) {\n      id\n    }\n  }\n": typeof types.BulkUpdateStockDocument,
    "\n  mutation BulkDeleteStock($input: BulkDeleteStockInput!) {\n    bulkDeleteStock(input: $input)\n  }\n": typeof types.BulkDeleteStockDocument,
    "\n  query SearchProductsForLot($searchTerm: String!, $isSingle: Boolean, $isSealed: Boolean) {\n    searchProducts(searchTerm: $searchTerm, isSingle: $isSingle, isSealed: $isSealed) {\n      id\n      name\n      gameName\n      setName\n      rarity\n      imageUrl\n      isSingle\n      isSealed\n      prices {\n        subTypeName\n        marketPrice\n        midPrice\n      }\n    }\n  }\n": typeof types.SearchProductsForLotDocument,
    "\n  query GetLot($id: Int!) {\n    getLot(id: $id) {\n      id\n      name\n      description\n      amountPaid\n      acquisitionDate\n      items {\n        id\n        productId\n        productName\n        gameName\n        setName\n        rarity\n        isSingle\n        isSealed\n        condition\n        quantity\n        costBasis\n        costOverridden\n        marketValue\n      }\n      totalMarketValue\n      totalCost\n      projectedProfitLoss\n      projectedProfitMargin\n    }\n  }\n": typeof types.GetLotDocument,
    "\n  mutation CreateLot($input: CreateLotInput!) {\n    createLot(input: $input) {\n      id\n    }\n  }\n": typeof types.CreateLotDocument,
    "\n  mutation UpdateLot($input: UpdateLotInput!) {\n    updateLot(input: $input) {\n      id\n    }\n  }\n": typeof types.UpdateLotDocument,
    "\n  query GetLots($filters: LotFilters, $pagination: PaginationInput) {\n    getLots(filters: $filters, pagination: $pagination) {\n      items {\n        id\n        name\n        description\n        amountPaid\n        acquisitionDate\n        totalMarketValue\n        totalCost\n        projectedProfitLoss\n        projectedProfitMargin\n        createdAt\n        items {\n          id\n        }\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n": typeof types.GetLotsDocument,
    "\n  mutation DeleteLot($id: Int!) {\n    deleteLot(id: $id)\n  }\n": typeof types.DeleteLotDocument,
    "\n  query GetLotStats {\n    getLotStats {\n      totalLots\n      totalInvested\n      totalMarketValue\n      totalProfitLoss\n    }\n  }\n": typeof types.GetLotStatsDocument,
    "\n  query GetOrders($pagination: PaginationInput, $filters: OrderFilters) {\n    getOrders(pagination: $pagination, filters: $filters) {\n      items {\n        id\n        orderNumber\n        customerName\n        status\n        totalAmount\n        totalCostBasis\n        totalProfit\n        createdAt\n        items {\n          id\n          productId\n          productName\n          condition\n          quantity\n          unitPrice\n          costBasis\n          profit\n          lotId\n        }\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n": typeof types.GetOrdersDocument,
    "\n  mutation CancelOrder($orderId: Int!) {\n    cancelOrder(orderId: $orderId) {\n      id\n      orderNumber\n      customerName\n      status\n      totalAmount\n      totalCostBasis\n      totalProfit\n      createdAt\n      items {\n        id\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        costBasis\n        profit\n      }\n    }\n  }\n": typeof types.CancelOrderDocument,
    "\n  mutation UpdateOrderStatus($orderId: Int!, $status: OrderStatus!) {\n    updateOrderStatus(orderId: $orderId, status: $status) {\n      id\n      orderNumber\n      customerName\n      status\n      totalAmount\n      totalCostBasis\n      totalProfit\n      createdAt\n      items {\n        id\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        costBasis\n        profit\n      }\n    }\n  }\n": typeof types.UpdateOrderStatusDocument,
    "\n  query GetProduct($productId: String!) {\n    getProduct(productId: $productId) {\n      id\n      name\n      setName\n      gameName\n      rarity\n      type\n      text\n      flavorText\n      finishes\n      isSingle\n      isSealed\n      images {\n        small\n        large\n      }\n      inventoryRecords {\n        inventoryItemId\n        condition\n        quantity\n        price\n      }\n    }\n  }\n": typeof types.GetProductDocument,
    "\n  query GetSealedProductListings($filters: ProductListingFilters, $pagination: ProductListingPagination) {\n    getProductListings(filters: $filters, pagination: $pagination) {\n      items {\n        id\n        name\n        setName\n        gameName\n        finishes\n        images {\n          small\n          large\n        }\n        totalQuantity\n        lowestPrice\n        lowestPriceInventoryItemId\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n": typeof types.GetSealedProductListingsDocument,
    "\n  query GetSealedSets($game: String!, $filters: SetFilters) {\n    getSets(game: $game, filters: $filters) {\n      code\n      name\n    }\n  }\n": typeof types.GetSealedSetsDocument,
    "\n  query GetSinglesProductListings($filters: ProductListingFilters, $pagination: ProductListingPagination) {\n    getProductListings(filters: $filters, pagination: $pagination) {\n      items {\n        id\n        name\n        setName\n        gameName\n        rarity\n        finishes\n        images {\n          small\n          large\n        }\n        totalQuantity\n        lowestPrice\n        conditionPrices {\n          inventoryItemId\n          condition\n          quantity\n          price\n        }\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n": typeof types.GetSinglesProductListingsDocument,
    "\n  query GetSinglesSets($game: String!, $filters: SetFilters) {\n    getSets(game: $game, filters: $filters) {\n      code\n      name\n    }\n  }\n": typeof types.GetSinglesSetsDocument,
    "\n  query GetBackupSettings {\n    getBackupSettings {\n      provider\n      frequency\n      lastBackupAt\n      googleDriveConnected\n      dropboxConnected\n      onedriveConnected\n    }\n  }\n": typeof types.GetBackupSettingsDocument,
    "\n  mutation UpdateBackupSettings($input: UpdateBackupSettingsInput!) {\n    updateBackupSettings(input: $input) {\n      provider\n      frequency\n      lastBackupAt\n      googleDriveConnected\n      dropboxConnected\n      onedriveConnected\n    }\n  }\n": typeof types.UpdateBackupSettingsDocument,
    "\n  mutation TriggerBackup {\n    triggerBackup {\n      success\n      message\n      timestamp\n    }\n  }\n": typeof types.TriggerBackupDocument,
    "\n  mutation TriggerRestore($provider: BackupProvider!) {\n    triggerRestore(provider: $provider) {\n      success\n      message\n    }\n  }\n": typeof types.TriggerRestoreDocument,
    "\n  query GetBuyRates($categoryId: Int!) {\n    getBuyRates(categoryId: $categoryId) {\n      id\n      description\n      fixedRateCents\n      percentageRate\n      type\n      rarity\n      hidden\n      sortOrder\n    }\n  }\n": typeof types.GetBuyRatesDocument,
    "\n  query GetDistinctRarities($categoryId: Int!) {\n    getDistinctRarities(categoryId: $categoryId)\n  }\n": typeof types.GetDistinctRaritiesDocument,
    "\n  mutation SaveBuyRates($input: SaveBuyRatesInput!) {\n    saveBuyRates(input: $input) {\n      id\n      description\n      fixedRateCents\n      percentageRate\n      type\n      rarity\n      hidden\n      sortOrder\n    }\n  }\n": typeof types.SaveBuyRatesDocument,
    "\n  query GetDashboardSales($organizationId: String!, $dateRange: DashboardDateRange!) {\n    getDashboardSales(organizationId: $organizationId, dateRange: $dateRange) {\n      summary {\n        totalRevenue\n        totalCost\n        totalProfit\n        profitMargin\n        orderCount\n      }\n      dataPoints {\n        label\n        revenue\n        cost\n        profit\n        orderCount\n      }\n      granularity\n    }\n  }\n": typeof types.GetDashboardSalesDocument,
    "\n  query GetDashboardBestSellers(\n    $organizationId: String!\n    $dateRange: DashboardDateRange!\n    $sortBy: BestSellerSortBy!\n    $limit: Int\n  ) {\n    getDashboardBestSellers(organizationId: $organizationId, dateRange: $dateRange, sortBy: $sortBy, limit: $limit) {\n      productId\n      productName\n      totalQuantity\n      totalRevenue\n    }\n  }\n": typeof types.GetDashboardBestSellersDocument,
    "\n  query GetDashboardInventorySummary($organizationId: String!) {\n    getDashboardInventorySummary(organizationId: $organizationId) {\n      totalSkus\n      totalUnits\n      totalCostValue\n      totalRetailValue\n    }\n  }\n": typeof types.GetDashboardInventorySummaryDocument,
    "\n  query GetDashboardOrderStatus($organizationId: String!, $dateRange: DashboardDateRange!) {\n    getDashboardOrderStatus(organizationId: $organizationId, dateRange: $dateRange) {\n      open\n      completed\n      cancelled\n      total\n    }\n  }\n": typeof types.GetDashboardOrderStatusDocument,
    "\n  query GetDataUpdateStatus {\n    getDataUpdateStatus {\n      currentVersion\n      latestVersion\n      updateAvailable\n      isUpdating\n    }\n  }\n": typeof types.GetDataUpdateStatusDocument,
    "\n  mutation TriggerDataUpdate {\n    triggerDataUpdate {\n      success\n      message\n      newVersion\n    }\n  }\n": typeof types.TriggerDataUpdateDocument,
    "\n  query GetStoreSettings {\n    getStoreSettings {\n      companyName\n      ein\n    }\n  }\n": typeof types.GetStoreSettingsDocument,
    "\n  mutation UpdateStoreSettings($input: UpdateStoreSettingsInput!) {\n    updateStoreSettings(input: $input) {\n      companyName\n      ein\n    }\n  }\n": typeof types.UpdateStoreSettingsDocument,
    "\n  query GetAvailableGamesForSettings {\n    getAvailableGames {\n      categoryId\n      name\n      displayName\n    }\n  }\n": typeof types.GetAvailableGamesForSettingsDocument,
    "\n  mutation SetSupportedGames($categoryIds: [Int!]!) {\n    setSupportedGames(categoryIds: $categoryIds) {\n      categoryId\n      name\n      displayName\n    }\n  }\n": typeof types.SetSupportedGamesDocument,
    "\n  query GetIntegrationSettings {\n    getIntegrationSettings {\n      stripe {\n        enabled\n        hasApiKey\n      }\n      shopify {\n        enabled\n        hasApiKey\n        shopDomain\n      }\n    }\n  }\n": typeof types.GetIntegrationSettingsDocument,
    "\n  mutation UpdateStripeIntegration($input: UpdateStripeIntegrationInput!) {\n    updateStripeIntegration(input: $input) {\n      enabled\n      hasApiKey\n    }\n  }\n": typeof types.UpdateStripeIntegrationDocument,
    "\n  mutation UpdateShopifyIntegration($input: UpdateShopifyIntegrationInput!) {\n    updateShopifyIntegration(input: $input) {\n      enabled\n      hasApiKey\n      shopDomain\n    }\n  }\n": typeof types.UpdateShopifyIntegrationDocument,
    "\n  query GetAllStoreLocationsAdmin {\n    getEmployeeStoreLocations {\n      id\n      name\n      slug\n      street1\n      street2\n      city\n      state\n      zip\n      phone\n      hours {\n        dayOfWeek\n        openTime\n        closeTime\n      }\n      createdAt\n    }\n  }\n": typeof types.GetAllStoreLocationsAdminDocument,
    "\n  mutation AddStoreLocation($input: AddStoreLocationInput!) {\n    addStoreLocation(input: $input) {\n      id\n      name\n      slug\n      street1\n      street2\n      city\n      state\n      zip\n      phone\n      hours {\n        dayOfWeek\n        openTime\n        closeTime\n      }\n      createdAt\n    }\n  }\n": typeof types.AddStoreLocationDocument,
    "\n  mutation UpdateStoreLocation($input: UpdateStoreLocationInput!) {\n    updateStoreLocation(input: $input) {\n      id\n      name\n      slug\n      street1\n      street2\n      city\n      state\n      zip\n      phone\n      hours {\n        dayOfWeek\n        openTime\n        closeTime\n      }\n      createdAt\n    }\n  }\n": typeof types.UpdateStoreLocationDocument,
    "\n  mutation RemoveStoreLocation($id: String!) {\n    removeStoreLocation(id: $id)\n  }\n": typeof types.RemoveStoreLocationDocument,
    "\n  query GetTransactionLogs($pagination: PaginationInput, $filters: TransactionLogFilters) {\n    getTransactionLogs(pagination: $pagination, filters: $filters) {\n      items {\n        id\n        action\n        resourceType\n        resourceId\n        details\n        userName\n        userEmail\n        createdAt\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n": typeof types.GetTransactionLogsDocument,
    "\n  query IsSetupPending {\n    isSetupPending\n  }\n": typeof types.IsSetupPendingDocument,
};
const documents: Documents = {
    "\n  mutation UpdateItemInCart($cartItem: CartItemInput!) {\n    updateItemInCart(cartItem: $cartItem) {\n      items {\n        inventoryItemId\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        maxAvailable\n      }\n    }\n  }\n": types.UpdateItemInCartDocument,
    "\n  mutation RemoveFromCart($cartItem: CartItemInput!) {\n    removeFromCart(cartItem: $cartItem) {\n      items {\n        inventoryItemId\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        maxAvailable\n      }\n    }\n  }\n": types.RemoveFromCartDocument,
    "\n  mutation SubmitOrder($input: SubmitOrderInput!) {\n    submitOrder(input: $input) {\n      id\n      orderNumber\n      customerName\n      totalAmount\n      createdAt\n    }\n  }\n": types.SubmitOrderDocument,
    "\n  query GetShoppingCartQuery {\n    getShoppingCart {\n      items {\n        inventoryItemId\n        quantity\n        productId\n        productName\n        condition\n        unitPrice\n        maxAvailable\n      }\n    }\n  }\n": types.GetShoppingCartQueryDocument,
    "\n  query GetAllStoreLocations {\n    getAllStoreLocations {\n      id\n      name\n      slug\n      city\n      state\n    }\n  }\n": types.GetAllStoreLocationsDocument,
    "\n  query GetEmployeeStoreLocations {\n    getEmployeeStoreLocations {\n      id\n      name\n      slug\n      city\n      state\n    }\n  }\n": types.GetEmployeeStoreLocationsDocument,
    "\n  query UserPermissions {\n    userPermissions {\n      canManageInventory\n      canManageLots\n      canViewDashboard\n      canAccessSettings\n      canManageStoreLocations\n      canManageUsers\n      canViewTransactionLog\n    }\n  }\n": types.UserPermissionsDocument,
    "\n  query GetSupportedGames {\n    getSupportedGames {\n      categoryId\n      name\n      displayName\n    }\n  }\n": types.GetSupportedGamesDocument,
    "\n  mutation AddToCart($cartItem: CartItemInput!) {\n    addToCart(cartItem: $cartItem) {\n      items {\n        inventoryItemId\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        maxAvailable\n      }\n    }\n  }\n": types.AddToCartDocument,
    "\n  query GetPublicBuyRates {\n    getPublicBuyRates {\n      games {\n        categoryId\n        gameName\n        gameDisplayName\n        entries {\n          id\n          description\n          fixedRateCents\n          percentageRate\n          type\n          sortOrder\n        }\n      }\n    }\n  }\n": types.GetPublicBuyRatesDocument,
    "\n  query GetAvailableGames {\n    getAvailableGames {\n      categoryId\n      name\n      displayName\n    }\n  }\n": types.GetAvailableGamesDocument,
    "\n      mutation FirstTimeSetupMutation(\n        $userDetails: UserDetails!\n        $company: CompanySettings!\n        $store: InitialStoreLocation!\n        $supportedGameCategoryIds: [Int!]!\n      ) {\n        firstTimeSetup(\n          userDetails: $userDetails\n          company: $company\n          store: $store\n          supportedGameCategoryIds: $supportedGameCategoryIds\n        )\n      }\n    ": types.FirstTimeSetupMutationDocument,
    "\n  query GetInventory($filters: InventoryFilters, $pagination: PaginationInput) {\n    getInventory(filters: $filters, pagination: $pagination) {\n      items {\n        id\n        productId\n        productName\n        gameName\n        setName\n        rarity\n        isSingle\n        isSealed\n        condition\n        price\n        totalQuantity\n        entryCount\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n": types.GetInventoryDocument,
    "\n  query GetInventoryItem($id: Int!) {\n    getInventoryItem(id: $id) {\n      id\n      productId\n      productName\n      gameName\n      setName\n      rarity\n      isSingle\n      isSealed\n      condition\n      price\n      totalQuantity\n      entryCount\n    }\n  }\n": types.GetInventoryItemDocument,
    "\n  query GetInventoryItemDetails($inventoryItemId: Int!, $pagination: PaginationInput) {\n    getInventoryItemDetails(inventoryItemId: $inventoryItemId, pagination: $pagination) {\n      items {\n        id\n        inventoryItemId\n        quantity\n        costBasis\n        acquisitionDate\n        notes\n        createdAt\n        updatedAt\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n": types.GetInventoryItemDetailsDocument,
    "\n  query SearchProducts($searchTerm: String!, $game: String) {\n    searchProducts(searchTerm: $searchTerm, game: $game) {\n      id\n      name\n      gameName\n      setName\n      rarity\n      imageUrl\n      isSingle\n      isSealed\n      prices {\n        subTypeName\n        lowPrice\n        midPrice\n        highPrice\n        marketPrice\n        directLowPrice\n      }\n    }\n  }\n": types.SearchProductsDocument,
    "\n  mutation AddInventoryItem($input: AddInventoryItemInput!) {\n    addInventoryItem(input: $input) {\n      id\n      productId\n      productName\n      gameName\n      setName\n      rarity\n      condition\n      price\n      totalQuantity\n      entryCount\n    }\n  }\n": types.AddInventoryItemDocument,
    "\n  mutation UpdateInventoryItem($input: UpdateInventoryItemInput!) {\n    updateInventoryItem(input: $input) {\n      id\n      productId\n      productName\n      condition\n      price\n      totalQuantity\n      entryCount\n    }\n  }\n": types.UpdateInventoryItemDocument,
    "\n  mutation DeleteInventoryItem($id: Int!) {\n    deleteInventoryItem(id: $id)\n  }\n": types.DeleteInventoryItemDocument,
    "\n  mutation AddStock($input: AddStockInput!) {\n    addStock(input: $input) {\n      id\n      inventoryItemId\n      quantity\n      costBasis\n      acquisitionDate\n      notes\n    }\n  }\n": types.AddStockDocument,
    "\n  mutation UpdateStock($input: UpdateStockInput!) {\n    updateStock(input: $input) {\n      id\n      inventoryItemId\n      quantity\n      costBasis\n      acquisitionDate\n      notes\n    }\n  }\n": types.UpdateStockDocument,
    "\n  mutation DeleteStock($id: Int!) {\n    deleteStock(id: $id)\n  }\n": types.DeleteStockDocument,
    "\n  mutation BulkUpdateStock($input: BulkUpdateStockInput!) {\n    bulkUpdateStock(input: $input) {\n      id\n    }\n  }\n": types.BulkUpdateStockDocument,
    "\n  mutation BulkDeleteStock($input: BulkDeleteStockInput!) {\n    bulkDeleteStock(input: $input)\n  }\n": types.BulkDeleteStockDocument,
    "\n  query SearchProductsForLot($searchTerm: String!, $isSingle: Boolean, $isSealed: Boolean) {\n    searchProducts(searchTerm: $searchTerm, isSingle: $isSingle, isSealed: $isSealed) {\n      id\n      name\n      gameName\n      setName\n      rarity\n      imageUrl\n      isSingle\n      isSealed\n      prices {\n        subTypeName\n        marketPrice\n        midPrice\n      }\n    }\n  }\n": types.SearchProductsForLotDocument,
    "\n  query GetLot($id: Int!) {\n    getLot(id: $id) {\n      id\n      name\n      description\n      amountPaid\n      acquisitionDate\n      items {\n        id\n        productId\n        productName\n        gameName\n        setName\n        rarity\n        isSingle\n        isSealed\n        condition\n        quantity\n        costBasis\n        costOverridden\n        marketValue\n      }\n      totalMarketValue\n      totalCost\n      projectedProfitLoss\n      projectedProfitMargin\n    }\n  }\n": types.GetLotDocument,
    "\n  mutation CreateLot($input: CreateLotInput!) {\n    createLot(input: $input) {\n      id\n    }\n  }\n": types.CreateLotDocument,
    "\n  mutation UpdateLot($input: UpdateLotInput!) {\n    updateLot(input: $input) {\n      id\n    }\n  }\n": types.UpdateLotDocument,
    "\n  query GetLots($filters: LotFilters, $pagination: PaginationInput) {\n    getLots(filters: $filters, pagination: $pagination) {\n      items {\n        id\n        name\n        description\n        amountPaid\n        acquisitionDate\n        totalMarketValue\n        totalCost\n        projectedProfitLoss\n        projectedProfitMargin\n        createdAt\n        items {\n          id\n        }\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n": types.GetLotsDocument,
    "\n  mutation DeleteLot($id: Int!) {\n    deleteLot(id: $id)\n  }\n": types.DeleteLotDocument,
    "\n  query GetLotStats {\n    getLotStats {\n      totalLots\n      totalInvested\n      totalMarketValue\n      totalProfitLoss\n    }\n  }\n": types.GetLotStatsDocument,
    "\n  query GetOrders($pagination: PaginationInput, $filters: OrderFilters) {\n    getOrders(pagination: $pagination, filters: $filters) {\n      items {\n        id\n        orderNumber\n        customerName\n        status\n        totalAmount\n        totalCostBasis\n        totalProfit\n        createdAt\n        items {\n          id\n          productId\n          productName\n          condition\n          quantity\n          unitPrice\n          costBasis\n          profit\n          lotId\n        }\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n": types.GetOrdersDocument,
    "\n  mutation CancelOrder($orderId: Int!) {\n    cancelOrder(orderId: $orderId) {\n      id\n      orderNumber\n      customerName\n      status\n      totalAmount\n      totalCostBasis\n      totalProfit\n      createdAt\n      items {\n        id\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        costBasis\n        profit\n      }\n    }\n  }\n": types.CancelOrderDocument,
    "\n  mutation UpdateOrderStatus($orderId: Int!, $status: OrderStatus!) {\n    updateOrderStatus(orderId: $orderId, status: $status) {\n      id\n      orderNumber\n      customerName\n      status\n      totalAmount\n      totalCostBasis\n      totalProfit\n      createdAt\n      items {\n        id\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        costBasis\n        profit\n      }\n    }\n  }\n": types.UpdateOrderStatusDocument,
    "\n  query GetProduct($productId: String!) {\n    getProduct(productId: $productId) {\n      id\n      name\n      setName\n      gameName\n      rarity\n      type\n      text\n      flavorText\n      finishes\n      isSingle\n      isSealed\n      images {\n        small\n        large\n      }\n      inventoryRecords {\n        inventoryItemId\n        condition\n        quantity\n        price\n      }\n    }\n  }\n": types.GetProductDocument,
    "\n  query GetSealedProductListings($filters: ProductListingFilters, $pagination: ProductListingPagination) {\n    getProductListings(filters: $filters, pagination: $pagination) {\n      items {\n        id\n        name\n        setName\n        gameName\n        finishes\n        images {\n          small\n          large\n        }\n        totalQuantity\n        lowestPrice\n        lowestPriceInventoryItemId\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n": types.GetSealedProductListingsDocument,
    "\n  query GetSealedSets($game: String!, $filters: SetFilters) {\n    getSets(game: $game, filters: $filters) {\n      code\n      name\n    }\n  }\n": types.GetSealedSetsDocument,
    "\n  query GetSinglesProductListings($filters: ProductListingFilters, $pagination: ProductListingPagination) {\n    getProductListings(filters: $filters, pagination: $pagination) {\n      items {\n        id\n        name\n        setName\n        gameName\n        rarity\n        finishes\n        images {\n          small\n          large\n        }\n        totalQuantity\n        lowestPrice\n        conditionPrices {\n          inventoryItemId\n          condition\n          quantity\n          price\n        }\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n": types.GetSinglesProductListingsDocument,
    "\n  query GetSinglesSets($game: String!, $filters: SetFilters) {\n    getSets(game: $game, filters: $filters) {\n      code\n      name\n    }\n  }\n": types.GetSinglesSetsDocument,
    "\n  query GetBackupSettings {\n    getBackupSettings {\n      provider\n      frequency\n      lastBackupAt\n      googleDriveConnected\n      dropboxConnected\n      onedriveConnected\n    }\n  }\n": types.GetBackupSettingsDocument,
    "\n  mutation UpdateBackupSettings($input: UpdateBackupSettingsInput!) {\n    updateBackupSettings(input: $input) {\n      provider\n      frequency\n      lastBackupAt\n      googleDriveConnected\n      dropboxConnected\n      onedriveConnected\n    }\n  }\n": types.UpdateBackupSettingsDocument,
    "\n  mutation TriggerBackup {\n    triggerBackup {\n      success\n      message\n      timestamp\n    }\n  }\n": types.TriggerBackupDocument,
    "\n  mutation TriggerRestore($provider: BackupProvider!) {\n    triggerRestore(provider: $provider) {\n      success\n      message\n    }\n  }\n": types.TriggerRestoreDocument,
    "\n  query GetBuyRates($categoryId: Int!) {\n    getBuyRates(categoryId: $categoryId) {\n      id\n      description\n      fixedRateCents\n      percentageRate\n      type\n      rarity\n      hidden\n      sortOrder\n    }\n  }\n": types.GetBuyRatesDocument,
    "\n  query GetDistinctRarities($categoryId: Int!) {\n    getDistinctRarities(categoryId: $categoryId)\n  }\n": types.GetDistinctRaritiesDocument,
    "\n  mutation SaveBuyRates($input: SaveBuyRatesInput!) {\n    saveBuyRates(input: $input) {\n      id\n      description\n      fixedRateCents\n      percentageRate\n      type\n      rarity\n      hidden\n      sortOrder\n    }\n  }\n": types.SaveBuyRatesDocument,
    "\n  query GetDashboardSales($organizationId: String!, $dateRange: DashboardDateRange!) {\n    getDashboardSales(organizationId: $organizationId, dateRange: $dateRange) {\n      summary {\n        totalRevenue\n        totalCost\n        totalProfit\n        profitMargin\n        orderCount\n      }\n      dataPoints {\n        label\n        revenue\n        cost\n        profit\n        orderCount\n      }\n      granularity\n    }\n  }\n": types.GetDashboardSalesDocument,
    "\n  query GetDashboardBestSellers(\n    $organizationId: String!\n    $dateRange: DashboardDateRange!\n    $sortBy: BestSellerSortBy!\n    $limit: Int\n  ) {\n    getDashboardBestSellers(organizationId: $organizationId, dateRange: $dateRange, sortBy: $sortBy, limit: $limit) {\n      productId\n      productName\n      totalQuantity\n      totalRevenue\n    }\n  }\n": types.GetDashboardBestSellersDocument,
    "\n  query GetDashboardInventorySummary($organizationId: String!) {\n    getDashboardInventorySummary(organizationId: $organizationId) {\n      totalSkus\n      totalUnits\n      totalCostValue\n      totalRetailValue\n    }\n  }\n": types.GetDashboardInventorySummaryDocument,
    "\n  query GetDashboardOrderStatus($organizationId: String!, $dateRange: DashboardDateRange!) {\n    getDashboardOrderStatus(organizationId: $organizationId, dateRange: $dateRange) {\n      open\n      completed\n      cancelled\n      total\n    }\n  }\n": types.GetDashboardOrderStatusDocument,
    "\n  query GetDataUpdateStatus {\n    getDataUpdateStatus {\n      currentVersion\n      latestVersion\n      updateAvailable\n      isUpdating\n    }\n  }\n": types.GetDataUpdateStatusDocument,
    "\n  mutation TriggerDataUpdate {\n    triggerDataUpdate {\n      success\n      message\n      newVersion\n    }\n  }\n": types.TriggerDataUpdateDocument,
    "\n  query GetStoreSettings {\n    getStoreSettings {\n      companyName\n      ein\n    }\n  }\n": types.GetStoreSettingsDocument,
    "\n  mutation UpdateStoreSettings($input: UpdateStoreSettingsInput!) {\n    updateStoreSettings(input: $input) {\n      companyName\n      ein\n    }\n  }\n": types.UpdateStoreSettingsDocument,
    "\n  query GetAvailableGamesForSettings {\n    getAvailableGames {\n      categoryId\n      name\n      displayName\n    }\n  }\n": types.GetAvailableGamesForSettingsDocument,
    "\n  mutation SetSupportedGames($categoryIds: [Int!]!) {\n    setSupportedGames(categoryIds: $categoryIds) {\n      categoryId\n      name\n      displayName\n    }\n  }\n": types.SetSupportedGamesDocument,
    "\n  query GetIntegrationSettings {\n    getIntegrationSettings {\n      stripe {\n        enabled\n        hasApiKey\n      }\n      shopify {\n        enabled\n        hasApiKey\n        shopDomain\n      }\n    }\n  }\n": types.GetIntegrationSettingsDocument,
    "\n  mutation UpdateStripeIntegration($input: UpdateStripeIntegrationInput!) {\n    updateStripeIntegration(input: $input) {\n      enabled\n      hasApiKey\n    }\n  }\n": types.UpdateStripeIntegrationDocument,
    "\n  mutation UpdateShopifyIntegration($input: UpdateShopifyIntegrationInput!) {\n    updateShopifyIntegration(input: $input) {\n      enabled\n      hasApiKey\n      shopDomain\n    }\n  }\n": types.UpdateShopifyIntegrationDocument,
    "\n  query GetAllStoreLocationsAdmin {\n    getEmployeeStoreLocations {\n      id\n      name\n      slug\n      street1\n      street2\n      city\n      state\n      zip\n      phone\n      hours {\n        dayOfWeek\n        openTime\n        closeTime\n      }\n      createdAt\n    }\n  }\n": types.GetAllStoreLocationsAdminDocument,
    "\n  mutation AddStoreLocation($input: AddStoreLocationInput!) {\n    addStoreLocation(input: $input) {\n      id\n      name\n      slug\n      street1\n      street2\n      city\n      state\n      zip\n      phone\n      hours {\n        dayOfWeek\n        openTime\n        closeTime\n      }\n      createdAt\n    }\n  }\n": types.AddStoreLocationDocument,
    "\n  mutation UpdateStoreLocation($input: UpdateStoreLocationInput!) {\n    updateStoreLocation(input: $input) {\n      id\n      name\n      slug\n      street1\n      street2\n      city\n      state\n      zip\n      phone\n      hours {\n        dayOfWeek\n        openTime\n        closeTime\n      }\n      createdAt\n    }\n  }\n": types.UpdateStoreLocationDocument,
    "\n  mutation RemoveStoreLocation($id: String!) {\n    removeStoreLocation(id: $id)\n  }\n": types.RemoveStoreLocationDocument,
    "\n  query GetTransactionLogs($pagination: PaginationInput, $filters: TransactionLogFilters) {\n    getTransactionLogs(pagination: $pagination, filters: $filters) {\n      items {\n        id\n        action\n        resourceType\n        resourceId\n        details\n        userName\n        userEmail\n        createdAt\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n": types.GetTransactionLogsDocument,
    "\n  query IsSetupPending {\n    isSetupPending\n  }\n": types.IsSetupPendingDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateItemInCart($cartItem: CartItemInput!) {\n    updateItemInCart(cartItem: $cartItem) {\n      items {\n        inventoryItemId\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        maxAvailable\n      }\n    }\n  }\n"): typeof import('./graphql').UpdateItemInCartDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveFromCart($cartItem: CartItemInput!) {\n    removeFromCart(cartItem: $cartItem) {\n      items {\n        inventoryItemId\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        maxAvailable\n      }\n    }\n  }\n"): typeof import('./graphql').RemoveFromCartDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SubmitOrder($input: SubmitOrderInput!) {\n    submitOrder(input: $input) {\n      id\n      orderNumber\n      customerName\n      totalAmount\n      createdAt\n    }\n  }\n"): typeof import('./graphql').SubmitOrderDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetShoppingCartQuery {\n    getShoppingCart {\n      items {\n        inventoryItemId\n        quantity\n        productId\n        productName\n        condition\n        unitPrice\n        maxAvailable\n      }\n    }\n  }\n"): typeof import('./graphql').GetShoppingCartQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAllStoreLocations {\n    getAllStoreLocations {\n      id\n      name\n      slug\n      city\n      state\n    }\n  }\n"): typeof import('./graphql').GetAllStoreLocationsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetEmployeeStoreLocations {\n    getEmployeeStoreLocations {\n      id\n      name\n      slug\n      city\n      state\n    }\n  }\n"): typeof import('./graphql').GetEmployeeStoreLocationsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserPermissions {\n    userPermissions {\n      canManageInventory\n      canManageLots\n      canViewDashboard\n      canAccessSettings\n      canManageStoreLocations\n      canManageUsers\n      canViewTransactionLog\n    }\n  }\n"): typeof import('./graphql').UserPermissionsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetSupportedGames {\n    getSupportedGames {\n      categoryId\n      name\n      displayName\n    }\n  }\n"): typeof import('./graphql').GetSupportedGamesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddToCart($cartItem: CartItemInput!) {\n    addToCart(cartItem: $cartItem) {\n      items {\n        inventoryItemId\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        maxAvailable\n      }\n    }\n  }\n"): typeof import('./graphql').AddToCartDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetPublicBuyRates {\n    getPublicBuyRates {\n      games {\n        categoryId\n        gameName\n        gameDisplayName\n        entries {\n          id\n          description\n          fixedRateCents\n          percentageRate\n          type\n          sortOrder\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').GetPublicBuyRatesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAvailableGames {\n    getAvailableGames {\n      categoryId\n      name\n      displayName\n    }\n  }\n"): typeof import('./graphql').GetAvailableGamesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation FirstTimeSetupMutation(\n        $userDetails: UserDetails!\n        $company: CompanySettings!\n        $store: InitialStoreLocation!\n        $supportedGameCategoryIds: [Int!]!\n      ) {\n        firstTimeSetup(\n          userDetails: $userDetails\n          company: $company\n          store: $store\n          supportedGameCategoryIds: $supportedGameCategoryIds\n        )\n      }\n    "): typeof import('./graphql').FirstTimeSetupMutationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetInventory($filters: InventoryFilters, $pagination: PaginationInput) {\n    getInventory(filters: $filters, pagination: $pagination) {\n      items {\n        id\n        productId\n        productName\n        gameName\n        setName\n        rarity\n        isSingle\n        isSealed\n        condition\n        price\n        totalQuantity\n        entryCount\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n"): typeof import('./graphql').GetInventoryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetInventoryItem($id: Int!) {\n    getInventoryItem(id: $id) {\n      id\n      productId\n      productName\n      gameName\n      setName\n      rarity\n      isSingle\n      isSealed\n      condition\n      price\n      totalQuantity\n      entryCount\n    }\n  }\n"): typeof import('./graphql').GetInventoryItemDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetInventoryItemDetails($inventoryItemId: Int!, $pagination: PaginationInput) {\n    getInventoryItemDetails(inventoryItemId: $inventoryItemId, pagination: $pagination) {\n      items {\n        id\n        inventoryItemId\n        quantity\n        costBasis\n        acquisitionDate\n        notes\n        createdAt\n        updatedAt\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n"): typeof import('./graphql').GetInventoryItemDetailsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SearchProducts($searchTerm: String!, $game: String) {\n    searchProducts(searchTerm: $searchTerm, game: $game) {\n      id\n      name\n      gameName\n      setName\n      rarity\n      imageUrl\n      isSingle\n      isSealed\n      prices {\n        subTypeName\n        lowPrice\n        midPrice\n        highPrice\n        marketPrice\n        directLowPrice\n      }\n    }\n  }\n"): typeof import('./graphql').SearchProductsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddInventoryItem($input: AddInventoryItemInput!) {\n    addInventoryItem(input: $input) {\n      id\n      productId\n      productName\n      gameName\n      setName\n      rarity\n      condition\n      price\n      totalQuantity\n      entryCount\n    }\n  }\n"): typeof import('./graphql').AddInventoryItemDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateInventoryItem($input: UpdateInventoryItemInput!) {\n    updateInventoryItem(input: $input) {\n      id\n      productId\n      productName\n      condition\n      price\n      totalQuantity\n      entryCount\n    }\n  }\n"): typeof import('./graphql').UpdateInventoryItemDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteInventoryItem($id: Int!) {\n    deleteInventoryItem(id: $id)\n  }\n"): typeof import('./graphql').DeleteInventoryItemDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddStock($input: AddStockInput!) {\n    addStock(input: $input) {\n      id\n      inventoryItemId\n      quantity\n      costBasis\n      acquisitionDate\n      notes\n    }\n  }\n"): typeof import('./graphql').AddStockDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateStock($input: UpdateStockInput!) {\n    updateStock(input: $input) {\n      id\n      inventoryItemId\n      quantity\n      costBasis\n      acquisitionDate\n      notes\n    }\n  }\n"): typeof import('./graphql').UpdateStockDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteStock($id: Int!) {\n    deleteStock(id: $id)\n  }\n"): typeof import('./graphql').DeleteStockDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BulkUpdateStock($input: BulkUpdateStockInput!) {\n    bulkUpdateStock(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').BulkUpdateStockDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BulkDeleteStock($input: BulkDeleteStockInput!) {\n    bulkDeleteStock(input: $input)\n  }\n"): typeof import('./graphql').BulkDeleteStockDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SearchProductsForLot($searchTerm: String!, $isSingle: Boolean, $isSealed: Boolean) {\n    searchProducts(searchTerm: $searchTerm, isSingle: $isSingle, isSealed: $isSealed) {\n      id\n      name\n      gameName\n      setName\n      rarity\n      imageUrl\n      isSingle\n      isSealed\n      prices {\n        subTypeName\n        marketPrice\n        midPrice\n      }\n    }\n  }\n"): typeof import('./graphql').SearchProductsForLotDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetLot($id: Int!) {\n    getLot(id: $id) {\n      id\n      name\n      description\n      amountPaid\n      acquisitionDate\n      items {\n        id\n        productId\n        productName\n        gameName\n        setName\n        rarity\n        isSingle\n        isSealed\n        condition\n        quantity\n        costBasis\n        costOverridden\n        marketValue\n      }\n      totalMarketValue\n      totalCost\n      projectedProfitLoss\n      projectedProfitMargin\n    }\n  }\n"): typeof import('./graphql').GetLotDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateLot($input: CreateLotInput!) {\n    createLot(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').CreateLotDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateLot($input: UpdateLotInput!) {\n    updateLot(input: $input) {\n      id\n    }\n  }\n"): typeof import('./graphql').UpdateLotDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetLots($filters: LotFilters, $pagination: PaginationInput) {\n    getLots(filters: $filters, pagination: $pagination) {\n      items {\n        id\n        name\n        description\n        amountPaid\n        acquisitionDate\n        totalMarketValue\n        totalCost\n        projectedProfitLoss\n        projectedProfitMargin\n        createdAt\n        items {\n          id\n        }\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n"): typeof import('./graphql').GetLotsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteLot($id: Int!) {\n    deleteLot(id: $id)\n  }\n"): typeof import('./graphql').DeleteLotDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetLotStats {\n    getLotStats {\n      totalLots\n      totalInvested\n      totalMarketValue\n      totalProfitLoss\n    }\n  }\n"): typeof import('./graphql').GetLotStatsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetOrders($pagination: PaginationInput, $filters: OrderFilters) {\n    getOrders(pagination: $pagination, filters: $filters) {\n      items {\n        id\n        orderNumber\n        customerName\n        status\n        totalAmount\n        totalCostBasis\n        totalProfit\n        createdAt\n        items {\n          id\n          productId\n          productName\n          condition\n          quantity\n          unitPrice\n          costBasis\n          profit\n          lotId\n        }\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n"): typeof import('./graphql').GetOrdersDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CancelOrder($orderId: Int!) {\n    cancelOrder(orderId: $orderId) {\n      id\n      orderNumber\n      customerName\n      status\n      totalAmount\n      totalCostBasis\n      totalProfit\n      createdAt\n      items {\n        id\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        costBasis\n        profit\n      }\n    }\n  }\n"): typeof import('./graphql').CancelOrderDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateOrderStatus($orderId: Int!, $status: OrderStatus!) {\n    updateOrderStatus(orderId: $orderId, status: $status) {\n      id\n      orderNumber\n      customerName\n      status\n      totalAmount\n      totalCostBasis\n      totalProfit\n      createdAt\n      items {\n        id\n        productId\n        productName\n        condition\n        quantity\n        unitPrice\n        costBasis\n        profit\n      }\n    }\n  }\n"): typeof import('./graphql').UpdateOrderStatusDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetProduct($productId: String!) {\n    getProduct(productId: $productId) {\n      id\n      name\n      setName\n      gameName\n      rarity\n      type\n      text\n      flavorText\n      finishes\n      isSingle\n      isSealed\n      images {\n        small\n        large\n      }\n      inventoryRecords {\n        inventoryItemId\n        condition\n        quantity\n        price\n      }\n    }\n  }\n"): typeof import('./graphql').GetProductDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetSealedProductListings($filters: ProductListingFilters, $pagination: ProductListingPagination) {\n    getProductListings(filters: $filters, pagination: $pagination) {\n      items {\n        id\n        name\n        setName\n        gameName\n        finishes\n        images {\n          small\n          large\n        }\n        totalQuantity\n        lowestPrice\n        lowestPriceInventoryItemId\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n"): typeof import('./graphql').GetSealedProductListingsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetSealedSets($game: String!, $filters: SetFilters) {\n    getSets(game: $game, filters: $filters) {\n      code\n      name\n    }\n  }\n"): typeof import('./graphql').GetSealedSetsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetSinglesProductListings($filters: ProductListingFilters, $pagination: ProductListingPagination) {\n    getProductListings(filters: $filters, pagination: $pagination) {\n      items {\n        id\n        name\n        setName\n        gameName\n        rarity\n        finishes\n        images {\n          small\n          large\n        }\n        totalQuantity\n        lowestPrice\n        conditionPrices {\n          inventoryItemId\n          condition\n          quantity\n          price\n        }\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n"): typeof import('./graphql').GetSinglesProductListingsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetSinglesSets($game: String!, $filters: SetFilters) {\n    getSets(game: $game, filters: $filters) {\n      code\n      name\n    }\n  }\n"): typeof import('./graphql').GetSinglesSetsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetBackupSettings {\n    getBackupSettings {\n      provider\n      frequency\n      lastBackupAt\n      googleDriveConnected\n      dropboxConnected\n      onedriveConnected\n    }\n  }\n"): typeof import('./graphql').GetBackupSettingsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateBackupSettings($input: UpdateBackupSettingsInput!) {\n    updateBackupSettings(input: $input) {\n      provider\n      frequency\n      lastBackupAt\n      googleDriveConnected\n      dropboxConnected\n      onedriveConnected\n    }\n  }\n"): typeof import('./graphql').UpdateBackupSettingsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TriggerBackup {\n    triggerBackup {\n      success\n      message\n      timestamp\n    }\n  }\n"): typeof import('./graphql').TriggerBackupDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TriggerRestore($provider: BackupProvider!) {\n    triggerRestore(provider: $provider) {\n      success\n      message\n    }\n  }\n"): typeof import('./graphql').TriggerRestoreDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetBuyRates($categoryId: Int!) {\n    getBuyRates(categoryId: $categoryId) {\n      id\n      description\n      fixedRateCents\n      percentageRate\n      type\n      rarity\n      hidden\n      sortOrder\n    }\n  }\n"): typeof import('./graphql').GetBuyRatesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetDistinctRarities($categoryId: Int!) {\n    getDistinctRarities(categoryId: $categoryId)\n  }\n"): typeof import('./graphql').GetDistinctRaritiesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveBuyRates($input: SaveBuyRatesInput!) {\n    saveBuyRates(input: $input) {\n      id\n      description\n      fixedRateCents\n      percentageRate\n      type\n      rarity\n      hidden\n      sortOrder\n    }\n  }\n"): typeof import('./graphql').SaveBuyRatesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetDashboardSales($organizationId: String!, $dateRange: DashboardDateRange!) {\n    getDashboardSales(organizationId: $organizationId, dateRange: $dateRange) {\n      summary {\n        totalRevenue\n        totalCost\n        totalProfit\n        profitMargin\n        orderCount\n      }\n      dataPoints {\n        label\n        revenue\n        cost\n        profit\n        orderCount\n      }\n      granularity\n    }\n  }\n"): typeof import('./graphql').GetDashboardSalesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetDashboardBestSellers(\n    $organizationId: String!\n    $dateRange: DashboardDateRange!\n    $sortBy: BestSellerSortBy!\n    $limit: Int\n  ) {\n    getDashboardBestSellers(organizationId: $organizationId, dateRange: $dateRange, sortBy: $sortBy, limit: $limit) {\n      productId\n      productName\n      totalQuantity\n      totalRevenue\n    }\n  }\n"): typeof import('./graphql').GetDashboardBestSellersDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetDashboardInventorySummary($organizationId: String!) {\n    getDashboardInventorySummary(organizationId: $organizationId) {\n      totalSkus\n      totalUnits\n      totalCostValue\n      totalRetailValue\n    }\n  }\n"): typeof import('./graphql').GetDashboardInventorySummaryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetDashboardOrderStatus($organizationId: String!, $dateRange: DashboardDateRange!) {\n    getDashboardOrderStatus(organizationId: $organizationId, dateRange: $dateRange) {\n      open\n      completed\n      cancelled\n      total\n    }\n  }\n"): typeof import('./graphql').GetDashboardOrderStatusDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetDataUpdateStatus {\n    getDataUpdateStatus {\n      currentVersion\n      latestVersion\n      updateAvailable\n      isUpdating\n    }\n  }\n"): typeof import('./graphql').GetDataUpdateStatusDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TriggerDataUpdate {\n    triggerDataUpdate {\n      success\n      message\n      newVersion\n    }\n  }\n"): typeof import('./graphql').TriggerDataUpdateDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetStoreSettings {\n    getStoreSettings {\n      companyName\n      ein\n    }\n  }\n"): typeof import('./graphql').GetStoreSettingsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateStoreSettings($input: UpdateStoreSettingsInput!) {\n    updateStoreSettings(input: $input) {\n      companyName\n      ein\n    }\n  }\n"): typeof import('./graphql').UpdateStoreSettingsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAvailableGamesForSettings {\n    getAvailableGames {\n      categoryId\n      name\n      displayName\n    }\n  }\n"): typeof import('./graphql').GetAvailableGamesForSettingsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetSupportedGames($categoryIds: [Int!]!) {\n    setSupportedGames(categoryIds: $categoryIds) {\n      categoryId\n      name\n      displayName\n    }\n  }\n"): typeof import('./graphql').SetSupportedGamesDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetIntegrationSettings {\n    getIntegrationSettings {\n      stripe {\n        enabled\n        hasApiKey\n      }\n      shopify {\n        enabled\n        hasApiKey\n        shopDomain\n      }\n    }\n  }\n"): typeof import('./graphql').GetIntegrationSettingsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateStripeIntegration($input: UpdateStripeIntegrationInput!) {\n    updateStripeIntegration(input: $input) {\n      enabled\n      hasApiKey\n    }\n  }\n"): typeof import('./graphql').UpdateStripeIntegrationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateShopifyIntegration($input: UpdateShopifyIntegrationInput!) {\n    updateShopifyIntegration(input: $input) {\n      enabled\n      hasApiKey\n      shopDomain\n    }\n  }\n"): typeof import('./graphql').UpdateShopifyIntegrationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAllStoreLocationsAdmin {\n    getEmployeeStoreLocations {\n      id\n      name\n      slug\n      street1\n      street2\n      city\n      state\n      zip\n      phone\n      hours {\n        dayOfWeek\n        openTime\n        closeTime\n      }\n      createdAt\n    }\n  }\n"): typeof import('./graphql').GetAllStoreLocationsAdminDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddStoreLocation($input: AddStoreLocationInput!) {\n    addStoreLocation(input: $input) {\n      id\n      name\n      slug\n      street1\n      street2\n      city\n      state\n      zip\n      phone\n      hours {\n        dayOfWeek\n        openTime\n        closeTime\n      }\n      createdAt\n    }\n  }\n"): typeof import('./graphql').AddStoreLocationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateStoreLocation($input: UpdateStoreLocationInput!) {\n    updateStoreLocation(input: $input) {\n      id\n      name\n      slug\n      street1\n      street2\n      city\n      state\n      zip\n      phone\n      hours {\n        dayOfWeek\n        openTime\n        closeTime\n      }\n      createdAt\n    }\n  }\n"): typeof import('./graphql').UpdateStoreLocationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveStoreLocation($id: String!) {\n    removeStoreLocation(id: $id)\n  }\n"): typeof import('./graphql').RemoveStoreLocationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTransactionLogs($pagination: PaginationInput, $filters: TransactionLogFilters) {\n    getTransactionLogs(pagination: $pagination, filters: $filters) {\n      items {\n        id\n        action\n        resourceType\n        resourceId\n        details\n        userName\n        userEmail\n        createdAt\n      }\n      totalCount\n      page\n      pageSize\n      totalPages\n    }\n  }\n"): typeof import('./graphql').GetTransactionLogsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query IsSetupPending {\n    isSetupPending\n  }\n"): typeof import('./graphql').IsSetupPendingDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
