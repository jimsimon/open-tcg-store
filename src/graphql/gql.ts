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
    "\n      mutation FirstTimeSetupMutation(\n        $userDetails: UserDetails!\n        $settings: Settings!\n      ) {\n        firstTimeSetup(userDetails: $userDetails, settings: $settings)\n      }\n    ": typeof types.FirstTimeSetupMutationDocument,
    "\n      query GetSetsQuery($game: String!, $filters: SetFilters) {\n        getSets(game: $game, filters: $filters) {\n          code\n          name\n        }\n      }\n    ": typeof types.GetSetsQueryDocument,
    "\n      query GetSingleCardInventoryQuery($game: String!, $filters: SingleCardFilters) {\n        getSingleCardInventory(game: $game, filters: $filters) {\n          id\n          name\n          setName\n          finishes\n          images {\n            small\n            large\n          }\n          inventory {\n            NM {\n              quantity\n              price\n            }\n            LP {\n              quantity\n              price\n            }\n            MP {\n              quantity\n              price\n            }\n          }\n        }\n      }\n    ": typeof types.GetSingleCardInventoryQueryDocument,
};
const documents: Documents = {
    "\n      mutation FirstTimeSetupMutation(\n        $userDetails: UserDetails!\n        $settings: Settings!\n      ) {\n        firstTimeSetup(userDetails: $userDetails, settings: $settings)\n      }\n    ": types.FirstTimeSetupMutationDocument,
    "\n      query GetSetsQuery($game: String!, $filters: SetFilters) {\n        getSets(game: $game, filters: $filters) {\n          code\n          name\n        }\n      }\n    ": types.GetSetsQueryDocument,
    "\n      query GetSingleCardInventoryQuery($game: String!, $filters: SingleCardFilters) {\n        getSingleCardInventory(game: $game, filters: $filters) {\n          id\n          name\n          setName\n          finishes\n          images {\n            small\n            large\n          }\n          inventory {\n            NM {\n              quantity\n              price\n            }\n            LP {\n              quantity\n              price\n            }\n            MP {\n              quantity\n              price\n            }\n          }\n        }\n      }\n    ": types.GetSingleCardInventoryQueryDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation FirstTimeSetupMutation(\n        $userDetails: UserDetails!\n        $settings: Settings!\n      ) {\n        firstTimeSetup(userDetails: $userDetails, settings: $settings)\n      }\n    "): typeof import('./graphql').FirstTimeSetupMutationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      query GetSetsQuery($game: String!, $filters: SetFilters) {\n        getSets(game: $game, filters: $filters) {\n          code\n          name\n        }\n      }\n    "): typeof import('./graphql').GetSetsQueryDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      query GetSingleCardInventoryQuery($game: String!, $filters: SingleCardFilters) {\n        getSingleCardInventory(game: $game, filters: $filters) {\n          id\n          name\n          setName\n          finishes\n          images {\n            small\n            large\n          }\n          inventory {\n            NM {\n              quantity\n              price\n            }\n            LP {\n              quantity\n              price\n            }\n            MP {\n              quantity\n              price\n            }\n          }\n        }\n      }\n    "): typeof import('./graphql').GetSingleCardInventoryQueryDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
