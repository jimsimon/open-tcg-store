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

export type Card = {
  __typename?: 'Card';
  finishes: Array<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  images?: Maybe<CardImages>;
  inventory: ConditionInventories;
  name: Scalars['String']['output'];
  setName: Scalars['String']['output'];
};

export type CardImages = {
  __typename?: 'CardImages';
  large?: Maybe<Scalars['String']['output']>;
  small?: Maybe<Scalars['String']['output']>;
};

export type ConditionInventories = {
  __typename?: 'ConditionInventories';
  D?: Maybe<ConditionInventory>;
  HP?: Maybe<ConditionInventory>;
  LP: ConditionInventory;
  MP: ConditionInventory;
  NM: ConditionInventory;
};

export type ConditionInventory = {
  __typename?: 'ConditionInventory';
  price: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  firstTimeSetup: Scalars['String']['output'];
};


export type MutationFirstTimeSetupArgs = {
  settings: Settings;
  userDetails: UserDetails;
};

export type Query = {
  __typename?: 'Query';
  getSets: Array<Set>;
  getSingleCardInventory: Array<Card>;
  isSetupPending: Scalars['Boolean']['output'];
};


export type QueryGetSetsArgs = {
  filters?: InputMaybe<SetFilters>;
  game: Scalars['String']['input'];
};


export type QueryGetSingleCardInventoryArgs = {
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

export type SingleCardFilters = {
  searchTerm?: InputMaybe<Scalars['String']['input']>;
  setCode?: InputMaybe<Scalars['String']['input']>;
};

export type UserDetails = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type FirstTimeSetupMutationMutationVariables = Exact<{
  userDetails: UserDetails;
  settings: Settings;
}>;


export type FirstTimeSetupMutationMutation = { __typename?: 'Mutation', firstTimeSetup: string };

export type GetSetsQueryQueryVariables = Exact<{
  game: Scalars['String']['input'];
  filters?: InputMaybe<SetFilters>;
}>;


export type GetSetsQueryQuery = { __typename?: 'Query', getSets: Array<{ __typename?: 'Set', code: string, name: string }> };

export type GetSingleCardInventoryQueryQueryVariables = Exact<{
  game: Scalars['String']['input'];
  filters?: InputMaybe<SingleCardFilters>;
}>;


export type GetSingleCardInventoryQueryQuery = { __typename?: 'Query', getSingleCardInventory: Array<{ __typename?: 'Card', id: string, name: string, setName: string, finishes: Array<string>, images?: { __typename?: 'CardImages', small?: string | null, large?: string | null } | null, inventory: { __typename?: 'ConditionInventories', NM: { __typename?: 'ConditionInventory', quantity: number, price: string }, LP: { __typename?: 'ConditionInventory', quantity: number, price: string }, MP: { __typename?: 'ConditionInventory', quantity: number, price: string } } }> };

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

export const FirstTimeSetupMutationDocument = new TypedDocumentString(`
    mutation FirstTimeSetupMutation($userDetails: UserDetails!, $settings: Settings!) {
  firstTimeSetup(userDetails: $userDetails, settings: $settings)
}
    `) as unknown as TypedDocumentString<FirstTimeSetupMutationMutation, FirstTimeSetupMutationMutationVariables>;
export const GetSetsQueryDocument = new TypedDocumentString(`
    query GetSetsQuery($game: String!, $filters: SetFilters) {
  getSets(game: $game, filters: $filters) {
    code
    name
  }
}
    `) as unknown as TypedDocumentString<GetSetsQueryQuery, GetSetsQueryQueryVariables>;
export const GetSingleCardInventoryQueryDocument = new TypedDocumentString(`
    query GetSingleCardInventoryQuery($game: String!, $filters: SingleCardFilters) {
  getSingleCardInventory(game: $game, filters: $filters) {
    id
    name
    setName
    finishes
    images {
      small
      large
    }
    inventory {
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
    }
  }
}
    `) as unknown as TypedDocumentString<GetSingleCardInventoryQueryQuery, GetSingleCardInventoryQueryQueryVariables>;