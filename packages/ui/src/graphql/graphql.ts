/* eslint-disable */
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AddInventoryItemInput = {
  acquisitionDate: Scalars['String']['input'];
  condition: Scalars['String']['input'];
  costBasis: Scalars['Int']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  price: Scalars['Int']['input'];
  productId: Scalars['Int']['input'];
  quantity: Scalars['Int']['input'];
};

export type AddStockInput = {
  acquisitionDate: Scalars['String']['input'];
  costBasis: Scalars['Int']['input'];
  inventoryItemId: Scalars['Int']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  quantity: Scalars['Int']['input'];
};

export type AddStoreLocationInput = {
  city: Scalars['String']['input'];
  hours?: InputMaybe<Array<StoreHoursInput>>;
  name: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  state: Scalars['String']['input'];
  street1: Scalars['String']['input'];
  street2?: InputMaybe<Scalars['String']['input']>;
  zip: Scalars['String']['input'];
};

export type BackupResult = {
  __typename?: 'BackupResult';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  timestamp?: Maybe<Scalars['String']['output']>;
};

export type BackupSettings = {
  __typename?: 'BackupSettings';
  dropboxConnected: Scalars['Boolean']['output'];
  frequency?: Maybe<Scalars['String']['output']>;
  googleDriveConnected: Scalars['Boolean']['output'];
  lastBackupAt?: Maybe<Scalars['String']['output']>;
  onedriveConnected: Scalars['Boolean']['output'];
  provider?: Maybe<Scalars['String']['output']>;
};

export type BestSeller = {
  __typename?: 'BestSeller';
  productId: Scalars['Int']['output'];
  productName: Scalars['String']['output'];
  totalQuantity: Scalars['Int']['output'];
  totalRevenue: Scalars['Int']['output'];
};

export type BulkDeleteStockInput = {
  ids: Array<Scalars['Int']['input']>;
};

export type BulkUpdateStockInput = {
  acquisitionDate?: InputMaybe<Scalars['String']['input']>;
  costBasis?: InputMaybe<Scalars['Int']['input']>;
  ids: Array<Scalars['Int']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
};

export type BuyRateEntry = {
  __typename?: 'BuyRateEntry';
  description: Scalars['String']['output'];
  fixedRateCents?: Maybe<Scalars['Int']['output']>;
  hidden: Scalars['Boolean']['output'];
  id: Scalars['Int']['output'];
  percentageRate?: Maybe<Scalars['Float']['output']>;
  rarity?: Maybe<Scalars['String']['output']>;
  sortOrder: Scalars['Int']['output'];
  type: Scalars['String']['output'];
};

export type BuyRateEntryInput = {
  description: Scalars['String']['input'];
  fixedRateCents?: InputMaybe<Scalars['Int']['input']>;
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  percentageRate?: InputMaybe<Scalars['Float']['input']>;
  rarity?: InputMaybe<Scalars['String']['input']>;
  sortOrder: Scalars['Int']['input'];
  type: Scalars['String']['input'];
};

export type BuyRateTable = {
  __typename?: 'BuyRateTable';
  categoryId: Scalars['Int']['output'];
  entries: Array<BuyRateEntry>;
  gameDisplayName: Scalars['String']['output'];
  gameName: Scalars['String']['output'];
};

export type CancelOrderResult = {
  __typename?: 'CancelOrderResult';
  error?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Order>;
};

export type Card = {
  __typename?: 'Card';
  finishes: Array<Scalars['String']['output']>;
  flavorText?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  images?: Maybe<CardImages>;
  inventory: Array<Maybe<ConditionInventories>>;
  name: Scalars['String']['output'];
  rarity?: Maybe<Scalars['String']['output']>;
  setName: Scalars['String']['output'];
  text?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type CardImages = {
  __typename?: 'CardImages';
  large?: Maybe<Scalars['String']['output']>;
  small?: Maybe<Scalars['String']['output']>;
};

export type CartItemInput = {
  inventoryItemId: Scalars['Int']['input'];
  quantity: Scalars['Int']['input'];
};

export type CartItemOutput = {
  __typename?: 'CartItemOutput';
  condition: Scalars['String']['output'];
  inventoryItemId: Scalars['Int']['output'];
  maxAvailable: Scalars['Int']['output'];
  productId: Scalars['Int']['output'];
  productName: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  unitPrice: Scalars['Int']['output'];
};

export type CompanySettings = {
  companyName: Scalars['String']['input'];
  ein: Scalars['String']['input'];
};

export type ConditionInventories = {
  __typename?: 'ConditionInventories';
  D?: Maybe<ConditionInventory>;
  HP?: Maybe<ConditionInventory>;
  LP: ConditionInventory;
  MP: ConditionInventory;
  NM: ConditionInventory;
  type: Scalars['String']['output'];
};

export type ConditionInventory = {
  __typename?: 'ConditionInventory';
  price: Scalars['Int']['output'];
  quantity: Scalars['Int']['output'];
};

export type CreateLotInput = {
  acquisitionDate: Scalars['String']['input'];
  amountPaid: Scalars['Int']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  items: Array<LotItemInput>;
  name: Scalars['String']['input'];
};

export type DashboardDateRange = {
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};

export type DataUpdateResult = {
  __typename?: 'DataUpdateResult';
  message?: Maybe<Scalars['String']['output']>;
  newVersion?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type DataUpdateStatus = {
  __typename?: 'DataUpdateStatus';
  currentVersion?: Maybe<Scalars['String']['output']>;
  isUpdating: Scalars['Boolean']['output'];
  latestVersion?: Maybe<Scalars['String']['output']>;
  updateAvailable: Scalars['Boolean']['output'];
};

export type InitialStoreLocation = {
  city: Scalars['String']['input'];
  name: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  state: Scalars['String']['input'];
  street1: Scalars['String']['input'];
  street2?: InputMaybe<Scalars['String']['input']>;
  zip: Scalars['String']['input'];
};

export type InsufficientItem = {
  __typename?: 'InsufficientItem';
  available: Scalars['Int']['output'];
  condition: Scalars['String']['output'];
  productId: Scalars['Int']['output'];
  productName: Scalars['String']['output'];
  requested: Scalars['Int']['output'];
};

export type IntegrationSettings = {
  __typename?: 'IntegrationSettings';
  shopify: ShopifyIntegration;
  stripe: StripeIntegration;
};

export type InventoryFilters = {
  condition?: InputMaybe<Scalars['String']['input']>;
  gameName?: InputMaybe<Scalars['String']['input']>;
  includeSealed?: InputMaybe<Scalars['Boolean']['input']>;
  includeSingles?: InputMaybe<Scalars['Boolean']['input']>;
  organizationId?: InputMaybe<Scalars['String']['input']>;
  rarity?: InputMaybe<Scalars['String']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  setName?: InputMaybe<Scalars['String']['input']>;
};

export type InventoryItem = {
  __typename?: 'InventoryItem';
  condition: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  entryCount: Scalars['Int']['output'];
  gameName: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  isSealed: Scalars['Boolean']['output'];
  isSingle: Scalars['Boolean']['output'];
  organizationId: Scalars['String']['output'];
  price: Scalars['Int']['output'];
  productId: Scalars['Int']['output'];
  productName: Scalars['String']['output'];
  rarity?: Maybe<Scalars['String']['output']>;
  setName: Scalars['String']['output'];
  totalQuantity: Scalars['Int']['output'];
  updatedAt: Scalars['String']['output'];
};

export type InventoryItemStock = {
  __typename?: 'InventoryItemStock';
  acquisitionDate: Scalars['String']['output'];
  costBasis: Scalars['Int']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  inventoryItemId: Scalars['Int']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  quantity: Scalars['Int']['output'];
  updatedAt: Scalars['String']['output'];
};

export type InventoryPage = {
  __typename?: 'InventoryPage';
  items: Array<InventoryItem>;
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type InventoryStockPage = {
  __typename?: 'InventoryStockPage';
  items: Array<InventoryItemStock>;
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type InventorySummary = {
  __typename?: 'InventorySummary';
  totalCostValue: Scalars['Int']['output'];
  totalRetailValue: Scalars['Int']['output'];
  totalSkus: Scalars['Int']['output'];
  totalUnits: Scalars['Int']['output'];
};

export type Lot = {
  __typename?: 'Lot';
  acquisitionDate: Scalars['String']['output'];
  amountPaid: Scalars['Int']['output'];
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  items: Array<LotItem>;
  name: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  projectedProfitLoss: Scalars['Int']['output'];
  projectedProfitMargin: Scalars['Float']['output'];
  totalCost: Scalars['Int']['output'];
  totalMarketValue: Scalars['Int']['output'];
  updatedAt: Scalars['String']['output'];
};

export type LotFilters = {
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};

export type LotItem = {
  __typename?: 'LotItem';
  condition?: Maybe<Scalars['String']['output']>;
  costBasis: Scalars['Int']['output'];
  costOverridden: Scalars['Boolean']['output'];
  gameName: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  isSealed: Scalars['Boolean']['output'];
  isSingle: Scalars['Boolean']['output'];
  lotId: Scalars['Int']['output'];
  marketValue?: Maybe<Scalars['Int']['output']>;
  productId: Scalars['Int']['output'];
  productName: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  rarity?: Maybe<Scalars['String']['output']>;
  setName: Scalars['String']['output'];
};

export type LotItemInput = {
  condition?: InputMaybe<Scalars['String']['input']>;
  costBasis: Scalars['Int']['input'];
  costOverridden: Scalars['Boolean']['input'];
  id?: InputMaybe<Scalars['Int']['input']>;
  productId: Scalars['Int']['input'];
  quantity: Scalars['Int']['input'];
};

export type LotPage = {
  __typename?: 'LotPage';
  lots: Array<Lot>;
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type LotStats = {
  __typename?: 'LotStats';
  totalInvested: Scalars['Int']['output'];
  totalLots: Scalars['Int']['output'];
  totalMarketValue: Scalars['Int']['output'];
  totalProfitLoss: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addInventoryItem: InventoryItem;
  addStock: InventoryItemStock;
  addStoreLocation: StoreLocation;
  addToCart: ShoppingCart;
  bulkDeleteStock: Scalars['Boolean']['output'];
  bulkUpdateStock: Array<InventoryItemStock>;
  cancelOrder: CancelOrderResult;
  checkoutWithCart: ShoppingCart;
  clearCart: ShoppingCart;
  createLot: Lot;
  /** Admin mutation - delete all buy rates for a game. */
  deleteBuyRates: Scalars['Boolean']['output'];
  deleteInventoryItem: Scalars['Boolean']['output'];
  deleteLot: Scalars['Boolean']['output'];
  deleteStock: Scalars['Boolean']['output'];
  firstTimeSetup: Scalars['String']['output'];
  removeFromCart: ShoppingCart;
  removeStoreLocation: Scalars['Boolean']['output'];
  /** Admin mutation - save the buy rate table for a game (replaces all entries). */
  saveBuyRates: Array<BuyRateEntry>;
  setActiveStoreLocation: Scalars['Boolean']['output'];
  /**
   * Admin mutation - set which games the store supports.
   * Removing a game also deletes its buy rates.
   */
  setSupportedGames: Array<SupportedGame>;
  submitOrder: SubmitOrderResult;
  triggerBackup: BackupResult;
  triggerDataUpdate: DataUpdateResult;
  triggerRestore: RestoreResult;
  updateBackupSettings: BackupSettings;
  updateInventoryItem: InventoryItem;
  updateItemInCart: ShoppingCart;
  updateLot: Lot;
  updateOrderStatus: UpdateOrderStatusResult;
  updateShopifyIntegration: ShopifyIntegration;
  updateStock: InventoryItemStock;
  updateStoreLocation: StoreLocation;
  updateStoreSettings: StoreSettings;
  updateStripeIntegration: StripeIntegration;
};


export type MutationAddInventoryItemArgs = {
  input: AddInventoryItemInput;
};


export type MutationAddStockArgs = {
  input: AddStockInput;
};


export type MutationAddStoreLocationArgs = {
  input: AddStoreLocationInput;
};


export type MutationAddToCartArgs = {
  cartItem: CartItemInput;
};


export type MutationBulkDeleteStockArgs = {
  input: BulkDeleteStockInput;
};


export type MutationBulkUpdateStockArgs = {
  input: BulkUpdateStockInput;
};


export type MutationCancelOrderArgs = {
  orderId: Scalars['Int']['input'];
};


export type MutationCreateLotArgs = {
  input: CreateLotInput;
};


export type MutationDeleteBuyRatesArgs = {
  categoryId: Scalars['Int']['input'];
};


export type MutationDeleteInventoryItemArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteLotArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteStockArgs = {
  id: Scalars['Int']['input'];
};


export type MutationFirstTimeSetupArgs = {
  company: CompanySettings;
  store: InitialStoreLocation;
  supportedGameCategoryIds: Array<Scalars['Int']['input']>;
  userDetails: UserDetails;
};


export type MutationRemoveFromCartArgs = {
  cartItem: CartItemInput;
};


export type MutationRemoveStoreLocationArgs = {
  id: Scalars['String']['input'];
};


export type MutationSaveBuyRatesArgs = {
  input: SaveBuyRatesInput;
};


export type MutationSetActiveStoreLocationArgs = {
  organizationId: Scalars['String']['input'];
};


export type MutationSetSupportedGamesArgs = {
  categoryIds: Array<Scalars['Int']['input']>;
};


export type MutationSubmitOrderArgs = {
  input: SubmitOrderInput;
};


export type MutationTriggerRestoreArgs = {
  provider: Scalars['String']['input'];
};


export type MutationUpdateBackupSettingsArgs = {
  input: UpdateBackupSettingsInput;
};


export type MutationUpdateInventoryItemArgs = {
  input: UpdateInventoryItemInput;
};


export type MutationUpdateItemInCartArgs = {
  cartItem: CartItemInput;
};


export type MutationUpdateLotArgs = {
  input: UpdateLotInput;
};


export type MutationUpdateOrderStatusArgs = {
  orderId: Scalars['Int']['input'];
  status: Scalars['String']['input'];
};


export type MutationUpdateShopifyIntegrationArgs = {
  input: UpdateShopifyIntegrationInput;
};


export type MutationUpdateStockArgs = {
  input: UpdateStockInput;
};


export type MutationUpdateStoreLocationArgs = {
  input: UpdateStoreLocationInput;
};


export type MutationUpdateStoreSettingsArgs = {
  input: UpdateStoreSettingsInput;
};


export type MutationUpdateStripeIntegrationArgs = {
  input: UpdateStripeIntegrationInput;
};

export type OpenOrder = {
  __typename?: 'OpenOrder';
  createdAt: Scalars['String']['output'];
  customerName: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  itemCount: Scalars['Int']['output'];
  orderNumber: Scalars['String']['output'];
  totalAmount: Scalars['Int']['output'];
};

export type Order = {
  __typename?: 'Order';
  createdAt: Scalars['String']['output'];
  customerName: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  items: Array<OrderItem>;
  orderNumber: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  status: Scalars['String']['output'];
  totalAmount: Scalars['Int']['output'];
  totalCostBasis?: Maybe<Scalars['Int']['output']>;
  totalProfit?: Maybe<Scalars['Int']['output']>;
};

export type OrderFilters = {
  organizationId?: InputMaybe<Scalars['String']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type OrderItem = {
  __typename?: 'OrderItem';
  condition: Scalars['String']['output'];
  costBasis?: Maybe<Scalars['Int']['output']>;
  id: Scalars['Int']['output'];
  lotId?: Maybe<Scalars['Int']['output']>;
  productId: Scalars['Int']['output'];
  productName: Scalars['String']['output'];
  profit?: Maybe<Scalars['Int']['output']>;
  quantity: Scalars['Int']['output'];
  unitPrice: Scalars['Int']['output'];
};

export type OrderPage = {
  __typename?: 'OrderPage';
  orders: Array<Order>;
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type OrderStatusBreakdown = {
  __typename?: 'OrderStatusBreakdown';
  cancelled: Scalars['Int']['output'];
  completed: Scalars['Int']['output'];
  open: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PaginationInput = {
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
};

export type ProductConditionPrice = {
  __typename?: 'ProductConditionPrice';
  condition: Scalars['String']['output'];
  inventoryItemId: Scalars['Int']['output'];
  price: Scalars['Int']['output'];
  quantity: Scalars['Int']['output'];
};

export type ProductDetail = {
  __typename?: 'ProductDetail';
  finishes: Array<Scalars['String']['output']>;
  flavorText?: Maybe<Scalars['String']['output']>;
  gameName: Scalars['String']['output'];
  id: Scalars['String']['output'];
  images?: Maybe<CardImages>;
  inventoryRecords: Array<ProductInventoryRecord>;
  isSealed: Scalars['Boolean']['output'];
  isSingle: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  rarity?: Maybe<Scalars['String']['output']>;
  setName: Scalars['String']['output'];
  text?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type ProductInventoryRecord = {
  __typename?: 'ProductInventoryRecord';
  condition: Scalars['String']['output'];
  inventoryItemId: Scalars['Int']['output'];
  price: Scalars['Int']['output'];
  quantity: Scalars['Int']['output'];
};

export type ProductListing = {
  __typename?: 'ProductListing';
  conditionPrices: Array<ProductConditionPrice>;
  finishes: Array<Scalars['String']['output']>;
  gameName: Scalars['String']['output'];
  id: Scalars['String']['output'];
  images?: Maybe<CardImages>;
  lowestPrice?: Maybe<Scalars['Int']['output']>;
  lowestPriceInventoryItemId?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  rarity?: Maybe<Scalars['String']['output']>;
  setName: Scalars['String']['output'];
  totalQuantity: Scalars['Int']['output'];
};

export type ProductListingFilters = {
  condition?: InputMaybe<Scalars['String']['input']>;
  gameName?: InputMaybe<Scalars['String']['input']>;
  inStockOnly?: InputMaybe<Scalars['Boolean']['input']>;
  includeSealed?: InputMaybe<Scalars['Boolean']['input']>;
  includeSingles?: InputMaybe<Scalars['Boolean']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  setCode?: InputMaybe<Scalars['String']['input']>;
};

export type ProductListingPage = {
  __typename?: 'ProductListingPage';
  items: Array<ProductListing>;
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type ProductListingPagination = {
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
};

export type ProductPrice = {
  __typename?: 'ProductPrice';
  directLowPrice?: Maybe<Scalars['Int']['output']>;
  highPrice?: Maybe<Scalars['Int']['output']>;
  lowPrice?: Maybe<Scalars['Int']['output']>;
  marketPrice?: Maybe<Scalars['Int']['output']>;
  midPrice?: Maybe<Scalars['Int']['output']>;
  subTypeName: Scalars['String']['output'];
};

export type ProductSearchResult = {
  __typename?: 'ProductSearchResult';
  gameName: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isSealed: Scalars['Boolean']['output'];
  isSingle: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  prices: Array<ProductPrice>;
  rarity?: Maybe<Scalars['String']['output']>;
  setName: Scalars['String']['output'];
};

export type PublicBuyRates = {
  __typename?: 'PublicBuyRates';
  games: Array<BuyRateTable>;
};

export type Query = {
  __typename?: 'Query';
  getActiveStoreLocation?: Maybe<StoreLocation>;
  /** Public list of all stores — no auth required. Used by anonymous users on product pages. */
  getAllStoreLocations: Array<StoreLocation>;
  /**
   * Public query - returns all available game categories from the TCG data catalog.
   * No authentication required (catalog data is not sensitive).
   */
  getAvailableGames: Array<SupportedGame>;
  getBackupSettings: BackupSettings;
  /** Admin query - returns buy rate entries for a specific game. */
  getBuyRates: Array<BuyRateEntry>;
  getCard: Card;
  getDashboardBestSellers: Array<BestSeller>;
  getDashboardInventorySummary: InventorySummary;
  getDashboardOpenOrders: Array<OpenOrder>;
  getDashboardOrderStatus: OrderStatusBreakdown;
  getDashboardSales: SalesBreakdown;
  getDataUpdateStatus: DataUpdateStatus;
  getDistinctRarities: Array<Scalars['String']['output']>;
  /** Stores the current user is assigned to (for authenticated employees/managers/owners) */
  getEmployeeStoreLocations: Array<StoreLocation>;
  getIntegrationSettings: IntegrationSettings;
  getInventory: InventoryPage;
  getInventoryItem?: Maybe<InventoryItem>;
  getInventoryItemDetails: InventoryStockPage;
  getLot?: Maybe<Lot>;
  getLotStats: LotStats;
  getLots: LotPage;
  getOrders: OrderPage;
  getProduct: ProductDetail;
  getProductListings: ProductListingPage;
  /**
   * Public query - returns buy rate tables for all supported games.
   * No authentication required.
   */
  getPublicBuyRates: PublicBuyRates;
  getSets: Array<Set>;
  getShoppingCart: ShoppingCart;
  getSingleCardInventory: Array<Card>;
  getStoreLocation?: Maybe<StoreLocation>;
  getStoreSettings: StoreSettings;
  /**
   * Returns the games this store currently supports.
   * No authentication required.
   */
  getSupportedGames: Array<SupportedGame>;
  getTransactionLogs: TransactionLogPage;
  isSetupPending: Scalars['Boolean']['output'];
  lookupSalesTax: SalesTaxLookupResult;
  searchProducts: Array<ProductSearchResult>;
  /**
   * Returns all permission flags for the current user in a single round trip.
   * Used by the SSR server to render nav visibility without multiple hasPermission calls.
   */
  userPermissions: UserPermissions;
};


export type QueryGetBuyRatesArgs = {
  categoryId: Scalars['Int']['input'];
};


export type QueryGetCardArgs = {
  cardId: Scalars['String']['input'];
  game: Scalars['String']['input'];
};


export type QueryGetDashboardBestSellersArgs = {
  dateRange: DashboardDateRange;
  limit?: InputMaybe<Scalars['Int']['input']>;
  organizationId: Scalars['String']['input'];
  sortBy: Scalars['String']['input'];
};


export type QueryGetDashboardInventorySummaryArgs = {
  organizationId: Scalars['String']['input'];
};


export type QueryGetDashboardOpenOrdersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  organizationId: Scalars['String']['input'];
};


export type QueryGetDashboardOrderStatusArgs = {
  dateRange: DashboardDateRange;
  organizationId: Scalars['String']['input'];
};


export type QueryGetDashboardSalesArgs = {
  dateRange: DashboardDateRange;
  organizationId: Scalars['String']['input'];
};


export type QueryGetDistinctRaritiesArgs = {
  categoryId: Scalars['Int']['input'];
};


export type QueryGetInventoryArgs = {
  filters?: InputMaybe<InventoryFilters>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryGetInventoryItemArgs = {
  id: Scalars['Int']['input'];
};


export type QueryGetInventoryItemDetailsArgs = {
  inventoryItemId: Scalars['Int']['input'];
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryGetLotArgs = {
  id: Scalars['Int']['input'];
};


export type QueryGetLotsArgs = {
  filters?: InputMaybe<LotFilters>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryGetOrdersArgs = {
  filters?: InputMaybe<OrderFilters>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryGetProductArgs = {
  organizationId?: InputMaybe<Scalars['String']['input']>;
  productId: Scalars['String']['input'];
};


export type QueryGetProductListingsArgs = {
  filters?: InputMaybe<ProductListingFilters>;
  organizationId?: InputMaybe<Scalars['String']['input']>;
  pagination?: InputMaybe<ProductListingPagination>;
};


export type QueryGetSetsArgs = {
  filters?: InputMaybe<SetFilters>;
  game: Scalars['String']['input'];
};


export type QueryGetSingleCardInventoryArgs = {
  filters?: InputMaybe<SingleCardFilters>;
  game: Scalars['String']['input'];
};


export type QueryGetStoreLocationArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetTransactionLogsArgs = {
  filters?: InputMaybe<TransactionLogFilters>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryLookupSalesTaxArgs = {
  countryCode: Scalars['String']['input'];
  stateCode: Scalars['String']['input'];
};


export type QuerySearchProductsArgs = {
  game?: InputMaybe<Scalars['String']['input']>;
  isSealed?: InputMaybe<Scalars['Boolean']['input']>;
  isSingle?: InputMaybe<Scalars['Boolean']['input']>;
  searchTerm: Scalars['String']['input'];
};

export type RestoreResult = {
  __typename?: 'RestoreResult';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type SalesBreakdown = {
  __typename?: 'SalesBreakdown';
  dataPoints: Array<SalesDataPoint>;
  granularity: Scalars['String']['output'];
  summary: SalesSummary;
};

export type SalesDataPoint = {
  __typename?: 'SalesDataPoint';
  cost: Scalars['Int']['output'];
  label: Scalars['String']['output'];
  orderCount: Scalars['Int']['output'];
  profit: Scalars['Int']['output'];
  revenue: Scalars['Int']['output'];
};

export type SalesSummary = {
  __typename?: 'SalesSummary';
  orderCount: Scalars['Int']['output'];
  profitMargin: Scalars['Float']['output'];
  totalCost: Scalars['Int']['output'];
  totalProfit: Scalars['Int']['output'];
  totalRevenue: Scalars['Int']['output'];
};

export type SalesTaxLookupResult = {
  __typename?: 'SalesTaxLookupResult';
  currency?: Maybe<Scalars['String']['output']>;
  rate: Scalars['Float']['output'];
  type: Scalars['String']['output'];
};

export type SaveBuyRatesInput = {
  categoryId: Scalars['Int']['input'];
  entries: Array<BuyRateEntryInput>;
};

export type Set = {
  __typename?: 'Set';
  code: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type SetFilters = {
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};

export type ShopifyIntegration = {
  __typename?: 'ShopifyIntegration';
  enabled: Scalars['Boolean']['output'];
  hasApiKey: Scalars['Boolean']['output'];
  shopDomain?: Maybe<Scalars['String']['output']>;
};

export type ShoppingCart = {
  __typename?: 'ShoppingCart';
  items: Array<CartItemOutput>;
  organizationId?: Maybe<Scalars['String']['output']>;
};

export type SingleCardFilters = {
  includeSealed?: InputMaybe<Scalars['Boolean']['input']>;
  includeSingles?: InputMaybe<Scalars['Boolean']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  setCode?: InputMaybe<Scalars['String']['input']>;
};

export type StoreHours = {
  __typename?: 'StoreHours';
  closeTime?: Maybe<Scalars['String']['output']>;
  dayOfWeek: Scalars['Int']['output'];
  openTime?: Maybe<Scalars['String']['output']>;
};

export type StoreHoursInput = {
  closeTime?: InputMaybe<Scalars['String']['input']>;
  dayOfWeek: Scalars['Int']['input'];
  openTime?: InputMaybe<Scalars['String']['input']>;
};

export type StoreLocation = {
  __typename?: 'StoreLocation';
  city: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  hours: Array<StoreHours>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  slug: Scalars['String']['output'];
  state: Scalars['String']['output'];
  street1: Scalars['String']['output'];
  street2?: Maybe<Scalars['String']['output']>;
  zip: Scalars['String']['output'];
};

export type StoreSettings = {
  __typename?: 'StoreSettings';
  companyName?: Maybe<Scalars['String']['output']>;
  ein?: Maybe<Scalars['String']['output']>;
};

export type StripeIntegration = {
  __typename?: 'StripeIntegration';
  enabled: Scalars['Boolean']['output'];
  hasApiKey: Scalars['Boolean']['output'];
};

export type SubmitOrderInput = {
  customerName: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
};

export type SubmitOrderResult = {
  __typename?: 'SubmitOrderResult';
  error?: Maybe<Scalars['String']['output']>;
  insufficientItems?: Maybe<Array<InsufficientItem>>;
  order?: Maybe<Order>;
};

export type SupportedGame = {
  __typename?: 'SupportedGame';
  categoryId: Scalars['Int']['output'];
  displayName: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type TransactionLogEntry = {
  __typename?: 'TransactionLogEntry';
  action: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  details: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  resourceId?: Maybe<Scalars['String']['output']>;
  resourceType: Scalars['String']['output'];
  userEmail: Scalars['String']['output'];
  userName: Scalars['String']['output'];
};

export type TransactionLogFilters = {
  action?: InputMaybe<Scalars['String']['input']>;
  month?: InputMaybe<Scalars['Int']['input']>;
  resourceType?: InputMaybe<Scalars['String']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  year?: InputMaybe<Scalars['Int']['input']>;
};

export type TransactionLogPage = {
  __typename?: 'TransactionLogPage';
  items: Array<TransactionLogEntry>;
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type UpdateBackupSettingsInput = {
  frequency?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateInventoryItemInput = {
  condition?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['Int']['input'];
  price?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateLotInput = {
  acquisitionDate: Scalars['String']['input'];
  amountPaid: Scalars['Int']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['Int']['input'];
  items: Array<LotItemInput>;
  name: Scalars['String']['input'];
};

export type UpdateOrderStatusResult = {
  __typename?: 'UpdateOrderStatusResult';
  error?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Order>;
};

export type UpdateShopifyIntegrationInput = {
  apiKey?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  shopDomain?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateStockInput = {
  acquisitionDate?: InputMaybe<Scalars['String']['input']>;
  costBasis?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['Int']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateStoreLocationInput = {
  city?: InputMaybe<Scalars['String']['input']>;
  hours?: InputMaybe<Array<StoreHoursInput>>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  street1?: InputMaybe<Scalars['String']['input']>;
  street2?: InputMaybe<Scalars['String']['input']>;
  zip?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateStoreSettingsInput = {
  companyName?: InputMaybe<Scalars['String']['input']>;
  ein?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateStripeIntegrationInput = {
  apiKey?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UserDetails = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

/**
 * The set of permissions the current user has in their active organization.
 * All flags are derived via better-auth's organization.hasPermission, so they
 * correctly reflect dynamic access control (DAC) overrides.
 */
export type UserPermissions = {
  __typename?: 'UserPermissions';
  canAccessSettings: Scalars['Boolean']['output'];
  canManageInventory: Scalars['Boolean']['output'];
  canManageLots: Scalars['Boolean']['output'];
  canManageStoreLocations: Scalars['Boolean']['output'];
  canManageUsers: Scalars['Boolean']['output'];
  canViewDashboard: Scalars['Boolean']['output'];
  canViewTransactionLog: Scalars['Boolean']['output'];
};

export type GetShoppingCartQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type GetShoppingCartQueryQuery = { __typename?: 'Query', getShoppingCart: { __typename?: 'ShoppingCart', items: Array<{ __typename?: 'CartItemOutput', inventoryItemId: number, quantity: number, productId: number, productName: string, condition: string, unitPrice: number, maxAvailable: number }> } };

export type UserPermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type UserPermissionsQuery = { __typename?: 'Query', userPermissions: { __typename?: 'UserPermissions', canManageInventory: boolean, canManageLots: boolean, canViewDashboard: boolean, canAccessSettings: boolean, canManageStoreLocations: boolean, canManageUsers: boolean, canViewTransactionLog: boolean } };

export type FirstTimeSetupMutationMutationVariables = Exact<{
  userDetails: UserDetails;
  company: CompanySettings;
  store: InitialStoreLocation;
  supportedGameCategoryIds: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
}>;


export type FirstTimeSetupMutationMutation = { __typename?: 'Mutation', firstTimeSetup: string };

export type IsSetupPendingQueryVariables = Exact<{ [key: string]: never; }>;


export type IsSetupPendingQuery = { __typename?: 'Query', isSetupPending: boolean };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const GetShoppingCartQueryDocument = new TypedDocumentString(`
    query GetShoppingCartQuery {
  getShoppingCart {
    items {
      inventoryItemId
      quantity
      productId
      productName
      condition
      unitPrice
      maxAvailable
    }
  }
}
    `) as unknown as TypedDocumentString<GetShoppingCartQueryQuery, GetShoppingCartQueryQueryVariables>;
export const UserPermissionsDocument = new TypedDocumentString(`
    query UserPermissions {
  userPermissions {
    canManageInventory
    canManageLots
    canViewDashboard
    canAccessSettings
    canManageStoreLocations
    canManageUsers
    canViewTransactionLog
  }
}
    `) as unknown as TypedDocumentString<UserPermissionsQuery, UserPermissionsQueryVariables>;
export const FirstTimeSetupMutationDocument = new TypedDocumentString(`
    mutation FirstTimeSetupMutation($userDetails: UserDetails!, $company: CompanySettings!, $store: InitialStoreLocation!, $supportedGameCategoryIds: [Int!]!) {
  firstTimeSetup(
    userDetails: $userDetails
    company: $company
    store: $store
    supportedGameCategoryIds: $supportedGameCategoryIds
  )
}
    `) as unknown as TypedDocumentString<FirstTimeSetupMutationMutation, FirstTimeSetupMutationMutationVariables>;
export const IsSetupPendingDocument = new TypedDocumentString(`
    query IsSetupPending {
  isSetupPending
}
    `) as unknown as TypedDocumentString<IsSetupPendingQuery, IsSetupPendingQueryVariables>;