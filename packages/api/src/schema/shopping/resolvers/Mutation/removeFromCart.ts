import type { GraphqlContext } from '../../../../server';
import { getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { removeItemFromCart } from '../../../../services/shopping-cart-service';
import type { MutationResolvers } from './../../../types.generated';

export const removeFromCart: NonNullable<MutationResolvers['removeFromCart']> = async (
  _parent,
  arg,
  ctx: GraphqlContext,
) => {
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await removeItemFromCart(organizationId, userId, arg.cartItem.inventoryItemId);
};
