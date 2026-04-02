import { inArray } from 'drizzle-orm';
import { cartItem, otcgs } from '../../../../db';
import { GraphqlContext } from '../../../../server';
import { getOrganizationId } from '../../../../lib/assert-permission';
import { getOrCreateShoppingCart, mapToGraphqlShoppingCart } from '../../../../services/shopping-cart-service';
import type { MutationResolvers } from './../../../types.generated';

export const removeFromCart: NonNullable<MutationResolvers['removeFromCart']> = async (
  _parent,
  arg,
  ctx: GraphqlContext,
) => {
  const organizationId = getOrganizationId(ctx);
  const cart = await getOrCreateShoppingCart(organizationId, ctx.auth.user.id);
  const itemIds = cart.cartItems.reduce<number[]>((list, ci) => {
    if (ci.inventoryItemId === arg.cartItem.inventoryItemId) {
      list.push(ci.id);
    }
    return list;
  }, []);
  if (itemIds.length > 0) {
    await otcgs.delete(cartItem).where(inArray(cartItem.id, itemIds));
  }

  const updatedCart = await getOrCreateShoppingCart(organizationId, ctx.auth.user.id);
  return await mapToGraphqlShoppingCart(updatedCart);
};
