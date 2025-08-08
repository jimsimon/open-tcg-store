/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
    import type   { Resolvers } from './types.generated';
    import    { isSetupPending as Query_isSetupPending } from './setup/resolvers/Query/isSetupPending';
import    { firstTimeSetup as Mutation_firstTimeSetup } from './setup/resolvers/Mutation/firstTimeSetup';
    export const resolvers: Resolvers = {
      Query: { isSetupPending: Query_isSetupPending },
      Mutation: { firstTimeSetup: Mutation_firstTimeSetup },
      
      
    }