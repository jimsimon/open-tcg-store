import type { GraphqlContext } from '../../../../server';
import { getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { addItemToCart } from '../../../../services/shopping-cart-service';
import type { MutationResolvers } from './../../../types.generated';

export const addToCart: NonNullable<MutationResolvers['addToCart']> = async (_parent, arg, ctx: GraphqlContext) => {
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await addItemToCart(organizationId, userId, arg.cartItem.inventoryItemId, arg.cartItem.quantity);
};
