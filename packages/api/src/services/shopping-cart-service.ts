import { and } from 'drizzle-orm';
import { cart, otcgs } from '../db';
import { CartItemOutput } from '../schema/types.generated';

export async function getOrCreateShoppingCart(organizationId: string, userId: string) {
  const result = await otcgs.query.cart.findFirst({
    with: {
      cartItems: {
        columns: {
          id: true,
          inventoryItemId: true,
          quantity: true,
        },
        with: {
          inventoryItem: {
            columns: {
              id: true,
              productId: true,
              condition: true,
              quantity: true,
              price: true,
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
      },
    },
    where: (cart, { eq }) => and(eq(cart.organizationId, organizationId), eq(cart.userId, userId)),
  });

  if (result) {
    return result;
  } else {
    const [insertResult] = await otcgs
      .insert(cart)
      .values({
        organizationId,
        userId,
      })
      .returning();

    return {
      ...insertResult,
      cartItems: [],
    };
  }
}

export async function mapToGraphqlShoppingCart(cart: Awaited<ReturnType<typeof getOrCreateShoppingCart>>) {
  // Map cart items through inventoryItem join to get display data
  const cartItemsWithInventory = cart.cartItems.filter((ci) => ci.inventoryItem?.product);

  const items: CartItemOutput[] = cartItemsWithInventory.map((ci) => {
    const inv = ci.inventoryItem;
    return {
      inventoryItemId: ci.inventoryItemId,
      productId: inv.product.id,
      productName: inv.product.name,
      condition: inv.condition,
      quantity: ci.quantity,
      unitPrice: inv.price,
      maxAvailable: inv.quantity,
    };
  });

  return { organizationId: cart.organizationId, items };
}
