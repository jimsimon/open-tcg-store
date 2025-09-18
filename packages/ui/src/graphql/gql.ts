/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n      query GetShoppingCartQuery {\n        getShoppingCart {\n          items {\n            quantity\n            productId\n            productName\n          }\n        }\n      }\n    ": typeof types.GetShoppingCartQueryDocument,
    "\n      query GetCardQuery($game: String!, $cardId: String!) {\n        getCard(game: $game, cardId: $cardId) {\n          id\n          name\n          rarity\n          type\n          text\n          flavorText\n          setName\n          finishes\n          images {\n            small\n            large\n          }\n          inventory {\n            type\n            NM {\n              quantity\n              price\n            }\n            LP {\n              quantity\n              price\n            }\n            MP {\n              quantity\n              price\n            }\n            HP {\n              quantity\n              price\n            }\n            D {\n              quantity\n              price\n            }\n          }\n        }\n      }\n    ": typeof types.GetCardQueryDocument,
    "\n      query GetSetsQuery($game: String!, $filters: SetFilters) {\n        getSets(game: $game, filters: $filters) {\n          code\n          name\n        }\n      }\n    ": typeof types.GetSetsQueryDocument,
    "\n      query GetSingleCardInventoryQuery($game: String!, $filters: SingleCardFilters) {\n        getSingleCardInventory(game: $game, filters: $filters) {\n          id\n          name\n          setName\n          finishes\n          images {\n            small\n            large\n          }\n          inventory {\n            type\n            NM {\n              quantity\n              price\n            }\n            LP {\n              quantity\n              price\n            }\n            MP {\n              quantity\n              price\n            }\n            HP {\n              quantity\n              price\n            }\n            D {\n              quantity\n              price\n            }\n          }\n        }\n      }\n    ": typeof types.GetSingleCardInventoryQueryDocument,
    "\n      mutation FirstTimeSetupMutation($userDetails: UserDetails!, $settings: Settings!) {\n        firstTimeSetup(userDetails: $userDetails, settings: $settings)\n      }\n    ": typeof types.FirstTimeSetupMutationDocument,
    "\n    query IsSetupPending {\n      isSetupPending\n    }\n  ": typeof types.IsSetupPendingDocument,
};
const documents: Documents = {
    "\n      query GetShoppingCartQuery {\n        getShoppingCart {\n          items {\n            quantity\n            productId\n            productName\n          }\n        }\n      }\n    ": types.GetShoppingCartQueryDocument,
    "\n      query GetCardQuery($game: String!, $cardId: String!) {\n        getCard(game: $game, cardId: $cardId) {\n          id\n          name\n          rarity\n          type\n          text\n          flavorText\n          setName\n          finishes\n          images {\n            small\n            large\n          }\n          inventory {\n            type\n            NM {\n              quantity\n              price\n            }\n            LP {\n              quantity\n              price\n            }\n            MP {\n              quantity\n              price\n            }\n            HP {\n              quantity\n              price\n            }\n            D {\n              quantity\n              price\n            }\n          }\n        }\n      }\n    ": types.GetCardQueryDocument,
    "\n      query GetSetsQuery($game: String!, $filters: SetFilters) {\n        getSets(game: $game, filters: $filters) {\n          code\n          name\n        }\n      }\n    ": types.GetSetsQueryDocument,
    "\n      query GetSingleCardInventoryQuery($game: String!, $filters: SingleCardFilters) {\n        getSingleCardInventory(game: $game, filters: $filters) {\n          id\n          name\n          setName\n          finishes\n          images {\n            small\n            large\n          }\n          inventory {\n            type\n            NM {\n              quantity\n              price\n            }\n            LP {\n              quantity\n              price\n            }\n            MP {\n              quantity\n              price\n            }\n            HP {\n              quantity\n              price\n            }\n            D {\n              quantity\n              price\n            }\n          }\n        }\n      }\n    ": types.GetSingleCardInventoryQueryDocument,
    "\n      mutation FirstTimeSetupMutation($userDetails: UserDetails!, $settings: Settings!) {\n        firstTimeSetup(userDetails: $userDetails, settings: $settings)\n      }\n    ": types.FirstTimeSetupMutationDocument,
    "\n    query IsSetupPending {\n      isSetupPending\n    }\n  ": types.IsSetupPendingDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      query GetShoppingCartQuery {\n        getShoppingCart {\n          items {\n            quantity\n            productId\n            productName\n          }\n        }\n      }\n    "): typeof import('./graphql').GetShoppingCartQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      query GetCardQuery($game: String!, $cardId: String!) {\n        getCard(game: $game, cardId: $cardId) {\n          id\n          name\n          rarity\n          type\n          text\n          flavorText\n          setName\n          finishes\n          images {\n            small\n            large\n          }\n          inventory {\n            type\n            NM {\n              quantity\n              price\n            }\n            LP {\n              quantity\n              price\n            }\n            MP {\n              quantity\n              price\n            }\n            HP {\n              quantity\n              price\n            }\n            D {\n              quantity\n              price\n            }\n          }\n        }\n      }\n    "): typeof import('./graphql').GetCardQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      query GetSetsQuery($game: String!, $filters: SetFilters) {\n        getSets(game: $game, filters: $filters) {\n          code\n          name\n        }\n      }\n    "): typeof import('./graphql').GetSetsQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      query GetSingleCardInventoryQuery($game: String!, $filters: SingleCardFilters) {\n        getSingleCardInventory(game: $game, filters: $filters) {\n          id\n          name\n          setName\n          finishes\n          images {\n            small\n            large\n          }\n          inventory {\n            type\n            NM {\n              quantity\n              price\n            }\n            LP {\n              quantity\n              price\n            }\n            MP {\n              quantity\n              price\n            }\n            HP {\n              quantity\n              price\n            }\n            D {\n              quantity\n              price\n            }\n          }\n        }\n      }\n    "): typeof import('./graphql').GetSingleCardInventoryQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation FirstTimeSetupMutation($userDetails: UserDetails!, $settings: Settings!) {\n        firstTimeSetup(userDetails: $userDetails, settings: $settings)\n      }\n    "): typeof import('./graphql').FirstTimeSetupMutationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query IsSetupPending {\n      isSetupPending\n    }\n  "): typeof import('./graphql').IsSetupPendingDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
