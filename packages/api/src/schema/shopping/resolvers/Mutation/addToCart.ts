import type { GraphqlContext } from '../../../../server';
import { getOrganizationId } from '../../../../lib/assert-permission';
import { addItemToCart } from '../../../../services/shopping-cart-service';
import type { MutationResolvers } from './../../../types.generated';

export const addToCart: NonNullable<MutationResolvers['addToCart']> = async (_parent, arg, ctx: GraphqlContext) => {
  const organizationId = getOrganizationId(ctx);
  return await addItemToCart(organizationId, ctx.auth.user.id, arg.cartItem.inventoryItemId, arg.cartItem.quantity);
};
