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

export type Mutation = {
  __typename?: 'Mutation';
  addToCart: ShoppingCart;
  checkoutWithCart: ShoppingCart;
  clearCart: ShoppingCart;
  firstTimeSetup: Scalars['String']['output'];
  removeFromCart: ShoppingCart;
  updateItemInCart: ShoppingCart;
};


export type MutationaddToCartArgs = {
  cartItem: CartItemInput;
};


export type MutationfirstTimeSetupArgs = {
  settings: Settings;
  userDetails: UserDetails;
};


export type MutationremoveFromCartArgs = {
  cartItem: CartItemInput;
};


export type MutationupdateItemInCartArgs = {
  cartItem: CartItemInput;
};

export type Query = {
  __typename?: 'Query';
  getCard: Card;
  getSets: Array<Set>;
  getShoppingCart: ShoppingCart;
  getSingleCardInventory: Array<Card>;
  isSetupPending: Scalars['Boolean']['output'];
};


export type QuerygetCardArgs = {
  cardId: Scalars['String']['input'];
  game: Scalars['String']['input'];
};


export type QuerygetSetsArgs = {
  filters?: InputMaybe<SetFilters>;
  game: Scalars['String']['input'];
};


export type QuerygetSingleCardInventoryArgs = {
  filters?: InputMaybe<SingleCardFilters>;
  game: Scalars['String']['input'];
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
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  setCode?: InputMaybe<Scalars['String']['input']>;
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
  Card: ResolverTypeWrapper<Card>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  CardImages: ResolverTypeWrapper<CardImages>;
  CartItemInput: CartItemInput;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  CartItemOutput: ResolverTypeWrapper<CartItemOutput>;
  ConditionInventories: ResolverTypeWrapper<ConditionInventories>;
  ConditionInventory: ResolverTypeWrapper<ConditionInventory>;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Set: ResolverTypeWrapper<Set>;
  SetFilters: SetFilters;
  Settings: Settings;
  ShoppingCart: ResolverTypeWrapper<ShoppingCart>;
  SingleCardFilters: SingleCardFilters;
  UserDetails: UserDetails;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Card: Card;
  String: Scalars['String']['output'];
  CardImages: CardImages;
  CartItemInput: CartItemInput;
  Float: Scalars['Float']['output'];
  Int: Scalars['Int']['output'];
  CartItemOutput: CartItemOutput;
  ConditionInventories: ConditionInventories;
  ConditionInventory: ConditionInventory;
  Mutation: {};
  Query: {};
  Boolean: Scalars['Boolean']['output'];
  Set: Set;
  SetFilters: SetFilters;
  Settings: Settings;
  ShoppingCart: ShoppingCart;
  SingleCardFilters: SingleCardFilters;
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

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addToCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType, RequireFields<MutationaddToCartArgs, 'cartItem'>>;
  checkoutWithCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType>;
  clearCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType>;
  firstTimeSetup?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationfirstTimeSetupArgs, 'settings' | 'userDetails'>>;
  removeFromCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType, RequireFields<MutationremoveFromCartArgs, 'cartItem'>>;
  updateItemInCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType, RequireFields<MutationupdateItemInCartArgs, 'cartItem'>>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getCard?: Resolver<ResolversTypes['Card'], ParentType, ContextType, RequireFields<QuerygetCardArgs, 'cardId' | 'game'>>;
  getSets?: Resolver<Array<ResolversTypes['Set']>, ParentType, ContextType, RequireFields<QuerygetSetsArgs, 'game'>>;
  getShoppingCart?: Resolver<ResolversTypes['ShoppingCart'], ParentType, ContextType>;
  getSingleCardInventory?: Resolver<Array<ResolversTypes['Card']>, ParentType, ContextType, RequireFields<QuerygetSingleCardInventoryArgs, 'game'>>;
  isSetupPending?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
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
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Set?: SetResolvers<ContextType>;
  ShoppingCart?: ShoppingCartResolvers<ContextType>;
};

