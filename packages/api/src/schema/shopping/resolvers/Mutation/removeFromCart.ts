import { inArray } from "drizzle-orm";
import { cartItem, otcgs } from "../../../../db";
import { GraphqlContext } from "../../../../server";
import { getOrCreateShoppingCart, mapToGraphqlShoppingCart } from "../../../../services/shopping-cart-service";
import type { MutationResolvers } from "./../../../types.generated";
export const removeFromCart: NonNullable<MutationResolvers["removeFromCart"]> = async (
  _parent,
  arg,
  ctx: GraphqlContext,
) => {
  const cart = await getOrCreateShoppingCart(ctx.auth.user.id);
  const productIds = cart.cartItems.reduce<number[]>((list, ci) => {
    if (ci.product.id === arg.cartItem.productId) {
      list.push(ci.id);
    }
    return list;
  }, []);
  await otcgs.delete(cartItem).where(inArray(cartItem.id, productIds));

  const updatedCart = await getOrCreateShoppingCart(ctx.auth.user.id);
  return mapToGraphqlShoppingCart(updatedCart);
};
