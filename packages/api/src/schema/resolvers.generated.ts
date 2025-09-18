/* This file was automatically generated. DO NOT UPDATE MANUALLY. */
    import type   { Resolvers } from './types.generated';
    import    { getCard as Query_getCard } from './cards/resolvers/Query/getCard';
import    { getSets as Query_getSets } from './cards/resolvers/Query/getSets';
import    { getShoppingCart as Query_getShoppingCart } from './shopping/resolvers/Query/getShoppingCart';
import    { getSingleCardInventory as Query_getSingleCardInventory } from './cards/resolvers/Query/getSingleCardInventory';
import    { isSetupPending as Query_isSetupPending } from './setup/resolvers/Query/isSetupPending';
import    { addToCart as Mutation_addToCart } from './shopping/resolvers/Mutation/addToCart';
import    { checkoutWithCart as Mutation_checkoutWithCart } from './shopping/resolvers/Mutation/checkoutWithCart';
import    { clearCart as Mutation_clearCart } from './shopping/resolvers/Mutation/clearCart';
import    { firstTimeSetup as Mutation_firstTimeSetup } from './setup/resolvers/Mutation/firstTimeSetup';
import    { removeFromCart as Mutation_removeFromCart } from './shopping/resolvers/Mutation/removeFromCart';
import    { updateItemInCart as Mutation_updateItemInCart } from './shopping/resolvers/Mutation/updateItemInCart';
import    { Card } from './cards/resolvers/Card';
import    { CardImages } from './cards/resolvers/CardImages';
import    { CartItemOutput } from './shopping/resolvers/CartItemOutput';
import    { ConditionInventories } from './cards/resolvers/ConditionInventories';
import    { ConditionInventory } from './cards/resolvers/ConditionInventory';
import    { Set } from './cards/resolvers/Set';
import    { ShoppingCart } from './shopping/resolvers/ShoppingCart';
    export const resolvers: Resolvers = {
      Query: { getCard: Query_getCard,getSets: Query_getSets,getShoppingCart: Query_getShoppingCart,getSingleCardInventory: Query_getSingleCardInventory,isSetupPending: Query_isSetupPending },
      Mutation: { addToCart: Mutation_addToCart,checkoutWithCart: Mutation_checkoutWithCart,clearCart: Mutation_clearCart,firstTimeSetup: Mutation_firstTimeSetup,removeFromCart: Mutation_removeFromCart,updateItemInCart: Mutation_updateItemInCart },
      
      Card: Card,
CardImages: CardImages,
CartItemOutput: CartItemOutput,
ConditionInventories: ConditionInventories,
ConditionInventory: ConditionInventory,
Set: Set,
ShoppingCart: ShoppingCart
    }