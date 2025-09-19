import { InferSelectModel } from "drizzle-orm";
import { cart, cartItem, otcgs, product } from "../db";

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
