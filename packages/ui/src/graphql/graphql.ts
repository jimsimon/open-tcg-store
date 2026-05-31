/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type AddBarcodeInput = {
  code: string;
  inventoryItemId: number;
};

export type AddInventoryItemInput = {
  acquisitionDate: string;
  barcodes?: Array<string> | null | undefined;
  condition: CardCondition;
  costBasis: number;
  notes?: string | null | undefined;
  price: number;
  productId: number;
  quantity: number;
};

export type AddStockInput = {
  acquisitionDate: string;
  costBasis: number;
  inventoryItemId: number;
  notes?: string | null | undefined;
  quantity: number;
};

export type AddStoreLocationInput = {
  city: string;
  hours?: Array<StoreHoursInput> | null | undefined;
  name: string;
  phone?: string | null | undefined;
  slug: string;
  state: string;
  street1: string;
  street2?: string | null | undefined;
  zip: string;
};

export type AdminEventRegistrationInput = {
  registrantEmail?: string | null | undefined;
  registrantName: string;
  registrantPhone?: string | null | undefined;
};

export type BackupProvider =
  | 'dropbox'
  | 'google_drive'
  | 'onedrive';

export type BestSellerSortBy =
  | 'quantity'
  | 'revenue';

export type BulkDeleteStockInput = {
  ids: Array<number>;
};

export type BulkUpdateStockInput = {
  acquisitionDate?: string | null | undefined;
  costBasis?: number | null | undefined;
  ids: Array<number>;
  notes?: string | null | undefined;
  quantity?: number | null | undefined;
};

export type BuyRateEntryInput = {
  description: string;
  fixedRateCents?: number | null | undefined;
  hidden?: boolean | null | undefined;
  percentageRate?: number | null | undefined;
  rarity?: string | null | undefined;
  sortOrder: number;
  type: BuyRateType;
};

export type BuyRateType =
  | 'fixed'
  | 'percentage';

export type CardCondition =
  | 'D'
  | 'HP'
  | 'LP'
  | 'MP'
  | 'NM';

export type CartItemInput = {
  inventoryItemId: number;
  quantity: number;
};

export type CompanySettings = {
  companyName: string;
  ein: string;
};

export type CompletePosOrderInput = {
  newItems?: Array<PosLineItemInput> | null | undefined;
  orderId: number;
  paymentMethod: string;
  stripePaymentIntentId?: string | null | undefined;
  taxAmount: number;
};

export type CreateEventInput = {
  capacity?: number | null | undefined;
  categoryId?: number | null | undefined;
  description?: string | null | undefined;
  endTime?: string | null | undefined;
  entryFeeInCents?: number | null | undefined;
  eventType: EventType;
  name: string;
  recurrenceRule?: RecurrenceRuleInput | null | undefined;
  startTime: string;
};

export type CreateLotInput = {
  acquisitionDate: string;
  amountPaid: number;
  description?: string | null | undefined;
  items: Array<LotItemInput>;
  name: string;
};

export type DashboardDateRange = {
  endDate: string;
  startDate: string;
};

export type EventFilters = {
  categoryId?: number | null | undefined;
  dateFrom?: string | null | undefined;
  dateTo?: string | null | undefined;
  eventType?: EventType | null | undefined;
  status?: EventStatus | null | undefined;
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
  city: string;
  name: string;
  phone?: string | null | undefined;
  slug: string;
  state: string;
  street1: string;
  street2?: string | null | undefined;
  zip: string;
};

export type InventoryFilters = {
  condition?: CardCondition | null | undefined;
  gameName?: string | null | undefined;
  includeSealed?: boolean | null | undefined;
  includeSingles?: boolean | null | undefined;
  organizationId?: string | null | undefined;
  rarity?: string | null | undefined;
  searchTerm?: string | null | undefined;
  setName?: string | null | undefined;
};

export type LotFilters = {
  searchTerm?: string | null | undefined;
};

export type LotItemInput = {
  condition?: CardCondition | null | undefined;
  costBasis: number;
  costOverridden: boolean;
  id?: number | null | undefined;
  productId: number;
  quantity: number;
};

export type OrderFilters = {
  organizationId?: string | null | undefined;
  searchTerm?: string | null | undefined;
  status?: OrderStatus | null | undefined;
};

export type OrderStatus =
  | 'cancelled'
  | 'completed'
  | 'open';

export type PaginationInput = {
  page?: number | null | undefined;
  pageSize?: number | null | undefined;
};

export type PosLineItemInput = {
  inventoryItemId: number;
  quantity: number;
};

export type ProductListingFilters = {
  condition?: CardCondition | null | undefined;
  gameName?: string | null | undefined;
  inStockOnly?: boolean | null | undefined;
  includeSealed?: boolean | null | undefined;
  includeSingles?: boolean | null | undefined;
  searchTerm?: string | null | undefined;
  setCode?: string | null | undefined;
};

export type ProductListingPagination = {
  page?: number | null | undefined;
  pageSize?: number | null | undefined;
};

export type PublicEventRegistrationInput = {
  registrantEmail?: string | null | undefined;
  registrantName: string;
  registrantPhone?: string | null | undefined;
};

export type RecurrenceFrequency =
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'WEEKLY';

export type RecurrenceRuleInput = {
  frequency: RecurrenceFrequency;
};

export type RegistrationStatus =
  | 'CANCELLED'
  | 'REGISTERED';

export type RemoveBarcodeInput = {
  id: number;
};

export type ResourceType =
  | 'inventory'
  | 'lot'
  | 'order';

export type SaveBuyRatesInput = {
  categoryId: number;
  entries: Array<BuyRateEntryInput>;
};

export type SetFilters = {
  searchTerm?: string | null | undefined;
};

export type StoreHoursInput = {
  closeTime?: string | null | undefined;
  dayOfWeek: number;
  openTime?: string | null | undefined;
};

export type SubmitOrderInput = {
  customerName: string;
  organizationId: string;
};

export type SubmitPosOrderInput = {
  customerName: string;
  items: Array<PosLineItemInput>;
  paymentMethod: string;
  stripePaymentIntentId?: string | null | undefined;
  taxAmount: number;
};

export type TransactionLogFilters = {
  action?: string | null | undefined;
  month?: number | null | undefined;
  resourceType?: ResourceType | null | undefined;
  searchTerm?: string | null | undefined;
  year?: number | null | undefined;
};

export type UpdateBackupSettingsInput = {
  dropboxClientId?: string | null | undefined;
  frequency?: string | null | undefined;
  googleDriveClientId?: string | null | undefined;
  onedriveClientId?: string | null | undefined;
  provider?: BackupProvider | null | undefined;
};

export type UpdateEventInput = {
  capacity?: number | null | undefined;
  categoryId?: number | null | undefined;
  description?: string | null | undefined;
  endTime?: string | null | undefined;
  entryFeeInCents?: number | null | undefined;
  eventType?: EventType | null | undefined;
  name?: string | null | undefined;
  startTime?: string | null | undefined;
};

export type UpdateInventoryItemInput = {
  condition?: CardCondition | null | undefined;
  id: number;
  price?: number | null | undefined;
};

export type UpdateLotInput = {
  acquisitionDate: string;
  amountPaid: number;
  description?: string | null | undefined;
  id: number;
  items: Array<LotItemInput>;
  name: string;
};

export type UpdateShopifyIntegrationInput = {
  apiKey?: string | null | undefined;
  enabled?: boolean | null | undefined;
  shopDomain?: string | null | undefined;
};

export type UpdateStockInput = {
  acquisitionDate?: string | null | undefined;
  costBasis?: number | null | undefined;
  id: number;
  notes?: string | null | undefined;
  quantity?: number | null | undefined;
};

export type UpdateStoreLocationInput = {
  city?: string | null | undefined;
  hours?: Array<StoreHoursInput> | null | undefined;
  id: string;
  name?: string | null | undefined;
  phone?: string | null | undefined;
  state?: string | null | undefined;
  street1?: string | null | undefined;
  street2?: string | null | undefined;
  zip?: string | null | undefined;
};

export type UpdateStoreSettingsInput = {
  companyName?: string | null | undefined;
  ein?: string | null | undefined;
};

export type UpdateStripeIntegrationInput = {
  apiKey?: string | null | undefined;
  enabled?: boolean | null | undefined;
  publishableKey?: string | null | undefined;
};

export type UserDetails = {
  email: string;
  firstName: string;
  password: string;
};

export type UpdateItemInCartMutationVariables = Exact<{
  cartItem: CartItemInput;
}>;


export type UpdateItemInCartMutation = { updateItemInCart: { items: Array<{ inventoryItemId: number, productId: number, productName: string, condition: CardCondition, quantity: number, unitPrice: number, maxAvailable: number }> } };

export type RemoveFromCartMutationVariables = Exact<{
  cartItem: CartItemInput;
}>;


export type RemoveFromCartMutation = { removeFromCart: { items: Array<{ inventoryItemId: number, productId: number, productName: string, condition: CardCondition, quantity: number, unitPrice: number, maxAvailable: number }> } };

export type SubmitOrderMutationVariables = Exact<{
  input: SubmitOrderInput;
}>;


export type SubmitOrderMutation = { submitOrder: { id: number, orderNumber: string, customerName: string, totalAmount: number, createdAt: string } };

export type GetShoppingCartQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type GetShoppingCartQueryQuery = { getShoppingCart: { items: Array<{ inventoryItemId: number, quantity: number, productId: number, productName: string, condition: CardCondition, unitPrice: number, maxAvailable: number }> } };

export type GetAllStoreLocationsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllStoreLocationsQuery = { getAllStoreLocations: Array<{ id: string, name: string, slug: string, city: string, state: string }> };

export type GetEmployeeStoreLocationsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEmployeeStoreLocationsQuery = { getEmployeeStoreLocations: Array<{ id: string, name: string, slug: string, city: string, state: string }> };

export type UserPermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type UserPermissionsQuery = { userPermissions: { canManageInventory: boolean, canManageLots: boolean, canViewDashboard: boolean, canAccessSettings: boolean, canManageStoreLocations: boolean, canManageUsers: boolean, canViewTransactionLog: boolean, canUsePOS: boolean, canManageEvents: boolean } };

export type GetSupportedGamesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSupportedGamesQuery = { getSupportedGames: Array<{ categoryId: number, name: string, displayName: string }> };

export type AddToCartMutationVariables = Exact<{
  cartItem: CartItemInput;
}>;


export type AddToCartMutation = { addToCart: { items: Array<{ inventoryItemId: number, productId: number, productName: string, condition: CardCondition, quantity: number, unitPrice: number, maxAvailable: number }> } };

export type GetPublicBuyRatesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPublicBuyRatesQuery = { getPublicBuyRates: { games: Array<{ categoryId: number, gameName: string, gameDisplayName: string, entries: Array<{ id: number, description: string, fixedRateCents: number | null, percentageRate: number | null, type: BuyRateType, sortOrder: number }> }> } };

export type GetPublicEventQueryVariables = Exact<{
  id: number;
}>;


export type GetPublicEventQuery = { getPublicEvent: { id: number, name: string, description: string | null, eventType: EventType, gameName: string | null, gameDisplayName: string | null, startTime: string, endTime: string | null, capacity: number | null, entryFeeInCents: number | null, status: EventStatus, registrationCount: number, registrations: Array<{ registrantName: string }> | null } | null };

export type RegisterForEventDetailMutationVariables = Exact<{
  eventId: number;
  input: PublicEventRegistrationInput;
}>;


export type RegisterForEventDetailMutation = { registerForEvent: { id: number, registrantName: string, status: RegistrationStatus } };

export type GetEventsQueryVariables = Exact<{
  pagination?: PaginationInput | null | undefined;
  filters?: EventFilters | null | undefined;
}>;


export type GetEventsQuery = { getEvents: { totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ id: number, name: string, eventType: EventType, gameName: string | null, gameDisplayName: string | null, startTime: string, endTime: string | null, capacity: number | null, status: EventStatus, registrationCount: number, recurrenceGroupId: string | null, isRecurrenceTemplate: boolean }> } };

export type GetEventQueryVariables = Exact<{
  id: number;
}>;


export type GetEventQuery = { getEvent: { id: number, organizationId: string, name: string, description: string | null, eventType: EventType, categoryId: number | null, gameName: string | null, gameDisplayName: string | null, startTime: string, endTime: string | null, capacity: number | null, entryFeeInCents: number | null, status: EventStatus, registrationCount: number, recurrenceGroupId: string | null, isRecurrenceTemplate: boolean, createdAt: string, updatedAt: string, recurrenceRule: { frequency: RecurrenceFrequency } | null } | null };

export type GetEventRegistrationsQueryVariables = Exact<{
  eventId: number;
}>;


export type GetEventRegistrationsQuery = { getEventRegistrations: Array<{ id: number, registrantName: string, registrantEmail: string | null, registrantPhone: string | null, status: RegistrationStatus, checkedIn: boolean, checkedInAt: string | null, createdAt: string }> };

export type CreateEventMutationVariables = Exact<{
  input: CreateEventInput;
}>;


export type CreateEventMutation = { createEvent: { id: number, name: string, status: EventStatus } };

export type UpdateEventMutationVariables = Exact<{
  id: number;
  input: UpdateEventInput;
}>;


export type UpdateEventMutation = { updateEvent: { id: number, name: string, status: EventStatus } };

export type CancelEventMutationVariables = Exact<{
  id: number;
}>;


export type CancelEventMutation = { cancelEvent: { id: number, status: EventStatus } };

export type CancelRecurringSeriesMutationVariables = Exact<{
  recurrenceGroupId: string;
}>;


export type CancelRecurringSeriesMutation = { cancelRecurringSeries: number };

export type UpdateRecurrenceRuleMutationVariables = Exact<{
  recurrenceGroupId: string;
  frequency: RecurrenceFrequency;
}>;


export type UpdateRecurrenceRuleMutation = { updateRecurrenceRule: { id: number, recurrenceRule: { frequency: RecurrenceFrequency } | null } };

export type AddEventRegistrationMutationVariables = Exact<{
  eventId: number;
  input: AdminEventRegistrationInput;
}>;


export type AddEventRegistrationMutation = { addEventRegistration: { id: number, registrantName: string, status: RegistrationStatus } };

export type CancelEventRegistrationMutationVariables = Exact<{
  registrationId: number;
}>;


export type CancelEventRegistrationMutation = { cancelEventRegistration: { id: number, status: RegistrationStatus } };

export type CheckInEventRegistrationMutationVariables = Exact<{
  registrationId: number;
}>;


export type CheckInEventRegistrationMutation = { checkInEventRegistration: { id: number, checkedIn: boolean, checkedInAt: string | null } };

export type GetPublicEventsQueryVariables = Exact<{
  organizationId: string;
  dateFrom: string;
  dateTo: string;
}>;


export type GetPublicEventsQuery = { getPublicEvents: Array<{ id: number, name: string, description: string | null, eventType: EventType, gameName: string | null, gameDisplayName: string | null, startTime: string, endTime: string | null, capacity: number | null, entryFeeInCents: number | null, status: EventStatus, registrationCount: number }> };

export type GetAvailableGamesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAvailableGamesQuery = { getAvailableGames: Array<{ categoryId: number, name: string, displayName: string }> };

export type FirstTimeSetupMutationMutationVariables = Exact<{
  userDetails: UserDetails;
  company: CompanySettings;
  store: InitialStoreLocation;
  supportedGameCategoryIds: Array<number> | number;
}>;


export type FirstTimeSetupMutationMutation = { firstTimeSetup: string };

export type GetInventoryQueryVariables = Exact<{
  filters?: InventoryFilters | null | undefined;
  pagination?: PaginationInput | null | undefined;
}>;


export type GetInventoryQuery = { getInventory: { totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ id: number, productId: number, productName: string, gameName: string, setName: string, rarity: string | null, isSingle: boolean, isSealed: boolean, condition: CardCondition, price: number, totalQuantity: number, entryCount: number }> } };

export type GetInventoryItemQueryVariables = Exact<{
  id: number;
}>;


export type GetInventoryItemQuery = { getInventoryItem: { id: number, productId: number, productName: string, gameName: string, setName: string, rarity: string | null, isSingle: boolean, isSealed: boolean, condition: CardCondition, price: number, totalQuantity: number, entryCount: number } | null };

export type GetInventoryItemDetailsQueryVariables = Exact<{
  inventoryItemId: number;
  pagination?: PaginationInput | null | undefined;
}>;


export type GetInventoryItemDetailsQuery = { getInventoryItemDetails: { totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ id: number, inventoryItemId: number, quantity: number, costBasis: number, acquisitionDate: string, notes: string | null, createdAt: string, updatedAt: string }> } };

export type SearchProductsQueryVariables = Exact<{
  searchTerm: string;
  game?: string | null | undefined;
}>;


export type SearchProductsQuery = { searchProducts: Array<{ id: number, name: string, gameName: string, setName: string, rarity: string | null, imageUrl: string | null, isSingle: boolean, isSealed: boolean, prices: Array<{ subTypeName: string, lowPrice: number | null, midPrice: number | null, highPrice: number | null, marketPrice: number | null, directLowPrice: number | null }> }> };

export type AddInventoryItemMutationVariables = Exact<{
  input: AddInventoryItemInput;
}>;


export type AddInventoryItemMutation = { addInventoryItem: { id: number, productId: number, productName: string, gameName: string, setName: string, rarity: string | null, condition: CardCondition, price: number, totalQuantity: number, entryCount: number } };

export type UpdateInventoryItemMutationVariables = Exact<{
  input: UpdateInventoryItemInput;
}>;


export type UpdateInventoryItemMutation = { updateInventoryItem: { id: number, productId: number, productName: string, condition: CardCondition, price: number, totalQuantity: number, entryCount: number } };

export type DeleteInventoryItemMutationVariables = Exact<{
  id: number;
}>;


export type DeleteInventoryItemMutation = { deleteInventoryItem: boolean };

export type AddStockMutationVariables = Exact<{
  input: AddStockInput;
}>;


export type AddStockMutation = { addStock: { id: number, inventoryItemId: number, quantity: number, costBasis: number, acquisitionDate: string, notes: string | null } };

export type UpdateStockMutationVariables = Exact<{
  input: UpdateStockInput;
}>;


export type UpdateStockMutation = { updateStock: { id: number, inventoryItemId: number, quantity: number, costBasis: number, acquisitionDate: string, notes: string | null } };

export type DeleteStockMutationVariables = Exact<{
  id: number;
}>;


export type DeleteStockMutation = { deleteStock: boolean };

export type BulkUpdateStockMutationVariables = Exact<{
  input: BulkUpdateStockInput;
}>;


export type BulkUpdateStockMutation = { bulkUpdateStock: Array<{ id: number }> };

export type BulkDeleteStockMutationVariables = Exact<{
  input: BulkDeleteStockInput;
}>;


export type BulkDeleteStockMutation = { bulkDeleteStock: boolean };

export type GetBarcodesForInventoryItemQueryVariables = Exact<{
  inventoryItemId: number;
}>;


export type GetBarcodesForInventoryItemQuery = { getBarcodesForInventoryItem: Array<{ id: number, code: string, inventoryItemId: number, createdAt: string }> };

export type AddBarcodeMutationVariables = Exact<{
  input: AddBarcodeInput;
}>;


export type AddBarcodeMutation = { addBarcode: { id: number, code: string, inventoryItemId: number, createdAt: string } };

export type RemoveBarcodeMutationVariables = Exact<{
  input: RemoveBarcodeInput;
}>;


export type RemoveBarcodeMutation = { removeBarcode: boolean };

export type SearchProductsForLotQueryVariables = Exact<{
  searchTerm: string;
  isSingle?: boolean | null | undefined;
  isSealed?: boolean | null | undefined;
}>;


export type SearchProductsForLotQuery = { searchProducts: Array<{ id: number, name: string, gameName: string, setName: string, rarity: string | null, imageUrl: string | null, isSingle: boolean, isSealed: boolean, prices: Array<{ subTypeName: string, marketPrice: number | null, midPrice: number | null }> }> };

export type GetLotQueryVariables = Exact<{
  id: number;
}>;


export type GetLotQuery = { getLot: { id: number, name: string, description: string | null, amountPaid: number, acquisitionDate: string, totalMarketValue: number, totalCost: number, projectedProfitLoss: number, projectedProfitMargin: number, items: Array<{ id: number, productId: number, productName: string, gameName: string, setName: string, rarity: string | null, isSingle: boolean, isSealed: boolean, condition: CardCondition | null, quantity: number, costBasis: number, costOverridden: boolean, marketValue: number | null }> } | null };

export type CreateLotMutationVariables = Exact<{
  input: CreateLotInput;
}>;


export type CreateLotMutation = { createLot: { id: number } };

export type UpdateLotMutationVariables = Exact<{
  input: UpdateLotInput;
}>;


export type UpdateLotMutation = { updateLot: { id: number } };

export type GetLotsQueryVariables = Exact<{
  filters?: LotFilters | null | undefined;
  pagination?: PaginationInput | null | undefined;
}>;


export type GetLotsQuery = { getLots: { totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ id: number, name: string, description: string | null, amountPaid: number, acquisitionDate: string, totalMarketValue: number, totalCost: number, projectedProfitLoss: number, projectedProfitMargin: number, createdAt: string, items: Array<{ id: number }> }> } };

export type DeleteLotMutationVariables = Exact<{
  id: number;
}>;


export type DeleteLotMutation = { deleteLot: boolean };

export type GetLotStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLotStatsQuery = { getLotStats: { totalLots: number, totalInvested: number, totalMarketValue: number, totalProfitLoss: number } };

export type GetOrdersQueryVariables = Exact<{
  pagination?: PaginationInput | null | undefined;
  filters?: OrderFilters | null | undefined;
}>;


export type GetOrdersQuery = { getOrders: { totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ id: number, orderNumber: string, customerName: string, status: OrderStatus, totalAmount: number, totalCostBasis: number | null, totalProfit: number | null, createdAt: string, items: Array<{ id: number, productId: number, productName: string, condition: CardCondition, quantity: number, unitPrice: number, costBasis: number | null, profit: number | null, lotId: number | null }> }> } };

export type CancelOrderMutationVariables = Exact<{
  orderId: number;
}>;


export type CancelOrderMutation = { cancelOrder: { id: number, orderNumber: string, customerName: string, status: OrderStatus, totalAmount: number, totalCostBasis: number | null, totalProfit: number | null, createdAt: string, items: Array<{ id: number, productId: number, productName: string, condition: CardCondition, quantity: number, unitPrice: number, costBasis: number | null, profit: number | null }> } };

export type UpdateOrderStatusMutationVariables = Exact<{
  orderId: number;
  status: OrderStatus;
}>;


export type UpdateOrderStatusMutation = { updateOrderStatus: { id: number, orderNumber: string, customerName: string, status: OrderStatus, totalAmount: number, totalCostBasis: number | null, totalProfit: number | null, createdAt: string, items: Array<{ id: number, productId: number, productName: string, condition: CardCondition, quantity: number, unitPrice: number, costBasis: number | null, profit: number | null }> } };

export type LookupBarcodeQueryVariables = Exact<{
  code: string;
}>;


export type LookupBarcodeQuery = { lookupBarcode: { inventoryItemId: number, productName: string, gameName: string, setName: string, condition: CardCondition, price: number, availableQuantity: number, imageUrl: string | null } | null };

export type PosGetInventoryQueryVariables = Exact<{
  filters?: InventoryFilters | null | undefined;
  pagination?: PaginationInput | null | undefined;
}>;


export type PosGetInventoryQuery = { getInventory: { items: Array<{ id: number, productId: number, productName: string, gameName: string, condition: CardCondition, price: number, totalQuantity: number }> } };

export type GetOpenOrdersQueryVariables = Exact<{
  pagination?: PaginationInput | null | undefined;
  filters?: OrderFilters | null | undefined;
}>;


export type GetOpenOrdersQuery = { getOrders: { items: Array<{ id: number, orderNumber: string, customerName: string, totalAmount: number, createdAt: string, items: Array<{ id: number, productId: number, productName: string, condition: CardCondition, quantity: number, unitPrice: number }> }> } };

export type PosGetActiveStoreLocationQueryVariables = Exact<{ [key: string]: never; }>;


export type PosGetActiveStoreLocationQuery = { getActiveStoreLocation: { id: string, state: string } | null };

export type GetPosConfigQueryVariables = Exact<{
  stateCode?: string | null | undefined;
}>;


export type GetPosConfigQuery = { getPosConfig: { taxRate: number, stripeEnabled: boolean, stripePublishableKey: string | null } };

export type SubmitPosOrderMutationVariables = Exact<{
  input: SubmitPosOrderInput;
}>;


export type SubmitPosOrderMutation = { submitPosOrder: { id: number, orderNumber: string, totalAmount: number, taxAmount: number | null, paymentMethod: string | null, status: OrderStatus } };

export type CompletePosOrderMutationVariables = Exact<{
  input: CompletePosOrderInput;
}>;


export type CompletePosOrderMutation = { completePosOrder: { id: number, orderNumber: string, totalAmount: number, taxAmount: number | null, paymentMethod: string | null, status: OrderStatus } };

export type CreatePosPaymentIntentMutationVariables = Exact<{
  amount: number;
}>;


export type CreatePosPaymentIntentMutation = { createPosPaymentIntent: { clientSecret: string, paymentIntentId: string } };

export type GetProductQueryVariables = Exact<{
  productId: string;
}>;


export type GetProductQuery = { getProduct: { id: string, name: string, setName: string, gameName: string, rarity: string | null, type: string | null, text: string | null, flavorText: string | null, finishes: Array<string>, isSingle: boolean, isSealed: boolean, images: { small: string | null, large: string | null } | null, inventoryRecords: Array<{ inventoryItemId: number, condition: CardCondition, quantity: number, price: number }> } };

export type GetSealedProductListingsQueryVariables = Exact<{
  filters?: ProductListingFilters | null | undefined;
  pagination?: ProductListingPagination | null | undefined;
}>;


export type GetSealedProductListingsQuery = { getProductListings: { totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ id: string, name: string, setName: string, gameName: string, finishes: Array<string>, totalQuantity: number, lowestPrice: number | null, lowestPriceInventoryItemId: number | null, images: { small: string | null, large: string | null } | null }> } };

export type GetSealedSetsQueryVariables = Exact<{
  game: string;
  filters?: SetFilters | null | undefined;
}>;


export type GetSealedSetsQuery = { getSets: Array<{ code: string, name: string }> };

export type GetSinglesProductListingsQueryVariables = Exact<{
  filters?: ProductListingFilters | null | undefined;
  pagination?: ProductListingPagination | null | undefined;
}>;


export type GetSinglesProductListingsQuery = { getProductListings: { totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ id: string, name: string, setName: string, gameName: string, rarity: string | null, finishes: Array<string>, totalQuantity: number, lowestPrice: number | null, images: { small: string | null, large: string | null } | null, conditionPrices: Array<{ inventoryItemId: number, condition: CardCondition, quantity: number, price: number }> }> } };

export type GetSinglesSetsQueryVariables = Exact<{
  game: string;
  filters?: SetFilters | null | undefined;
}>;


export type GetSinglesSetsQuery = { getSets: Array<{ code: string, name: string }> };

export type GetBackupSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBackupSettingsQuery = { getBackupSettings: { provider: BackupProvider | null, frequency: string | null, lastBackupAt: string | null, googleDriveConnected: boolean, dropboxConnected: boolean, onedriveConnected: boolean, googleDriveClientId: string | null, dropboxClientId: string | null, onedriveClientId: string | null, googleDriveHasClientSecret: boolean } };

export type GetBackupCronJobsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBackupCronJobsQuery = { getCronJobs: Array<{ id: number, name: string, displayName: string, description: string | null, cronExpression: string, enabled: boolean, lastRunAt: string | null, lastRunStatus: string | null, lastRunDurationMs: number | null, lastRunError: string | null, nextRunAt: string | null, config: string | null }> };

export type TriggerBackupCronJobMutationVariables = Exact<{
  id: number;
}>;


export type TriggerBackupCronJobMutation = { triggerCronJob: { id: number, status: string, summary: string | null, error: string | null, durationMs: number | null } };

export type EnableBackupCronJobMutationVariables = Exact<{
  id: number;
}>;


export type EnableBackupCronJobMutation = { enableCronJob: { id: number, enabled: boolean } };

export type DisableBackupCronJobMutationVariables = Exact<{
  id: number;
}>;


export type DisableBackupCronJobMutation = { disableCronJob: { id: number, enabled: boolean } };

export type UpdateBackupCronJobScheduleMutationVariables = Exact<{
  id: number;
  cronExpression: string;
}>;


export type UpdateBackupCronJobScheduleMutation = { updateCronJobSchedule: { id: number, cronExpression: string, nextRunAt: string | null } };

export type UpdateBackupSettingsMutationVariables = Exact<{
  input: UpdateBackupSettingsInput;
}>;


export type UpdateBackupSettingsMutation = { updateBackupSettings: { provider: BackupProvider | null, frequency: string | null, lastBackupAt: string | null, googleDriveConnected: boolean, dropboxConnected: boolean, onedriveConnected: boolean } };

export type TriggerRestoreMutationVariables = Exact<{
  provider: BackupProvider;
}>;


export type TriggerRestoreMutation = { triggerRestore: { success: boolean, message: string | null } };

export type DisconnectBackupProviderMutationVariables = Exact<{
  provider: BackupProvider;
}>;


export type DisconnectBackupProviderMutation = { disconnectBackupProvider: { provider: BackupProvider | null, frequency: string | null, lastBackupAt: string | null, googleDriveConnected: boolean, dropboxConnected: boolean, onedriveConnected: boolean, googleDriveClientId: string | null, dropboxClientId: string | null, onedriveClientId: string | null, googleDriveHasClientSecret: boolean } };

export type GetBuyRatesQueryVariables = Exact<{
  categoryId: number;
}>;


export type GetBuyRatesQuery = { getBuyRates: Array<{ id: number, description: string, fixedRateCents: number | null, percentageRate: number | null, type: BuyRateType, rarity: string | null, hidden: boolean, sortOrder: number }> };

export type GetDistinctRaritiesQueryVariables = Exact<{
  categoryId: number;
}>;


export type GetDistinctRaritiesQuery = { getDistinctRarities: Array<string> };

export type SaveBuyRatesMutationVariables = Exact<{
  input: SaveBuyRatesInput;
}>;


export type SaveBuyRatesMutation = { saveBuyRates: Array<{ id: number, description: string, fixedRateCents: number | null, percentageRate: number | null, type: BuyRateType, rarity: string | null, hidden: boolean, sortOrder: number }> };

export type GetDashboardSalesQueryVariables = Exact<{
  organizationId: string;
  dateRange: DashboardDateRange;
}>;


export type GetDashboardSalesQuery = { getDashboardSales: { granularity: Granularity, summary: { totalRevenue: number, totalCost: number, totalProfit: number, profitMargin: number, orderCount: number }, dataPoints: Array<{ label: string, revenue: number, cost: number, profit: number, orderCount: number }> } };

export type GetDashboardBestSellersQueryVariables = Exact<{
  organizationId: string;
  dateRange: DashboardDateRange;
  sortBy: BestSellerSortBy;
  limit?: number | null | undefined;
}>;


export type GetDashboardBestSellersQuery = { getDashboardBestSellers: Array<{ productId: number, productName: string, totalQuantity: number, totalRevenue: number }> };

export type GetDashboardInventorySummaryQueryVariables = Exact<{
  organizationId: string;
}>;


export type GetDashboardInventorySummaryQuery = { getDashboardInventorySummary: { totalSkus: number, totalUnits: number, totalCostValue: number, totalRetailValue: number } };

export type GetDashboardOrderStatusQueryVariables = Exact<{
  organizationId: string;
  dateRange: DashboardDateRange;
}>;


export type GetDashboardOrderStatusQuery = { getDashboardOrderStatus: { open: number, completed: number, cancelled: number, total: number } };

export type CheckForDataUpdatesQueryVariables = Exact<{ [key: string]: never; }>;


export type CheckForDataUpdatesQuery = { checkForDataUpdates: { currentVersion: string | null, latestVersion: string | null, updateAvailable: boolean, isUpdating: boolean } };

export type TriggerDataUpdateMutationVariables = Exact<{ [key: string]: never; }>;


export type TriggerDataUpdateMutation = { triggerDataUpdate: { success: boolean, message: string | null, newVersion: string | null } };

export type GetDataUpdateCronJobsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDataUpdateCronJobsQuery = { getCronJobs: Array<{ id: number, name: string, cronExpression: string, enabled: boolean, lastRunAt: string | null, lastRunStatus: string | null, lastRunDurationMs: number | null, lastRunError: string | null, nextRunAt: string | null }> };

export type EnableDataUpdateCronJobMutationVariables = Exact<{
  id: number;
}>;


export type EnableDataUpdateCronJobMutation = { enableCronJob: { id: number, enabled: boolean } };

export type DisableDataUpdateCronJobMutationVariables = Exact<{
  id: number;
}>;


export type DisableDataUpdateCronJobMutation = { disableCronJob: { id: number, enabled: boolean } };

export type UpdateDataUpdateScheduleMutationVariables = Exact<{
  id: number;
  cronExpression: string;
}>;


export type UpdateDataUpdateScheduleMutation = { updateCronJobSchedule: { id: number, cronExpression: string, nextRunAt: string | null } };

export type GetStoreSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetStoreSettingsQuery = { getStoreSettings: { companyName: string | null, ein: string | null } };

export type UpdateStoreSettingsMutationVariables = Exact<{
  input: UpdateStoreSettingsInput;
}>;


export type UpdateStoreSettingsMutation = { updateStoreSettings: { companyName: string | null, ein: string | null } };

export type GetAvailableGamesForSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAvailableGamesForSettingsQuery = { getAvailableGames: Array<{ categoryId: number, name: string, displayName: string }> };

export type SetSupportedGamesMutationVariables = Exact<{
  categoryIds: Array<number> | number;
}>;


export type SetSupportedGamesMutation = { setSupportedGames: Array<{ categoryId: number, name: string, displayName: string }> };

export type GetIntegrationSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetIntegrationSettingsQuery = { getIntegrationSettings: { stripe: { enabled: boolean, hasApiKey: boolean, hasPublishableKey: boolean }, shopify: { enabled: boolean, hasApiKey: boolean, shopDomain: string | null } } };

export type UpdateStripeIntegrationMutationVariables = Exact<{
  input: UpdateStripeIntegrationInput;
}>;


export type UpdateStripeIntegrationMutation = { updateStripeIntegration: { enabled: boolean, hasApiKey: boolean, hasPublishableKey: boolean } };

export type UpdateShopifyIntegrationMutationVariables = Exact<{
  input: UpdateShopifyIntegrationInput;
}>;


export type UpdateShopifyIntegrationMutation = { updateShopifyIntegration: { enabled: boolean, hasApiKey: boolean, shopDomain: string | null } };

export type GetAllStoreLocationsAdminQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllStoreLocationsAdminQuery = { getEmployeeStoreLocations: Array<{ id: string, name: string, street1: string, street2: string | null, city: string, state: string, zip: string, phone: string | null, createdAt: string, hours: Array<{ dayOfWeek: number, openTime: string | null, closeTime: string | null }> }> };

export type AddStoreLocationMutationVariables = Exact<{
  input: AddStoreLocationInput;
}>;


export type AddStoreLocationMutation = { addStoreLocation: { id: string, name: string, street1: string, street2: string | null, city: string, state: string, zip: string, phone: string | null, createdAt: string, hours: Array<{ dayOfWeek: number, openTime: string | null, closeTime: string | null }> } };

export type UpdateStoreLocationMutationVariables = Exact<{
  input: UpdateStoreLocationInput;
}>;


export type UpdateStoreLocationMutation = { updateStoreLocation: { id: string, name: string, street1: string, street2: string | null, city: string, state: string, zip: string, phone: string | null, createdAt: string, hours: Array<{ dayOfWeek: number, openTime: string | null, closeTime: string | null }> } };

export type RemoveStoreLocationMutationVariables = Exact<{
  id: string;
}>;


export type RemoveStoreLocationMutation = { removeStoreLocation: boolean };

export type GetCronJobsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCronJobsQuery = { getCronJobs: Array<{ id: number, name: string, displayName: string, description: string | null, cronExpression: string, enabled: boolean, lastRunAt: string | null, lastRunStatus: string | null, lastRunDurationMs: number | null, lastRunError: string | null, nextRunAt: string | null, config: string | null }> };

export type GetCronJobRunsQueryVariables = Exact<{
  cronJobId: number;
  pagination?: PaginationInput | null | undefined;
}>;


export type GetCronJobRunsQuery = { getCronJobRuns: { totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ id: number, startedAt: string, completedAt: string | null, durationMs: number | null, status: string, error: string | null, summary: string | null }> } };

export type TriggerCronJobMutationVariables = Exact<{
  id: number;
}>;


export type TriggerCronJobMutation = { triggerCronJob: { id: number, status: string, summary: string | null, error: string | null, durationMs: number | null } };

export type EnableCronJobMutationVariables = Exact<{
  id: number;
}>;


export type EnableCronJobMutation = { enableCronJob: { id: number, enabled: boolean } };

export type DisableCronJobMutationVariables = Exact<{
  id: number;
}>;


export type DisableCronJobMutation = { disableCronJob: { id: number, enabled: boolean } };

export type UpdateCronJobScheduleMutationVariables = Exact<{
  id: number;
  cronExpression: string;
}>;


export type UpdateCronJobScheduleMutation = { updateCronJobSchedule: { id: number, cronExpression: string, nextRunAt: string | null } };

export type GetTransactionLogsQueryVariables = Exact<{
  pagination?: PaginationInput | null | undefined;
  filters?: TransactionLogFilters | null | undefined;
}>;


export type GetTransactionLogsQuery = { getTransactionLogs: { totalCount: number, page: number, pageSize: number, totalPages: number, items: Array<{ id: number, action: string, resourceType: ResourceType, resourceId: string | null, details: string, userName: string, userEmail: string, createdAt: string }> } };

export type IsSetupPendingQueryVariables = Exact<{ [key: string]: never; }>;


export type IsSetupPendingQuery = { isSetupPending: boolean };

export type GetDefaultStoreIdQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDefaultStoreIdQuery = { getAllStoreLocations: Array<{ id: string }> };

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
export const GetPublicEventDocument = new TypedDocumentString(`
    query GetPublicEvent($id: Int!) {
  getPublicEvent(id: $id) {
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
    registrations {
      registrantName
    }
  }
}
    `) as unknown as TypedDocumentString<GetPublicEventQuery, GetPublicEventQueryVariables>;
export const RegisterForEventDetailDocument = new TypedDocumentString(`
    mutation RegisterForEventDetail($eventId: Int!, $input: PublicEventRegistrationInput!) {
  registerForEvent(eventId: $eventId, input: $input) {
    id
    registrantName
    status
  }
}
    `) as unknown as TypedDocumentString<RegisterForEventDetailMutation, RegisterForEventDetailMutationVariables>;
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
export const UpdateRecurrenceRuleDocument = new TypedDocumentString(`
    mutation UpdateRecurrenceRule($recurrenceGroupId: String!, $frequency: RecurrenceFrequency!) {
  updateRecurrenceRule(
    recurrenceGroupId: $recurrenceGroupId
    frequency: $frequency
  ) {
    id
    recurrenceRule {
      frequency
    }
  }
}
    `) as unknown as TypedDocumentString<UpdateRecurrenceRuleMutation, UpdateRecurrenceRuleMutationVariables>;
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
export const PosGetActiveStoreLocationDocument = new TypedDocumentString(`
    query POSGetActiveStoreLocation {
  getActiveStoreLocation {
    id
    state
  }
}
    `) as unknown as TypedDocumentString<PosGetActiveStoreLocationQuery, PosGetActiveStoreLocationQueryVariables>;
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
    googleDriveClientId
    dropboxClientId
    onedriveClientId
    googleDriveHasClientSecret
  }
}
    `) as unknown as TypedDocumentString<GetBackupSettingsQuery, GetBackupSettingsQueryVariables>;
export const GetBackupCronJobsDocument = new TypedDocumentString(`
    query GetBackupCronJobs {
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
    `) as unknown as TypedDocumentString<GetBackupCronJobsQuery, GetBackupCronJobsQueryVariables>;
export const TriggerBackupCronJobDocument = new TypedDocumentString(`
    mutation TriggerBackupCronJob($id: Int!) {
  triggerCronJob(id: $id) {
    id
    status
    summary
    error
    durationMs
  }
}
    `) as unknown as TypedDocumentString<TriggerBackupCronJobMutation, TriggerBackupCronJobMutationVariables>;
export const EnableBackupCronJobDocument = new TypedDocumentString(`
    mutation EnableBackupCronJob($id: Int!) {
  enableCronJob(id: $id) {
    id
    enabled
  }
}
    `) as unknown as TypedDocumentString<EnableBackupCronJobMutation, EnableBackupCronJobMutationVariables>;
export const DisableBackupCronJobDocument = new TypedDocumentString(`
    mutation DisableBackupCronJob($id: Int!) {
  disableCronJob(id: $id) {
    id
    enabled
  }
}
    `) as unknown as TypedDocumentString<DisableBackupCronJobMutation, DisableBackupCronJobMutationVariables>;
export const UpdateBackupCronJobScheduleDocument = new TypedDocumentString(`
    mutation UpdateBackupCronJobSchedule($id: Int!, $cronExpression: String!) {
  updateCronJobSchedule(id: $id, cronExpression: $cronExpression) {
    id
    cronExpression
    nextRunAt
  }
}
    `) as unknown as TypedDocumentString<UpdateBackupCronJobScheduleMutation, UpdateBackupCronJobScheduleMutationVariables>;
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
export const TriggerRestoreDocument = new TypedDocumentString(`
    mutation TriggerRestore($provider: BackupProvider!) {
  triggerRestore(provider: $provider) {
    success
    message
  }
}
    `) as unknown as TypedDocumentString<TriggerRestoreMutation, TriggerRestoreMutationVariables>;
export const DisconnectBackupProviderDocument = new TypedDocumentString(`
    mutation DisconnectBackupProvider($provider: BackupProvider!) {
  disconnectBackupProvider(provider: $provider) {
    provider
    frequency
    lastBackupAt
    googleDriveConnected
    dropboxConnected
    onedriveConnected
    googleDriveClientId
    dropboxClientId
    onedriveClientId
    googleDriveHasClientSecret
  }
}
    `) as unknown as TypedDocumentString<DisconnectBackupProviderMutation, DisconnectBackupProviderMutationVariables>;
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
export const CheckForDataUpdatesDocument = new TypedDocumentString(`
    query CheckForDataUpdates {
  checkForDataUpdates {
    currentVersion
    latestVersion
    updateAvailable
    isUpdating
  }
}
    `) as unknown as TypedDocumentString<CheckForDataUpdatesQuery, CheckForDataUpdatesQueryVariables>;
export const TriggerDataUpdateDocument = new TypedDocumentString(`
    mutation TriggerDataUpdate {
  triggerDataUpdate {
    success
    message
    newVersion
  }
}
    `) as unknown as TypedDocumentString<TriggerDataUpdateMutation, TriggerDataUpdateMutationVariables>;
export const GetDataUpdateCronJobsDocument = new TypedDocumentString(`
    query GetDataUpdateCronJobs {
  getCronJobs {
    id
    name
    cronExpression
    enabled
    lastRunAt
    lastRunStatus
    lastRunDurationMs
    lastRunError
    nextRunAt
  }
}
    `) as unknown as TypedDocumentString<GetDataUpdateCronJobsQuery, GetDataUpdateCronJobsQueryVariables>;
export const EnableDataUpdateCronJobDocument = new TypedDocumentString(`
    mutation EnableDataUpdateCronJob($id: Int!) {
  enableCronJob(id: $id) {
    id
    enabled
  }
}
    `) as unknown as TypedDocumentString<EnableDataUpdateCronJobMutation, EnableDataUpdateCronJobMutationVariables>;
export const DisableDataUpdateCronJobDocument = new TypedDocumentString(`
    mutation DisableDataUpdateCronJob($id: Int!) {
  disableCronJob(id: $id) {
    id
    enabled
  }
}
    `) as unknown as TypedDocumentString<DisableDataUpdateCronJobMutation, DisableDataUpdateCronJobMutationVariables>;
export const UpdateDataUpdateScheduleDocument = new TypedDocumentString(`
    mutation UpdateDataUpdateSchedule($id: Int!, $cronExpression: String!) {
  updateCronJobSchedule(id: $id, cronExpression: $cronExpression) {
    id
    cronExpression
    nextRunAt
  }
}
    `) as unknown as TypedDocumentString<UpdateDataUpdateScheduleMutation, UpdateDataUpdateScheduleMutationVariables>;
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
export const GetDefaultStoreIdDocument = new TypedDocumentString(`
    query GetDefaultStoreId {
  getAllStoreLocations {
    id
  }
}
    `) as unknown as TypedDocumentString<GetDefaultStoreIdQuery, GetDefaultStoreIdQueryVariables>;