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
  acquisitionDate?: InputMaybe<Scalars['String']['input']>;
  condition: Scalars['String']['input'];
  costBasis?: InputMaybe<Scalars['Float']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  price: Scalars['Float']['input'];
  productId: Scalars['Int']['input'];
  quantity: Scalars['Int']['input'];
};

export type BulkDeleteInventoryInput = {
  ids: Array<Scalars['Int']['input']>;
};

export type BulkUpdateInventoryInput = {
  acquisitionDate?: InputMaybe<Scalars['String']['input']>;
  condition?: InputMaybe<Scalars['String']['input']>;
  costBasis?: InputMaybe<Scalars['Float']['input']>;
  ids: Array<Scalars['Int']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
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
  productId: Scalars['Float']['input'];
  quantity: Scalars['Int']['input'];
};

export type CartItemOutput = {
  __typename?: 'CartItemOutput';
  productId: Scalars['Int']['output'];
  productName: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
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

export type InventoryFilters = {
  condition?: InputMaybe<Scalars['String']['input']>;
  gameName?: InputMaybe<Scalars['String']['input']>;
  includeSealed?: InputMaybe<Scalars['Boolean']['input']>;
  includeSingles?: InputMaybe<Scalars['Boolean']['input']>;
  rarity?: InputMaybe<Scalars['String']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  setName?: InputMaybe<Scalars['String']['input']>;
};

export type InventoryItem = {
  __typename?: 'InventoryItem';
  acquisitionDate?: Maybe<Scalars['String']['output']>;
  condition?: Maybe<Scalars['String']['output']>;
  costBasis?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['String']['output'];
  gameName: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  isSealed: Scalars['Boolean']['output'];
  isSingle: Scalars['Boolean']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  price: Scalars['Float']['output'];
  productId: Scalars['Int']['output'];
  productName: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  rarity?: Maybe<Scalars['String']['output']>;
  setName: Scalars['String']['output'];
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

export type Mutation = {
  __typename?: 'Mutation';
  addInventoryItem: InventoryItem;
  addToCart: ShoppingCart;
  bulkDeleteInventory: Scalars['Boolean']['output'];
  bulkUpdateInventory: Array<InventoryItem>;
  checkoutWithCart: ShoppingCart;
  clearCart: ShoppingCart;
  deleteInventoryItem: Scalars['Boolean']['output'];
  firstTimeSetup: Scalars['String']['output'];
  removeFromCart: ShoppingCart;
  updateInventoryItem: InventoryItem;
  updateItemInCart: ShoppingCart;
};


export type MutationaddInventoryItemArgs = {
  input: AddInventoryItemInput;
};


export type MutationaddToCartArgs = {
  cartItem: CartItemInput;
};


export type MutationbulkDeleteInventoryArgs = {
  input: BulkDeleteInventoryInput;
};


export type MutationbulkUpdateInventoryArgs = {
  input: BulkUpdateInventoryInput;
};


export type MutationdeleteInventoryItemArgs = {
  id: Scalars['Int']['input'];
};


export type MutationfirstTimeSetupArgs = {
  settings: Settings;
  userDetails: UserDetails;
};


export type MutationremoveFromCartArgs = {
  cartItem: CartItemInput;
};


export type MutationupdateInventoryItemArgs = {
  input: UpdateInventoryItemInput;
};


export type MutationupdateItemInCartArgs = {
  cartItem: CartItemInput;
};

export type PaginationInput = {
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
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
  price: Scalars['Float']['output'];
  quantity: Scalars['Int']['output'];
};

export type ProductListing = {
  __typename?: 'ProductListing';
  finishes: Array<Scalars['String']['output']>;
  gameName: Scalars['String']['output'];
  id: Scalars['String']['output'];
  images?: Maybe<CardImages>;
  lowestPrice?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  rarity?: Maybe<Scalars['String']['output']>;
  setName: Scalars['String']['output'];
  totalQuantity: Scalars['Int']['output'];
};

export type ProductListingFilters = {
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
  getCard: Card;
  getInventory: InventoryPage;
  getProduct: ProductDetail;
  getProductListings: ProductListingPage;
  getSets: Array<Set>;
  getShoppingCart: ShoppingCart;
  getSingleCardInventory: Array<Card>;
  isSetupPending: Scalars['Boolean']['output'];
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


export type QuerygetProductArgs = {
  productId: Scalars['String']['input'];
};


export type QuerygetProductListingsArgs = {
  filters?: InputMaybe<ProductListingFilters>;
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


export type QuerysearchProductsArgs = {
  game?: InputMaybe<Scalars['String']['input']>;
  searchTerm: Scalars['String']['input'];
};

export type Set = {
  __typename?: 'Set';
  code: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type SetFilters = {
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};

export type Settings = {
  country: Scalars['String']['input'];
  state: Scalars['String']['input'];
};

export type ShoppingCart = {
  __typename?: 'ShoppingCart';
  items: Array<CartItemOutput>;
};

export type SingleCardFilters = {
  includeSealed?: InputMaybe<Scalars['Boolean']['input']>;
  includeSingles?: InputMaybe<Scalars['Boolean']['input']>;
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  setCode?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateInventoryItemInput = {
  acquisitionDate?: InputMaybe<Scalars['String']['input']>;
  condition?: InputMaybe<Scalars['String']['input']>;
  costBasis?: InputMaybe<Scalars['Float']['input']>;
  id: Scalars['Int']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
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
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

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

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
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
  BulkDeleteInventoryInput: BulkDeleteInventoryInput;
  BulkUpdateInventoryInput: BulkUpdateInventoryInput;
  Card: ResolverTypeWrapper<Card>;
  CardImages: ResolverTypeWrapper<CardImages>;
  CartItemInput: CartItemInput;
  CartItemOutput: ResolverTypeWrapper<CartItemOutput>;
  ConditionInventories: ResolverTypeWrapper<ConditionInventories>;
  ConditionInventory: ResolverTypeWrapper<ConditionInventory>;
  InventoryFilters: InventoryFilters;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  InventoryItem: ResolverTypeWrapper<InventoryItem>;
  InventoryPage: ResolverTypeWrapper<InventoryPage>;
  Mutation: ResolverTypeWrapper<{}>;
  PaginationInput: PaginationInput;
  ProductDetail: ResolverTypeWrapper<ProductDetail>;
  ProductInventoryRecord: ResolverTypeWrapper<ProductInventoryRecord>;
  ProductListing: ResolverTypeWrapper<ProductListing>;
  ProductListingFilters: ProductListingFilters;
  ProductListingPage: ResolverTypeWrapper<ProductListingPage>;
  ProductListingPagination: ProductListingPagination;
  ProductPrice: ResolverTypeWrapper<ProductPrice>;
  ProductSearchResult: ResolverTypeWrapper<ProductSearchResult>;
  Query: ResolverTypeWrapper<{}>;
  Set: ResolverTypeWrapper<Set>;
  SetFilters: SetFilters;
  Settings: Settings;
  ShoppingCart: ResolverTypeWrapper<ShoppingCart>;
  SingleCardFilters: SingleCardFilters;
  UpdateInventoryItemInput: UpdateInventoryItemInput;
  UserDetails: UserDetails;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AddInventoryItemInput: AddInventoryItemInput;
  String: Scalars['String']['output'];
  Float: Scalars['Float']['output'];
  Int: Scalars['Int']['output'];
  BulkDeleteInventoryInput: BulkDeleteInventoryInput;
  BulkUpdateInventoryInput: BulkUpdateInventoryInput;
  Card: Card;
  CardImages: CardImages;
  CartItemInput: CartItemInput;
  CartItemOutput: CartItemOutput;
  ConditionInventories: ConditionInventories;
  ConditionInventory: ConditionInventory;
  InventoryFilters: InventoryFilters;
  Boolean: Scalars['Boolean']['output'];
  InventoryItem: InventoryItem;
  InventoryPage: InventoryPage;
  Mutation: {};
  PaginationInput: PaginationInput;
  ProductDetail: ProductDetail;
  ProductInventoryRecord: ProductInventoryRecord;
  ProductListing: ProductListing;
  ProductListingFilters: ProductListingFilters;
  ProductListingPage: ProductListingPage;
  ProductListingPagination: ProductListingPagination;
  ProductPrice: ProductPrice;
  ProductSearchResult: ProductSearchResult;
  Query: {};
  Set: Set;
  SetFilters: SetFilters;
  Settings: Settings;
  ShoppingCart: ShoppingCart;
  SingleCardFilters: SingleCardFilters;
  UpdateInventoryItemInput: UpdateInventoryItemInput;
  UserDetails: UserDetails;
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
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CardImagesResolvers<ContextType = any, ParentType extends ResolversParentTypes['CardImages'] = ResolversParentTypes['CardImages']> = {
  large?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  small?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CartItemOutputResolvers<ContextType = any, ParentType extends ResolversParentTypes['CartItemOutput'] = ResolversParentTypes['CartItemOutput']> = {
  productId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConditionInventoriesResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConditionInventories'] = ResolversParentTypes['ConditionInventories']> = {
  D?: Resolver<Maybe<ResolversTypes['ConditionInventory']>, ParentType, ContextType>;
  HP?: Resolver<Maybe<ResolversTypes['ConditionInventory']>, ParentType, ContextType>;
  LP?: Resolver<ResolversTypes['ConditionInventory'], ParentType, ContextType>;
  MP?: Resolver<ResolversTypes['ConditionInventory'], ParentType, ContextType>;
  NM?: Resolver<ResolversTypes['ConditionInventory'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConditionInventoryResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConditionInventory'] = ResolversParentTypes['ConditionInventory']> = {
  price?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type InventoryItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['InventoryItem'] = ResolversParentTypes['InventoryItem']> = {
  acquisitionDate?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  condition?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  costBasis?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  gameName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isSealed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isSingle?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  notes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  productId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  productName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  rarity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  setName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type InventoryPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['InventoryPage'] = ResolversParentTypes['InventoryPage']> = {
  items?: Resolver<Array<ResolversTypes['InventoryItem']>, ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pageSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addInventoryItem?: Resolver<ResolversTypes['InventoryItem'], ParentType, ContextType, RequireFields<MutationaddInventoryItemArgs, 'input'>>;
  addToCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType, RequireFields<MutationaddToCartArgs, 'cartItem'>>;
  bulkDeleteInventory?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationbulkDeleteInventoryArgs, 'input'>>;
  bulkUpdateInventory?: Resolver<Array<ResolversTypes['InventoryItem']>, ParentType, ContextType, RequireFields<MutationbulkUpdateInventoryArgs, 'input'>>;
  checkoutWithCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType>;
  clearCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType>;
  deleteInventoryItem?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationdeleteInventoryItemArgs, 'id'>>;
  firstTimeSetup?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationfirstTimeSetupArgs, 'settings' | 'userDetails'>>;
  removeFromCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType, RequireFields<MutationremoveFromCartArgs, 'cartItem'>>;
  updateInventoryItem?: Resolver<ResolversTypes['InventoryItem'], ParentType, ContextType, RequireFields<MutationupdateInventoryItemArgs, 'input'>>;
  updateItemInCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType, RequireFields<MutationupdateItemInCartArgs, 'cartItem'>>;
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
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProductInventoryRecordResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProductInventoryRecord'] = ResolversParentTypes['ProductInventoryRecord']> = {
  condition?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  price?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  quantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProductListingResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProductListing'] = ResolversParentTypes['ProductListing']> = {
  finishes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  gameName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  images?: Resolver<Maybe<ResolversTypes['CardImages']>, ParentType, ContextType>;
  lowestPrice?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rarity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  setName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalQuantity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProductListingPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProductListingPage'] = ResolversParentTypes['ProductListingPage']> = {
  items?: Resolver<Array<ResolversTypes['ProductListing']>, ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pageSize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ProductPriceResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProductPrice'] = ResolversParentTypes['ProductPrice']> = {
  directLowPrice?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  highPrice?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  lowPrice?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  marketPrice?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  midPrice?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  subTypeName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
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
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getCard?: Resolver<ResolversTypes['Card'], ParentType, ContextType, RequireFields<QuerygetCardArgs, 'cardId' | 'game'>>;
  getInventory?: Resolver<ResolversTypes['InventoryPage'], ParentType, ContextType, Partial<QuerygetInventoryArgs>>;
  getProduct?: Resolver<ResolversTypes['ProductDetail'], ParentType, ContextType, RequireFields<QuerygetProductArgs, 'productId'>>;
  getProductListings?: Resolver<ResolversTypes['ProductListingPage'], ParentType, ContextType, Partial<QuerygetProductListingsArgs>>;
  getSets?: Resolver<Array<ResolversTypes['Set']>, ParentType, ContextType, RequireFields<QuerygetSetsArgs, 'game'>>;
  getShoppingCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType>;
  getSingleCardInventory?: Resolver<Array<ResolversTypes['Card']>, ParentType, ContextType, RequireFields<QuerygetSingleCardInventoryArgs, 'game'>>;
  isSetupPending?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  searchProducts?: Resolver<Array<ResolversTypes['ProductSearchResult']>, ParentType, ContextType, RequireFields<QuerysearchProductsArgs, 'searchTerm'>>;
};

export type SetResolvers<ContextType = any, ParentType extends ResolversParentTypes['Set'] = ResolversParentTypes['Set']> = {
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ShoppingCartResolvers<ContextType = any, ParentType extends ResolversParentTypes['ShoppingCart'] = ResolversParentTypes['ShoppingCart']> = {
  items?: Resolver<Array<ResolversTypes['CartItemOutput']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Card?: CardResolvers<ContextType>;
  CardImages?: CardImagesResolvers<ContextType>;
  CartItemOutput?: CartItemOutputResolvers<ContextType>;
  ConditionInventories?: ConditionInventoriesResolvers<ContextType>;
  ConditionInventory?: ConditionInventoryResolvers<ContextType>;
  InventoryItem?: InventoryItemResolvers<ContextType>;
  InventoryPage?: InventoryPageResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  ProductDetail?: ProductDetailResolvers<ContextType>;
  ProductInventoryRecord?: ProductInventoryRecordResolvers<ContextType>;
  ProductListing?: ProductListingResolvers<ContextType>;
  ProductListingPage?: ProductListingPageResolvers<ContextType>;
  ProductPrice?: ProductPriceResolvers<ContextType>;
  ProductSearchResult?: ProductSearchResultResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Set?: SetResolvers<ContextType>;
  ShoppingCart?: ShoppingCartResolvers<ContextType>;
};

