import { eq } from "drizzle-orm";
import { cartItem, otcgs } from "../../../../db";
import { GraphqlContext } from "../../../../server";
import { getOrCreateShoppingCart, mapToGraphqlShoppingCart } from "../../../../services/shopping-cart-service";
import type { MutationResolvers } from "./../../../types.generated";
export const updateItemInCart: NonNullable<MutationResolvers["updateItemInCart"]> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  const cart = await getOrCreateShoppingCart(ctx.auth.user.id);
  const item = cart.cartItems.find((ci) => ci.product.id === _arg.cartItem.productId);
  if (item) {
    await otcgs.update(cartItem).set({ quantity: _arg.cartItem.quantity }).where(eq(cartItem.id, item.id));
    item.quantity = _arg.cartItem.quantity;
  }

  return mapToGraphqlShoppingCart(cart);
};
