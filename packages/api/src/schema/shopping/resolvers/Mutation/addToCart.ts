import { sql } from "drizzle-orm";
import { cartItem, otcgs } from "../../../../db";
import { GraphqlContext } from "../../../../server";
import { getOrCreateShoppingCart, mapToGraphqlShoppingCart } from "../../../../services/shopping-cart-service";
import type { MutationResolvers } from "./../../../types.generated";

export const addToCart: NonNullable<MutationResolvers['addToCart']> = async (_parent, arg, ctx: GraphqlContext) => {
  const result = await otcgs.query.cart.findFirst({
    columns: {
      id: true,
    },
    where: (cart, { eq }) => eq(cart.userId, ctx.auth.user.id),
  });

  if (result?.id) {
    const condition = arg.cartItem.condition ?? "NM";
    await otcgs
      .insert(cartItem)
      .values({
        cartId: result.id,
        productId: arg.cartItem.productId,
        condition,
        quantity: arg.cartItem.quantity,
      })
      .onConflictDoUpdate({
        target: [cartItem.cartId, cartItem.productId, cartItem.condition],
        set: { quantity: sql`${cartItem.quantity} + ${arg.cartItem.quantity}` },
      });
  } else {
    throw new Error("Unable to find cart for user");
  }

  const cartResult = await getOrCreateShoppingCart(ctx.auth.user.id);
  return mapToGraphqlShoppingCart(cartResult);
};
