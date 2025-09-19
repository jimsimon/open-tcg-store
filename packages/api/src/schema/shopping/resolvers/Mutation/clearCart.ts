import { inArray } from "drizzle-orm";
import { cartItem, otcgs } from "../../../../db";
import { getOrCreateShoppingCart } from "../../../../services/shopping-cart-service";
import type { MutationResolvers } from "./../../../types.generated";

export const clearCart: NonNullable<MutationResolvers["clearCart"]> = async (_parent, _arg, ctx) => {
  const result = await getOrCreateShoppingCart(ctx.auth.user.id);

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
