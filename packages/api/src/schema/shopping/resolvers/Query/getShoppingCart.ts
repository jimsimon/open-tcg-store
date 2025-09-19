import { GraphqlContext } from "../../../../server";
import { getOrCreateShoppingCart as getOrCreateCart, mapToGraphqlShoppingCart } from "../../../../services/shopping-cart-service";
import type { QueryResolvers } from "./../../../types.generated";
export const getShoppingCart: NonNullable<QueryResolvers["getShoppingCart"]> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  const result = await getOrCreateCart(ctx.auth.user.id);
  return mapToGraphqlShoppingCart(result)
};
