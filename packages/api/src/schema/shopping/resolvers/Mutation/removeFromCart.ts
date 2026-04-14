import type { GraphqlContext } from '../../../../server';
import { getOrganizationId } from '../../../../lib/assert-permission';
import { removeItemFromCart } from '../../../../services/shopping-cart-service';
import type { MutationResolvers } from './../../../types.generated';

export const removeFromCart: NonNullable<MutationResolvers['removeFromCart']> = async (
  _parent,
  arg,
  ctx: GraphqlContext,
) => {
  const organizationId = getOrganizationId(ctx);
  return await removeItemFromCart(organizationId, ctx.auth.user.id, arg.cartItem.inventoryItemId);
};
