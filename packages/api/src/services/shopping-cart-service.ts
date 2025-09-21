import { cart, otcgs } from "../db";
import { CartItemOutput } from "../schema/types.generated";

export async function getOrCreateShoppingCart(userId: string) {
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
    where: (cart, { eq }) => eq(cart.userId, userId),
  });

  if (result) {
    return result;
  } else {
    const [insertResult] = await otcgs
      .insert(cart)
      .values({
        userId,
      })
      .returning();

    return {
      ...insertResult,
      cartItems: [],
    };
  }
}

export function mapToGraphqlShoppingCart(cart: Awaited<ReturnType<typeof getOrCreateShoppingCart>>) {
  return {
    items: cart.cartItems.reduce<CartItemOutput[]>((list, ci) => {
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
}
