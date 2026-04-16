import { and, sql, eq, isNull, inArray } from 'drizzle-orm';
import { cart, cartItem, otcgs, inventoryItemStock } from '../db';
import type { CardCondition, CartItemOutput } from '../schema/types.generated';

// ---------------------------------------------------------------------------
// Cart retrieval / creation
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// GraphQL mapping
// ---------------------------------------------------------------------------

export async function mapToGraphqlShoppingCart(cart: Awaited<ReturnType<typeof getOrCreateShoppingCart>>) {
  const cartItemsWithInventory = cart.cartItems.filter((ci) => ci.inventoryItem?.product);

  // Batch fetch stock totals for all inventory items in one query (instead of 1 per cart item)
  const invIds = cartItemsWithInventory.map((ci) => ci.inventoryItem.id);
  const stockTotals =
    invIds.length > 0
      ? await otcgs
          .select({
            inventoryItemId: inventoryItemStock.inventoryItemId,
            total: sql<number>`COALESCE(SUM(${inventoryItemStock.quantity}), 0)`.as('total'),
          })
          .from(inventoryItemStock)
          .where(and(inArray(inventoryItemStock.inventoryItemId, invIds), isNull(inventoryItemStock.deletedAt)))
          .groupBy(inventoryItemStock.inventoryItemId)
      : [];

  const stockMap = new Map(stockTotals.map((s) => [s.inventoryItemId, s.total]));

  const items: CartItemOutput[] = cartItemsWithInventory.map((ci) => {
    const inv = ci.inventoryItem;
    return {
      inventoryItemId: ci.inventoryItemId,
      productId: inv.product.id,
      productName: inv.product.name,
      condition: inv.condition as CardCondition,
      quantity: ci.quantity,
      unitPrice: inv.price,
      maxAvailable: stockMap.get(inv.id) ?? 0,
    };
  });

  return { organizationId: cart.organizationId, items };
}

// ---------------------------------------------------------------------------
// Cart mutations
// ---------------------------------------------------------------------------

/** Add an item to the cart. If the item already exists, increment the quantity. */
export async function addItemToCart(organizationId: string, userId: string, inventoryItemId: number, quantity: number) {
  const existingCart = await otcgs.query.cart.findFirst({
    columns: { id: true },
    where: (c, { eq, and }) => and(eq(c.organizationId, organizationId), eq(c.userId, userId)),
  });

  if (!existingCart?.id) {
    throw new Error('Unable to find cart for user');
  }

  await otcgs
    .insert(cartItem)
    .values({
      cartId: existingCart.id,
      inventoryItemId,
      quantity,
    })
    .onConflictDoUpdate({
      target: [cartItem.cartId, cartItem.inventoryItemId],
      set: { quantity: sql`${cartItem.quantity} + ${quantity}` },
    });

  const updatedCart = await getOrCreateShoppingCart(organizationId, userId);
  return await mapToGraphqlShoppingCart(updatedCart);
}

/** Remove all cart items matching the given inventory item ID. */
export async function removeItemFromCart(organizationId: string, userId: string, inventoryItemId: number) {
  const existingCart = await getOrCreateShoppingCart(organizationId, userId);
  const itemIds = existingCart.cartItems.reduce<number[]>((list, ci) => {
    if (ci.inventoryItemId === inventoryItemId) {
      list.push(ci.id);
    }
    return list;
  }, []);

  if (itemIds.length > 0) {
    await otcgs.delete(cartItem).where(inArray(cartItem.id, itemIds));
  }

  const updatedCart = await getOrCreateShoppingCart(organizationId, userId);
  return await mapToGraphqlShoppingCart(updatedCart);
}

/** Update the quantity of a specific item in the cart. */
export async function updateCartItemQuantity(
  organizationId: string,
  userId: string,
  inventoryItemId: number,
  quantity: number,
) {
  const existingCart = await getOrCreateShoppingCart(organizationId, userId);
  const item = existingCart.cartItems.find((ci) => ci.inventoryItemId === inventoryItemId);
  if (item) {
    await otcgs.update(cartItem).set({ quantity }).where(eq(cartItem.id, item.id));
    item.quantity = quantity;
  }

  return await mapToGraphqlShoppingCart(existingCart);
}

/** Remove all items from the cart. */
export async function clearAllCartItems(organizationId: string, userId: string) {
  const existingCart = await getOrCreateShoppingCart(organizationId, userId);

  if (existingCart.cartItems.length > 0) {
    await otcgs.delete(cartItem).where(
      inArray(
        cartItem.id,
        existingCart.cartItems.map((ci) => ci.id),
      ),
    );
  }

  return { items: [] };
}
