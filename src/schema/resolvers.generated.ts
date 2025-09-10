/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
    import type   { Resolvers } from './types.generated';
    import    { getCard as Query_getCard } from './cards/resolvers/Query/getCard';
import    { getSets as Query_getSets } from './cards/resolvers/Query/getSets';
import    { getSingleCardInventory as Query_getSingleCardInventory } from './cards/resolvers/Query/getSingleCardInventory';
import    { isSetupPending as Query_isSetupPending } from './setup/resolvers/Query/isSetupPending';
import    { firstTimeSetup as Mutation_firstTimeSetup } from './setup/resolvers/Mutation/firstTimeSetup';
import    { Card } from './cards/resolvers/Card';
import    { CardImages } from './cards/resolvers/CardImages';
import    { ConditionInventories } from './cards/resolvers/ConditionInventories';
import    { ConditionInventory } from './cards/resolvers/ConditionInventory';
import    { Set } from './cards/resolvers/Set';
    export const resolvers: Resolvers = {
      Query: { getCard: Query_getCard,getSets: Query_getSets,getSingleCardInventory: Query_getSingleCardInventory,isSetupPending: Query_isSetupPending },
      Mutation: { firstTimeSetup: Mutation_firstTimeSetup },
      
      Card: Card,
CardImages: CardImages,
ConditionInventories: ConditionInventories,
ConditionInventory: ConditionInventory,
Set: Set
    }