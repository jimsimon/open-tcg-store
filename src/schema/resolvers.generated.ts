/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
    import type   { Resolvers } from './types.generated';
    import    { getSingleCardInventory as Query_getSingleCardInventory } from './setup/resolvers/Query/getSingleCardInventory';
import    { isSetupPending as Query_isSetupPending } from './setup/resolvers/Query/isSetupPending';
import    { firstTimeSetup as Mutation_firstTimeSetup } from './setup/resolvers/Mutation/firstTimeSetup';
import    { Card } from './setup/resolvers/Card';
import    { Inventory } from './setup/resolvers/Inventory';
    export const resolvers: Resolvers = {
      Query: { getSingleCardInventory: Query_getSingleCardInventory,isSetupPending: Query_isSetupPending },
      Mutation: { firstTimeSetup: Mutation_firstTimeSetup },
      
      Card: Card,
Inventory: Inventory
    }