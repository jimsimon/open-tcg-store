import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type EnumResolverSignature<T, AllowedValues = any> = { [key in keyof T]?: AllowedValues };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AddBarcodeInput = {
  code: Scalars['String']['input'];
  inventoryItemId: Scalars['Int']['input'];
};

export type AddInventoryItemInput = {
  acquisitionDate: Scalars['String']['input'];
  barcodes?: InputMaybe<Array<Scalars['String']['input']>>;
  condition: CardCondition;
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

export type AdminEventRegistrationInput = {
  registrantEmail?: InputMaybe<Scalars['String']['input']>;
  registrantName: Scalars['String']['input'];
  registrantPhone?: InputMaybe<Scalars['String']['input']>;
};

export type BackupProvider =
  | 'dropbox'
  | 'google_drive'
  | 'onedrive';

export type BackupResult = {
  __typename?: 'BackupResult';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  timestamp?: Maybe<Scalars['String']['output']>;
};

export type BackupSettings = {
  __typename?: 'BackupSettings';
  dropboxClientId?: Maybe<Scalars['String']['output']>;
  dropboxConnected: Scalars['Boolean']['output'];
  frequency?: Maybe<Scalars['String']['output']>;
  googleDriveClientId?: Maybe<Scalars['String']['output']>;
  googleDriveConnected: Scalars['Boolean']['output'];
  googleDriveHasClientSecret: Scalars['Boolean']['output'];
  lastBackupAt?: Maybe<Scalars['String']['output']>;
  onedriveClientId?: Maybe<Scalars['String']['output']>;
  onedriveConnected: Scalars['Boolean']['output'];
  provider?: Maybe<BackupProvider>;
};

export type Barcode = {
  __typename?: 'Barcode';
  code: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  inventoryItemId: Scalars['Int']['output'];
};

export type BarcodeLookupResult = {
  __typename?: 'BarcodeLookupResult';
  availableQuantity: Scalars['Int']['output'];
  condition: CardCondition;
  gameName: Scalars['String']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  inventoryItemId: Scalars['Int']['output'];
  price: Scalars['Int']['output'];
  productId: Scalars['Int']['output'];
  productName: Scalars['String']['output'];
  setName: Scalars['String']['output'];
};

export type BestSeller = {
  __typename?: 'BestSeller';
  productId: Scalars['Int']['output'];
  productName: Scalars['String']['output'];
  totalQuantity: Scalars['Int']['output'];
  totalRevenue: Scalars['Int']['output'];
};

export type BestSellerSortBy =
  | 'quantity'
  | 'revenue';

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
  type: BuyRateType;
};

export type BuyRateEntryInput = {
  description: Scalars['String']['input'];
  fixedRateCents?: InputMaybe<Scalars['Int']['input']>;
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  percentageRate?: InputMaybe<Scalars['Float']['input']>;
  rarity?: InputMaybe<Scalars['String']['input']>;
  sortOrder: Scalars['Int']['input'];
  type: BuyRateType;
};

export type BuyRateTable = {
  __typename?: 'BuyRateTable';
  categoryId: Scalars['Int']['output'];
  entries: Array<BuyRateEntry>;
  gameDisplayName: Scalars['String']['output'];
  gameName: Scalars['String']['output'];
};

export type BuyRateType =
  | 'fixed'
  | 'percentage';

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

export type CardCondition =
  | 'D'
  | 'HP'
  | 'LP'
  | 'MP'
  | 'NM';

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
  condition: CardCondition;
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

export type CompletePosOrderInput = {
  newItems?: InputMaybe<Array<PosLineItemInput>>;
  orderId: Scalars['Int']['input'];
  paymentMethod: Scalars['String']['input'];
  stripePaymentIntentId?: InputMaybe<Scalars['String']['input']>;
  taxAmount: Scalars['Int']['input'];
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

export type CreateEventInput = {
  capacity?: InputMaybe<Scalars['Int']['input']>;
  categoryId?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  entryFeeInCents?: InputMaybe<Scalars['Int']['input']>;
  eventType: EventType;
  name: Scalars['String']['input'];
  recurrenceRule?: InputMaybe<RecurrenceRuleInput>;
  startTime: Scalars['String']['input'];
};

export type CreateLotInput = {
  acquisitionDate: Scalars['String']['input'];
  amountPaid: Scalars['Int']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  items: Array<LotItemInput>;
  name: Scalars['String']['input'];
};

export type CronJob = {
  __typename?: 'CronJob';
  config?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  cronExpression: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  displayName: Scalars['String']['output'];
  enabled: Scalars['Boolean']['output'];
  id: Scalars['Int']['output'];
  lastRunAt?: Maybe<Scalars['String']['output']>;
  lastRunDurationMs?: Maybe<Scalars['Int']['output']>;
  lastRunError?: Maybe<Scalars['String']['output']>;
  lastRunStatus?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  nextRunAt?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type CronJobRun = {
  __typename?: 'CronJobRun';
  completedAt?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  cronJobId: Scalars['Int']['output'];
  durationMs?: Maybe<Scalars['Int']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  startedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  summary?: Maybe<Scalars['String']['output']>;
};

export type CronJobRunPage = {
  __typename?: 'CronJobRunPage';
  items: Array<CronJobRun>;
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
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

export type Event = {
  __typename?: 'Event';
  capacity?: Maybe<Scalars['Int']['output']>;
  categoryId?: Maybe<Scalars['Int']['output']>;
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  endTime?: Maybe<Scalars['String']['output']>;
  entryFeeInCents?: Maybe<Scalars['Int']['output']>;
  eventType: EventType;
  gameDisplayName?: Maybe<Scalars['String']['output']>;
  gameName?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  isRecurrenceTemplate: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  recurrenceGroupId?: Maybe<Scalars['String']['output']>;
  recurrenceRule?: Maybe<RecurrenceRule>;
  registrationCount: Scalars['Int']['output'];
  registrations?: Maybe<Array<EventRegistration>>;
  startTime: Scalars['String']['output'];
  status: EventStatus;
  updatedAt: Scalars['String']['output'];
};

export type EventFilters = {
  categoryId?: InputMaybe<Scalars['Int']['input']>;
  dateFrom?: InputMaybe<Scalars['String']['input']>;
  dateTo?: InputMaybe<Scalars['String']['input']>;
  eventType?: InputMaybe<EventType>;
  status?: InputMaybe<EventStatus>;
};

export type EventPage = {
  __typename?: 'EventPage';
  items: Array<Event>;
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type EventRegistration = {
  __typename?: 'EventRegistration';
  checkedIn: Scalars['Boolean']['output'];
  checkedInAt?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  eventId: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  registrantEmail?: Maybe<Scalars['String']['output']>;
  registrantName: Scalars['String']['output'];
  registrantPhone?: Maybe<Scalars['String']['output']>;
  status: RegistrationStatus;
};

export type EventStatus =
  | 'CANCELLED'
  | 'COMPLETED'
  | 'SCHEDULED';

export type EventType =
  | 'CASUAL_PLAY'
  | 'DRAFT'
  | 'LEAGUE'
  | 'OTHER'
  | 'PRERELEASE'
  | 'RELEASE_EVENT'
  | 'TOURNAMENT';

export type Granularity =
  | 'day'
  | 'hour'
  | 'month';

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

export type IntegrationSettings = {
  __typename?: 'IntegrationSettings';
  shopify: ShopifyIntegration;
  stripe: StripeIntegration;
};

export type InventoryFilters = {
  condition?: InputMaybe<CardCondition>;
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
  condition: CardCondition;
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
  condition?: Maybe<CardCondition>;
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
  condition?: InputMaybe<CardCondition>;
  costBasis: Scalars['Int']['input'];
  costOverridden: Scalars['Boolean']['input'];
  id?: InputMaybe<Scalars['Int']['input']>;
  productId: Scalars['Int']['input'];
  quantity: Scalars['Int']['input'];
};

export type LotPage = {
  __typename?: 'LotPage';
  items: Array<Lot>;
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
  addBarcode: Barcode;
  addEventRegistration: EventRegistration;
  addInventoryItem: InventoryItem;
  addStock: InventoryItemStock;
  addStoreLocation: StoreLocation;
  addToCart: ShoppingCart;
  bulkDeleteStock: Scalars['Boolean']['output'];
  bulkUpdateStock: Array<InventoryItemStock>;
  cancelEvent: Event;
  cancelEventRegistration: EventRegistration;
  cancelOrder: Order;
  cancelPosPaymentIntent: Scalars['Boolean']['output'];
  cancelRecurringSeries: Scalars['Int']['output'];
  checkInEventRegistration: EventRegistration;
  checkoutWithCart: ShoppingCart;
  clearCart: ShoppingCart;
  completePosOrder: Order;
  createEvent: Event;
  createLot: Lot;
  createPosPaymentIntent: PaymentIntentResult;
  createTerminalConnectionToken: TerminalConnectionToken;
  /** Admin mutation - delete all buy rates for a game. */
  deleteBuyRates: Scalars['Boolean']['output'];
  deleteInventoryItem: Scalars['Boolean']['output'];
  deleteLot: Scalars['Boolean']['output'];
  deleteStock: Scalars['Boolean']['output'];
  disableCronJob: CronJob;
  disconnectBackupProvider: BackupSettings;
  enableCronJob: CronJob;
  firstTimeSetup: Scalars['String']['output'];
  registerForEvent: EventRegistration;
  removeBarcode: Scalars['Boolean']['output'];
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
  submitOrder: Order;
  submitPosOrder: Order;
  triggerBackup: BackupResult;
  triggerCronJob: CronJobRun;
  triggerDataUpdate: DataUpdateResult;
  triggerRestore: RestoreResult;
  updateBackupSettings: BackupSettings;
  updateCronJobConfig: CronJob;
  updateCronJobSchedule: CronJob;
  updateEvent: Event;
  updateInventoryItem: InventoryItem;
  updateItemInCart: ShoppingCart;
  updateLot: Lot;
  updateOrderStatus: Order;
  updateRecurrenceRule: Event;
  updateShopifyIntegration: ShopifyIntegration;
  updateStock: InventoryItemStock;
  updateStoreLocation: StoreLocation;
  updateStoreSettings: StoreSettings;
  updateStripeIntegration: StripeIntegration;
};


export type MutationaddBarcodeArgs = {
  input: AddBarcodeInput;
};


export type MutationaddEventRegistrationArgs = {
  eventId: Scalars['Int']['input'];
  input: AdminEventRegistrationInput;
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


export type MutationcancelEventArgs = {
  id: Scalars['Int']['input'];
};


export type MutationcancelEventRegistrationArgs = {
  registrationId: Scalars['Int']['input'];
};


export type MutationcancelOrderArgs = {
  orderId: Scalars['Int']['input'];
};


export type MutationcancelPosPaymentIntentArgs = {
  paymentIntentId: Scalars['String']['input'];
};


export type MutationcancelRecurringSeriesArgs = {
  recurrenceGroupId: Scalars['String']['input'];
};


export type MutationcheckInEventRegistrationArgs = {
  registrationId: Scalars['Int']['input'];
};


export type MutationcompletePosOrderArgs = {
  input: CompletePosOrderInput;
};


export type MutationcreateEventArgs = {
  input: CreateEventInput;
};


export type MutationcreateLotArgs = {
  input: CreateLotInput;
};


export type MutationcreatePosPaymentIntentArgs = {
  amount: Scalars['Int']['input'];
};


export type MutationdeleteBuyRatesArgs = {
  categoryId: Scalars['Int']['input'];
};


export type MutationdeleteInventoryItemArgs = {
  id: Scalars['Int']['input'];
};


export type MutationdeleteLotArgs = {
  id: Scalars['Int']['input'];
};


export type MutationdeleteStockArgs = {
  id: Scalars['Int']['input'];
};


export type MutationdisableCronJobArgs = {
  id: Scalars['Int']['input'];
};


export type MutationdisconnectBackupProviderArgs = {
  provider: BackupProvider;
};


export type MutationenableCronJobArgs = {
  id: Scalars['Int']['input'];
};


export type MutationfirstTimeSetupArgs = {
  company: CompanySettings;
  store: InitialStoreLocation;
  supportedGameCategoryIds: Array<Scalars['Int']['input']>;
  userDetails: UserDetails;
};


export type MutationregisterForEventArgs = {
  eventId: Scalars['Int']['input'];
  input: PublicEventRegistrationInput;
};


export type MutationremoveBarcodeArgs = {
  input: RemoveBarcodeInput;
};


export type MutationremoveFromCartArgs = {
  cartItem: CartItemInput;
};


export type MutationremoveStoreLocationArgs = {
  id: Scalars['String']['input'];
};


export type MutationsaveBuyRatesArgs = {
  input: SaveBuyRatesInput;
};


export type MutationsetActiveStoreLocationArgs = {
  organizationId: Scalars['String']['input'];
};


export type MutationsetSupportedGamesArgs = {
  categoryIds: Array<Scalars['Int']['input']>;
};


export type MutationsubmitOrderArgs = {
  input: SubmitOrderInput;
};


export type MutationsubmitPosOrderArgs = {
  input: SubmitPosOrderInput;
};


export type MutationtriggerCronJobArgs = {
  id: Scalars['Int']['input'];
};


export type MutationtriggerRestoreArgs = {
  provider: BackupProvider;
};


export type MutationupdateBackupSettingsArgs = {
  input: UpdateBackupSettingsInput;
};


export type MutationupdateCronJobConfigArgs = {
  config: Scalars['String']['input'];
  id: Scalars['Int']['input'];
};


export type MutationupdateCronJobScheduleArgs = {
  cronExpression: Scalars['String']['input'];
  id: Scalars['Int']['input'];
};


export type MutationupdateEventArgs = {
  id: Scalars['Int']['input'];
  input: UpdateEventInput;
};


export type MutationupdateInventoryItemArgs = {
  input: UpdateInventoryItemInput;
};


export type MutationupdateItemInCartArgs = {
  cartItem: CartItemInput;
};


export type MutationupdateLotArgs = {
  input: UpdateLotInput;
};


export type MutationupdateOrderStatusArgs = {
  orderId: Scalars['Int']['input'];
  status: OrderStatus;
};


export type MutationupdateRecurrenceRuleArgs = {
  frequency: RecurrenceFrequency;
  recurrenceGroupId: Scalars['String']['input'];
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
  paymentMethod?: Maybe<Scalars['String']['output']>;
  status: OrderStatus;
  taxAmount?: Maybe<Scalars['Int']['output']>;
  totalAmount: Scalars['Int']['output'];
  totalCostBasis?: Maybe<Scalars['Int']['output']>;
  totalProfit?: Maybe<Scalars['Int']['output']>;
};

export type OrderFilters = {
  organizationId?: InputMaybe<Scalars['String']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<OrderStatus>;
};

export type OrderItem = {
  __typename?: 'OrderItem';
  condition: CardCondition;
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
  items: Array<Order>;
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type OrderStatus =
  | 'cancelled'
  | 'completed'
  | 'open';

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

export type PaymentIntentResult = {
  __typename?: 'PaymentIntentResult';
  clientSecret: Scalars['String']['output'];
  paymentIntentId: Scalars['String']['output'];
};

export type PosConfig = {
  __typename?: 'PosConfig';
  stripeEnabled: Scalars['Boolean']['output'];
  stripePublishableKey?: Maybe<Scalars['String']['output']>;
  taxRate: Scalars['Float']['output'];
};

export type PosLineItemInput = {
  inventoryItemId: Scalars['Int']['input'];
  quantity: Scalars['Int']['input'];
};

export type PriceHistoryEntry = {
  __typename?: 'PriceHistoryEntry';
  date: Scalars['String']['output'];
  directLowPrice?: Maybe<Scalars['Int']['output']>;
  highPrice?: Maybe<Scalars['Int']['output']>;
  lowPrice?: Maybe<Scalars['Int']['output']>;
  marketPrice?: Maybe<Scalars['Int']['output']>;
  midPrice?: Maybe<Scalars['Int']['output']>;
  subTypeName: Scalars['String']['output'];
};

export type ProductConditionPrice = {
  __typename?: 'ProductConditionPrice';
  condition: CardCondition;
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
  condition: CardCondition;
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
  condition?: InputMaybe<CardCondition>;
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

export type PublicEventRegistrationInput = {
  registrantEmail?: InputMaybe<Scalars['String']['input']>;
  registrantName: Scalars['String']['input'];
  registrantPhone?: InputMaybe<Scalars['String']['input']>;
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
  getBarcodesForInventoryItem: Array<Barcode>;
  /** Admin query - returns buy rate entries for a specific game. */
  getBuyRates: Array<BuyRateEntry>;
  getCard: Card;
  getCronJob?: Maybe<CronJob>;
  getCronJobRuns: CronJobRunPage;
  getCronJobs: Array<CronJob>;
  getDashboardBestSellers: Array<BestSeller>;
  getDashboardInventorySummary: InventorySummary;
  getDashboardOpenOrders: Array<OpenOrder>;
  getDashboardOrderStatus: OrderStatusBreakdown;
  getDashboardSales: SalesBreakdown;
  getDataUpdateStatus: DataUpdateStatus;
  getDistinctRarities: Array<Scalars['String']['output']>;
  /** Stores the current user is assigned to (for authenticated employees/managers/owners) */
  getEmployeeStoreLocations: Array<StoreLocation>;
  getEvent?: Maybe<Event>;
  getEventRegistrations: Array<EventRegistration>;
  getEvents: EventPage;
  getIntegrationSettings: IntegrationSettings;
  getInventory: InventoryPage;
  getInventoryItem?: Maybe<InventoryItem>;
  getInventoryItemDetails: InventoryStockPage;
  getLot?: Maybe<Lot>;
  getLotStats: LotStats;
  getLots: LotPage;
  getOrders: OrderPage;
  getPosConfig: PosConfig;
  getPriceHistory: Array<PriceHistoryEntry>;
  getProduct: ProductDetail;
  getProductListings: ProductListingPage;
  /**
   * Public query - returns buy rate tables for all supported games.
   * No authentication required.
   */
  getPublicBuyRates: PublicBuyRates;
  getPublicEvent?: Maybe<Event>;
  getPublicEvents: Array<Event>;
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
  lookupBarcode?: Maybe<BarcodeLookupResult>;
  lookupSalesTax: SalesTaxLookupResult;
  searchProducts: Array<ProductSearchResult>;
  /**
   * Returns all permission flags for the current user in a single round trip.
   * Used by the SSR server to render nav visibility without multiple hasPermission calls.
   */
  userPermissions: UserPermissions;
};


export type QuerygetBarcodesForInventoryItemArgs = {
  inventoryItemId: Scalars['Int']['input'];
};


export type QuerygetBuyRatesArgs = {
  categoryId: Scalars['Int']['input'];
};


export type QuerygetCardArgs = {
  cardId: Scalars['String']['input'];
  game: Scalars['String']['input'];
};


export type QuerygetCronJobArgs = {
  id: Scalars['Int']['input'];
};


export type QuerygetCronJobRunsArgs = {
  cronJobId: Scalars['Int']['input'];
  pagination?: InputMaybe<PaginationInput>;
};


export type QuerygetDashboardBestSellersArgs = {
  dateRange: DashboardDateRange;
  limit?: InputMaybe<Scalars['Int']['input']>;
  organizationId: Scalars['String']['input'];
  sortBy: BestSellerSortBy;
};


export type QuerygetDashboardInventorySummaryArgs = {
  organizationId: Scalars['String']['input'];
};


export type QuerygetDashboardOpenOrdersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  organizationId: Scalars['String']['input'];
};


export type QuerygetDashboardOrderStatusArgs = {
  dateRange: DashboardDateRange;
  organizationId: Scalars['String']['input'];
};


export type QuerygetDashboardSalesArgs = {
  dateRange: DashboardDateRange;
  organizationId: Scalars['String']['input'];
};


export type QuerygetDistinctRaritiesArgs = {
  categoryId: Scalars['Int']['input'];
};


export type QuerygetEventArgs = {
  id: Scalars['Int']['input'];
};


export type QuerygetEventRegistrationsArgs = {
  eventId: Scalars['Int']['input'];
};


export type QuerygetEventsArgs = {
  filters?: InputMaybe<EventFilters>;
  pagination?: InputMaybe<PaginationInput>;
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


export type QuerygetLotArgs = {
  id: Scalars['Int']['input'];
};


export type QuerygetLotsArgs = {
  filters?: InputMaybe<LotFilters>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QuerygetOrdersArgs = {
  filters?: InputMaybe<OrderFilters>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QuerygetPosConfigArgs = {
  stateCode?: InputMaybe<Scalars['String']['input']>;
};


export type QuerygetPriceHistoryArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  productId: Scalars['String']['input'];
  startDate?: InputMaybe<Scalars['String']['input']>;
  subTypeName?: InputMaybe<Scalars['String']['input']>;
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


export type QuerygetPublicEventArgs = {
  id: Scalars['Int']['input'];
};


export type QuerygetPublicEventsArgs = {
  dateFrom: Scalars['String']['input'];
  dateTo: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
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


export type QuerygetTransactionLogsArgs = {
  filters?: InputMaybe<TransactionLogFilters>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QuerylookupBarcodeArgs = {
  code: Scalars['String']['input'];
};


export type QuerylookupSalesTaxArgs = {
  countryCode: Scalars['String']['input'];
  stateCode: Scalars['String']['input'];
};


export type QuerysearchProductsArgs = {
  game?: InputMaybe<Scalars['String']['input']>;
  isSealed?: InputMaybe<Scalars['Boolean']['input']>;
  isSingle?: InputMaybe<Scalars['Boolean']['input']>;
  searchTerm: Scalars['String']['input'];
};

export type RecurrenceFrequency =
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'WEEKLY';

export type RecurrenceRule = {
  __typename?: 'RecurrenceRule';
  frequency: RecurrenceFrequency;
};

export type RecurrenceRuleInput = {
  frequency: RecurrenceFrequency;
};

export type RegistrationStatus =
  | 'CANCELLED'
  | 'REGISTERED';

export type RemoveBarcodeInput = {
  id: Scalars['Int']['input'];
};

export type ResourceType =
  | 'inventory'
  | 'lot'
  | 'order';

export type RestoreResult = {
  __typename?: 'RestoreResult';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type SalesBreakdown = {
  __typename?: 'SalesBreakdown';
  dataPoints: Array<SalesDataPoint>;
  granularity: Granularity;
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
  hasPublishableKey: Scalars['Boolean']['output'];
};

export type SubmitOrderInput = {
  customerName: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
};

export type SubmitPosOrderInput = {
  customerName: Scalars['String']['input'];
  items: Array<PosLineItemInput>;
  paymentMethod: Scalars['String']['input'];
  stripePaymentIntentId?: InputMaybe<Scalars['String']['input']>;
  taxAmount: Scalars['Int']['input'];
};

export type SupportedGame = {
  __typename?: 'SupportedGame';
  categoryId: Scalars['Int']['output'];
  displayName: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type TerminalConnectionToken = {
  __typename?: 'TerminalConnectionToken';
  secret: Scalars['String']['output'];
};

export type TransactionLogEntry = {
  __typename?: 'TransactionLogEntry';
  action: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  details: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  resourceId?: Maybe<Scalars['String']['output']>;
  resourceType: ResourceType;
  userEmail: Scalars['String']['output'];
  userName: Scalars['String']['output'];
};

export type TransactionLogFilters = {
  action?: InputMaybe<Scalars['String']['input']>;
  month?: InputMaybe<Scalars['Int']['input']>;
  resourceType?: InputMaybe<ResourceType>;
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
  dropboxClientId?: InputMaybe<Scalars['String']['input']>;
  frequency?: InputMaybe<Scalars['String']['input']>;
  googleDriveClientId?: InputMaybe<Scalars['String']['input']>;
  onedriveClientId?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<BackupProvider>;
};

export type UpdateEventInput = {
  capacity?: InputMaybe<Scalars['Int']['input']>;
  categoryId?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  entryFeeInCents?: InputMaybe<Scalars['Int']['input']>;
  eventType?: InputMaybe<EventType>;
  name?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateInventoryItemInput = {
  condition?: InputMaybe<CardCondition>;
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
  publishableKey?: InputMaybe<Scalars['String']['input']>;
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
  canManageEvents: Scalars['Boolean']['output'];
  canManageInventory: Scalars['Boolean']['output'];
  canManageLots: Scalars['Boolean']['output'];
  canManageStoreLocations: Scalars['Boolean']['output'];
  canManageUsers: Scalars['Boolean']['output'];
  canUsePOS: Scalars['Boolean']['output'];
  canViewDashboard: Scalars['Boolean']['output'];
  canViewTransactionLog: Scalars['Boolean']['output'];
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
  AddBarcodeInput: AddBarcodeInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  AddInventoryItemInput: AddInventoryItemInput;
  AddStockInput: AddStockInput;
  AddStoreLocationInput: AddStoreLocationInput;
  AdminEventRegistrationInput: AdminEventRegistrationInput;
  BackupProvider: ResolverTypeWrapper<'google_drive' | 'dropbox' | 'onedrive'>;
  BackupResult: ResolverTypeWrapper<BackupResult>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  BackupSettings: ResolverTypeWrapper<Omit<BackupSettings, 'provider'> & { provider?: Maybe<ResolversTypes['BackupProvider']> }>;
  Barcode: ResolverTypeWrapper<Barcode>;
  BarcodeLookupResult: ResolverTypeWrapper<Omit<BarcodeLookupResult, 'condition'> & { condition: ResolversTypes['CardCondition'] }>;
  BestSeller: ResolverTypeWrapper<BestSeller>;
  BestSellerSortBy: ResolverTypeWrapper<'quantity' | 'revenue'>;
  BulkDeleteStockInput: BulkDeleteStockInput;
  BulkUpdateStockInput: BulkUpdateStockInput;
  BuyRateEntry: ResolverTypeWrapper<Omit<BuyRateEntry, 'type'> & { type: ResolversTypes['BuyRateType'] }>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  BuyRateEntryInput: BuyRateEntryInput;
  BuyRateTable: ResolverTypeWrapper<Omit<BuyRateTable, 'entries'> & { entries: Array<ResolversTypes['BuyRateEntry']> }>;
  BuyRateType: ResolverTypeWrapper<'fixed' | 'percentage'>;
  Card: ResolverTypeWrapper<Card>;
  CardCondition: ResolverTypeWrapper<'NM' | 'LP' | 'MP' | 'HP' | 'D'>;
  CardImages: ResolverTypeWrapper<CardImages>;
  CartItemInput: CartItemInput;
  CartItemOutput: ResolverTypeWrapper<Omit<CartItemOutput, 'condition'> & { condition: ResolversTypes['CardCondition'] }>;
  CompanySettings: CompanySettings;
  CompletePosOrderInput: CompletePosOrderInput;
  ConditionInventories: ResolverTypeWrapper<ConditionInventories>;
  ConditionInventory: ResolverTypeWrapper<ConditionInventory>;
  CreateEventInput: CreateEventInput;
  CreateLotInput: CreateLotInput;
  CronJob: ResolverTypeWrapper<CronJob>;
  CronJobRun: ResolverTypeWrapper<CronJobRun>;
  CronJobRunPage: ResolverTypeWrapper<CronJobRunPage>;
  DashboardDateRange: DashboardDateRange;
  DataUpdateResult: ResolverTypeWrapper<DataUpdateResult>;
  DataUpdateStatus: ResolverTypeWrapper<DataUpdateStatus>;
  Event: ResolverTypeWrapper<Omit<Event, 'eventType' | 'recurrenceRule' | 'registrations' | 'status'> & { eventType: ResolversTypes['EventType'], recurrenceRule?: Maybe<ResolversTypes['RecurrenceRule']>, registrations?: Maybe<Array<ResolversTypes['EventRegistration']>>, status: ResolversTypes['EventStatus'] }>;
  EventFilters: EventFilters;
  EventPage: ResolverTypeWrapper<Omit<EventPage, 'items'> & { items: Array<ResolversTypes['Event']> }>;
  EventRegistration: ResolverTypeWrapper<Omit<EventRegistration, 'status'> & { status: ResolversTypes['RegistrationStatus'] }>;
  EventStatus: ResolverTypeWrapper<'SCHEDULED' | 'CANCELLED' | 'COMPLETED'>;
  EventType: ResolverTypeWrapper<'TOURNAMENT' | 'CASUAL_PLAY' | 'RELEASE_EVENT' | 'DRAFT' | 'PRERELEASE' | 'LEAGUE' | 'OTHER'>;
  Granularity: ResolverTypeWrapper<'hour' | 'day' | 'month'>;
  InitialStoreLocation: InitialStoreLocation;
  IntegrationSettings: ResolverTypeWrapper<IntegrationSettings>;
  InventoryFilters: InventoryFilters;
  InventoryItem: ResolverTypeWrapper<Omit<InventoryItem, 'condition'> & { condition: ResolversTypes['CardCondition'] }>;
  InventoryItemStock: ResolverTypeWrapper<InventoryItemStock>;
  InventoryPage: ResolverTypeWrapper<Omit<InventoryPage, 'items'> & { items: Array<ResolversTypes['InventoryItem']> }>;
  InventoryStockPage: ResolverTypeWrapper<InventoryStockPage>;
  InventorySummary: ResolverTypeWrapper<InventorySummary>;
  Lot: ResolverTypeWrapper<Omit<Lot, 'items'> & { items: Array<ResolversTypes['LotItem']> }>;
  LotFilters: LotFilters;
  LotItem: ResolverTypeWrapper<Omit<LotItem, 'condition'> & { condition?: Maybe<ResolversTypes['CardCondition']> }>;
  LotItemInput: LotItemInput;
  LotPage: ResolverTypeWrapper<Omit<LotPage, 'items'> & { items: Array<ResolversTypes['Lot']> }>;
  LotStats: ResolverTypeWrapper<LotStats>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  OpenOrder: ResolverTypeWrapper<OpenOrder>;
  Order: ResolverTypeWrapper<Omit<Order, 'items' | 'status'> & { items: Array<ResolversTypes['OrderItem']>, status: ResolversTypes['OrderStatus'] }>;
  OrderFilters: OrderFilters;
  OrderItem: ResolverTypeWrapper<Omit<OrderItem, 'condition'> & { condition: ResolversTypes['CardCondition'] }>;
  OrderPage: ResolverTypeWrapper<Omit<OrderPage, 'items'> & { items: Array<ResolversTypes['Order']> }>;
  OrderStatus: ResolverTypeWrapper<'open' | 'completed' | 'cancelled'>;
  OrderStatusBreakdown: ResolverTypeWrapper<OrderStatusBreakdown>;
  PaginationInput: PaginationInput;
  PaymentIntentResult: ResolverTypeWrapper<PaymentIntentResult>;
  PosConfig: ResolverTypeWrapper<PosConfig>;
  PosLineItemInput: PosLineItemInput;
  PriceHistoryEntry: ResolverTypeWrapper<PriceHistoryEntry>;
  ProductConditionPrice: ResolverTypeWrapper<Omit<ProductConditionPrice, 'condition'> & { condition: ResolversTypes['CardCondition'] }>;
  ProductDetail: ResolverTypeWrapper<Omit<ProductDetail, 'inventoryRecords'> & { inventoryRecords: Array<ResolversTypes['ProductInventoryRecord']> }>;
  ProductInventoryRecord: ResolverTypeWrapper<Omit<ProductInventoryRecord, 'condition'> & { condition: ResolversTypes['CardCondition'] }>;
  ProductListing: ResolverTypeWrapper<Omit<ProductListing, 'conditionPrices'> & { conditionPrices: Array<ResolversTypes['ProductConditionPrice']> }>;
  ProductListingFilters: ProductListingFilters;
  ProductListingPage: ResolverTypeWrapper<Omit<ProductListingPage, 'items'> & { items: Array<ResolversTypes['ProductListing']> }>;
  ProductListingPagination: ProductListingPagination;
  ProductPrice: ResolverTypeWrapper<ProductPrice>;
  ProductSearchResult: ResolverTypeWrapper<ProductSearchResult>;
  PublicBuyRates: ResolverTypeWrapper<Omit<PublicBuyRates, 'games'> & { games: Array<ResolversTypes['BuyRateTable']> }>;
  PublicEventRegistrationInput: PublicEventRegistrationInput;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  RecurrenceFrequency: ResolverTypeWrapper<'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'>;
  RecurrenceRule: ResolverTypeWrapper<Omit<RecurrenceRule, 'frequency'> & { frequency: ResolversTypes['RecurrenceFrequency'] }>;
  RecurrenceRuleInput: RecurrenceRuleInput;
  RegistrationStatus: ResolverTypeWrapper<'REGISTERED' | 'CANCELLED'>;
  RemoveBarcodeInput: RemoveBarcodeInput;
  ResourceType: ResolverTypeWrapper<'order' | 'lot' | 'inventory'>;
  RestoreResult: ResolverTypeWrapper<RestoreResult>;
  SalesBreakdown: ResolverTypeWrapper<Omit<SalesBreakdown, 'granularity'> & { granularity: ResolversTypes['Granularity'] }>;
  SalesDataPoint: ResolverTypeWrapper<SalesDataPoint>;
  SalesSummary: ResolverTypeWrapper<SalesSummary>;
  SalesTaxLookupResult: ResolverTypeWrapper<SalesTaxLookupResult>;
  SaveBuyRatesInput: SaveBuyRatesInput;
  Set: ResolverTypeWrapper<Set>;
  SetFilters: SetFilters;
  ShopifyIntegration: ResolverTypeWrapper<ShopifyIntegration>;
  ShoppingCart: ResolverTypeWrapper<Omit<ShoppingCart, 'items'> & { items: Array<ResolversTypes['CartItemOutput']> }>;
  SingleCardFilters: SingleCardFilters;
  StoreHours: ResolverTypeWrapper<StoreHours>;
  StoreHoursInput: StoreHoursInput;
  StoreLocation: ResolverTypeWrapper<StoreLocation>;
  StoreSettings: ResolverTypeWrapper<StoreSettings>;
  StripeIntegration: ResolverTypeWrapper<StripeIntegration>;
  SubmitOrderInput: SubmitOrderInput;
  SubmitPosOrderInput: SubmitPosOrderInput;
  SupportedGame: ResolverTypeWrapper<SupportedGame>;
  TerminalConnectionToken: ResolverTypeWrapper<TerminalConnectionToken>;
  TransactionLogEntry: ResolverTypeWrapper<Omit<TransactionLogEntry, 'resourceType'> & { resourceType: ResolversTypes['ResourceType'] }>;
  TransactionLogFilters: TransactionLogFilters;
  TransactionLogPage: ResolverTypeWrapper<Omit<TransactionLogPage, 'items'> & { items: Array<ResolversTypes['TransactionLogEntry']> }>;
  UpdateBackupSettingsInput: UpdateBackupSettingsInput;
  UpdateEventInput: UpdateEventInput;
  UpdateInventoryItemInput: UpdateInventoryItemInput;
  UpdateLotInput: UpdateLotInput;
  UpdateShopifyIntegrationInput: UpdateShopifyIntegrationInput;
  UpdateStockInput: UpdateStockInput;
  UpdateStoreLocationInput: UpdateStoreLocationInput;
  UpdateStoreSettingsInput: UpdateStoreSettingsInput;
  UpdateStripeIntegrationInput: UpdateStripeIntegrationInput;
  UserDetails: UserDetails;
  UserPermissions: ResolverTypeWrapper<UserPermissions>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AddBarcodeInput: AddBarcodeInput;
  String: Scalars['String']['output'];
  Int: Scalars['Int']['output'];
  AddInventoryItemInput: AddInventoryItemInput;
  AddStockInput: AddStockInput;
  AddStoreLocationInput: AddStoreLocationInput;
  AdminEventRegistrationInput: AdminEventRegistrationInput;
  BackupResult: BackupResult;
  Boolean: Scalars['Boolean']['output'];
  BackupSettings: BackupSettings;
  Barcode: Barcode;
  BarcodeLookupResult: BarcodeLookupResult;
  BestSeller: BestSeller;
  BulkDeleteStockInput: BulkDeleteStockInput;
  BulkUpdateStockInput: BulkUpdateStockInput;
  BuyRateEntry: BuyRateEntry;
  Float: Scalars['Float']['output'];
  BuyRateEntryInput: BuyRateEntryInput;
  BuyRateTable: Omit<BuyRateTable, 'entries'> & { entries: Array<ResolversParentTypes['BuyRateEntry']> };
  Card: Card;
  CardImages: CardImages;
  CartItemInput: CartItemInput;
  CartItemOutput: CartItemOutput;
  CompanySettings: CompanySettings;
  CompletePosOrderInput: CompletePosOrderInput;
  ConditionInventories: ConditionInventories;
  ConditionInventory: ConditionInventory;
  CreateEventInput: CreateEventInput;
  CreateLotInput: CreateLotInput;
  CronJob: CronJob;
  CronJobRun: CronJobRun;
  CronJobRunPage: CronJobRunPage;
  DashboardDateRange: DashboardDateRange;
  DataUpdateResult: DataUpdateResult;
  DataUpdateStatus: DataUpdateStatus;
  Event: Omit<Event, 'recurrenceRule' | 'registrations'> & { recurrenceRule?: Maybe<ResolversParentTypes['RecurrenceRule']>, registrations?: Maybe<Array<ResolversParentTypes['EventRegistration']>> };
  EventFilters: EventFilters;
  EventPage: Omit<EventPage, 'items'> & { items: Array<ResolversParentTypes['Event']> };
  EventRegistration: EventRegistration;
  InitialStoreLocation: InitialStoreLocation;
  IntegrationSettings: IntegrationSettings;
  InventoryFilters: InventoryFilters;
  InventoryItem: InventoryItem;
  InventoryItemStock: InventoryItemStock;
  InventoryPage: Omit<InventoryPage, 'items'> & { items: Array<ResolversParentTypes['InventoryItem']> };
  InventoryStockPage: InventoryStockPage;
  InventorySummary: InventorySummary;
  Lot: Omit<Lot, 'items'> & { items: Array<ResolversParentTypes['LotItem']> };
  LotFilters: LotFilters;
  LotItem: LotItem;
  LotItemInput: LotItemInput;
  LotPage: Omit<LotPage, 'items'> & { items: Array<ResolversParentTypes['Lot']> };
  LotStats: LotStats;
  Mutation: Record<PropertyKey, never>;
  OpenOrder: OpenOrder;
  Order: Omit<Order, 'items'> & { items: Array<ResolversParentTypes['OrderItem']> };
  OrderFilters: OrderFilters;
  OrderItem: OrderItem;
  OrderPage: Omit<OrderPage, 'items'> & { items: Array<ResolversParentTypes['Order']> };
  OrderStatusBreakdown: OrderStatusBreakdown;
  PaginationInput: PaginationInput;
  PaymentIntentResult: PaymentIntentResult;
  PosConfig: PosConfig;
  PosLineItemInput: PosLineItemInput;
  PriceHistoryEntry: PriceHistoryEntry;
  ProductConditionPrice: ProductConditionPrice;
  ProductDetail: Omit<ProductDetail, 'inventoryRecords'> & { inventoryRecords: Array<ResolversParentTypes['ProductInventoryRecord']> };
  ProductInventoryRecord: ProductInventoryRecord;
  ProductListing: Omit<ProductListing, 'conditionPrices'> & { conditionPrices: Array<ResolversParentTypes['ProductConditionPrice']> };
  ProductListingFilters: ProductListingFilters;
  ProductListingPage: Omit<ProductListingPage, 'items'> & { items: Array<ResolversParentTypes['ProductListing']> };
  ProductListingPagination: ProductListingPagination;
  ProductPrice: ProductPrice;
  ProductSearchResult: ProductSearchResult;
  PublicBuyRates: Omit<PublicBuyRates, 'games'> & { games: Array<ResolversParentTypes['BuyRateTable']> };
  PublicEventRegistrationInput: PublicEventRegistrationInput;
  Query: Record<PropertyKey, never>;
  RecurrenceRule: RecurrenceRule;
  RecurrenceRuleInput: RecurrenceRuleInput;
  RemoveBarcodeInput: RemoveBarcodeInput;
  RestoreResult: RestoreResult;
  SalesBreakdown: SalesBreakdown;
  SalesDataPoint: SalesDataPoint;
  SalesSummary: SalesSummary;
  SalesTaxLookupResult: SalesTaxLookupResult;
  SaveBuyRatesInput: SaveBuyRatesInput;
  Set: Set;
  SetFilters: SetFilters;
  ShopifyIntegration: ShopifyIntegration;
  ShoppingCart: Omit<ShoppingCart, 'items'> & { items: Array<ResolversParentTypes['CartItemOutput']> };
  SingleCardFilters: SingleCardFilters;
  StoreHours: StoreHours;
  StoreHoursInput: StoreHoursInput;
  StoreLocation: StoreLocation;
  StoreSettings: StoreSettings;
  StripeIntegration: StripeIntegration;
  SubmitOrderInput: SubmitOrderInput;
  SubmitPosOrderInput: SubmitPosOrderInput;
  SupportedGame: SupportedGame;
  TerminalConnectionToken: TerminalConnectionToken;
  TransactionLogEntry: TransactionLogEntry;
  TransactionLogFilters: TransactionLogFilters;
  TransactionLogPage: Omit<TransactionLogPage, 'items'> & { items: Array<ResolversParentTypes['TransactionLogEntry']> };
  UpdateBackupSettingsInput: UpdateBackupSettingsInput;
  UpdateEventInput: UpdateEventInput;
  UpdateInventoryItemInput: UpdateInventoryItemInput;
  UpdateLotInput: UpdateLotInput;
  UpdateShopifyIntegrationInput: UpdateShopifyIntegrationInput;
  UpdateStockInput: UpdateStockInput;
  UpdateStoreLocationInput: UpdateStoreLocationInput;
  UpdateStoreSettingsInput: UpdateStoreSettingsInput;
  UpdateStripeIntegrationInput: UpdateStripeIntegrationInput;
  UserDetails: UserDetails;
  UserPermissions: UserPermissions;
};

export type BackupProviderResolvers = EnumResolverSignature<{ dropbox?: any, google_drive?: any, onedrive?: any }, ResolversTypes['BackupProvider']>;

export type BackupResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['BackupResult'] = ResolversParentTypes['BackupResult']> = {
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  timestamp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type BackupSettingsResolvers<ContextType = any, ParentType extends ResolversParentTypes['BackupSettings'] = ResolversParentTypes['BackupSettings']> = {
  dropboxClientId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dropboxConnected?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  frequency?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  googleDriveClientId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  googleDriveConnected?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  googleDriveHasClientSecret?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastBackupAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  onedriveClientId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  onedriveConnected?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  provider?: Resolver<Maybe<ResolversTypes['BackupProvider']>, ParentType, ContextType>;
};

export type BarcodeResolvers<ContextType = any, ParentType extends ResolversParentTypes['Barcode'] = ResolversParentTypes['Barcode']> = {
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  inventoryItemId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type BarcodeLookupResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['BarcodeLookupResult'] = ResolversParentTypes['BarcodeLookupResult']> = {
  availableQuantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  condition?: Resolver<ResolversTypes['CardCondition'], ParentType, ContextType>;
  gameName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  imageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  inventoryItemId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  setName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type BestSellerResolvers<ContextType = any, ParentType extends ResolversParentTypes['BestSeller'] = ResolversParentTypes['BestSeller']> = {
  productId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalQuantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalRevenue?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type BestSellerSortByResolvers = EnumResolverSignature<{ quantity?: any, revenue?: any }, ResolversTypes['BestSellerSortBy']>;

export type BuyRateEntryResolvers<ContextType = any, ParentType extends ResolversParentTypes['BuyRateEntry'] = ResolversParentTypes['BuyRateEntry']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fixedRateCents?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  hidden?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  percentageRate?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  rarity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sortOrder?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['BuyRateType'], ParentType, ContextType>;
};

export type BuyRateTableResolvers<ContextType = any, ParentType extends ResolversParentTypes['BuyRateTable'] = ResolversParentTypes['BuyRateTable']> = {
  categoryId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  entries?: Resolver<Array<ResolversTypes['BuyRateEntry']>, ParentType, ContextType>;
  gameDisplayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  gameName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type BuyRateTypeResolvers = EnumResolverSignature<{ fixed?: any, percentage?: any }, ResolversTypes['BuyRateType']>;

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

export type CardConditionResolvers = EnumResolverSignature<{ D?: any, HP?: any, LP?: any, MP?: any, NM?: any }, ResolversTypes['CardCondition']>;

export type CardImagesResolvers<ContextType = any, ParentType extends ResolversParentTypes['CardImages'] = ResolversParentTypes['CardImages']> = {
  large?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  small?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type CartItemOutputResolvers<ContextType = any, ParentType extends ResolversParentTypes['CartItemOutput'] = ResolversParentTypes['CartItemOutput']> = {
  condition?: Resolver<ResolversTypes['CardCondition'], ParentType, ContextType>;
  inventoryItemId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  maxAvailable?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unitPrice?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
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
  price?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type CronJobResolvers<ContextType = any, ParentType extends ResolversParentTypes['CronJob'] = ResolversParentTypes['CronJob']> = {
  config?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  cronExpression?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lastRunAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lastRunDurationMs?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  lastRunError?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lastRunStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nextRunAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type CronJobRunResolvers<ContextType = any, ParentType extends ResolversParentTypes['CronJobRun'] = ResolversParentTypes['CronJobRun']> = {
  completedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  cronJobId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  durationMs?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  summary?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type CronJobRunPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['CronJobRunPage'] = ResolversParentTypes['CronJobRunPage']> = {
  items?: Resolver<Array<ResolversTypes['CronJobRun']>, ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pageSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type DataUpdateResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['DataUpdateResult'] = ResolversParentTypes['DataUpdateResult']> = {
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  newVersion?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type DataUpdateStatusResolvers<ContextType = any, ParentType extends ResolversParentTypes['DataUpdateStatus'] = ResolversParentTypes['DataUpdateStatus']> = {
  currentVersion?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isUpdating?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  latestVersion?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updateAvailable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type EventResolvers<ContextType = any, ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']> = {
  capacity?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  categoryId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  endTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  entryFeeInCents?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  eventType?: Resolver<ResolversTypes['EventType'], ParentType, ContextType>;
  gameDisplayName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  gameName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isRecurrenceTemplate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  organizationId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  recurrenceGroupId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  recurrenceRule?: Resolver<Maybe<ResolversTypes['RecurrenceRule']>, ParentType, ContextType>;
  registrationCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  registrations?: Resolver<Maybe<Array<ResolversTypes['EventRegistration']>>, ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['EventStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type EventPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventPage'] = ResolversParentTypes['EventPage']> = {
  items?: Resolver<Array<ResolversTypes['Event']>, ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pageSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type EventRegistrationResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventRegistration'] = ResolversParentTypes['EventRegistration']> = {
  checkedIn?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  checkedInAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  eventId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  registrantEmail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  registrantName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  registrantPhone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['RegistrationStatus'], ParentType, ContextType>;
};

export type EventStatusResolvers = EnumResolverSignature<{ CANCELLED?: any, COMPLETED?: any, SCHEDULED?: any }, ResolversTypes['EventStatus']>;

export type EventTypeResolvers = EnumResolverSignature<{ CASUAL_PLAY?: any, DRAFT?: any, LEAGUE?: any, OTHER?: any, PRERELEASE?: any, RELEASE_EVENT?: any, TOURNAMENT?: any }, ResolversTypes['EventType']>;

export type GranularityResolvers = EnumResolverSignature<{ day?: any, hour?: any, month?: any }, ResolversTypes['Granularity']>;

export type IntegrationSettingsResolvers<ContextType = any, ParentType extends ResolversParentTypes['IntegrationSettings'] = ResolversParentTypes['IntegrationSettings']> = {
  shopify?: Resolver<ResolversTypes['ShopifyIntegration'], ParentType, ContextType>;
  stripe?: Resolver<ResolversTypes['StripeIntegration'], ParentType, ContextType>;
};

export type InventoryItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['InventoryItem'] = ResolversParentTypes['InventoryItem']> = {
  condition?: Resolver<ResolversTypes['CardCondition'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  entryCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  gameName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isSealed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isSingle?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  organizationId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rarity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  setName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalQuantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type InventoryItemStockResolvers<ContextType = any, ParentType extends ResolversParentTypes['InventoryItemStock'] = ResolversParentTypes['InventoryItemStock']> = {
  acquisitionDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  costBasis?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
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

export type InventorySummaryResolvers<ContextType = any, ParentType extends ResolversParentTypes['InventorySummary'] = ResolversParentTypes['InventorySummary']> = {
  totalCostValue?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalRetailValue?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalSkus?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalUnits?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type LotResolvers<ContextType = any, ParentType extends ResolversParentTypes['Lot'] = ResolversParentTypes['Lot']> = {
  acquisitionDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  amountPaid?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['LotItem']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  organizationId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  projectedProfitLoss?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  projectedProfitMargin?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  totalCost?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalMarketValue?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type LotItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['LotItem'] = ResolversParentTypes['LotItem']> = {
  condition?: Resolver<Maybe<ResolversTypes['CardCondition']>, ParentType, ContextType>;
  costBasis?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  costOverridden?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  gameName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isSealed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isSingle?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lotId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  marketValue?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  productId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  rarity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  setName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type LotPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['LotPage'] = ResolversParentTypes['LotPage']> = {
  items?: Resolver<Array<ResolversTypes['Lot']>, ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pageSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type LotStatsResolvers<ContextType = any, ParentType extends ResolversParentTypes['LotStats'] = ResolversParentTypes['LotStats']> = {
  totalInvested?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalLots?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalMarketValue?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalProfitLoss?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addBarcode?: Resolver<ResolversTypes['Barcode'], ParentType, ContextType, RequireFields<MutationaddBarcodeArgs, 'input'>>;
  addEventRegistration?: Resolver<ResolversTypes['EventRegistration'], ParentType, ContextType, RequireFields<MutationaddEventRegistrationArgs, 'eventId' | 'input'>>;
  addInventoryItem?: Resolver<ResolversTypes['InventoryItem'], ParentType, ContextType, RequireFields<MutationaddInventoryItemArgs, 'input'>>;
  addStock?: Resolver<ResolversTypes['InventoryItemStock'], ParentType, ContextType, RequireFields<MutationaddStockArgs, 'input'>>;
  addStoreLocation?: Resolver<ResolversTypes['StoreLocation'], ParentType, ContextType, RequireFields<MutationaddStoreLocationArgs, 'input'>>;
  addToCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType, RequireFields<MutationaddToCartArgs, 'cartItem'>>;
  bulkDeleteStock?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationbulkDeleteStockArgs, 'input'>>;
  bulkUpdateStock?: Resolver<Array<ResolversTypes['InventoryItemStock']>, ParentType, ContextType, RequireFields<MutationbulkUpdateStockArgs, 'input'>>;
  cancelEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationcancelEventArgs, 'id'>>;
  cancelEventRegistration?: Resolver<ResolversTypes['EventRegistration'], ParentType, ContextType, RequireFields<MutationcancelEventRegistrationArgs, 'registrationId'>>;
  cancelOrder?: Resolver<ResolversTypes['Order'], ParentType, ContextType, RequireFields<MutationcancelOrderArgs, 'orderId'>>;
  cancelPosPaymentIntent?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationcancelPosPaymentIntentArgs, 'paymentIntentId'>>;
  cancelRecurringSeries?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<MutationcancelRecurringSeriesArgs, 'recurrenceGroupId'>>;
  checkInEventRegistration?: Resolver<ResolversTypes['EventRegistration'], ParentType, ContextType, RequireFields<MutationcheckInEventRegistrationArgs, 'registrationId'>>;
  checkoutWithCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType>;
  clearCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType>;
  completePosOrder?: Resolver<ResolversTypes['Order'], ParentType, ContextType, RequireFields<MutationcompletePosOrderArgs, 'input'>>;
  createEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationcreateEventArgs, 'input'>>;
  createLot?: Resolver<ResolversTypes['Lot'], ParentType, ContextType, RequireFields<MutationcreateLotArgs, 'input'>>;
  createPosPaymentIntent?: Resolver<ResolversTypes['PaymentIntentResult'], ParentType, ContextType, RequireFields<MutationcreatePosPaymentIntentArgs, 'amount'>>;
  createTerminalConnectionToken?: Resolver<ResolversTypes['TerminalConnectionToken'], ParentType, ContextType>;
  deleteBuyRates?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationdeleteBuyRatesArgs, 'categoryId'>>;
  deleteInventoryItem?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationdeleteInventoryItemArgs, 'id'>>;
  deleteLot?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationdeleteLotArgs, 'id'>>;
  deleteStock?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationdeleteStockArgs, 'id'>>;
  disableCronJob?: Resolver<ResolversTypes['CronJob'], ParentType, ContextType, RequireFields<MutationdisableCronJobArgs, 'id'>>;
  disconnectBackupProvider?: Resolver<ResolversTypes['BackupSettings'], ParentType, ContextType, RequireFields<MutationdisconnectBackupProviderArgs, 'provider'>>;
  enableCronJob?: Resolver<ResolversTypes['CronJob'], ParentType, ContextType, RequireFields<MutationenableCronJobArgs, 'id'>>;
  firstTimeSetup?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationfirstTimeSetupArgs, 'company' | 'store' | 'supportedGameCategoryIds' | 'userDetails'>>;
  registerForEvent?: Resolver<ResolversTypes['EventRegistration'], ParentType, ContextType, RequireFields<MutationregisterForEventArgs, 'eventId' | 'input'>>;
  removeBarcode?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationremoveBarcodeArgs, 'input'>>;
  removeFromCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType, RequireFields<MutationremoveFromCartArgs, 'cartItem'>>;
  removeStoreLocation?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationremoveStoreLocationArgs, 'id'>>;
  saveBuyRates?: Resolver<Array<ResolversTypes['BuyRateEntry']>, ParentType, ContextType, RequireFields<MutationsaveBuyRatesArgs, 'input'>>;
  setActiveStoreLocation?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationsetActiveStoreLocationArgs, 'organizationId'>>;
  setSupportedGames?: Resolver<Array<ResolversTypes['SupportedGame']>, ParentType, ContextType, RequireFields<MutationsetSupportedGamesArgs, 'categoryIds'>>;
  submitOrder?: Resolver<ResolversTypes['Order'], ParentType, ContextType, RequireFields<MutationsubmitOrderArgs, 'input'>>;
  submitPosOrder?: Resolver<ResolversTypes['Order'], ParentType, ContextType, RequireFields<MutationsubmitPosOrderArgs, 'input'>>;
  triggerBackup?: Resolver<ResolversTypes['BackupResult'], ParentType, ContextType>;
  triggerCronJob?: Resolver<ResolversTypes['CronJobRun'], ParentType, ContextType, RequireFields<MutationtriggerCronJobArgs, 'id'>>;
  triggerDataUpdate?: Resolver<ResolversTypes['DataUpdateResult'], ParentType, ContextType>;
  triggerRestore?: Resolver<ResolversTypes['RestoreResult'], ParentType, ContextType, RequireFields<MutationtriggerRestoreArgs, 'provider'>>;
  updateBackupSettings?: Resolver<ResolversTypes['BackupSettings'], ParentType, ContextType, RequireFields<MutationupdateBackupSettingsArgs, 'input'>>;
  updateCronJobConfig?: Resolver<ResolversTypes['CronJob'], ParentType, ContextType, RequireFields<MutationupdateCronJobConfigArgs, 'config' | 'id'>>;
  updateCronJobSchedule?: Resolver<ResolversTypes['CronJob'], ParentType, ContextType, RequireFields<MutationupdateCronJobScheduleArgs, 'cronExpression' | 'id'>>;
  updateEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationupdateEventArgs, 'id' | 'input'>>;
  updateInventoryItem?: Resolver<ResolversTypes['InventoryItem'], ParentType, ContextType, RequireFields<MutationupdateInventoryItemArgs, 'input'>>;
  updateItemInCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType, RequireFields<MutationupdateItemInCartArgs, 'cartItem'>>;
  updateLot?: Resolver<ResolversTypes['Lot'], ParentType, ContextType, RequireFields<MutationupdateLotArgs, 'input'>>;
  updateOrderStatus?: Resolver<ResolversTypes['Order'], ParentType, ContextType, RequireFields<MutationupdateOrderStatusArgs, 'orderId' | 'status'>>;
  updateRecurrenceRule?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationupdateRecurrenceRuleArgs, 'frequency' | 'recurrenceGroupId'>>;
  updateShopifyIntegration?: Resolver<ResolversTypes['ShopifyIntegration'], ParentType, ContextType, RequireFields<MutationupdateShopifyIntegrationArgs, 'input'>>;
  updateStock?: Resolver<ResolversTypes['InventoryItemStock'], ParentType, ContextType, RequireFields<MutationupdateStockArgs, 'input'>>;
  updateStoreLocation?: Resolver<ResolversTypes['StoreLocation'], ParentType, ContextType, RequireFields<MutationupdateStoreLocationArgs, 'input'>>;
  updateStoreSettings?: Resolver<ResolversTypes['StoreSettings'], ParentType, ContextType, RequireFields<MutationupdateStoreSettingsArgs, 'input'>>;
  updateStripeIntegration?: Resolver<ResolversTypes['StripeIntegration'], ParentType, ContextType, RequireFields<MutationupdateStripeIntegrationArgs, 'input'>>;
};

export type OpenOrderResolvers<ContextType = any, ParentType extends ResolversParentTypes['OpenOrder'] = ResolversParentTypes['OpenOrder']> = {
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  customerName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  itemCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  orderNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalAmount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type OrderResolvers<ContextType = any, ParentType extends ResolversParentTypes['Order'] = ResolversParentTypes['Order']> = {
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  customerName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['OrderItem']>, ParentType, ContextType>;
  orderNumber?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  organizationId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  paymentMethod?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['OrderStatus'], ParentType, ContextType>;
  taxAmount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalAmount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCostBasis?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalProfit?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
};

export type OrderItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrderItem'] = ResolversParentTypes['OrderItem']> = {
  condition?: Resolver<ResolversTypes['CardCondition'], ParentType, ContextType>;
  costBasis?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lotId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  productId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  profit?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unitPrice?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type OrderPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrderPage'] = ResolversParentTypes['OrderPage']> = {
  items?: Resolver<Array<ResolversTypes['Order']>, ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pageSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type OrderStatusResolvers = EnumResolverSignature<{ cancelled?: any, completed?: any, open?: any }, ResolversTypes['OrderStatus']>;

export type OrderStatusBreakdownResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrderStatusBreakdown'] = ResolversParentTypes['OrderStatusBreakdown']> = {
  cancelled?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  completed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  open?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type PaymentIntentResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['PaymentIntentResult'] = ResolversParentTypes['PaymentIntentResult']> = {
  clientSecret?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  paymentIntentId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type PosConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['PosConfig'] = ResolversParentTypes['PosConfig']> = {
  stripeEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  stripePublishableKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  taxRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
};

export type PriceHistoryEntryResolvers<ContextType = any, ParentType extends ResolversParentTypes['PriceHistoryEntry'] = ResolversParentTypes['PriceHistoryEntry']> = {
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  directLowPrice?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  highPrice?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  lowPrice?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  marketPrice?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  midPrice?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  subTypeName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ProductConditionPriceResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProductConditionPrice'] = ResolversParentTypes['ProductConditionPrice']> = {
  condition?: Resolver<ResolversTypes['CardCondition'], ParentType, ContextType>;
  inventoryItemId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
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
  condition?: Resolver<ResolversTypes['CardCondition'], ParentType, ContextType>;
  inventoryItemId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type ProductListingResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProductListing'] = ResolversParentTypes['ProductListing']> = {
  conditionPrices?: Resolver<Array<ResolversTypes['ProductConditionPrice']>, ParentType, ContextType>;
  finishes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  gameName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  images?: Resolver<Maybe<ResolversTypes['CardImages']>, ParentType, ContextType>;
  lowestPrice?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
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
  directLowPrice?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  highPrice?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  lowPrice?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  marketPrice?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  midPrice?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
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

export type PublicBuyRatesResolvers<ContextType = any, ParentType extends ResolversParentTypes['PublicBuyRates'] = ResolversParentTypes['PublicBuyRates']> = {
  games?: Resolver<Array<ResolversTypes['BuyRateTable']>, ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getActiveStoreLocation?: Resolver<Maybe<ResolversTypes['StoreLocation']>, ParentType, ContextType>;
  getAllStoreLocations?: Resolver<Array<ResolversTypes['StoreLocation']>, ParentType, ContextType>;
  getAvailableGames?: Resolver<Array<ResolversTypes['SupportedGame']>, ParentType, ContextType>;
  getBackupSettings?: Resolver<ResolversTypes['BackupSettings'], ParentType, ContextType>;
  getBarcodesForInventoryItem?: Resolver<Array<ResolversTypes['Barcode']>, ParentType, ContextType, RequireFields<QuerygetBarcodesForInventoryItemArgs, 'inventoryItemId'>>;
  getBuyRates?: Resolver<Array<ResolversTypes['BuyRateEntry']>, ParentType, ContextType, RequireFields<QuerygetBuyRatesArgs, 'categoryId'>>;
  getCard?: Resolver<ResolversTypes['Card'], ParentType, ContextType, RequireFields<QuerygetCardArgs, 'cardId' | 'game'>>;
  getCronJob?: Resolver<Maybe<ResolversTypes['CronJob']>, ParentType, ContextType, RequireFields<QuerygetCronJobArgs, 'id'>>;
  getCronJobRuns?: Resolver<ResolversTypes['CronJobRunPage'], ParentType, ContextType, RequireFields<QuerygetCronJobRunsArgs, 'cronJobId'>>;
  getCronJobs?: Resolver<Array<ResolversTypes['CronJob']>, ParentType, ContextType>;
  getDashboardBestSellers?: Resolver<Array<ResolversTypes['BestSeller']>, ParentType, ContextType, RequireFields<QuerygetDashboardBestSellersArgs, 'dateRange' | 'organizationId' | 'sortBy'>>;
  getDashboardInventorySummary?: Resolver<ResolversTypes['InventorySummary'], ParentType, ContextType, RequireFields<QuerygetDashboardInventorySummaryArgs, 'organizationId'>>;
  getDashboardOpenOrders?: Resolver<Array<ResolversTypes['OpenOrder']>, ParentType, ContextType, RequireFields<QuerygetDashboardOpenOrdersArgs, 'organizationId'>>;
  getDashboardOrderStatus?: Resolver<ResolversTypes['OrderStatusBreakdown'], ParentType, ContextType, RequireFields<QuerygetDashboardOrderStatusArgs, 'dateRange' | 'organizationId'>>;
  getDashboardSales?: Resolver<ResolversTypes['SalesBreakdown'], ParentType, ContextType, RequireFields<QuerygetDashboardSalesArgs, 'dateRange' | 'organizationId'>>;
  getDataUpdateStatus?: Resolver<ResolversTypes['DataUpdateStatus'], ParentType, ContextType>;
  getDistinctRarities?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType, RequireFields<QuerygetDistinctRaritiesArgs, 'categoryId'>>;
  getEmployeeStoreLocations?: Resolver<Array<ResolversTypes['StoreLocation']>, ParentType, ContextType>;
  getEvent?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<QuerygetEventArgs, 'id'>>;
  getEventRegistrations?: Resolver<Array<ResolversTypes['EventRegistration']>, ParentType, ContextType, RequireFields<QuerygetEventRegistrationsArgs, 'eventId'>>;
  getEvents?: Resolver<ResolversTypes['EventPage'], ParentType, ContextType, Partial<QuerygetEventsArgs>>;
  getIntegrationSettings?: Resolver<ResolversTypes['IntegrationSettings'], ParentType, ContextType>;
  getInventory?: Resolver<ResolversTypes['InventoryPage'], ParentType, ContextType, Partial<QuerygetInventoryArgs>>;
  getInventoryItem?: Resolver<Maybe<ResolversTypes['InventoryItem']>, ParentType, ContextType, RequireFields<QuerygetInventoryItemArgs, 'id'>>;
  getInventoryItemDetails?: Resolver<ResolversTypes['InventoryStockPage'], ParentType, ContextType, RequireFields<QuerygetInventoryItemDetailsArgs, 'inventoryItemId'>>;
  getLot?: Resolver<Maybe<ResolversTypes['Lot']>, ParentType, ContextType, RequireFields<QuerygetLotArgs, 'id'>>;
  getLotStats?: Resolver<ResolversTypes['LotStats'], ParentType, ContextType>;
  getLots?: Resolver<ResolversTypes['LotPage'], ParentType, ContextType, Partial<QuerygetLotsArgs>>;
  getOrders?: Resolver<ResolversTypes['OrderPage'], ParentType, ContextType, Partial<QuerygetOrdersArgs>>;
  getPosConfig?: Resolver<ResolversTypes['PosConfig'], ParentType, ContextType, Partial<QuerygetPosConfigArgs>>;
  getPriceHistory?: Resolver<Array<ResolversTypes['PriceHistoryEntry']>, ParentType, ContextType, RequireFields<QuerygetPriceHistoryArgs, 'productId'>>;
  getProduct?: Resolver<ResolversTypes['ProductDetail'], ParentType, ContextType, RequireFields<QuerygetProductArgs, 'productId'>>;
  getProductListings?: Resolver<ResolversTypes['ProductListingPage'], ParentType, ContextType, Partial<QuerygetProductListingsArgs>>;
  getPublicBuyRates?: Resolver<ResolversTypes['PublicBuyRates'], ParentType, ContextType>;
  getPublicEvent?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<QuerygetPublicEventArgs, 'id'>>;
  getPublicEvents?: Resolver<Array<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<QuerygetPublicEventsArgs, 'dateFrom' | 'dateTo' | 'organizationId'>>;
  getSets?: Resolver<Array<ResolversTypes['Set']>, ParentType, ContextType, RequireFields<QuerygetSetsArgs, 'game'>>;
  getShoppingCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType>;
  getSingleCardInventory?: Resolver<Array<ResolversTypes['Card']>, ParentType, ContextType, RequireFields<QuerygetSingleCardInventoryArgs, 'game'>>;
  getStoreLocation?: Resolver<Maybe<ResolversTypes['StoreLocation']>, ParentType, ContextType, RequireFields<QuerygetStoreLocationArgs, 'id'>>;
  getStoreSettings?: Resolver<ResolversTypes['StoreSettings'], ParentType, ContextType>;
  getSupportedGames?: Resolver<Array<ResolversTypes['SupportedGame']>, ParentType, ContextType>;
  getTransactionLogs?: Resolver<ResolversTypes['TransactionLogPage'], ParentType, ContextType, Partial<QuerygetTransactionLogsArgs>>;
  isSetupPending?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lookupBarcode?: Resolver<Maybe<ResolversTypes['BarcodeLookupResult']>, ParentType, ContextType, RequireFields<QuerylookupBarcodeArgs, 'code'>>;
  lookupSalesTax?: Resolver<ResolversTypes['SalesTaxLookupResult'], ParentType, ContextType, RequireFields<QuerylookupSalesTaxArgs, 'countryCode' | 'stateCode'>>;
  searchProducts?: Resolver<Array<ResolversTypes['ProductSearchResult']>, ParentType, ContextType, RequireFields<QuerysearchProductsArgs, 'searchTerm'>>;
  userPermissions?: Resolver<ResolversTypes['UserPermissions'], ParentType, ContextType>;
};

export type RecurrenceFrequencyResolvers = EnumResolverSignature<{ BIWEEKLY?: any, MONTHLY?: any, WEEKLY?: any }, ResolversTypes['RecurrenceFrequency']>;

export type RecurrenceRuleResolvers<ContextType = any, ParentType extends ResolversParentTypes['RecurrenceRule'] = ResolversParentTypes['RecurrenceRule']> = {
  frequency?: Resolver<ResolversTypes['RecurrenceFrequency'], ParentType, ContextType>;
};

export type RegistrationStatusResolvers = EnumResolverSignature<{ CANCELLED?: any, REGISTERED?: any }, ResolversTypes['RegistrationStatus']>;

export type ResourceTypeResolvers = EnumResolverSignature<{ inventory?: any, lot?: any, order?: any }, ResolversTypes['ResourceType']>;

export type RestoreResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['RestoreResult'] = ResolversParentTypes['RestoreResult']> = {
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type SalesBreakdownResolvers<ContextType = any, ParentType extends ResolversParentTypes['SalesBreakdown'] = ResolversParentTypes['SalesBreakdown']> = {
  dataPoints?: Resolver<Array<ResolversTypes['SalesDataPoint']>, ParentType, ContextType>;
  granularity?: Resolver<ResolversTypes['Granularity'], ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['SalesSummary'], ParentType, ContextType>;
};

export type SalesDataPointResolvers<ContextType = any, ParentType extends ResolversParentTypes['SalesDataPoint'] = ResolversParentTypes['SalesDataPoint']> = {
  cost?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  orderCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  profit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  revenue?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type SalesSummaryResolvers<ContextType = any, ParentType extends ResolversParentTypes['SalesSummary'] = ResolversParentTypes['SalesSummary']> = {
  orderCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  profitMargin?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  totalCost?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalProfit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalRevenue?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
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
  hasPublishableKey?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type SupportedGameResolvers<ContextType = any, ParentType extends ResolversParentTypes['SupportedGame'] = ResolversParentTypes['SupportedGame']> = {
  categoryId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type TerminalConnectionTokenResolvers<ContextType = any, ParentType extends ResolversParentTypes['TerminalConnectionToken'] = ResolversParentTypes['TerminalConnectionToken']> = {
  secret?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type TransactionLogEntryResolvers<ContextType = any, ParentType extends ResolversParentTypes['TransactionLogEntry'] = ResolversParentTypes['TransactionLogEntry']> = {
  action?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  details?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  resourceId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  resourceType?: Resolver<ResolversTypes['ResourceType'], ParentType, ContextType>;
  userEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type TransactionLogPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['TransactionLogPage'] = ResolversParentTypes['TransactionLogPage']> = {
  items?: Resolver<Array<ResolversTypes['TransactionLogEntry']>, ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pageSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type UserPermissionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserPermissions'] = ResolversParentTypes['UserPermissions']> = {
  canAccessSettings?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canManageEvents?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canManageInventory?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canManageLots?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canManageStoreLocations?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canManageUsers?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canUsePOS?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canViewDashboard?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canViewTransactionLog?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  BackupProvider?: BackupProviderResolvers;
  BackupResult?: BackupResultResolvers<ContextType>;
  BackupSettings?: BackupSettingsResolvers<ContextType>;
  Barcode?: BarcodeResolvers<ContextType>;
  BarcodeLookupResult?: BarcodeLookupResultResolvers<ContextType>;
  BestSeller?: BestSellerResolvers<ContextType>;
  BestSellerSortBy?: BestSellerSortByResolvers;
  BuyRateEntry?: BuyRateEntryResolvers<ContextType>;
  BuyRateTable?: BuyRateTableResolvers<ContextType>;
  BuyRateType?: BuyRateTypeResolvers;
  Card?: CardResolvers<ContextType>;
  CardCondition?: CardConditionResolvers;
  CardImages?: CardImagesResolvers<ContextType>;
  CartItemOutput?: CartItemOutputResolvers<ContextType>;
  ConditionInventories?: ConditionInventoriesResolvers<ContextType>;
  ConditionInventory?: ConditionInventoryResolvers<ContextType>;
  CronJob?: CronJobResolvers<ContextType>;
  CronJobRun?: CronJobRunResolvers<ContextType>;
  CronJobRunPage?: CronJobRunPageResolvers<ContextType>;
  DataUpdateResult?: DataUpdateResultResolvers<ContextType>;
  DataUpdateStatus?: DataUpdateStatusResolvers<ContextType>;
  Event?: EventResolvers<ContextType>;
  EventPage?: EventPageResolvers<ContextType>;
  EventRegistration?: EventRegistrationResolvers<ContextType>;
  EventStatus?: EventStatusResolvers;
  EventType?: EventTypeResolvers;
  Granularity?: GranularityResolvers;
  IntegrationSettings?: IntegrationSettingsResolvers<ContextType>;
  InventoryItem?: InventoryItemResolvers<ContextType>;
  InventoryItemStock?: InventoryItemStockResolvers<ContextType>;
  InventoryPage?: InventoryPageResolvers<ContextType>;
  InventoryStockPage?: InventoryStockPageResolvers<ContextType>;
  InventorySummary?: InventorySummaryResolvers<ContextType>;
  Lot?: LotResolvers<ContextType>;
  LotItem?: LotItemResolvers<ContextType>;
  LotPage?: LotPageResolvers<ContextType>;
  LotStats?: LotStatsResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  OpenOrder?: OpenOrderResolvers<ContextType>;
  Order?: OrderResolvers<ContextType>;
  OrderItem?: OrderItemResolvers<ContextType>;
  OrderPage?: OrderPageResolvers<ContextType>;
  OrderStatus?: OrderStatusResolvers;
  OrderStatusBreakdown?: OrderStatusBreakdownResolvers<ContextType>;
  PaymentIntentResult?: PaymentIntentResultResolvers<ContextType>;
  PosConfig?: PosConfigResolvers<ContextType>;
  PriceHistoryEntry?: PriceHistoryEntryResolvers<ContextType>;
  ProductConditionPrice?: ProductConditionPriceResolvers<ContextType>;
  ProductDetail?: ProductDetailResolvers<ContextType>;
  ProductInventoryRecord?: ProductInventoryRecordResolvers<ContextType>;
  ProductListing?: ProductListingResolvers<ContextType>;
  ProductListingPage?: ProductListingPageResolvers<ContextType>;
  ProductPrice?: ProductPriceResolvers<ContextType>;
  ProductSearchResult?: ProductSearchResultResolvers<ContextType>;
  PublicBuyRates?: PublicBuyRatesResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RecurrenceFrequency?: RecurrenceFrequencyResolvers;
  RecurrenceRule?: RecurrenceRuleResolvers<ContextType>;
  RegistrationStatus?: RegistrationStatusResolvers;
  ResourceType?: ResourceTypeResolvers;
  RestoreResult?: RestoreResultResolvers<ContextType>;
  SalesBreakdown?: SalesBreakdownResolvers<ContextType>;
  SalesDataPoint?: SalesDataPointResolvers<ContextType>;
  SalesSummary?: SalesSummaryResolvers<ContextType>;
  SalesTaxLookupResult?: SalesTaxLookupResultResolvers<ContextType>;
  Set?: SetResolvers<ContextType>;
  ShopifyIntegration?: ShopifyIntegrationResolvers<ContextType>;
  ShoppingCart?: ShoppingCartResolvers<ContextType>;
  StoreHours?: StoreHoursResolvers<ContextType>;
  StoreLocation?: StoreLocationResolvers<ContextType>;
  StoreSettings?: StoreSettingsResolvers<ContextType>;
  StripeIntegration?: StripeIntegrationResolvers<ContextType>;
  SupportedGame?: SupportedGameResolvers<ContextType>;
  TerminalConnectionToken?: TerminalConnectionTokenResolvers<ContextType>;
  TransactionLogEntry?: TransactionLogEntryResolvers<ContextType>;
  TransactionLogPage?: TransactionLogPageResolvers<ContextType>;
  UserPermissions?: UserPermissionsResolvers<ContextType>;
};

