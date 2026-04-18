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

export enum BackupProvider {
  Dropbox = 'dropbox',
  GoogleDrive = 'google_drive',
  Onedrive = 'onedrive'
}

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

export enum BestSellerSortBy {
  Quantity = 'quantity',
  Revenue = 'revenue'
}

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

export enum BuyRateType {
  Fixed = 'fixed',
  Percentage = 'percentage'
}

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

export enum CardCondition {
  D = 'D',
  Hp = 'HP',
  Lp = 'LP',
  Mp = 'MP',
  Nm = 'NM'
}

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

export enum EventStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Scheduled = 'SCHEDULED'
}

export enum EventType {
  CasualPlay = 'CASUAL_PLAY',
  Draft = 'DRAFT',
  League = 'LEAGUE',
  Other = 'OTHER',
  Prerelease = 'PRERELEASE',
  ReleaseEvent = 'RELEASE_EVENT',
  Tournament = 'TOURNAMENT'
}

export enum Granularity {
  Day = 'day',
  Hour = 'hour',
  Month = 'month'
}

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
  updateShopifyIntegration: ShopifyIntegration;
  updateStock: InventoryItemStock;
  updateStoreLocation: StoreLocation;
  updateStoreSettings: StoreSettings;
  updateStripeIntegration: StripeIntegration;
};


export type MutationAddBarcodeArgs = {
  input: AddBarcodeInput;
};


export type MutationAddEventRegistrationArgs = {
  eventId: Scalars['Int']['input'];
  input: AdminEventRegistrationInput;
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


export type MutationCancelEventArgs = {
  id: Scalars['Int']['input'];
};


export type MutationCancelEventRegistrationArgs = {
  registrationId: Scalars['Int']['input'];
};


export type MutationCancelOrderArgs = {
  orderId: Scalars['Int']['input'];
};


export type MutationCancelPosPaymentIntentArgs = {
  paymentIntentId: Scalars['String']['input'];
};


export type MutationCancelRecurringSeriesArgs = {
  recurrenceGroupId: Scalars['String']['input'];
};


export type MutationCheckInEventRegistrationArgs = {
  registrationId: Scalars['Int']['input'];
};


export type MutationCompletePosOrderArgs = {
  input: CompletePosOrderInput;
};


export type MutationCreateEventArgs = {
  input: CreateEventInput;
};


export type MutationCreateLotArgs = {
  input: CreateLotInput;
};


export type MutationCreatePosPaymentIntentArgs = {
  amount: Scalars['Int']['input'];
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


export type MutationDisableCronJobArgs = {
  id: Scalars['Int']['input'];
};


export type MutationEnableCronJobArgs = {
  id: Scalars['Int']['input'];
};


export type MutationFirstTimeSetupArgs = {
  company: CompanySettings;
  store: InitialStoreLocation;
  supportedGameCategoryIds: Array<Scalars['Int']['input']>;
  userDetails: UserDetails;
};


export type MutationRegisterForEventArgs = {
  eventId: Scalars['Int']['input'];
  input: PublicEventRegistrationInput;
};


export type MutationRemoveBarcodeArgs = {
  input: RemoveBarcodeInput;
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


export type MutationSubmitPosOrderArgs = {
  input: SubmitPosOrderInput;
};


export type MutationTriggerCronJobArgs = {
  id: Scalars['Int']['input'];
};


export type MutationTriggerRestoreArgs = {
  provider: BackupProvider;
};


export type MutationUpdateBackupSettingsArgs = {
  input: UpdateBackupSettingsInput;
};


export type MutationUpdateCronJobConfigArgs = {
  config: Scalars['String']['input'];
  id: Scalars['Int']['input'];
};


export type MutationUpdateCronJobScheduleArgs = {
  cronExpression: Scalars['String']['input'];
  id: Scalars['Int']['input'];
};


export type MutationUpdateEventArgs = {
  id: Scalars['Int']['input'];
  input: UpdateEventInput;
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
  status: OrderStatus;
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

export enum OrderStatus {
  Cancelled = 'cancelled',
  Completed = 'completed',
  Open = 'open'
}

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


export type QueryGetBarcodesForInventoryItemArgs = {
  inventoryItemId: Scalars['Int']['input'];
};


export type QueryGetBuyRatesArgs = {
  categoryId: Scalars['Int']['input'];
};


export type QueryGetCardArgs = {
  cardId: Scalars['String']['input'];
  game: Scalars['String']['input'];
};


export type QueryGetCronJobArgs = {
  id: Scalars['Int']['input'];
};


export type QueryGetCronJobRunsArgs = {
  cronJobId: Scalars['Int']['input'];
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryGetDashboardBestSellersArgs = {
  dateRange: DashboardDateRange;
  limit?: InputMaybe<Scalars['Int']['input']>;
  organizationId: Scalars['String']['input'];
  sortBy: BestSellerSortBy;
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


export type QueryGetEventArgs = {
  id: Scalars['Int']['input'];
};


export type QueryGetEventRegistrationsArgs = {
  eventId: Scalars['Int']['input'];
};


export type QueryGetEventsArgs = {
  filters?: InputMaybe<EventFilters>;
  pagination?: InputMaybe<PaginationInput>;
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


export type QueryGetPosConfigArgs = {
  stateCode?: InputMaybe<Scalars['String']['input']>;
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


export type QueryGetPublicEventArgs = {
  id: Scalars['Int']['input'];
};


export type QueryGetPublicEventsArgs = {
  dateFrom: Scalars['String']['input'];
  dateTo: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
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


export type QueryLookupBarcodeArgs = {
  code: Scalars['String']['input'];
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

export type RecurrenceRule = {
  __typename?: 'RecurrenceRule';
  frequency: Scalars['String']['output'];
};

export type RecurrenceRuleInput = {
  frequency: Scalars['String']['input'];
};

export enum RegistrationStatus {
  Cancelled = 'CANCELLED',
  Registered = 'REGISTERED'
}

export type RemoveBarcodeInput = {
  id: Scalars['Int']['input'];
};

export enum ResourceType {
  Inventory = 'inventory',
  Lot = 'lot',
  Order = 'order'
}

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
  frequency?: InputMaybe<Scalars['String']['input']>;
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

export type UpdateItemInCartMutationVariables = Exact<{
  cartItem: CartItemInput;
}>;


export type UpdateItemInCartMutation = { __typename?: 'Mutation', updateItemInCart: { __typename?: 'ShoppingCart', items: Array<{ __typename?: 'CartItemOutput', inventoryItemId: number, productId: number, productName: string, condition: CardCondition, quantity: number, unitPrice: number, maxAvailable: number }> } };

export type RemoveFromCartMutationVariables = Exact<{
  cartItem: CartItemInput;
}>;


export type RemoveFromCartMutation = { __typename?: 'Mutation', removeFromCart: { __typename?: 'ShoppingCart', items: Array<{ __typename?: 'CartItemOutput', inventoryItemId: number, productId: number, productName: string, condition: CardCondition, quantity: number, unitPrice: number, maxAvailable: number }> } };

export type SubmitOrderMutationVariables = Exact<{
  input: SubmitOrderInput;
}>;


export type SubmitOrderMutation = { __typename?: 'Mutation', submitOrder: { __typename?: 'Order', id: number, orderNumber: string, customerName: string, totalAmount: number, createdAt: string } };

export type GetShoppingCartQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type GetShoppingCartQueryQuery = { __typename?: 'Query', getShoppingCart: { __typename?: 'ShoppingCart', items: Array<{ __typename?: 'CartItemOutput', inventoryItemId: number, quantity: number, productId: number, productName: string, condition: CardCondition, unitPrice: number, maxAvailable: number }> } };

export type GetAllStoreLocationsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllStoreLocationsQuery = { __typename?: 'Query', getAllStoreLocations: Array<{ __typename?: 'StoreLocation', id: string, name: string, slug: string, city: string, state: string }> };

export type GetEmployeeStoreLocationsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEmployeeStoreLocationsQuery = { __typename?: 'Query', getEmployeeStoreLocations: Array<{ __typename?: 'StoreLocation', id: string, name: string, slug: string, city: string, state: string }> };

export type UserPermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type UserPermissionsQuery = { __typename?: 'Query', userPermissions: { __typename?: 'UserPermissions', canManageInventory: boolean, canManageLots: boolean, canViewDashboard: boolean, canAccessSettings: boolean, canManageStoreLocations: boolean, canManageUsers: boolean, canViewTransactionLog: boolean, canUsePOS: boolean, canManageEvents: boolean } };

export type GetSupportedGamesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSupportedGamesQuery = { __typename?: 'Query', getSupportedGames: Array<{ __typename?: 'SupportedGame', categoryId: number, name: string, displayName: string }> };

export type AddToCartMutationVariables = Exact<{
  cartItem: CartItemInput;
}>;


export type AddToCartMutation = { __typename?: 'Mutation', addToCart: { __typename?: 'ShoppingCart', items: Array<{ __typename?: 'CartItemOutput', inventoryItemId: number, productId: number, productName: string, condition: CardCondition, quantity: number, unitPrice: number, maxAvailable: number }> } };

export type GetPublicBuyRatesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPublicBuyRatesQuery = { __typename?: 'Query', getPublicBuyRates: { __typename?: 'PublicBuyRates', games: Array<{ __typename?: 'BuyRateTable', categoryId: number, gameName: string, gameDisplayName: string, entries: Array<{ __typename?: 'BuyRateEntry', id: number, description: string, fixedRateCents?: number | null, percentageRate?: number | null, type: BuyRateType, sortOrder: number }> }> } };

export type GetEventsQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationInput>;
  filters?: InputMaybe<EventFilters>;
}>;


export type GetEventsQuery = { __typename?: 'Query', getEvents: { __typename?: 'EventPage', totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ __typename?: 'Event', id: number, name: string, eventType: EventType, gameName?: string | null, gameDisplayName?: string | null, startTime: string, endTime?: string | null, capacity?: number | null, status: EventStatus, registrationCount: number, recurrenceGroupId?: string | null, isRecurrenceTemplate: boolean }> } };

export type GetEventQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetEventQuery = { __typename?: 'Query', getEvent?: { __typename?: 'Event', id: number, organizationId: string, name: string, description?: string | null, eventType: EventType, categoryId?: number | null, gameName?: string | null, gameDisplayName?: string | null, startTime: string, endTime?: string | null, capacity?: number | null, entryFeeInCents?: number | null, status: EventStatus, registrationCount: number, recurrenceGroupId?: string | null, isRecurrenceTemplate: boolean, createdAt: string, updatedAt: string, recurrenceRule?: { __typename?: 'RecurrenceRule', frequency: string } | null } | null };

export type GetEventRegistrationsQueryVariables = Exact<{
  eventId: Scalars['Int']['input'];
}>;


export type GetEventRegistrationsQuery = { __typename?: 'Query', getEventRegistrations: Array<{ __typename?: 'EventRegistration', id: number, registrantName: string, registrantEmail?: string | null, registrantPhone?: string | null, status: RegistrationStatus, checkedIn: boolean, checkedInAt?: string | null, createdAt: string }> };

export type CreateEventMutationVariables = Exact<{
  input: CreateEventInput;
}>;


export type CreateEventMutation = { __typename?: 'Mutation', createEvent: { __typename?: 'Event', id: number, name: string, status: EventStatus } };

export type UpdateEventMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  input: UpdateEventInput;
}>;


export type UpdateEventMutation = { __typename?: 'Mutation', updateEvent: { __typename?: 'Event', id: number, name: string, status: EventStatus } };

export type CancelEventMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type CancelEventMutation = { __typename?: 'Mutation', cancelEvent: { __typename?: 'Event', id: number, status: EventStatus } };

export type CancelRecurringSeriesMutationVariables = Exact<{
  recurrenceGroupId: Scalars['String']['input'];
}>;


export type CancelRecurringSeriesMutation = { __typename?: 'Mutation', cancelRecurringSeries: number };

export type AddEventRegistrationMutationVariables = Exact<{
  eventId: Scalars['Int']['input'];
  input: AdminEventRegistrationInput;
}>;


export type AddEventRegistrationMutation = { __typename?: 'Mutation', addEventRegistration: { __typename?: 'EventRegistration', id: number, registrantName: string, status: RegistrationStatus } };

export type CancelEventRegistrationMutationVariables = Exact<{
  registrationId: Scalars['Int']['input'];
}>;


export type CancelEventRegistrationMutation = { __typename?: 'Mutation', cancelEventRegistration: { __typename?: 'EventRegistration', id: number, status: RegistrationStatus } };

export type CheckInEventRegistrationMutationVariables = Exact<{
  registrationId: Scalars['Int']['input'];
}>;


export type CheckInEventRegistrationMutation = { __typename?: 'Mutation', checkInEventRegistration: { __typename?: 'EventRegistration', id: number, checkedIn: boolean, checkedInAt?: string | null } };

export type GetPublicEventsQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  dateFrom: Scalars['String']['input'];
  dateTo: Scalars['String']['input'];
}>;


export type GetPublicEventsQuery = { __typename?: 'Query', getPublicEvents: Array<{ __typename?: 'Event', id: number, name: string, description?: string | null, eventType: EventType, gameName?: string | null, gameDisplayName?: string | null, startTime: string, endTime?: string | null, capacity?: number | null, entryFeeInCents?: number | null, status: EventStatus, registrationCount: number }> };

export type RegisterForEventMutationVariables = Exact<{
  eventId: Scalars['Int']['input'];
  input: PublicEventRegistrationInput;
}>;


export type RegisterForEventMutation = { __typename?: 'Mutation', registerForEvent: { __typename?: 'EventRegistration', id: number, registrantName: string, status: RegistrationStatus } };

export type GetAvailableGamesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAvailableGamesQuery = { __typename?: 'Query', getAvailableGames: Array<{ __typename?: 'SupportedGame', categoryId: number, name: string, displayName: string }> };

export type FirstTimeSetupMutationMutationVariables = Exact<{
  userDetails: UserDetails;
  company: CompanySettings;
  store: InitialStoreLocation;
  supportedGameCategoryIds: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
}>;


export type FirstTimeSetupMutationMutation = { __typename?: 'Mutation', firstTimeSetup: string };

export type GetInventoryQueryVariables = Exact<{
  filters?: InputMaybe<InventoryFilters>;
  pagination?: InputMaybe<PaginationInput>;
}>;


export type GetInventoryQuery = { __typename?: 'Query', getInventory: { __typename?: 'InventoryPage', totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ __typename?: 'InventoryItem', id: number, productId: number, productName: string, gameName: string, setName: string, rarity?: string | null, isSingle: boolean, isSealed: boolean, condition: CardCondition, price: number, totalQuantity: number, entryCount: number }> } };

export type GetInventoryItemQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetInventoryItemQuery = { __typename?: 'Query', getInventoryItem?: { __typename?: 'InventoryItem', id: number, productId: number, productName: string, gameName: string, setName: string, rarity?: string | null, isSingle: boolean, isSealed: boolean, condition: CardCondition, price: number, totalQuantity: number, entryCount: number } | null };

export type GetInventoryItemDetailsQueryVariables = Exact<{
  inventoryItemId: Scalars['Int']['input'];
  pagination?: InputMaybe<PaginationInput>;
}>;


export type GetInventoryItemDetailsQuery = { __typename?: 'Query', getInventoryItemDetails: { __typename?: 'InventoryStockPage', totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ __typename?: 'InventoryItemStock', id: number, inventoryItemId: number, quantity: number, costBasis: number, acquisitionDate: string, notes?: string | null, createdAt: string, updatedAt: string }> } };

export type SearchProductsQueryVariables = Exact<{
  searchTerm: Scalars['String']['input'];
  game?: InputMaybe<Scalars['String']['input']>;
}>;


export type SearchProductsQuery = { __typename?: 'Query', searchProducts: Array<{ __typename?: 'ProductSearchResult', id: number, name: string, gameName: string, setName: string, rarity?: string | null, imageUrl?: string | null, isSingle: boolean, isSealed: boolean, prices: Array<{ __typename?: 'ProductPrice', subTypeName: string, lowPrice?: number | null, midPrice?: number | null, highPrice?: number | null, marketPrice?: number | null, directLowPrice?: number | null }> }> };

export type AddInventoryItemMutationVariables = Exact<{
  input: AddInventoryItemInput;
}>;


export type AddInventoryItemMutation = { __typename?: 'Mutation', addInventoryItem: { __typename?: 'InventoryItem', id: number, productId: number, productName: string, gameName: string, setName: string, rarity?: string | null, condition: CardCondition, price: number, totalQuantity: number, entryCount: number } };

export type UpdateInventoryItemMutationVariables = Exact<{
  input: UpdateInventoryItemInput;
}>;


export type UpdateInventoryItemMutation = { __typename?: 'Mutation', updateInventoryItem: { __typename?: 'InventoryItem', id: number, productId: number, productName: string, condition: CardCondition, price: number, totalQuantity: number, entryCount: number } };

export type DeleteInventoryItemMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteInventoryItemMutation = { __typename?: 'Mutation', deleteInventoryItem: boolean };

export type AddStockMutationVariables = Exact<{
  input: AddStockInput;
}>;


export type AddStockMutation = { __typename?: 'Mutation', addStock: { __typename?: 'InventoryItemStock', id: number, inventoryItemId: number, quantity: number, costBasis: number, acquisitionDate: string, notes?: string | null } };

export type UpdateStockMutationVariables = Exact<{
  input: UpdateStockInput;
}>;


export type UpdateStockMutation = { __typename?: 'Mutation', updateStock: { __typename?: 'InventoryItemStock', id: number, inventoryItemId: number, quantity: number, costBasis: number, acquisitionDate: string, notes?: string | null } };

export type DeleteStockMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteStockMutation = { __typename?: 'Mutation', deleteStock: boolean };

export type BulkUpdateStockMutationVariables = Exact<{
  input: BulkUpdateStockInput;
}>;


export type BulkUpdateStockMutation = { __typename?: 'Mutation', bulkUpdateStock: Array<{ __typename?: 'InventoryItemStock', id: number }> };

export type BulkDeleteStockMutationVariables = Exact<{
  input: BulkDeleteStockInput;
}>;


export type BulkDeleteStockMutation = { __typename?: 'Mutation', bulkDeleteStock: boolean };

export type GetBarcodesForInventoryItemQueryVariables = Exact<{
  inventoryItemId: Scalars['Int']['input'];
}>;


export type GetBarcodesForInventoryItemQuery = { __typename?: 'Query', getBarcodesForInventoryItem: Array<{ __typename?: 'Barcode', id: number, code: string, inventoryItemId: number, createdAt: string }> };

export type AddBarcodeMutationVariables = Exact<{
  input: AddBarcodeInput;
}>;


export type AddBarcodeMutation = { __typename?: 'Mutation', addBarcode: { __typename?: 'Barcode', id: number, code: string, inventoryItemId: number, createdAt: string } };

export type RemoveBarcodeMutationVariables = Exact<{
  input: RemoveBarcodeInput;
}>;


export type RemoveBarcodeMutation = { __typename?: 'Mutation', removeBarcode: boolean };

export type SearchProductsForLotQueryVariables = Exact<{
  searchTerm: Scalars['String']['input'];
  isSingle?: InputMaybe<Scalars['Boolean']['input']>;
  isSealed?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type SearchProductsForLotQuery = { __typename?: 'Query', searchProducts: Array<{ __typename?: 'ProductSearchResult', id: number, name: string, gameName: string, setName: string, rarity?: string | null, imageUrl?: string | null, isSingle: boolean, isSealed: boolean, prices: Array<{ __typename?: 'ProductPrice', subTypeName: string, marketPrice?: number | null, midPrice?: number | null }> }> };

export type GetLotQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetLotQuery = { __typename?: 'Query', getLot?: { __typename?: 'Lot', id: number, name: string, description?: string | null, amountPaid: number, acquisitionDate: string, totalMarketValue: number, totalCost: number, projectedProfitLoss: number, projectedProfitMargin: number, items: Array<{ __typename?: 'LotItem', id: number, productId: number, productName: string, gameName: string, setName: string, rarity?: string | null, isSingle: boolean, isSealed: boolean, condition?: CardCondition | null, quantity: number, costBasis: number, costOverridden: boolean, marketValue?: number | null }> } | null };

export type CreateLotMutationVariables = Exact<{
  input: CreateLotInput;
}>;


export type CreateLotMutation = { __typename?: 'Mutation', createLot: { __typename?: 'Lot', id: number } };

export type UpdateLotMutationVariables = Exact<{
  input: UpdateLotInput;
}>;


export type UpdateLotMutation = { __typename?: 'Mutation', updateLot: { __typename?: 'Lot', id: number } };

export type GetLotsQueryVariables = Exact<{
  filters?: InputMaybe<LotFilters>;
  pagination?: InputMaybe<PaginationInput>;
}>;


export type GetLotsQuery = { __typename?: 'Query', getLots: { __typename?: 'LotPage', totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ __typename?: 'Lot', id: number, name: string, description?: string | null, amountPaid: number, acquisitionDate: string, totalMarketValue: number, totalCost: number, projectedProfitLoss: number, projectedProfitMargin: number, createdAt: string, items: Array<{ __typename?: 'LotItem', id: number }> }> } };

export type DeleteLotMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteLotMutation = { __typename?: 'Mutation', deleteLot: boolean };

export type GetLotStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLotStatsQuery = { __typename?: 'Query', getLotStats: { __typename?: 'LotStats', totalLots: number, totalInvested: number, totalMarketValue: number, totalProfitLoss: number } };

export type GetOrdersQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationInput>;
  filters?: InputMaybe<OrderFilters>;
}>;


export type GetOrdersQuery = { __typename?: 'Query', getOrders: { __typename?: 'OrderPage', totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ __typename?: 'Order', id: number, orderNumber: string, customerName: string, status: OrderStatus, totalAmount: number, totalCostBasis?: number | null, totalProfit?: number | null, createdAt: string, items: Array<{ __typename?: 'OrderItem', id: number, productId: number, productName: string, condition: CardCondition, quantity: number, unitPrice: number, costBasis?: number | null, profit?: number | null, lotId?: number | null }> }> } };

export type CancelOrderMutationVariables = Exact<{
  orderId: Scalars['Int']['input'];
}>;


export type CancelOrderMutation = { __typename?: 'Mutation', cancelOrder: { __typename?: 'Order', id: number, orderNumber: string, customerName: string, status: OrderStatus, totalAmount: number, totalCostBasis?: number | null, totalProfit?: number | null, createdAt: string, items: Array<{ __typename?: 'OrderItem', id: number, productId: number, productName: string, condition: CardCondition, quantity: number, unitPrice: number, costBasis?: number | null, profit?: number | null }> } };

export type UpdateOrderStatusMutationVariables = Exact<{
  orderId: Scalars['Int']['input'];
  status: OrderStatus;
}>;


export type UpdateOrderStatusMutation = { __typename?: 'Mutation', updateOrderStatus: { __typename?: 'Order', id: number, orderNumber: string, customerName: string, status: OrderStatus, totalAmount: number, totalCostBasis?: number | null, totalProfit?: number | null, createdAt: string, items: Array<{ __typename?: 'OrderItem', id: number, productId: number, productName: string, condition: CardCondition, quantity: number, unitPrice: number, costBasis?: number | null, profit?: number | null }> } };

export type LookupBarcodeQueryVariables = Exact<{
  code: Scalars['String']['input'];
}>;


export type LookupBarcodeQuery = { __typename?: 'Query', lookupBarcode?: { __typename?: 'BarcodeLookupResult', inventoryItemId: number, productName: string, gameName: string, setName: string, condition: CardCondition, price: number, availableQuantity: number, imageUrl?: string | null } | null };

export type PosGetInventoryQueryVariables = Exact<{
  filters?: InputMaybe<InventoryFilters>;
  pagination?: InputMaybe<PaginationInput>;
}>;


export type PosGetInventoryQuery = { __typename?: 'Query', getInventory: { __typename?: 'InventoryPage', items: Array<{ __typename?: 'InventoryItem', id: number, productId: number, productName: string, gameName: string, condition: CardCondition, price: number, totalQuantity: number }> } };

export type GetOpenOrdersQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationInput>;
  filters?: InputMaybe<OrderFilters>;
}>;


export type GetOpenOrdersQuery = { __typename?: 'Query', getOrders: { __typename?: 'OrderPage', items: Array<{ __typename?: 'Order', id: number, orderNumber: string, customerName: string, totalAmount: number, createdAt: string, items: Array<{ __typename?: 'OrderItem', id: number, productId: number, productName: string, condition: CardCondition, quantity: number, unitPrice: number }> }> } };

export type GetPosConfigQueryVariables = Exact<{
  stateCode?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetPosConfigQuery = { __typename?: 'Query', getPosConfig: { __typename?: 'PosConfig', taxRate: number, stripeEnabled: boolean, stripePublishableKey?: string | null } };

export type SubmitPosOrderMutationVariables = Exact<{
  input: SubmitPosOrderInput;
}>;


export type SubmitPosOrderMutation = { __typename?: 'Mutation', submitPosOrder: { __typename?: 'Order', id: number, orderNumber: string, totalAmount: number, taxAmount?: number | null, paymentMethod?: string | null, status: OrderStatus } };

export type CompletePosOrderMutationVariables = Exact<{
  input: CompletePosOrderInput;
}>;


export type CompletePosOrderMutation = { __typename?: 'Mutation', completePosOrder: { __typename?: 'Order', id: number, orderNumber: string, totalAmount: number, taxAmount?: number | null, paymentMethod?: string | null, status: OrderStatus } };

export type CreatePosPaymentIntentMutationVariables = Exact<{
  amount: Scalars['Int']['input'];
}>;


export type CreatePosPaymentIntentMutation = { __typename?: 'Mutation', createPosPaymentIntent: { __typename?: 'PaymentIntentResult', clientSecret: string, paymentIntentId: string } };

export type GetProductQueryVariables = Exact<{
  productId: Scalars['String']['input'];
}>;


export type GetProductQuery = { __typename?: 'Query', getProduct: { __typename?: 'ProductDetail', id: string, name: string, setName: string, gameName: string, rarity?: string | null, type?: string | null, text?: string | null, flavorText?: string | null, finishes: Array<string>, isSingle: boolean, isSealed: boolean, images?: { __typename?: 'CardImages', small?: string | null, large?: string | null } | null, inventoryRecords: Array<{ __typename?: 'ProductInventoryRecord', inventoryItemId: number, condition: CardCondition, quantity: number, price: number }> } };

export type GetSealedProductListingsQueryVariables = Exact<{
  filters?: InputMaybe<ProductListingFilters>;
  pagination?: InputMaybe<ProductListingPagination>;
}>;


export type GetSealedProductListingsQuery = { __typename?: 'Query', getProductListings: { __typename?: 'ProductListingPage', totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ __typename?: 'ProductListing', id: string, name: string, setName: string, gameName: string, finishes: Array<string>, totalQuantity: number, lowestPrice?: number | null, lowestPriceInventoryItemId?: number | null, images?: { __typename?: 'CardImages', small?: string | null, large?: string | null } | null }> } };

export type GetSealedSetsQueryVariables = Exact<{
  game: Scalars['String']['input'];
  filters?: InputMaybe<SetFilters>;
}>;


export type GetSealedSetsQuery = { __typename?: 'Query', getSets: Array<{ __typename?: 'Set', code: string, name: string }> };

export type GetSinglesProductListingsQueryVariables = Exact<{
  filters?: InputMaybe<ProductListingFilters>;
  pagination?: InputMaybe<ProductListingPagination>;
}>;


export type GetSinglesProductListingsQuery = { __typename?: 'Query', getProductListings: { __typename?: 'ProductListingPage', totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ __typename?: 'ProductListing', id: string, name: string, setName: string, gameName: string, rarity?: string | null, finishes: Array<string>, totalQuantity: number, lowestPrice?: number | null, images?: { __typename?: 'CardImages', small?: string | null, large?: string | null } | null, conditionPrices: Array<{ __typename?: 'ProductConditionPrice', inventoryItemId: number, condition: CardCondition, quantity: number, price: number }> }> } };

export type GetSinglesSetsQueryVariables = Exact<{
  game: Scalars['String']['input'];
  filters?: InputMaybe<SetFilters>;
}>;


export type GetSinglesSetsQuery = { __typename?: 'Query', getSets: Array<{ __typename?: 'Set', code: string, name: string }> };

export type GetBackupSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBackupSettingsQuery = { __typename?: 'Query', getBackupSettings: { __typename?: 'BackupSettings', provider?: BackupProvider | null, frequency?: string | null, lastBackupAt?: string | null, googleDriveConnected: boolean, dropboxConnected: boolean, onedriveConnected: boolean } };

export type UpdateBackupSettingsMutationVariables = Exact<{
  input: UpdateBackupSettingsInput;
}>;


export type UpdateBackupSettingsMutation = { __typename?: 'Mutation', updateBackupSettings: { __typename?: 'BackupSettings', provider?: BackupProvider | null, frequency?: string | null, lastBackupAt?: string | null, googleDriveConnected: boolean, dropboxConnected: boolean, onedriveConnected: boolean } };

export type TriggerBackupMutationVariables = Exact<{ [key: string]: never; }>;


export type TriggerBackupMutation = { __typename?: 'Mutation', triggerBackup: { __typename?: 'BackupResult', success: boolean, message?: string | null, timestamp?: string | null } };

export type TriggerRestoreMutationVariables = Exact<{
  provider: BackupProvider;
}>;


export type TriggerRestoreMutation = { __typename?: 'Mutation', triggerRestore: { __typename?: 'RestoreResult', success: boolean, message?: string | null } };

export type GetBuyRatesQueryVariables = Exact<{
  categoryId: Scalars['Int']['input'];
}>;


export type GetBuyRatesQuery = { __typename?: 'Query', getBuyRates: Array<{ __typename?: 'BuyRateEntry', id: number, description: string, fixedRateCents?: number | null, percentageRate?: number | null, type: BuyRateType, rarity?: string | null, hidden: boolean, sortOrder: number }> };

export type GetDistinctRaritiesQueryVariables = Exact<{
  categoryId: Scalars['Int']['input'];
}>;


export type GetDistinctRaritiesQuery = { __typename?: 'Query', getDistinctRarities: Array<string> };

export type SaveBuyRatesMutationVariables = Exact<{
  input: SaveBuyRatesInput;
}>;


export type SaveBuyRatesMutation = { __typename?: 'Mutation', saveBuyRates: Array<{ __typename?: 'BuyRateEntry', id: number, description: string, fixedRateCents?: number | null, percentageRate?: number | null, type: BuyRateType, rarity?: string | null, hidden: boolean, sortOrder: number }> };

export type GetDashboardSalesQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  dateRange: DashboardDateRange;
}>;


export type GetDashboardSalesQuery = { __typename?: 'Query', getDashboardSales: { __typename?: 'SalesBreakdown', granularity: Granularity, summary: { __typename?: 'SalesSummary', totalRevenue: number, totalCost: number, totalProfit: number, profitMargin: number, orderCount: number }, dataPoints: Array<{ __typename?: 'SalesDataPoint', label: string, revenue: number, cost: number, profit: number, orderCount: number }> } };

export type GetDashboardBestSellersQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  dateRange: DashboardDateRange;
  sortBy: BestSellerSortBy;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetDashboardBestSellersQuery = { __typename?: 'Query', getDashboardBestSellers: Array<{ __typename?: 'BestSeller', productId: number, productName: string, totalQuantity: number, totalRevenue: number }> };

export type GetDashboardInventorySummaryQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type GetDashboardInventorySummaryQuery = { __typename?: 'Query', getDashboardInventorySummary: { __typename?: 'InventorySummary', totalSkus: number, totalUnits: number, totalCostValue: number, totalRetailValue: number } };

export type GetDashboardOrderStatusQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
  dateRange: DashboardDateRange;
}>;


export type GetDashboardOrderStatusQuery = { __typename?: 'Query', getDashboardOrderStatus: { __typename?: 'OrderStatusBreakdown', open: number, completed: number, cancelled: number, total: number } };

export type GetDataUpdateStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDataUpdateStatusQuery = { __typename?: 'Query', getDataUpdateStatus: { __typename?: 'DataUpdateStatus', currentVersion?: string | null, latestVersion?: string | null, updateAvailable: boolean, isUpdating: boolean } };

export type TriggerDataUpdateMutationVariables = Exact<{ [key: string]: never; }>;


export type TriggerDataUpdateMutation = { __typename?: 'Mutation', triggerDataUpdate: { __typename?: 'DataUpdateResult', success: boolean, message?: string | null, newVersion?: string | null } };

export type GetStoreSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetStoreSettingsQuery = { __typename?: 'Query', getStoreSettings: { __typename?: 'StoreSettings', companyName?: string | null, ein?: string | null } };

export type UpdateStoreSettingsMutationVariables = Exact<{
  input: UpdateStoreSettingsInput;
}>;


export type UpdateStoreSettingsMutation = { __typename?: 'Mutation', updateStoreSettings: { __typename?: 'StoreSettings', companyName?: string | null, ein?: string | null } };

export type GetAvailableGamesForSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAvailableGamesForSettingsQuery = { __typename?: 'Query', getAvailableGames: Array<{ __typename?: 'SupportedGame', categoryId: number, name: string, displayName: string }> };

export type SetSupportedGamesMutationVariables = Exact<{
  categoryIds: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
}>;


export type SetSupportedGamesMutation = { __typename?: 'Mutation', setSupportedGames: Array<{ __typename?: 'SupportedGame', categoryId: number, name: string, displayName: string }> };

export type GetIntegrationSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetIntegrationSettingsQuery = { __typename?: 'Query', getIntegrationSettings: { __typename?: 'IntegrationSettings', stripe: { __typename?: 'StripeIntegration', enabled: boolean, hasApiKey: boolean, hasPublishableKey: boolean }, shopify: { __typename?: 'ShopifyIntegration', enabled: boolean, hasApiKey: boolean, shopDomain?: string | null } } };

export type UpdateStripeIntegrationMutationVariables = Exact<{
  input: UpdateStripeIntegrationInput;
}>;


export type UpdateStripeIntegrationMutation = { __typename?: 'Mutation', updateStripeIntegration: { __typename?: 'StripeIntegration', enabled: boolean, hasApiKey: boolean, hasPublishableKey: boolean } };

export type UpdateShopifyIntegrationMutationVariables = Exact<{
  input: UpdateShopifyIntegrationInput;
}>;


export type UpdateShopifyIntegrationMutation = { __typename?: 'Mutation', updateShopifyIntegration: { __typename?: 'ShopifyIntegration', enabled: boolean, hasApiKey: boolean, shopDomain?: string | null } };

export type GetAllStoreLocationsAdminQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllStoreLocationsAdminQuery = { __typename?: 'Query', getEmployeeStoreLocations: Array<{ __typename?: 'StoreLocation', id: string, name: string, slug: string, street1: string, street2?: string | null, city: string, state: string, zip: string, phone?: string | null, createdAt: string, hours: Array<{ __typename?: 'StoreHours', dayOfWeek: number, openTime?: string | null, closeTime?: string | null }> }> };

export type AddStoreLocationMutationVariables = Exact<{
  input: AddStoreLocationInput;
}>;


export type AddStoreLocationMutation = { __typename?: 'Mutation', addStoreLocation: { __typename?: 'StoreLocation', id: string, name: string, slug: string, street1: string, street2?: string | null, city: string, state: string, zip: string, phone?: string | null, createdAt: string, hours: Array<{ __typename?: 'StoreHours', dayOfWeek: number, openTime?: string | null, closeTime?: string | null }> } };

export type UpdateStoreLocationMutationVariables = Exact<{
  input: UpdateStoreLocationInput;
}>;


export type UpdateStoreLocationMutation = { __typename?: 'Mutation', updateStoreLocation: { __typename?: 'StoreLocation', id: string, name: string, slug: string, street1: string, street2?: string | null, city: string, state: string, zip: string, phone?: string | null, createdAt: string, hours: Array<{ __typename?: 'StoreHours', dayOfWeek: number, openTime?: string | null, closeTime?: string | null }> } };

export type RemoveStoreLocationMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type RemoveStoreLocationMutation = { __typename?: 'Mutation', removeStoreLocation: boolean };

export type GetCronJobsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCronJobsQuery = { __typename?: 'Query', getCronJobs: Array<{ __typename?: 'CronJob', id: number, name: string, displayName: string, description?: string | null, cronExpression: string, enabled: boolean, lastRunAt?: string | null, lastRunStatus?: string | null, lastRunDurationMs?: number | null, lastRunError?: string | null, nextRunAt?: string | null, config?: string | null }> };

export type GetCronJobRunsQueryVariables = Exact<{
  cronJobId: Scalars['Int']['input'];
  pagination?: InputMaybe<PaginationInput>;
}>;


export type GetCronJobRunsQuery = { __typename?: 'Query', getCronJobRuns: { __typename?: 'CronJobRunPage', totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ __typename?: 'CronJobRun', id: number, startedAt: string, completedAt?: string | null, durationMs?: number | null, status: string, error?: string | null, summary?: string | null }> } };

export type TriggerCronJobMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type TriggerCronJobMutation = { __typename?: 'Mutation', triggerCronJob: { __typename?: 'CronJobRun', id: number, status: string, summary?: string | null, error?: string | null, durationMs?: number | null } };

export type EnableCronJobMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type EnableCronJobMutation = { __typename?: 'Mutation', enableCronJob: { __typename?: 'CronJob', id: number, enabled: boolean } };

export type DisableCronJobMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DisableCronJobMutation = { __typename?: 'Mutation', disableCronJob: { __typename?: 'CronJob', id: number, enabled: boolean } };

export type UpdateCronJobScheduleMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  cronExpression: Scalars['String']['input'];
}>;


export type UpdateCronJobScheduleMutation = { __typename?: 'Mutation', updateCronJobSchedule: { __typename?: 'CronJob', id: number, cronExpression: string, nextRunAt?: string | null } };

export type GetTransactionLogsQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationInput>;
  filters?: InputMaybe<TransactionLogFilters>;
}>;


export type GetTransactionLogsQuery = { __typename?: 'Query', getTransactionLogs: { __typename?: 'TransactionLogPage', totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ __typename?: 'TransactionLogEntry', id: number, action: string, resourceType: ResourceType, resourceId?: string | null, details: string, userName: string, userEmail: string, createdAt: string }> } };

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

export const UpdateItemInCartDocument = new TypedDocumentString(`
    mutation UpdateItemInCart($cartItem: CartItemInput!) {
  updateItemInCart(cartItem: $cartItem) {
    items {
      inventoryItemId
      productId
      productName
      condition
      quantity
      unitPrice
      maxAvailable
    }
  }
}
    `) as unknown as TypedDocumentString<UpdateItemInCartMutation, UpdateItemInCartMutationVariables>;
export const RemoveFromCartDocument = new TypedDocumentString(`
    mutation RemoveFromCart($cartItem: CartItemInput!) {
  removeFromCart(cartItem: $cartItem) {
    items {
      inventoryItemId
      productId
      productName
      condition
      quantity
      unitPrice
      maxAvailable
    }
  }
}
    `) as unknown as TypedDocumentString<RemoveFromCartMutation, RemoveFromCartMutationVariables>;
export const SubmitOrderDocument = new TypedDocumentString(`
    mutation SubmitOrder($input: SubmitOrderInput!) {
  submitOrder(input: $input) {
    id
    orderNumber
    customerName
    totalAmount
    createdAt
  }
}
    `) as unknown as TypedDocumentString<SubmitOrderMutation, SubmitOrderMutationVariables>;
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
export const GetAllStoreLocationsDocument = new TypedDocumentString(`
    query GetAllStoreLocations {
  getAllStoreLocations {
    id
    name
    slug
    city
    state
  }
}
    `) as unknown as TypedDocumentString<GetAllStoreLocationsQuery, GetAllStoreLocationsQueryVariables>;
export const GetEmployeeStoreLocationsDocument = new TypedDocumentString(`
    query GetEmployeeStoreLocations {
  getEmployeeStoreLocations {
    id
    name
    slug
    city
    state
  }
}
    `) as unknown as TypedDocumentString<GetEmployeeStoreLocationsQuery, GetEmployeeStoreLocationsQueryVariables>;
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
    canUsePOS
    canManageEvents
  }
}
    `) as unknown as TypedDocumentString<UserPermissionsQuery, UserPermissionsQueryVariables>;
export const GetSupportedGamesDocument = new TypedDocumentString(`
    query GetSupportedGames {
  getSupportedGames {
    categoryId
    name
    displayName
  }
}
    `) as unknown as TypedDocumentString<GetSupportedGamesQuery, GetSupportedGamesQueryVariables>;
export const AddToCartDocument = new TypedDocumentString(`
    mutation AddToCart($cartItem: CartItemInput!) {
  addToCart(cartItem: $cartItem) {
    items {
      inventoryItemId
      productId
      productName
      condition
      quantity
      unitPrice
      maxAvailable
    }
  }
}
    `) as unknown as TypedDocumentString<AddToCartMutation, AddToCartMutationVariables>;
export const GetPublicBuyRatesDocument = new TypedDocumentString(`
    query GetPublicBuyRates {
  getPublicBuyRates {
    games {
      categoryId
      gameName
      gameDisplayName
      entries {
        id
        description
        fixedRateCents
        percentageRate
        type
        sortOrder
      }
    }
  }
}
    `) as unknown as TypedDocumentString<GetPublicBuyRatesQuery, GetPublicBuyRatesQueryVariables>;
export const GetEventsDocument = new TypedDocumentString(`
    query GetEvents($pagination: PaginationInput, $filters: EventFilters) {
  getEvents(pagination: $pagination, filters: $filters) {
    items {
      id
      name
      eventType
      gameName
      gameDisplayName
      startTime
      endTime
      capacity
      status
      registrationCount
      recurrenceGroupId
      isRecurrenceTemplate
    }
    totalCount
    page
    pageSize
    totalPages
  }
}
    `) as unknown as TypedDocumentString<GetEventsQuery, GetEventsQueryVariables>;
export const GetEventDocument = new TypedDocumentString(`
    query GetEvent($id: Int!) {
  getEvent(id: $id) {
    id
    organizationId
    name
    description
    eventType
    categoryId
    gameName
    gameDisplayName
    startTime
    endTime
    capacity
    entryFeeInCents
    status
    registrationCount
    recurrenceRule {
      frequency
    }
    recurrenceGroupId
    isRecurrenceTemplate
    createdAt
    updatedAt
  }
}
    `) as unknown as TypedDocumentString<GetEventQuery, GetEventQueryVariables>;
export const GetEventRegistrationsDocument = new TypedDocumentString(`
    query GetEventRegistrations($eventId: Int!) {
  getEventRegistrations(eventId: $eventId) {
    id
    registrantName
    registrantEmail
    registrantPhone
    status
    checkedIn
    checkedInAt
    createdAt
  }
}
    `) as unknown as TypedDocumentString<GetEventRegistrationsQuery, GetEventRegistrationsQueryVariables>;
export const CreateEventDocument = new TypedDocumentString(`
    mutation CreateEvent($input: CreateEventInput!) {
  createEvent(input: $input) {
    id
    name
    status
  }
}
    `) as unknown as TypedDocumentString<CreateEventMutation, CreateEventMutationVariables>;
export const UpdateEventDocument = new TypedDocumentString(`
    mutation UpdateEvent($id: Int!, $input: UpdateEventInput!) {
  updateEvent(id: $id, input: $input) {
    id
    name
    status
  }
}
    `) as unknown as TypedDocumentString<UpdateEventMutation, UpdateEventMutationVariables>;
export const CancelEventDocument = new TypedDocumentString(`
    mutation CancelEvent($id: Int!) {
  cancelEvent(id: $id) {
    id
    status
  }
}
    `) as unknown as TypedDocumentString<CancelEventMutation, CancelEventMutationVariables>;
export const CancelRecurringSeriesDocument = new TypedDocumentString(`
    mutation CancelRecurringSeries($recurrenceGroupId: String!) {
  cancelRecurringSeries(recurrenceGroupId: $recurrenceGroupId)
}
    `) as unknown as TypedDocumentString<CancelRecurringSeriesMutation, CancelRecurringSeriesMutationVariables>;
export const AddEventRegistrationDocument = new TypedDocumentString(`
    mutation AddEventRegistration($eventId: Int!, $input: AdminEventRegistrationInput!) {
  addEventRegistration(eventId: $eventId, input: $input) {
    id
    registrantName
    status
  }
}
    `) as unknown as TypedDocumentString<AddEventRegistrationMutation, AddEventRegistrationMutationVariables>;
export const CancelEventRegistrationDocument = new TypedDocumentString(`
    mutation CancelEventRegistration($registrationId: Int!) {
  cancelEventRegistration(registrationId: $registrationId) {
    id
    status
  }
}
    `) as unknown as TypedDocumentString<CancelEventRegistrationMutation, CancelEventRegistrationMutationVariables>;
export const CheckInEventRegistrationDocument = new TypedDocumentString(`
    mutation CheckInEventRegistration($registrationId: Int!) {
  checkInEventRegistration(registrationId: $registrationId) {
    id
    checkedIn
    checkedInAt
  }
}
    `) as unknown as TypedDocumentString<CheckInEventRegistrationMutation, CheckInEventRegistrationMutationVariables>;
export const GetPublicEventsDocument = new TypedDocumentString(`
    query GetPublicEvents($organizationId: String!, $dateFrom: String!, $dateTo: String!) {
  getPublicEvents(
    organizationId: $organizationId
    dateFrom: $dateFrom
    dateTo: $dateTo
  ) {
    id
    name
    description
    eventType
    gameName
    gameDisplayName
    startTime
    endTime
    capacity
    entryFeeInCents
    status
    registrationCount
  }
}
    `) as unknown as TypedDocumentString<GetPublicEventsQuery, GetPublicEventsQueryVariables>;
export const RegisterForEventDocument = new TypedDocumentString(`
    mutation RegisterForEvent($eventId: Int!, $input: PublicEventRegistrationInput!) {
  registerForEvent(eventId: $eventId, input: $input) {
    id
    registrantName
    status
  }
}
    `) as unknown as TypedDocumentString<RegisterForEventMutation, RegisterForEventMutationVariables>;
export const GetAvailableGamesDocument = new TypedDocumentString(`
    query GetAvailableGames {
  getAvailableGames {
    categoryId
    name
    displayName
  }
}
    `) as unknown as TypedDocumentString<GetAvailableGamesQuery, GetAvailableGamesQueryVariables>;
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
export const GetInventoryDocument = new TypedDocumentString(`
    query GetInventory($filters: InventoryFilters, $pagination: PaginationInput) {
  getInventory(filters: $filters, pagination: $pagination) {
    items {
      id
      productId
      productName
      gameName
      setName
      rarity
      isSingle
      isSealed
      condition
      price
      totalQuantity
      entryCount
    }
    totalCount
    page
    pageSize
    totalPages
  }
}
    `) as unknown as TypedDocumentString<GetInventoryQuery, GetInventoryQueryVariables>;
export const GetInventoryItemDocument = new TypedDocumentString(`
    query GetInventoryItem($id: Int!) {
  getInventoryItem(id: $id) {
    id
    productId
    productName
    gameName
    setName
    rarity
    isSingle
    isSealed
    condition
    price
    totalQuantity
    entryCount
  }
}
    `) as unknown as TypedDocumentString<GetInventoryItemQuery, GetInventoryItemQueryVariables>;
export const GetInventoryItemDetailsDocument = new TypedDocumentString(`
    query GetInventoryItemDetails($inventoryItemId: Int!, $pagination: PaginationInput) {
  getInventoryItemDetails(
    inventoryItemId: $inventoryItemId
    pagination: $pagination
  ) {
    items {
      id
      inventoryItemId
      quantity
      costBasis
      acquisitionDate
      notes
      createdAt
      updatedAt
    }
    totalCount
    page
    pageSize
    totalPages
  }
}
    `) as unknown as TypedDocumentString<GetInventoryItemDetailsQuery, GetInventoryItemDetailsQueryVariables>;
export const SearchProductsDocument = new TypedDocumentString(`
    query SearchProducts($searchTerm: String!, $game: String) {
  searchProducts(searchTerm: $searchTerm, game: $game) {
    id
    name
    gameName
    setName
    rarity
    imageUrl
    isSingle
    isSealed
    prices {
      subTypeName
      lowPrice
      midPrice
      highPrice
      marketPrice
      directLowPrice
    }
  }
}
    `) as unknown as TypedDocumentString<SearchProductsQuery, SearchProductsQueryVariables>;
export const AddInventoryItemDocument = new TypedDocumentString(`
    mutation AddInventoryItem($input: AddInventoryItemInput!) {
  addInventoryItem(input: $input) {
    id
    productId
    productName
    gameName
    setName
    rarity
    condition
    price
    totalQuantity
    entryCount
  }
}
    `) as unknown as TypedDocumentString<AddInventoryItemMutation, AddInventoryItemMutationVariables>;
export const UpdateInventoryItemDocument = new TypedDocumentString(`
    mutation UpdateInventoryItem($input: UpdateInventoryItemInput!) {
  updateInventoryItem(input: $input) {
    id
    productId
    productName
    condition
    price
    totalQuantity
    entryCount
  }
}
    `) as unknown as TypedDocumentString<UpdateInventoryItemMutation, UpdateInventoryItemMutationVariables>;
export const DeleteInventoryItemDocument = new TypedDocumentString(`
    mutation DeleteInventoryItem($id: Int!) {
  deleteInventoryItem(id: $id)
}
    `) as unknown as TypedDocumentString<DeleteInventoryItemMutation, DeleteInventoryItemMutationVariables>;
export const AddStockDocument = new TypedDocumentString(`
    mutation AddStock($input: AddStockInput!) {
  addStock(input: $input) {
    id
    inventoryItemId
    quantity
    costBasis
    acquisitionDate
    notes
  }
}
    `) as unknown as TypedDocumentString<AddStockMutation, AddStockMutationVariables>;
export const UpdateStockDocument = new TypedDocumentString(`
    mutation UpdateStock($input: UpdateStockInput!) {
  updateStock(input: $input) {
    id
    inventoryItemId
    quantity
    costBasis
    acquisitionDate
    notes
  }
}
    `) as unknown as TypedDocumentString<UpdateStockMutation, UpdateStockMutationVariables>;
export const DeleteStockDocument = new TypedDocumentString(`
    mutation DeleteStock($id: Int!) {
  deleteStock(id: $id)
}
    `) as unknown as TypedDocumentString<DeleteStockMutation, DeleteStockMutationVariables>;
export const BulkUpdateStockDocument = new TypedDocumentString(`
    mutation BulkUpdateStock($input: BulkUpdateStockInput!) {
  bulkUpdateStock(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<BulkUpdateStockMutation, BulkUpdateStockMutationVariables>;
export const BulkDeleteStockDocument = new TypedDocumentString(`
    mutation BulkDeleteStock($input: BulkDeleteStockInput!) {
  bulkDeleteStock(input: $input)
}
    `) as unknown as TypedDocumentString<BulkDeleteStockMutation, BulkDeleteStockMutationVariables>;
export const GetBarcodesForInventoryItemDocument = new TypedDocumentString(`
    query GetBarcodesForInventoryItem($inventoryItemId: Int!) {
  getBarcodesForInventoryItem(inventoryItemId: $inventoryItemId) {
    id
    code
    inventoryItemId
    createdAt
  }
}
    `) as unknown as TypedDocumentString<GetBarcodesForInventoryItemQuery, GetBarcodesForInventoryItemQueryVariables>;
export const AddBarcodeDocument = new TypedDocumentString(`
    mutation AddBarcode($input: AddBarcodeInput!) {
  addBarcode(input: $input) {
    id
    code
    inventoryItemId
    createdAt
  }
}
    `) as unknown as TypedDocumentString<AddBarcodeMutation, AddBarcodeMutationVariables>;
export const RemoveBarcodeDocument = new TypedDocumentString(`
    mutation RemoveBarcode($input: RemoveBarcodeInput!) {
  removeBarcode(input: $input)
}
    `) as unknown as TypedDocumentString<RemoveBarcodeMutation, RemoveBarcodeMutationVariables>;
export const SearchProductsForLotDocument = new TypedDocumentString(`
    query SearchProductsForLot($searchTerm: String!, $isSingle: Boolean, $isSealed: Boolean) {
  searchProducts(
    searchTerm: $searchTerm
    isSingle: $isSingle
    isSealed: $isSealed
  ) {
    id
    name
    gameName
    setName
    rarity
    imageUrl
    isSingle
    isSealed
    prices {
      subTypeName
      marketPrice
      midPrice
    }
  }
}
    `) as unknown as TypedDocumentString<SearchProductsForLotQuery, SearchProductsForLotQueryVariables>;
export const GetLotDocument = new TypedDocumentString(`
    query GetLot($id: Int!) {
  getLot(id: $id) {
    id
    name
    description
    amountPaid
    acquisitionDate
    items {
      id
      productId
      productName
      gameName
      setName
      rarity
      isSingle
      isSealed
      condition
      quantity
      costBasis
      costOverridden
      marketValue
    }
    totalMarketValue
    totalCost
    projectedProfitLoss
    projectedProfitMargin
  }
}
    `) as unknown as TypedDocumentString<GetLotQuery, GetLotQueryVariables>;
export const CreateLotDocument = new TypedDocumentString(`
    mutation CreateLot($input: CreateLotInput!) {
  createLot(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<CreateLotMutation, CreateLotMutationVariables>;
export const UpdateLotDocument = new TypedDocumentString(`
    mutation UpdateLot($input: UpdateLotInput!) {
  updateLot(input: $input) {
    id
  }
}
    `) as unknown as TypedDocumentString<UpdateLotMutation, UpdateLotMutationVariables>;
export const GetLotsDocument = new TypedDocumentString(`
    query GetLots($filters: LotFilters, $pagination: PaginationInput) {
  getLots(filters: $filters, pagination: $pagination) {
    items {
      id
      name
      description
      amountPaid
      acquisitionDate
      totalMarketValue
      totalCost
      projectedProfitLoss
      projectedProfitMargin
      createdAt
      items {
        id
      }
    }
    totalCount
    page
    pageSize
    totalPages
  }
}
    `) as unknown as TypedDocumentString<GetLotsQuery, GetLotsQueryVariables>;
export const DeleteLotDocument = new TypedDocumentString(`
    mutation DeleteLot($id: Int!) {
  deleteLot(id: $id)
}
    `) as unknown as TypedDocumentString<DeleteLotMutation, DeleteLotMutationVariables>;
export const GetLotStatsDocument = new TypedDocumentString(`
    query GetLotStats {
  getLotStats {
    totalLots
    totalInvested
    totalMarketValue
    totalProfitLoss
  }
}
    `) as unknown as TypedDocumentString<GetLotStatsQuery, GetLotStatsQueryVariables>;
export const GetOrdersDocument = new TypedDocumentString(`
    query GetOrders($pagination: PaginationInput, $filters: OrderFilters) {
  getOrders(pagination: $pagination, filters: $filters) {
    items {
      id
      orderNumber
      customerName
      status
      totalAmount
      totalCostBasis
      totalProfit
      createdAt
      items {
        id
        productId
        productName
        condition
        quantity
        unitPrice
        costBasis
        profit
        lotId
      }
    }
    totalCount
    page
    pageSize
    totalPages
  }
}
    `) as unknown as TypedDocumentString<GetOrdersQuery, GetOrdersQueryVariables>;
export const CancelOrderDocument = new TypedDocumentString(`
    mutation CancelOrder($orderId: Int!) {
  cancelOrder(orderId: $orderId) {
    id
    orderNumber
    customerName
    status
    totalAmount
    totalCostBasis
    totalProfit
    createdAt
    items {
      id
      productId
      productName
      condition
      quantity
      unitPrice
      costBasis
      profit
    }
  }
}
    `) as unknown as TypedDocumentString<CancelOrderMutation, CancelOrderMutationVariables>;
export const UpdateOrderStatusDocument = new TypedDocumentString(`
    mutation UpdateOrderStatus($orderId: Int!, $status: OrderStatus!) {
  updateOrderStatus(orderId: $orderId, status: $status) {
    id
    orderNumber
    customerName
    status
    totalAmount
    totalCostBasis
    totalProfit
    createdAt
    items {
      id
      productId
      productName
      condition
      quantity
      unitPrice
      costBasis
      profit
    }
  }
}
    `) as unknown as TypedDocumentString<UpdateOrderStatusMutation, UpdateOrderStatusMutationVariables>;
export const LookupBarcodeDocument = new TypedDocumentString(`
    query LookupBarcode($code: String!) {
  lookupBarcode(code: $code) {
    inventoryItemId
    productName
    gameName
    setName
    condition
    price
    availableQuantity
    imageUrl
  }
}
    `) as unknown as TypedDocumentString<LookupBarcodeQuery, LookupBarcodeQueryVariables>;
export const PosGetInventoryDocument = new TypedDocumentString(`
    query POSGetInventory($filters: InventoryFilters, $pagination: PaginationInput) {
  getInventory(filters: $filters, pagination: $pagination) {
    items {
      id
      productId
      productName
      gameName
      condition
      price
      totalQuantity
    }
  }
}
    `) as unknown as TypedDocumentString<PosGetInventoryQuery, PosGetInventoryQueryVariables>;
export const GetOpenOrdersDocument = new TypedDocumentString(`
    query GetOpenOrders($pagination: PaginationInput, $filters: OrderFilters) {
  getOrders(pagination: $pagination, filters: $filters) {
    items {
      id
      orderNumber
      customerName
      totalAmount
      createdAt
      items {
        id
        productId
        productName
        condition
        quantity
        unitPrice
      }
    }
  }
}
    `) as unknown as TypedDocumentString<GetOpenOrdersQuery, GetOpenOrdersQueryVariables>;
export const GetPosConfigDocument = new TypedDocumentString(`
    query GetPosConfig($stateCode: String) {
  getPosConfig(stateCode: $stateCode) {
    taxRate
    stripeEnabled
    stripePublishableKey
  }
}
    `) as unknown as TypedDocumentString<GetPosConfigQuery, GetPosConfigQueryVariables>;
export const SubmitPosOrderDocument = new TypedDocumentString(`
    mutation SubmitPosOrder($input: SubmitPosOrderInput!) {
  submitPosOrder(input: $input) {
    id
    orderNumber
    totalAmount
    taxAmount
    paymentMethod
    status
  }
}
    `) as unknown as TypedDocumentString<SubmitPosOrderMutation, SubmitPosOrderMutationVariables>;
export const CompletePosOrderDocument = new TypedDocumentString(`
    mutation CompletePosOrder($input: CompletePosOrderInput!) {
  completePosOrder(input: $input) {
    id
    orderNumber
    totalAmount
    taxAmount
    paymentMethod
    status
  }
}
    `) as unknown as TypedDocumentString<CompletePosOrderMutation, CompletePosOrderMutationVariables>;
export const CreatePosPaymentIntentDocument = new TypedDocumentString(`
    mutation CreatePosPaymentIntent($amount: Int!) {
  createPosPaymentIntent(amount: $amount) {
    clientSecret
    paymentIntentId
  }
}
    `) as unknown as TypedDocumentString<CreatePosPaymentIntentMutation, CreatePosPaymentIntentMutationVariables>;
export const GetProductDocument = new TypedDocumentString(`
    query GetProduct($productId: String!) {
  getProduct(productId: $productId) {
    id
    name
    setName
    gameName
    rarity
    type
    text
    flavorText
    finishes
    isSingle
    isSealed
    images {
      small
      large
    }
    inventoryRecords {
      inventoryItemId
      condition
      quantity
      price
    }
  }
}
    `) as unknown as TypedDocumentString<GetProductQuery, GetProductQueryVariables>;
export const GetSealedProductListingsDocument = new TypedDocumentString(`
    query GetSealedProductListings($filters: ProductListingFilters, $pagination: ProductListingPagination) {
  getProductListings(filters: $filters, pagination: $pagination) {
    items {
      id
      name
      setName
      gameName
      finishes
      images {
        small
        large
      }
      totalQuantity
      lowestPrice
      lowestPriceInventoryItemId
    }
    totalCount
    page
    pageSize
    totalPages
  }
}
    `) as unknown as TypedDocumentString<GetSealedProductListingsQuery, GetSealedProductListingsQueryVariables>;
export const GetSealedSetsDocument = new TypedDocumentString(`
    query GetSealedSets($game: String!, $filters: SetFilters) {
  getSets(game: $game, filters: $filters) {
    code
    name
  }
}
    `) as unknown as TypedDocumentString<GetSealedSetsQuery, GetSealedSetsQueryVariables>;
export const GetSinglesProductListingsDocument = new TypedDocumentString(`
    query GetSinglesProductListings($filters: ProductListingFilters, $pagination: ProductListingPagination) {
  getProductListings(filters: $filters, pagination: $pagination) {
    items {
      id
      name
      setName
      gameName
      rarity
      finishes
      images {
        small
        large
      }
      totalQuantity
      lowestPrice
      conditionPrices {
        inventoryItemId
        condition
        quantity
        price
      }
    }
    totalCount
    page
    pageSize
    totalPages
  }
}
    `) as unknown as TypedDocumentString<GetSinglesProductListingsQuery, GetSinglesProductListingsQueryVariables>;
export const GetSinglesSetsDocument = new TypedDocumentString(`
    query GetSinglesSets($game: String!, $filters: SetFilters) {
  getSets(game: $game, filters: $filters) {
    code
    name
  }
}
    `) as unknown as TypedDocumentString<GetSinglesSetsQuery, GetSinglesSetsQueryVariables>;
export const GetBackupSettingsDocument = new TypedDocumentString(`
    query GetBackupSettings {
  getBackupSettings {
    provider
    frequency
    lastBackupAt
    googleDriveConnected
    dropboxConnected
    onedriveConnected
  }
}
    `) as unknown as TypedDocumentString<GetBackupSettingsQuery, GetBackupSettingsQueryVariables>;
export const UpdateBackupSettingsDocument = new TypedDocumentString(`
    mutation UpdateBackupSettings($input: UpdateBackupSettingsInput!) {
  updateBackupSettings(input: $input) {
    provider
    frequency
    lastBackupAt
    googleDriveConnected
    dropboxConnected
    onedriveConnected
  }
}
    `) as unknown as TypedDocumentString<UpdateBackupSettingsMutation, UpdateBackupSettingsMutationVariables>;
export const TriggerBackupDocument = new TypedDocumentString(`
    mutation TriggerBackup {
  triggerBackup {
    success
    message
    timestamp
  }
}
    `) as unknown as TypedDocumentString<TriggerBackupMutation, TriggerBackupMutationVariables>;
export const TriggerRestoreDocument = new TypedDocumentString(`
    mutation TriggerRestore($provider: BackupProvider!) {
  triggerRestore(provider: $provider) {
    success
    message
  }
}
    `) as unknown as TypedDocumentString<TriggerRestoreMutation, TriggerRestoreMutationVariables>;
export const GetBuyRatesDocument = new TypedDocumentString(`
    query GetBuyRates($categoryId: Int!) {
  getBuyRates(categoryId: $categoryId) {
    id
    description
    fixedRateCents
    percentageRate
    type
    rarity
    hidden
    sortOrder
  }
}
    `) as unknown as TypedDocumentString<GetBuyRatesQuery, GetBuyRatesQueryVariables>;
export const GetDistinctRaritiesDocument = new TypedDocumentString(`
    query GetDistinctRarities($categoryId: Int!) {
  getDistinctRarities(categoryId: $categoryId)
}
    `) as unknown as TypedDocumentString<GetDistinctRaritiesQuery, GetDistinctRaritiesQueryVariables>;
export const SaveBuyRatesDocument = new TypedDocumentString(`
    mutation SaveBuyRates($input: SaveBuyRatesInput!) {
  saveBuyRates(input: $input) {
    id
    description
    fixedRateCents
    percentageRate
    type
    rarity
    hidden
    sortOrder
  }
}
    `) as unknown as TypedDocumentString<SaveBuyRatesMutation, SaveBuyRatesMutationVariables>;
export const GetDashboardSalesDocument = new TypedDocumentString(`
    query GetDashboardSales($organizationId: String!, $dateRange: DashboardDateRange!) {
  getDashboardSales(organizationId: $organizationId, dateRange: $dateRange) {
    summary {
      totalRevenue
      totalCost
      totalProfit
      profitMargin
      orderCount
    }
    dataPoints {
      label
      revenue
      cost
      profit
      orderCount
    }
    granularity
  }
}
    `) as unknown as TypedDocumentString<GetDashboardSalesQuery, GetDashboardSalesQueryVariables>;
export const GetDashboardBestSellersDocument = new TypedDocumentString(`
    query GetDashboardBestSellers($organizationId: String!, $dateRange: DashboardDateRange!, $sortBy: BestSellerSortBy!, $limit: Int) {
  getDashboardBestSellers(
    organizationId: $organizationId
    dateRange: $dateRange
    sortBy: $sortBy
    limit: $limit
  ) {
    productId
    productName
    totalQuantity
    totalRevenue
  }
}
    `) as unknown as TypedDocumentString<GetDashboardBestSellersQuery, GetDashboardBestSellersQueryVariables>;
export const GetDashboardInventorySummaryDocument = new TypedDocumentString(`
    query GetDashboardInventorySummary($organizationId: String!) {
  getDashboardInventorySummary(organizationId: $organizationId) {
    totalSkus
    totalUnits
    totalCostValue
    totalRetailValue
  }
}
    `) as unknown as TypedDocumentString<GetDashboardInventorySummaryQuery, GetDashboardInventorySummaryQueryVariables>;
export const GetDashboardOrderStatusDocument = new TypedDocumentString(`
    query GetDashboardOrderStatus($organizationId: String!, $dateRange: DashboardDateRange!) {
  getDashboardOrderStatus(organizationId: $organizationId, dateRange: $dateRange) {
    open
    completed
    cancelled
    total
  }
}
    `) as unknown as TypedDocumentString<GetDashboardOrderStatusQuery, GetDashboardOrderStatusQueryVariables>;
export const GetDataUpdateStatusDocument = new TypedDocumentString(`
    query GetDataUpdateStatus {
  getDataUpdateStatus {
    currentVersion
    latestVersion
    updateAvailable
    isUpdating
  }
}
    `) as unknown as TypedDocumentString<GetDataUpdateStatusQuery, GetDataUpdateStatusQueryVariables>;
export const TriggerDataUpdateDocument = new TypedDocumentString(`
    mutation TriggerDataUpdate {
  triggerDataUpdate {
    success
    message
    newVersion
  }
}
    `) as unknown as TypedDocumentString<TriggerDataUpdateMutation, TriggerDataUpdateMutationVariables>;
export const GetStoreSettingsDocument = new TypedDocumentString(`
    query GetStoreSettings {
  getStoreSettings {
    companyName
    ein
  }
}
    `) as unknown as TypedDocumentString<GetStoreSettingsQuery, GetStoreSettingsQueryVariables>;
export const UpdateStoreSettingsDocument = new TypedDocumentString(`
    mutation UpdateStoreSettings($input: UpdateStoreSettingsInput!) {
  updateStoreSettings(input: $input) {
    companyName
    ein
  }
}
    `) as unknown as TypedDocumentString<UpdateStoreSettingsMutation, UpdateStoreSettingsMutationVariables>;
export const GetAvailableGamesForSettingsDocument = new TypedDocumentString(`
    query GetAvailableGamesForSettings {
  getAvailableGames {
    categoryId
    name
    displayName
  }
}
    `) as unknown as TypedDocumentString<GetAvailableGamesForSettingsQuery, GetAvailableGamesForSettingsQueryVariables>;
export const SetSupportedGamesDocument = new TypedDocumentString(`
    mutation SetSupportedGames($categoryIds: [Int!]!) {
  setSupportedGames(categoryIds: $categoryIds) {
    categoryId
    name
    displayName
  }
}
    `) as unknown as TypedDocumentString<SetSupportedGamesMutation, SetSupportedGamesMutationVariables>;
export const GetIntegrationSettingsDocument = new TypedDocumentString(`
    query GetIntegrationSettings {
  getIntegrationSettings {
    stripe {
      enabled
      hasApiKey
      hasPublishableKey
    }
    shopify {
      enabled
      hasApiKey
      shopDomain
    }
  }
}
    `) as unknown as TypedDocumentString<GetIntegrationSettingsQuery, GetIntegrationSettingsQueryVariables>;
export const UpdateStripeIntegrationDocument = new TypedDocumentString(`
    mutation UpdateStripeIntegration($input: UpdateStripeIntegrationInput!) {
  updateStripeIntegration(input: $input) {
    enabled
    hasApiKey
    hasPublishableKey
  }
}
    `) as unknown as TypedDocumentString<UpdateStripeIntegrationMutation, UpdateStripeIntegrationMutationVariables>;
export const UpdateShopifyIntegrationDocument = new TypedDocumentString(`
    mutation UpdateShopifyIntegration($input: UpdateShopifyIntegrationInput!) {
  updateShopifyIntegration(input: $input) {
    enabled
    hasApiKey
    shopDomain
  }
}
    `) as unknown as TypedDocumentString<UpdateShopifyIntegrationMutation, UpdateShopifyIntegrationMutationVariables>;
export const GetAllStoreLocationsAdminDocument = new TypedDocumentString(`
    query GetAllStoreLocationsAdmin {
  getEmployeeStoreLocations {
    id
    name
    slug
    street1
    street2
    city
    state
    zip
    phone
    hours {
      dayOfWeek
      openTime
      closeTime
    }
    createdAt
  }
}
    `) as unknown as TypedDocumentString<GetAllStoreLocationsAdminQuery, GetAllStoreLocationsAdminQueryVariables>;
export const AddStoreLocationDocument = new TypedDocumentString(`
    mutation AddStoreLocation($input: AddStoreLocationInput!) {
  addStoreLocation(input: $input) {
    id
    name
    slug
    street1
    street2
    city
    state
    zip
    phone
    hours {
      dayOfWeek
      openTime
      closeTime
    }
    createdAt
  }
}
    `) as unknown as TypedDocumentString<AddStoreLocationMutation, AddStoreLocationMutationVariables>;
export const UpdateStoreLocationDocument = new TypedDocumentString(`
    mutation UpdateStoreLocation($input: UpdateStoreLocationInput!) {
  updateStoreLocation(input: $input) {
    id
    name
    slug
    street1
    street2
    city
    state
    zip
    phone
    hours {
      dayOfWeek
      openTime
      closeTime
    }
    createdAt
  }
}
    `) as unknown as TypedDocumentString<UpdateStoreLocationMutation, UpdateStoreLocationMutationVariables>;
export const RemoveStoreLocationDocument = new TypedDocumentString(`
    mutation RemoveStoreLocation($id: String!) {
  removeStoreLocation(id: $id)
}
    `) as unknown as TypedDocumentString<RemoveStoreLocationMutation, RemoveStoreLocationMutationVariables>;
export const GetCronJobsDocument = new TypedDocumentString(`
    query GetCronJobs {
  getCronJobs {
    id
    name
    displayName
    description
    cronExpression
    enabled
    lastRunAt
    lastRunStatus
    lastRunDurationMs
    lastRunError
    nextRunAt
    config
  }
}
    `) as unknown as TypedDocumentString<GetCronJobsQuery, GetCronJobsQueryVariables>;
export const GetCronJobRunsDocument = new TypedDocumentString(`
    query GetCronJobRuns($cronJobId: Int!, $pagination: PaginationInput) {
  getCronJobRuns(cronJobId: $cronJobId, pagination: $pagination) {
    items {
      id
      startedAt
      completedAt
      durationMs
      status
      error
      summary
    }
    totalCount
    page
    pageSize
    totalPages
  }
}
    `) as unknown as TypedDocumentString<GetCronJobRunsQuery, GetCronJobRunsQueryVariables>;
export const TriggerCronJobDocument = new TypedDocumentString(`
    mutation TriggerCronJob($id: Int!) {
  triggerCronJob(id: $id) {
    id
    status
    summary
    error
    durationMs
  }
}
    `) as unknown as TypedDocumentString<TriggerCronJobMutation, TriggerCronJobMutationVariables>;
export const EnableCronJobDocument = new TypedDocumentString(`
    mutation EnableCronJob($id: Int!) {
  enableCronJob(id: $id) {
    id
    enabled
  }
}
    `) as unknown as TypedDocumentString<EnableCronJobMutation, EnableCronJobMutationVariables>;
export const DisableCronJobDocument = new TypedDocumentString(`
    mutation DisableCronJob($id: Int!) {
  disableCronJob(id: $id) {
    id
    enabled
  }
}
    `) as unknown as TypedDocumentString<DisableCronJobMutation, DisableCronJobMutationVariables>;
export const UpdateCronJobScheduleDocument = new TypedDocumentString(`
    mutation UpdateCronJobSchedule($id: Int!, $cronExpression: String!) {
  updateCronJobSchedule(id: $id, cronExpression: $cronExpression) {
    id
    cronExpression
    nextRunAt
  }
}
    `) as unknown as TypedDocumentString<UpdateCronJobScheduleMutation, UpdateCronJobScheduleMutationVariables>;
export const GetTransactionLogsDocument = new TypedDocumentString(`
    query GetTransactionLogs($pagination: PaginationInput, $filters: TransactionLogFilters) {
  getTransactionLogs(pagination: $pagination, filters: $filters) {
    items {
      id
      action
      resourceType
      resourceId
      details
      userName
      userEmail
      createdAt
    }
    totalCount
    page
    pageSize
    totalPages
  }
}
    `) as unknown as TypedDocumentString<GetTransactionLogsQuery, GetTransactionLogsQueryVariables>;
export const IsSetupPendingDocument = new TypedDocumentString(`
    query IsSetupPending {
  isSetupPending
}
    `) as unknown as TypedDocumentString<IsSetupPendingQuery, IsSetupPendingQueryVariables>;