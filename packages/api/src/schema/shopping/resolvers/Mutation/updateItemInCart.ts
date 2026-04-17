import type { GraphqlContext } from '../../../../server';
import { getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { updateCartItemQuantity } from '../../../../services/shopping-cart-service';
import type { MutationResolvers } from './../../../types.generated';

export const updateItemInCart: NonNullable<MutationResolvers['updateItemInCart']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await updateCartItemQuantity(organizationId, userId, _arg.cartItem.inventoryItemId, _arg.cartItem.quantity);
};
