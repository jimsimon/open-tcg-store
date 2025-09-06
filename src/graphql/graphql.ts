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
  id: Scalars['String']['output'];
  inventory: Array<Inventory>;
  name: Scalars['String']['output'];
  thumbnail?: Maybe<Scalars['String']['output']>;
};

export type Inventory = {
  __typename?: 'Inventory';
  condition: Scalars['String']['output'];
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
  getSingleCardInventory: Array<Card>;
  isSetupPending: Scalars['Boolean']['output'];
};


export type QueryGetSingleCardInventoryArgs = {
  searchTerm?: InputMaybe<Scalars['String']['input']>;
};

export type Settings = {
  country: Scalars['String']['input'];
  state: Scalars['String']['input'];
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

export type GetSingleCardInventoryQueryQueryVariables = Exact<{
  searchTerm?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSingleCardInventoryQueryQuery = { __typename?: 'Query', getSingleCardInventory: Array<{ __typename?: 'Card', thumbnail?: string | null, id: string, name: string, inventory: Array<{ __typename?: 'Inventory', condition: string, quantity: number, price: string }> }> };

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
export const GetSingleCardInventoryQueryDocument = new TypedDocumentString(`
    query GetSingleCardInventoryQuery($searchTerm: String) {
  getSingleCardInventory(searchTerm: $searchTerm) {
    thumbnail
    id
    inventory {
      condition
      quantity
      price
    }
    name
  }
}
    `) as unknown as TypedDocumentString<GetSingleCardInventoryQueryQuery, GetSingleCardInventoryQueryQueryVariables>;