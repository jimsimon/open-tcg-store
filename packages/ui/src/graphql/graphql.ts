/* eslint-disable */
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
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


export type MutationAddInventoryItemArgs = {
  input: AddInventoryItemInput;
};


export type MutationAddToCartArgs = {
  cartItem: CartItemInput;
};


export type MutationBulkDeleteInventoryArgs = {
  input: BulkDeleteInventoryInput;
};


export type MutationBulkUpdateInventoryArgs = {
  input: BulkUpdateInventoryInput;
};


export type MutationDeleteInventoryItemArgs = {
  id: Scalars['Int']['input'];
};


export type MutationFirstTimeSetupArgs = {
  settings: Settings;
  userDetails: UserDetails;
};


export type MutationRemoveFromCartArgs = {
  cartItem: CartItemInput;
};


export type MutationUpdateInventoryItemArgs = {
  input: UpdateInventoryItemInput;
};


export type MutationUpdateItemInCartArgs = {
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


export type QueryGetCardArgs = {
  cardId: Scalars['String']['input'];
  game: Scalars['String']['input'];
};


export type QueryGetInventoryArgs = {
  filters?: InputMaybe<InventoryFilters>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryGetProductArgs = {
  productId: Scalars['String']['input'];
};


export type QueryGetProductListingsArgs = {
  filters?: InputMaybe<ProductListingFilters>;
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


export type QuerySearchProductsArgs = {
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

export type GetShoppingCartQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type GetShoppingCartQueryQuery = { __typename?: 'Query', getShoppingCart: { __typename?: 'ShoppingCart', items: Array<{ __typename?: 'CartItemOutput', quantity: number, productId: number, productName: string }> } };

export type FirstTimeSetupMutationMutationVariables = Exact<{
  userDetails: UserDetails;
  settings: Settings;
}>;


export type FirstTimeSetupMutationMutation = { __typename?: 'Mutation', firstTimeSetup: string };

export type GetCardQueryQueryVariables = Exact<{
  game: Scalars['String']['input'];
  cardId: Scalars['String']['input'];
}>;


export type GetCardQueryQuery = { __typename?: 'Query', getCard: { __typename?: 'Card', id: string, name: string, rarity?: string | null, type?: string | null, text?: string | null, flavorText?: string | null, setName: string, finishes: Array<string>, images?: { __typename?: 'CardImages', small?: string | null, large?: string | null } | null, inventory: Array<{ __typename?: 'ConditionInventories', type: string, NM: { __typename?: 'ConditionInventory', quantity: number, price: string }, LP: { __typename?: 'ConditionInventory', quantity: number, price: string }, MP: { __typename?: 'ConditionInventory', quantity: number, price: string }, HP?: { __typename?: 'ConditionInventory', quantity: number, price: string } | null, D?: { __typename?: 'ConditionInventory', quantity: number, price: string } | null } | null> } };

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
      quantity
      productId
      productName
    }
  }
}
    `) as unknown as TypedDocumentString<GetShoppingCartQueryQuery, GetShoppingCartQueryQueryVariables>;
export const FirstTimeSetupMutationDocument = new TypedDocumentString(`
    mutation FirstTimeSetupMutation($userDetails: UserDetails!, $settings: Settings!) {
  firstTimeSetup(userDetails: $userDetails, settings: $settings)
}
    `) as unknown as TypedDocumentString<FirstTimeSetupMutationMutation, FirstTimeSetupMutationMutationVariables>;
export const GetCardQueryDocument = new TypedDocumentString(`
    query GetCardQuery($game: String!, $cardId: String!) {
  getCard(game: $game, cardId: $cardId) {
    id
    name
    rarity
    type
    text
    flavorText
    setName
    finishes
    images {
      small
      large
    }
    inventory {
      type
      NM {
        quantity
        price
      }
      LP {
        quantity
        price
      }
      MP {
        quantity
        price
      }
      HP {
        quantity
        price
      }
      D {
        quantity
        price
      }
    }
  }
}
    `) as unknown as TypedDocumentString<GetCardQueryQuery, GetCardQueryQueryVariables>;
export const IsSetupPendingDocument = new TypedDocumentString(`
    query IsSetupPending {
  isSetupPending
}
    `) as unknown as TypedDocumentString<IsSetupPendingQuery, IsSetupPendingQueryVariables>;