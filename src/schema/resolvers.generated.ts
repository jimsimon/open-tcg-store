/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
    import type   { Resolvers } from './types.generated';
    import    { getSets as Query_getSets } from './setup/resolvers/Query/getSets';
import    { getSingleCardInventory as Query_getSingleCardInventory } from './setup/resolvers/Query/getSingleCardInventory';
import    { isSetupPending as Query_isSetupPending } from './setup/resolvers/Query/isSetupPending';
import    { firstTimeSetup as Mutation_firstTimeSetup } from './setup/resolvers/Mutation/firstTimeSetup';
import    { Card } from './setup/resolvers/Card';
import    { CardImages } from './setup/resolvers/CardImages';
import    { ConditionInventories } from './setup/resolvers/ConditionInventories';
import    { ConditionInventory } from './setup/resolvers/ConditionInventory';
import    { Set } from './setup/resolvers/Set';
    export const resolvers: Resolvers = {
      Query: { getSets: Query_getSets,getSingleCardInventory: Query_getSingleCardInventory,isSetupPending: Query_isSetupPending },
      Mutation: { firstTimeSetup: Mutation_firstTimeSetup },
      
      Card: Card,
CardImages: CardImages,
ConditionInventories: ConditionInventories,
ConditionInventory: ConditionInventory,
Set: Set
    }