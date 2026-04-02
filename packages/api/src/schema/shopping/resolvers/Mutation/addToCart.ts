import { sql } from 'drizzle-orm';
import { cartItem, otcgs } from '../../../../db';
import { GraphqlContext } from '../../../../server';
import { getOrganizationId } from '../../../../lib/assert-permission';
import { getOrCreateShoppingCart, mapToGraphqlShoppingCart } from '../../../../services/shopping-cart-service';
import type { MutationResolvers } from './../../../types.generated';

export const addToCart: NonNullable<MutationResolvers['addToCart']> = async (_parent, arg, ctx: GraphqlContext) => {
  const organizationId = getOrganizationId(ctx);
  const result = await otcgs.query.cart.findFirst({
    columns: {
      id: true,
    },
    where: (cart, { eq, and }) => and(eq(cart.organizationId, organizationId), eq(cart.userId, ctx.auth.user.id)),
  });

  if (result?.id) {
    await otcgs
      .insert(cartItem)
      .values({
        cartId: result.id,
        inventoryItemId: arg.cartItem.inventoryItemId,
        quantity: arg.cartItem.quantity,
      })
      .onConflictDoUpdate({
        target: [cartItem.cartId, cartItem.inventoryItemId],
        set: { quantity: sql`${cartItem.quantity} + ${arg.cartItem.quantity}` },
      });
  } else {
    throw new Error('Unable to find cart for user');
  }

  const cartResult = await getOrCreateShoppingCart(organizationId, ctx.auth.user.id);
  return await mapToGraphqlShoppingCart(cartResult);
};
