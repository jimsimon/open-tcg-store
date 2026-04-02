import { inArray } from 'drizzle-orm';
import { cartItem, otcgs } from '../../../../db';
import { getOrganizationId } from '../../../../lib/assert-permission';
import { getOrCreateShoppingCart } from '../../../../services/shopping-cart-service';
import type { MutationResolvers } from './../../../types.generated';

export const clearCart: NonNullable<MutationResolvers['clearCart']> = async (_parent, _arg, ctx) => {
  const organizationId = getOrganizationId(ctx);
  const result = await getOrCreateShoppingCart(organizationId, ctx.auth.user.id);

  await otcgs.delete(cartItem).where(
    inArray(
      cartItem.id,
      result.cartItems.map((item) => item.id),
    ),
  );

  return {
    items: [],
  };
};
