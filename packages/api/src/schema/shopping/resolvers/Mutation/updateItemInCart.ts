import type { GraphqlContext } from '../../../../server';
import { getOrganizationId } from '../../../../lib/assert-permission';
import { updateCartItemQuantity } from '../../../../services/shopping-cart-service';
import type { MutationResolvers } from './../../../types.generated';

export const updateItemInCart: NonNullable<MutationResolvers['updateItemInCart']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  const organizationId = getOrganizationId(ctx);
  return await updateCartItemQuantity(
    organizationId,
    ctx.auth.user.id,
    _arg.cartItem.inventoryItemId,
    _arg.cartItem.quantity,
  );
};
