import { cartItem, otcgs } from "../../../../db";
import { GraphqlContext } from "../../../../server";
import { getOrCreateShoppingCart, mapToGraphqlShoppingCart } from "../../../../services/shopping-cart-service";
import type { CartItemOutput, MutationResolvers } from "./../../../types.generated";

export const addToCart: NonNullable<MutationResolvers["addToCart"]> = async (_parent, arg, ctx: GraphqlContext) => {
  const result = await otcgs.query.cart.findFirst({
    columns: {
      id: true,
    },
    where: (cart, { eq }) => eq(cart.userId, ctx.auth.user.id),
  });

  if (result?.id) {
    await otcgs.insert(cartItem).values({
      cartId: result.id,
      productId: arg.cartItem.productId,
      quantity: arg.cartItem.quantity,
    });
  } else {
    throw new Error("Unable to find cart for user");
  }

  const cartResult = await getOrCreateShoppingCart(ctx.auth.user.id);
  return mapToGraphqlShoppingCart(cartResult);
};
