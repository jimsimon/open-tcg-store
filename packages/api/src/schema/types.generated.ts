import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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
  costBasis: Scalars['Float']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  price: Scalars['Float']['input'];
  productId: Scalars['Int']['input'];
  quantity: Scalars['Int']['input'];
};

export type AddStockInput = {
  acquisitionDate: Scalars['String']['input'];
  costBasis: Scalars['Float']['input'];
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

export type BulkDeleteStockInput = {
  ids: Array<Scalars['Int']['input']>;
};

export type BulkUpdateStockInput = {
  acquisitionDate?: InputMaybe<Scalars['String']['input']>;
  costBasis?: InputMaybe<Scalars['Float']['input']>;
  ids: Array<Scalars['Int']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
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
  unitPrice: Scalars['Float']['output'];
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
  price: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
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
  quickbooks: QuickBooksIntegration;
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
  price: Scalars['Float']['output'];
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
  costBasis: Scalars['Float']['output'];
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
  deleteInventoryItem: Scalars['Boolean']['output'];
  deleteStock: Scalars['Boolean']['output'];
  firstTimeSetup: Scalars['String']['output'];
  removeFromCart: ShoppingCart;
  removeStoreLocation: Scalars['Boolean']['output'];
  setActiveStoreLocation: Scalars['Boolean']['output'];
  submitOrder: SubmitOrderResult;
  triggerBackup: BackupResult;
  triggerRestore: RestoreResult;
  updateBackupSettings: BackupSettings;
  updateInventoryItem: InventoryItem;
  updateItemInCart: ShoppingCart;
  updateOrderStatus: UpdateOrderStatusResult;
  updateQuickBooksIntegration: QuickBooksIntegration;
  updateShopifyIntegration: ShopifyIntegration;
  updateStock: InventoryItemStock;
  updateStoreLocation: StoreLocation;
  updateStoreSettings: StoreSettings;
  updateStripeIntegration: StripeIntegration;
};


export type MutationaddInventoryItemArgs = {
  input: AddInventoryItemInput;
};


export type MutationaddStockArgs = {
  input: AddStockInput;
};


export type MutationaddStoreLocationArgs = {
  input: AddStoreLocationInput;
};


export type MutationaddToCartArgs = {
  cartItem: CartItemInput;
};


export type MutationbulkDeleteStockArgs = {
  input: BulkDeleteStockInput;
};


export type MutationbulkUpdateStockArgs = {
  input: BulkUpdateStockInput;
};


export type MutationcancelOrderArgs = {
  orderId: Scalars['Int']['input'];
};


export type MutationdeleteInventoryItemArgs = {
  id: Scalars['Int']['input'];
};


export type MutationdeleteStockArgs = {
  id: Scalars['Int']['input'];
};


export type MutationfirstTimeSetupArgs = {
  company: CompanySettings;
  store: InitialStoreLocation;
  userDetails: UserDetails;
};


export type MutationremoveFromCartArgs = {
  cartItem: CartItemInput;
};


export type MutationremoveStoreLocationArgs = {
  id: Scalars['String']['input'];
};


export type MutationsetActiveStoreLocationArgs = {
  organizationId: Scalars['String']['input'];
};


export type MutationsubmitOrderArgs = {
  input: SubmitOrderInput;
};


export type MutationtriggerRestoreArgs = {
  provider: Scalars['String']['input'];
};


export type MutationupdateBackupSettingsArgs = {
  input: UpdateBackupSettingsInput;
};


export type MutationupdateInventoryItemArgs = {
  input: UpdateInventoryItemInput;
};


export type MutationupdateItemInCartArgs = {
  cartItem: CartItemInput;
};


export type MutationupdateOrderStatusArgs = {
  orderId: Scalars['Int']['input'];
  status: Scalars['String']['input'];
};


export type MutationupdateQuickBooksIntegrationArgs = {
  input: UpdateQuickBooksIntegrationInput;
};


export type MutationupdateShopifyIntegrationArgs = {
  input: UpdateShopifyIntegrationInput;
};


export type MutationupdateStockArgs = {
  input: UpdateStockInput;
};


export type MutationupdateStoreLocationArgs = {
  input: UpdateStoreLocationInput;
};


export type MutationupdateStoreSettingsArgs = {
  input: UpdateStoreSettingsInput;
};


export type MutationupdateStripeIntegrationArgs = {
  input: UpdateStripeIntegrationInput;
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
  totalAmount: Scalars['Float']['output'];
  totalCostBasis?: Maybe<Scalars['Float']['output']>;
  totalProfit?: Maybe<Scalars['Float']['output']>;
};

export type OrderFilters = {
  organizationId?: InputMaybe<Scalars['String']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type OrderItem = {
  __typename?: 'OrderItem';
  condition: Scalars['String']['output'];
  costBasis?: Maybe<Scalars['Float']['output']>;
  id: Scalars['Int']['output'];
  productId: Scalars['Int']['output'];
  productName: Scalars['String']['output'];
  profit?: Maybe<Scalars['Float']['output']>;
  quantity: Scalars['Int']['output'];
  unitPrice: Scalars['Float']['output'];
};

export type OrderPage = {
  __typename?: 'OrderPage';
  orders: Array<Order>;
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type PaginationInput = {
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
};

export type ProductConditionPrice = {
  __typename?: 'ProductConditionPrice';
  condition: Scalars['String']['output'];
  inventoryItemId: Scalars['Int']['output'];
  price: Scalars['Float']['output'];
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
  price: Scalars['Float']['output'];
  quantity: Scalars['Int']['output'];
};

export type ProductListing = {
  __typename?: 'ProductListing';
  conditionPrices: Array<ProductConditionPrice>;
  finishes: Array<Scalars['String']['output']>;
  gameName: Scalars['String']['output'];
  id: Scalars['String']['output'];
  images?: Maybe<CardImages>;
  lowestPrice?: Maybe<Scalars['String']['output']>;
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
  directLowPrice?: Maybe<Scalars['Float']['output']>;
  highPrice?: Maybe<Scalars['Float']['output']>;
  lowPrice?: Maybe<Scalars['Float']['output']>;
  marketPrice?: Maybe<Scalars['Float']['output']>;
  midPrice?: Maybe<Scalars['Float']['output']>;
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

export type Query = {
  __typename?: 'Query';
  getActiveStoreLocation?: Maybe<StoreLocation>;
  /** Public list of all stores — no auth required. Used by anonymous users on product pages. */
  getAllStoreLocations: Array<StoreLocation>;
  getBackupSettings: BackupSettings;
  getCard: Card;
  /** Stores the current user is assigned to (for authenticated employees/managers/owners) */
  getEmployeeStoreLocations: Array<StoreLocation>;
  getIntegrationSettings: IntegrationSettings;
  getInventory: InventoryPage;
  getInventoryItem?: Maybe<InventoryItem>;
  getInventoryItemDetails: InventoryStockPage;
  getOrders: OrderPage;
  getProduct: ProductDetail;
  getProductListings: ProductListingPage;
  getSets: Array<Set>;
  getShoppingCart: ShoppingCart;
  getSingleCardInventory: Array<Card>;
  getStoreLocation?: Maybe<StoreLocation>;
  getStoreSettings: StoreSettings;
  isSetupPending: Scalars['Boolean']['output'];
  lookupSalesTax: SalesTaxLookupResult;
  searchProducts: Array<ProductSearchResult>;
};


export type QuerygetCardArgs = {
  cardId: Scalars['String']['input'];
  game: Scalars['String']['input'];
};


export type QuerygetInventoryArgs = {
  filters?: InputMaybe<InventoryFilters>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QuerygetInventoryItemArgs = {
  id: Scalars['Int']['input'];
};


export type QuerygetInventoryItemDetailsArgs = {
  inventoryItemId: Scalars['Int']['input'];
  pagination?: InputMaybe<PaginationInput>;
};


export type QuerygetOrdersArgs = {
  filters?: InputMaybe<OrderFilters>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QuerygetProductArgs = {
  organizationId?: InputMaybe<Scalars['String']['input']>;
  productId: Scalars['String']['input'];
};


export type QuerygetProductListingsArgs = {
  filters?: InputMaybe<ProductListingFilters>;
  organizationId?: InputMaybe<Scalars['String']['input']>;
  pagination?: InputMaybe<ProductListingPagination>;
};


export type QuerygetSetsArgs = {
  filters?: InputMaybe<SetFilters>;
  game: Scalars['String']['input'];
};


export type QuerygetSingleCardInventoryArgs = {
  filters?: InputMaybe<SingleCardFilters>;
  game: Scalars['String']['input'];
};


export type QuerygetStoreLocationArgs = {
  id: Scalars['String']['input'];
};


export type QuerylookupSalesTaxArgs = {
  countryCode: Scalars['String']['input'];
  stateCode: Scalars['String']['input'];
};


export type QuerysearchProductsArgs = {
  game?: InputMaybe<Scalars['String']['input']>;
  searchTerm: Scalars['String']['input'];
};

export type QuickBooksIntegration = {
  __typename?: 'QuickBooksIntegration';
  enabled: Scalars['Boolean']['output'];
  hasClientId: Scalars['Boolean']['output'];
  hasClientSecret: Scalars['Boolean']['output'];
};

export type RestoreResult = {
  __typename?: 'RestoreResult';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type SalesTaxLookupResult = {
  __typename?: 'SalesTaxLookupResult';
  currency?: Maybe<Scalars['String']['output']>;
  rate: Scalars['Float']['output'];
  type: Scalars['String']['output'];
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

export type UpdateBackupSettingsInput = {
  frequency?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateInventoryItemInput = {
  condition?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['Int']['input'];
  price?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateOrderStatusResult = {
  __typename?: 'UpdateOrderStatusResult';
  error?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Order>;
};

export type UpdateQuickBooksIntegrationInput = {
  clientId?: InputMaybe<Scalars['String']['input']>;
  clientSecret?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateShopifyIntegrationInput = {
  apiKey?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  shopDomain?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateStockInput = {
  acquisitionDate?: InputMaybe<Scalars['String']['input']>;
  costBasis?: InputMaybe<Scalars['Float']['input']>;
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



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AddInventoryItemInput: AddInventoryItemInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  AddStockInput: AddStockInput;
  AddStoreLocationInput: AddStoreLocationInput;
  BackupResult: ResolverTypeWrapper<BackupResult>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BackupSettings: ResolverTypeWrapper<BackupSettings>;
  BulkDeleteStockInput: BulkDeleteStockInput;
  BulkUpdateStockInput: BulkUpdateStockInput;
  CancelOrderResult: ResolverTypeWrapper<CancelOrderResult>;
  Card: ResolverTypeWrapper<Card>;
  CardImages: ResolverTypeWrapper<CardImages>;
  CartItemInput: CartItemInput;
  CartItemOutput: ResolverTypeWrapper<CartItemOutput>;
  CompanySettings: CompanySettings;
  ConditionInventories: ResolverTypeWrapper<ConditionInventories>;
  ConditionInventory: ResolverTypeWrapper<ConditionInventory>;
  InitialStoreLocation: InitialStoreLocation;
  InsufficientItem: ResolverTypeWrapper<InsufficientItem>;
  IntegrationSettings: ResolverTypeWrapper<IntegrationSettings>;
  InventoryFilters: InventoryFilters;
  InventoryItem: ResolverTypeWrapper<InventoryItem>;
  InventoryItemStock: ResolverTypeWrapper<InventoryItemStock>;
  InventoryPage: ResolverTypeWrapper<InventoryPage>;
  InventoryStockPage: ResolverTypeWrapper<InventoryStockPage>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Order: ResolverTypeWrapper<Order>;
  OrderFilters: OrderFilters;
  OrderItem: ResolverTypeWrapper<OrderItem>;
  OrderPage: ResolverTypeWrapper<OrderPage>;
  PaginationInput: PaginationInput;
  ProductConditionPrice: ResolverTypeWrapper<ProductConditionPrice>;
  ProductDetail: ResolverTypeWrapper<ProductDetail>;
  ProductInventoryRecord: ResolverTypeWrapper<ProductInventoryRecord>;
  ProductListing: ResolverTypeWrapper<ProductListing>;
  ProductListingFilters: ProductListingFilters;
  ProductListingPage: ResolverTypeWrapper<ProductListingPage>;
  ProductListingPagination: ProductListingPagination;
  ProductPrice: ResolverTypeWrapper<ProductPrice>;
  ProductSearchResult: ResolverTypeWrapper<ProductSearchResult>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  QuickBooksIntegration: ResolverTypeWrapper<QuickBooksIntegration>;
  RestoreResult: ResolverTypeWrapper<RestoreResult>;
  SalesTaxLookupResult: ResolverTypeWrapper<SalesTaxLookupResult>;
  Set: ResolverTypeWrapper<Set>;
  SetFilters: SetFilters;
  ShopifyIntegration: ResolverTypeWrapper<ShopifyIntegration>;
  ShoppingCart: ResolverTypeWrapper<ShoppingCart>;
  SingleCardFilters: SingleCardFilters;
  StoreHours: ResolverTypeWrapper<StoreHours>;
  StoreHoursInput: StoreHoursInput;
  StoreLocation: ResolverTypeWrapper<StoreLocation>;
  StoreSettings: ResolverTypeWrapper<StoreSettings>;
  StripeIntegration: ResolverTypeWrapper<StripeIntegration>;
  SubmitOrderInput: SubmitOrderInput;
  SubmitOrderResult: ResolverTypeWrapper<SubmitOrderResult>;
  UpdateBackupSettingsInput: UpdateBackupSettingsInput;
  UpdateInventoryItemInput: UpdateInventoryItemInput;
  UpdateOrderStatusResult: ResolverTypeWrapper<UpdateOrderStatusResult>;
  UpdateQuickBooksIntegrationInput: UpdateQuickBooksIntegrationInput;
  UpdateShopifyIntegrationInput: UpdateShopifyIntegrationInput;
  UpdateStockInput: UpdateStockInput;
  UpdateStoreLocationInput: UpdateStoreLocationInput;
  UpdateStoreSettingsInput: UpdateStoreSettingsInput;
  UpdateStripeIntegrationInput: UpdateStripeIntegrationInput;
  UserDetails: UserDetails;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AddInventoryItemInput: AddInventoryItemInput;
  String: Scalars['String']['output'];
  Float: Scalars['Float']['output'];
  Int: Scalars['Int']['output'];
  AddStockInput: AddStockInput;
  AddStoreLocationInput: AddStoreLocationInput;
  BackupResult: BackupResult;
  Boolean: Scalars['Boolean']['output'];
  BackupSettings: BackupSettings;
  BulkDeleteStockInput: BulkDeleteStockInput;
  BulkUpdateStockInput: BulkUpdateStockInput;
  CancelOrderResult: CancelOrderResult;
  Card: Card;
  CardImages: CardImages;
  CartItemInput: CartItemInput;
  CartItemOutput: CartItemOutput;
  CompanySettings: CompanySettings;
  ConditionInventories: ConditionInventories;
  ConditionInventory: ConditionInventory;
  InitialStoreLocation: InitialStoreLocation;
  InsufficientItem: InsufficientItem;
  IntegrationSettings: IntegrationSettings;
  InventoryFilters: InventoryFilters;
  InventoryItem: InventoryItem;
  InventoryItemStock: InventoryItemStock;
  InventoryPage: InventoryPage;
  InventoryStockPage: InventoryStockPage;
  Mutation: Record<PropertyKey, never>;
  Order: Order;
  OrderFilters: OrderFilters;
  OrderItem: OrderItem;
  OrderPage: OrderPage;
  PaginationInput: PaginationInput;
  ProductConditionPrice: ProductConditionPrice;
  ProductDetail: ProductDetail;
  ProductInventoryRecord: ProductInventoryRecord;
  ProductListing: ProductListing;
  ProductListingFilters: ProductListingFilters;
  ProductListingPage: ProductListingPage;
  ProductListingPagination: ProductListingPagination;
  ProductPrice: ProductPrice;
  ProductSearchResult: ProductSearchResult;
  Query: Record<PropertyKey, never>;
  QuickBooksIntegration: QuickBooksIntegration;
  RestoreResult: RestoreResult;
  SalesTaxLookupResult: SalesTaxLookupResult;
  Set: Set;
  SetFilters: SetFilters;
  ShopifyIntegration: ShopifyIntegration;
  ShoppingCart: ShoppingCart;
  SingleCardFilters: SingleCardFilters;
  StoreHours: StoreHours;
  StoreHoursInput: StoreHoursInput;
  StoreLocation: StoreLocation;
  StoreSettings: StoreSettings;
  StripeIntegration: StripeIntegration;
  SubmitOrderInput: SubmitOrderInput;
  SubmitOrderResult: SubmitOrderResult;
  UpdateBackupSettingsInput: UpdateBackupSettingsInput;
  UpdateInventoryItemInput: UpdateInventoryItemInput;
  UpdateOrderStatusResult: UpdateOrderStatusResult;
  UpdateQuickBooksIntegrationInput: UpdateQuickBooksIntegrationInput;
  UpdateShopifyIntegrationInput: UpdateShopifyIntegrationInput;
  UpdateStockInput: UpdateStockInput;
  UpdateStoreLocationInput: UpdateStoreLocationInput;
  UpdateStoreSettingsInput: UpdateStoreSettingsInput;
  UpdateStripeIntegrationInput: UpdateStripeIntegrationInput;
  UserDetails: UserDetails;
};

export type BackupResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['BackupResult'] = ResolversParentTypes['BackupResult']> = {
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  timestamp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type BackupSettingsResolvers<ContextType = any, ParentType extends ResolversParentTypes['BackupSettings'] = ResolversParentTypes['BackupSettings']> = {
  dropboxConnected?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  frequency?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  googleDriveConnected?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastBackupAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  onedriveConnected?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  provider?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type CancelOrderResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['CancelOrderResult'] = ResolversParentTypes['CancelOrderResult']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  order?: Resolver<Maybe<ResolversTypes['Order']>, ParentType, ContextType>;
};

export type CardResolvers<ContextType = any, ParentType extends ResolversParentTypes['Card'] = ResolversParentTypes['Card']> = {
  finishes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  flavorText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  images?: Resolver<Maybe<ResolversTypes['CardImages']>, ParentType, ContextType>;
  inventory?: Resolver<Array<Maybe<ResolversTypes['ConditionInventories']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rarity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  setName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  text?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type CardImagesResolvers<ContextType = any, ParentType extends ResolversParentTypes['CardImages'] = ResolversParentTypes['CardImages']> = {
  large?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  small?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type CartItemOutputResolvers<ContextType = any, ParentType extends ResolversParentTypes['CartItemOutput'] = ResolversParentTypes['CartItemOutput']> = {
  condition?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  inventoryItemId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  maxAvailable?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unitPrice?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type ConditionInventoriesResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConditionInventories'] = ResolversParentTypes['ConditionInventories']> = {
  D?: Resolver<Maybe<ResolversTypes['ConditionInventory']>, ParentType, ContextType>;
  HP?: Resolver<Maybe<ResolversTypes['ConditionInventory']>, ParentType, ContextType>;
  LP?: Resolver<ResolversTypes['ConditionInventory'], ParentType, ContextType>;
  MP?: Resolver<ResolversTypes['ConditionInventory'], ParentType, ContextType>;
  NM?: Resolver<ResolversTypes['ConditionInventory'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ConditionInventoryResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConditionInventory'] = ResolversParentTypes['ConditionInventory']> = {
  price?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type InsufficientItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['InsufficientItem'] = ResolversParentTypes['InsufficientItem']> = {
  available?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  condition?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  productId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requested?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type IntegrationSettingsResolvers<ContextType = any, ParentType extends ResolversParentTypes['IntegrationSettings'] = ResolversParentTypes['IntegrationSettings']> = {
  quickbooks?: Resolver<ResolversTypes['QuickBooksIntegration'], ParentType, ContextType>;
  shopify?: Resolver<ResolversTypes['ShopifyIntegration'], ParentType, ContextType>;
  stripe?: Resolver<ResolversTypes['StripeIntegration'], ParentType, ContextType>;
};

export type InventoryItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['InventoryItem'] = ResolversParentTypes['InventoryItem']> = {
  condition?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  entryCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  gameName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isSealed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isSingle?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  organizationId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  productId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rarity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  setName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalQuantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type InventoryItemStockResolvers<ContextType = any, ParentType extends ResolversParentTypes['InventoryItemStock'] = ResolversParentTypes['InventoryItemStock']> = {
  acquisitionDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  costBasis?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  inventoryItemId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  notes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type InventoryPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['InventoryPage'] = ResolversParentTypes['InventoryPage']> = {
  items?: Resolver<Array<ResolversTypes['InventoryItem']>, ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pageSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type InventoryStockPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['InventoryStockPage'] = ResolversParentTypes['InventoryStockPage']> = {
  items?: Resolver<Array<ResolversTypes['InventoryItemStock']>, ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pageSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addInventoryItem?: Resolver<ResolversTypes['InventoryItem'], ParentType, ContextType, RequireFields<MutationaddInventoryItemArgs, 'input'>>;
  addStock?: Resolver<ResolversTypes['InventoryItemStock'], ParentType, ContextType, RequireFields<MutationaddStockArgs, 'input'>>;
  addStoreLocation?: Resolver<ResolversTypes['StoreLocation'], ParentType, ContextType, RequireFields<MutationaddStoreLocationArgs, 'input'>>;
  addToCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType, RequireFields<MutationaddToCartArgs, 'cartItem'>>;
  bulkDeleteStock?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationbulkDeleteStockArgs, 'input'>>;
  bulkUpdateStock?: Resolver<Array<ResolversTypes['InventoryItemStock']>, ParentType, ContextType, RequireFields<MutationbulkUpdateStockArgs, 'input'>>;
  cancelOrder?: Resolver<ResolversTypes['CancelOrderResult'], ParentType, ContextType, RequireFields<MutationcancelOrderArgs, 'orderId'>>;
  checkoutWithCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType>;
  clearCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType>;
  deleteInventoryItem?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationdeleteInventoryItemArgs, 'id'>>;
  deleteStock?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationdeleteStockArgs, 'id'>>;
  firstTimeSetup?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationfirstTimeSetupArgs, 'company' | 'store' | 'userDetails'>>;
  removeFromCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType, RequireFields<MutationremoveFromCartArgs, 'cartItem'>>;
  removeStoreLocation?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationremoveStoreLocationArgs, 'id'>>;
  setActiveStoreLocation?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationsetActiveStoreLocationArgs, 'organizationId'>>;
  submitOrder?: Resolver<ResolversTypes['SubmitOrderResult'], ParentType, ContextType, RequireFields<MutationsubmitOrderArgs, 'input'>>;
  triggerBackup?: Resolver<ResolversTypes['BackupResult'], ParentType, ContextType>;
  triggerRestore?: Resolver<ResolversTypes['RestoreResult'], ParentType, ContextType, RequireFields<MutationtriggerRestoreArgs, 'provider'>>;
  updateBackupSettings?: Resolver<ResolversTypes['BackupSettings'], ParentType, ContextType, RequireFields<MutationupdateBackupSettingsArgs, 'input'>>;
  updateInventoryItem?: Resolver<ResolversTypes['InventoryItem'], ParentType, ContextType, RequireFields<MutationupdateInventoryItemArgs, 'input'>>;
  updateItemInCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType, RequireFields<MutationupdateItemInCartArgs, 'cartItem'>>;
  updateOrderStatus?: Resolver<ResolversTypes['UpdateOrderStatusResult'], ParentType, ContextType, RequireFields<MutationupdateOrderStatusArgs, 'orderId' | 'status'>>;
  updateQuickBooksIntegration?: Resolver<ResolversTypes['QuickBooksIntegration'], ParentType, ContextType, RequireFields<MutationupdateQuickBooksIntegrationArgs, 'input'>>;
  updateShopifyIntegration?: Resolver<ResolversTypes['ShopifyIntegration'], ParentType, ContextType, RequireFields<MutationupdateShopifyIntegrationArgs, 'input'>>;
  updateStock?: Resolver<ResolversTypes['InventoryItemStock'], ParentType, ContextType, RequireFields<MutationupdateStockArgs, 'input'>>;
  updateStoreLocation?: Resolver<ResolversTypes['StoreLocation'], ParentType, ContextType, RequireFields<MutationupdateStoreLocationArgs, 'input'>>;
  updateStoreSettings?: Resolver<ResolversTypes['StoreSettings'], ParentType, ContextType, RequireFields<MutationupdateStoreSettingsArgs, 'input'>>;
  updateStripeIntegration?: Resolver<ResolversTypes['StripeIntegration'], ParentType, ContextType, RequireFields<MutationupdateStripeIntegrationArgs, 'input'>>;
};

export type OrderResolvers<ContextType = any, ParentType extends ResolversParentTypes['Order'] = ResolversParentTypes['Order']> = {
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  customerName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['OrderItem']>, ParentType, ContextType>;
  orderNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  organizationId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalAmount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  totalCostBasis?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  totalProfit?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
};

export type OrderItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrderItem'] = ResolversParentTypes['OrderItem']> = {
  condition?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  costBasis?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  profit?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unitPrice?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type OrderPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrderPage'] = ResolversParentTypes['OrderPage']> = {
  orders?: Resolver<Array<ResolversTypes['Order']>, ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pageSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ProductConditionPriceResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProductConditionPrice'] = ResolversParentTypes['ProductConditionPrice']> = {
  condition?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  inventoryItemId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ProductDetailResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProductDetail'] = ResolversParentTypes['ProductDetail']> = {
  finishes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  flavorText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  gameName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  images?: Resolver<Maybe<ResolversTypes['CardImages']>, ParentType, ContextType>;
  inventoryRecords?: Resolver<Array<ResolversTypes['ProductInventoryRecord']>, ParentType, ContextType>;
  isSealed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isSingle?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rarity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  setName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  text?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type ProductInventoryRecordResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProductInventoryRecord'] = ResolversParentTypes['ProductInventoryRecord']> = {
  condition?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  inventoryItemId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ProductListingResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProductListing'] = ResolversParentTypes['ProductListing']> = {
  conditionPrices?: Resolver<Array<ResolversTypes['ProductConditionPrice']>, ParentType, ContextType>;
  finishes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  gameName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  images?: Resolver<Maybe<ResolversTypes['CardImages']>, ParentType, ContextType>;
  lowestPrice?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lowestPriceInventoryItemId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rarity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  setName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalQuantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ProductListingPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProductListingPage'] = ResolversParentTypes['ProductListingPage']> = {
  items?: Resolver<Array<ResolversTypes['ProductListing']>, ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pageSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ProductPriceResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProductPrice'] = ResolversParentTypes['ProductPrice']> = {
  directLowPrice?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  highPrice?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  lowPrice?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  marketPrice?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  midPrice?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  subTypeName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ProductSearchResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProductSearchResult'] = ResolversParentTypes['ProductSearchResult']> = {
  gameName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  imageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isSealed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isSingle?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  prices?: Resolver<Array<ResolversTypes['ProductPrice']>, ParentType, ContextType>;
  rarity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  setName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getActiveStoreLocation?: Resolver<Maybe<ResolversTypes['StoreLocation']>, ParentType, ContextType>;
  getAllStoreLocations?: Resolver<Array<ResolversTypes['StoreLocation']>, ParentType, ContextType>;
  getBackupSettings?: Resolver<ResolversTypes['BackupSettings'], ParentType, ContextType>;
  getCard?: Resolver<ResolversTypes['Card'], ParentType, ContextType, RequireFields<QuerygetCardArgs, 'cardId' | 'game'>>;
  getEmployeeStoreLocations?: Resolver<Array<ResolversTypes['StoreLocation']>, ParentType, ContextType>;
  getIntegrationSettings?: Resolver<ResolversTypes['IntegrationSettings'], ParentType, ContextType>;
  getInventory?: Resolver<ResolversTypes['InventoryPage'], ParentType, ContextType, Partial<QuerygetInventoryArgs>>;
  getInventoryItem?: Resolver<Maybe<ResolversTypes['InventoryItem']>, ParentType, ContextType, RequireFields<QuerygetInventoryItemArgs, 'id'>>;
  getInventoryItemDetails?: Resolver<ResolversTypes['InventoryStockPage'], ParentType, ContextType, RequireFields<QuerygetInventoryItemDetailsArgs, 'inventoryItemId'>>;
  getOrders?: Resolver<ResolversTypes['OrderPage'], ParentType, ContextType, Partial<QuerygetOrdersArgs>>;
  getProduct?: Resolver<ResolversTypes['ProductDetail'], ParentType, ContextType, RequireFields<QuerygetProductArgs, 'productId'>>;
  getProductListings?: Resolver<ResolversTypes['ProductListingPage'], ParentType, ContextType, Partial<QuerygetProductListingsArgs>>;
  getSets?: Resolver<Array<ResolversTypes['Set']>, ParentType, ContextType, RequireFields<QuerygetSetsArgs, 'game'>>;
  getShoppingCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType>;
  getSingleCardInventory?: Resolver<Array<ResolversTypes['Card']>, ParentType, ContextType, RequireFields<QuerygetSingleCardInventoryArgs, 'game'>>;
  getStoreLocation?: Resolver<Maybe<ResolversTypes['StoreLocation']>, ParentType, ContextType, RequireFields<QuerygetStoreLocationArgs, 'id'>>;
  getStoreSettings?: Resolver<ResolversTypes['StoreSettings'], ParentType, ContextType>;
  isSetupPending?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lookupSalesTax?: Resolver<ResolversTypes['SalesTaxLookupResult'], ParentType, ContextType, RequireFields<QuerylookupSalesTaxArgs, 'countryCode' | 'stateCode'>>;
  searchProducts?: Resolver<Array<ResolversTypes['ProductSearchResult']>, ParentType, ContextType, RequireFields<QuerysearchProductsArgs, 'searchTerm'>>;
};

export type QuickBooksIntegrationResolvers<ContextType = any, ParentType extends ResolversParentTypes['QuickBooksIntegration'] = ResolversParentTypes['QuickBooksIntegration']> = {
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasClientId?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasClientSecret?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type RestoreResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['RestoreResult'] = ResolversParentTypes['RestoreResult']> = {
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type SalesTaxLookupResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SalesTaxLookupResult'] = ResolversParentTypes['SalesTaxLookupResult']> = {
  currency?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type SetResolvers<ContextType = any, ParentType extends ResolversParentTypes['Set'] = ResolversParentTypes['Set']> = {
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ShopifyIntegrationResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShopifyIntegration'] = ResolversParentTypes['ShopifyIntegration']> = {
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasApiKey?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  shopDomain?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type ShoppingCartResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShoppingCart'] = ResolversParentTypes['ShoppingCart']> = {
  items?: Resolver<Array<ResolversTypes['CartItemOutput']>, ParentType, ContextType>;
  organizationId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type StoreHoursResolvers<ContextType = any, ParentType extends ResolversParentTypes['StoreHours'] = ResolversParentTypes['StoreHours']> = {
  closeTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dayOfWeek?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  openTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type StoreLocationResolvers<ContextType = any, ParentType extends ResolversParentTypes['StoreLocation'] = ResolversParentTypes['StoreLocation']> = {
  city?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hours?: Resolver<Array<ResolversTypes['StoreHours']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  street1?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  street2?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  zip?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type StoreSettingsResolvers<ContextType = any, ParentType extends ResolversParentTypes['StoreSettings'] = ResolversParentTypes['StoreSettings']> = {
  companyName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ein?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type StripeIntegrationResolvers<ContextType = any, ParentType extends ResolversParentTypes['StripeIntegration'] = ResolversParentTypes['StripeIntegration']> = {
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasApiKey?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type SubmitOrderResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SubmitOrderResult'] = ResolversParentTypes['SubmitOrderResult']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  insufficientItems?: Resolver<Maybe<Array<ResolversTypes['InsufficientItem']>>, ParentType, ContextType>;
  order?: Resolver<Maybe<ResolversTypes['Order']>, ParentType, ContextType>;
};

export type UpdateOrderStatusResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['UpdateOrderStatusResult'] = ResolversParentTypes['UpdateOrderStatusResult']> = {
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  order?: Resolver<Maybe<ResolversTypes['Order']>, ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  BackupResult?: BackupResultResolvers<ContextType>;
  BackupSettings?: BackupSettingsResolvers<ContextType>;
  CancelOrderResult?: CancelOrderResultResolvers<ContextType>;
  Card?: CardResolvers<ContextType>;
  CardImages?: CardImagesResolvers<ContextType>;
  CartItemOutput?: CartItemOutputResolvers<ContextType>;
  ConditionInventories?: ConditionInventoriesResolvers<ContextType>;
  ConditionInventory?: ConditionInventoryResolvers<ContextType>;
  InsufficientItem?: InsufficientItemResolvers<ContextType>;
  IntegrationSettings?: IntegrationSettingsResolvers<ContextType>;
  InventoryItem?: InventoryItemResolvers<ContextType>;
  InventoryItemStock?: InventoryItemStockResolvers<ContextType>;
  InventoryPage?: InventoryPageResolvers<ContextType>;
  InventoryStockPage?: InventoryStockPageResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Order?: OrderResolvers<ContextType>;
  OrderItem?: OrderItemResolvers<ContextType>;
  OrderPage?: OrderPageResolvers<ContextType>;
  ProductConditionPrice?: ProductConditionPriceResolvers<ContextType>;
  ProductDetail?: ProductDetailResolvers<ContextType>;
  ProductInventoryRecord?: ProductInventoryRecordResolvers<ContextType>;
  ProductListing?: ProductListingResolvers<ContextType>;
  ProductListingPage?: ProductListingPageResolvers<ContextType>;
  ProductPrice?: ProductPriceResolvers<ContextType>;
  ProductSearchResult?: ProductSearchResultResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  QuickBooksIntegration?: QuickBooksIntegrationResolvers<ContextType>;
  RestoreResult?: RestoreResultResolvers<ContextType>;
  SalesTaxLookupResult?: SalesTaxLookupResultResolvers<ContextType>;
  Set?: SetResolvers<ContextType>;
  ShopifyIntegration?: ShopifyIntegrationResolvers<ContextType>;
  ShoppingCart?: ShoppingCartResolvers<ContextType>;
  StoreHours?: StoreHoursResolvers<ContextType>;
  StoreLocation?: StoreLocationResolvers<ContextType>;
  StoreSettings?: StoreSettingsResolvers<ContextType>;
  StripeIntegration?: StripeIntegrationResolvers<ContextType>;
  SubmitOrderResult?: SubmitOrderResultResolvers<ContextType>;
  UpdateOrderStatusResult?: UpdateOrderStatusResultResolvers<ContextType>;
};

