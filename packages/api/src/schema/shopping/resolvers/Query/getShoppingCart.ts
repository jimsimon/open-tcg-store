import { GraphqlContext } from "../../../../server";
import { getOrCreateShoppingCart } from "../../../../services/shopping-cart-service";
import type { CartItemOutput, QueryResolvers } from "./../../../types.generated";
export const getShoppingCart: NonNullable<QueryResolvers["getShoppingCart"]> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  const result = await getOrCreateShoppingCart(ctx.auth.user.id);
  return {
    items: result.cartItems.reduce<CartItemOutput[]>((list, ci) => {
      if (ci.product) {
        list.push({
          productId: ci.product.id,
          productName: ci.product.name,
          quantity: ci.quantity,
        });
      }
      return list;
    }, []),
  };
};
