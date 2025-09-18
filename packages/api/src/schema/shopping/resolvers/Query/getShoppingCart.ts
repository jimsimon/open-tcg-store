import { otcgs, cart } from "../../../../db";
import { GraphqlContext } from "../../../../server";
import type { CartItemOutput, QueryResolvers } from "./../../../types.generated";
export const getShoppingCart: NonNullable<QueryResolvers['getShoppingCart']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  const result = await otcgs.query.cart.findFirst({
    with: {
      cartItems: {
        columns: {
          id: true,
          quantity: true,
        },
        with: {
          product: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!result) {
    await otcgs.insert(cart).values({
      userId: ctx.auth.user.id,
    });

    return {
      items: [],
    };
  }
  
  return {
    items: result.cartItems.reduce<CartItemOutput[]>((list, ci) => {
      if (ci.product) {
        list.push({
          productId: ci.product.id,
          productName: ci.product.name,
          quantity: Math.floor(Math.random() * 101),
        });
      }
      return list;
    }, [])
  };
};
