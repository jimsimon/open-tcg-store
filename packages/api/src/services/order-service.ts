import { and, eq, sql, asc, inArray, like, or, isNull, gt } from 'drizzle-orm';
import { cart, cartItem, inventoryItem, inventoryItemStock, order, orderItem, otcgs } from '../db';
import { product } from '../db/tcg-data/schema';
import { logTransaction } from './transaction-log-service';

/** Return today's date as YYYY-MM-DD. */
function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

interface InsufficientItemInfo {
  productId: number;
  productName: string;
  condition: string;
  requested: number;
  available: number;
}

interface OrderItemResult {
  id: number;
  productId: number;
  productName: string;
  condition: string;
  quantity: number;
  unitPrice: number;
  costBasis: number | null;
  profit: number | null;
  lotId: number | null;
}

interface OrderResult {
  order?: {
    id: number;
    organizationId: string;
    orderNumber: string;
    customerName: string;
    status: string;
    totalAmount: number;
    totalCostBasis: number | null;
    totalProfit: number | null;
    createdAt: string;
    items: OrderItemResult[];
  };
  error?: string;
  insufficientItems?: InsufficientItemInfo[];
}

function mapOrderItems(
  orderItems: {
    id: number;
    productId: number;
    productName: string;
    condition: string;
    quantity: number;
    unitPrice: number;
    costBasis: number | null;
    lotId?: number | null;
  }[],
): OrderItemResult[] {
  return orderItems.map((oi) => {
    const revenue = oi.unitPrice * oi.quantity;
    const cost = oi.costBasis != null ? oi.costBasis * oi.quantity : null;
    const profit = cost != null ? revenue - cost : null;
    return {
      id: oi.id,
      productId: oi.productId,
      productName: oi.productName,
      condition: oi.condition,
      quantity: oi.quantity,
      unitPrice: oi.unitPrice,
      costBasis: oi.costBasis,
      profit,
      lotId: oi.lotId ?? null,
    };
  });
}

function calculateOrderTotals(items: OrderItemResult[]) {
  let totalCostBasis: number | null = 0;
  let totalProfit: number | null = 0;
  let hasAnyCostBasis = false;

  for (const item of items) {
    if (item.costBasis != null) {
      hasAnyCostBasis = true;
      totalCostBasis = (totalCostBasis ?? 0) + item.costBasis * item.quantity;
      totalProfit = (totalProfit ?? 0) + (item.profit ?? 0);
    }
  }

  return {
    totalCostBasis: hasAnyCostBasis ? totalCostBasis : null,
    totalProfit: hasAnyCostBasis ? totalProfit : null,
  };
}

function safeISOString(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) {
    const iso = value.toISOString();
    if (iso === 'Invalid Date') return new Date().toISOString();
    return iso;
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  if (typeof value === 'number') {
    return new Date(value * 1000).toISOString();
  }
  return new Date().toISOString();
}

function generateOrderNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `ORD-${datePart}-${randomPart}`;
}

export async function submitOrder(organizationId: string, userId: string, customerName: string): Promise<OrderResult> {
  // Wrap the entire order submission — including the cart read — in a transaction
  // to prevent race conditions. This ensures the cart state is consistent with the
  // inventory checks and stock decrements (no stale data between fetch and delete).
  const result = await otcgs.transaction(async (tx) => {
    // 1. Read the user's cart with items inside the transaction for a consistent snapshot.
    //    Uses a direct join query instead of the relational API (which isn't available on tx).
    const [userCart] = await tx
      .select({ id: cart.id })
      .from(cart)
      .where(and(eq(cart.organizationId, organizationId), eq(cart.userId, userId)))
      .limit(1);

    if (!userCart) {
      return { error: 'Cart is empty' };
    }

    const cartItems = await tx
      .select({
        id: cartItem.id,
        inventoryItemId: cartItem.inventoryItemId,
        quantity: cartItem.quantity,
        invId: inventoryItem.id,
        invCondition: inventoryItem.condition,
        invPrice: inventoryItem.price,
        productId: product.id,
        productName: product.name,
      })
      .from(cartItem)
      .innerJoin(inventoryItem, eq(cartItem.inventoryItemId, inventoryItem.id))
      .innerJoin(product, eq(inventoryItem.productId, product.id))
      .where(eq(cartItem.cartId, userCart.id));

    if (cartItems.length === 0) {
      return { error: 'Cart is empty' };
    }

    // 2. Validate inventory availability — check total stock across all non-deleted stock entries
    //    for the parent inventory_item referenced by each cart item
    const insufficientItems: InsufficientItemInfo[] = [];
    const cartItemsWithInventory: {
      cartItemId: number; // cartItem.id for deletion
      inventoryItemId: number; // parent inventory_item.id
      productId: number;
      productName: string;
      condition: string;
      quantity: number;
      unitPrice: number;
    }[] = [];

    for (const ci of cartItems) {
      // Check total available from stock entries for this parent
      const [totalResult] = await tx
        .select({ total: sql<number>`COALESCE(SUM(${inventoryItemStock.quantity}), 0)` })
        .from(inventoryItemStock)
        .where(and(eq(inventoryItemStock.inventoryItemId, ci.invId), isNull(inventoryItemStock.deletedAt)));

      const totalAvailable = totalResult?.total ?? 0;

      if (totalAvailable < ci.quantity) {
        insufficientItems.push({
          productId: ci.productId,
          productName: ci.productName,
          condition: ci.invCondition,
          requested: ci.quantity,
          available: totalAvailable,
        });
      }

      cartItemsWithInventory.push({
        cartItemId: ci.id,
        inventoryItemId: ci.invId,
        productId: ci.productId,
        productName: ci.productName,
        condition: ci.invCondition,
        quantity: ci.quantity,
        unitPrice: ci.invPrice,
      });
    }

    if (insufficientItems.length > 0) {
      return {
        error: 'Insufficient inventory for one or more items',
        insufficientItems,
      };
    }

    // 3. Create the order
    const orderNumber = generateOrderNumber();
    const totalAmount = cartItemsWithInventory.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    const [insertedOrder] = await tx
      .insert(order)
      .values({
        organizationId,
        orderNumber,
        customerName,
        userId,
        status: 'open',
        totalAmount,
        createdAt: new Date(),
      })
      .returning();

    // 4. Decrement inventory using FIFO (oldest first by createdAt) across stock entries.
    const allOrderItemValues: {
      orderId: number;
      inventoryItemId: number;
      inventoryItemStockId: number;
      productId: number;
      productName: string;
      condition: string;
      quantity: number;
      unitPrice: number;
      costBasis: number | null;
      lotId: number | null;
    }[] = [];

    for (const item of cartItemsWithInventory) {
      // Get all non-deleted stock entries with quantity > 0 for this parent, FIFO ordered
      const fifoStockEntries = await tx
        .select({
          id: inventoryItemStock.id,
          quantity: inventoryItemStock.quantity,
          costBasis: inventoryItemStock.costBasis,
          lotId: inventoryItemStock.lotId,
        })
        .from(inventoryItemStock)
        .where(
          and(
            eq(inventoryItemStock.inventoryItemId, item.inventoryItemId),
            isNull(inventoryItemStock.deletedAt),
            gt(inventoryItemStock.quantity, 0),
          ),
        )
        .orderBy(asc(inventoryItemStock.createdAt));

      let remaining = item.quantity;

      for (const stockEntry of fifoStockEntries) {
        if (remaining <= 0) break;
        if (stockEntry.quantity <= 0) continue;

        const deduct = Math.min(remaining, stockEntry.quantity);
        const newQuantity = stockEntry.quantity - deduct;

        await tx
          .update(inventoryItemStock)
          .set({ quantity: newQuantity, updatedAt: new Date() })
          .where(eq(inventoryItemStock.id, stockEntry.id));

        // Create an order item for each stock entry consumed (tracks exact cost basis lot)
        allOrderItemValues.push({
          orderId: insertedOrder.id,
          inventoryItemId: item.inventoryItemId,
          inventoryItemStockId: stockEntry.id,
          productId: item.productId,
          productName: item.productName,
          condition: item.condition,
          quantity: deduct,
          unitPrice: item.unitPrice,
          costBasis: stockEntry.costBasis,
          lotId: stockEntry.lotId ?? null,
        });

        remaining -= deduct;
      }
    }

    const insertedOrderItems = await tx.insert(orderItem).values(allOrderItemValues).returning();

    // 5. Clear the cart
    const cartItemIds = cartItemsWithInventory.map((ci) => ci.cartItemId);
    if (cartItemIds.length > 0) {
      await tx.delete(cartItem).where(inArray(cartItem.id, cartItemIds));
    }

    // 6. Return the created order
    const items = mapOrderItems(insertedOrderItems);
    const { totalCostBasis, totalProfit } = calculateOrderTotals(items);

    return {
      order: {
        id: insertedOrder.id,
        organizationId: insertedOrder.organizationId,
        orderNumber: insertedOrder.orderNumber,
        customerName: insertedOrder.customerName,
        status: insertedOrder.status,
        totalAmount: insertedOrder.totalAmount,
        totalCostBasis,
        totalProfit,
        createdAt: safeISOString(insertedOrder.createdAt),
        items,
      },
    };
  });

  // Log after the transaction commits — best-effort, won't be rolled back with the order
  if (result.order) {
    await logTransaction({
      organizationId,
      userId,
      action: 'order.created',
      resourceType: 'order',
      resourceId: result.order.id,
      details: {
        orderNumber: result.order.orderNumber,
        customerName,
        totalAmount: result.order.totalAmount,
        itemCount: result.order.items.length,
      },
    });
  }

  return result;
}

export async function cancelOrder(
  orderId: number,
  organizationId: string,
  userId: string,
): Promise<{ order?: OrderResult['order']; error?: string }> {
  // 1. Find the order — scoped to the caller's organization
  const existingOrder = await otcgs.query.order.findFirst({
    with: {
      orderItems: true,
    },
    where: (o, { eq, and }) => and(eq(o.id, orderId), eq(o.organizationId, organizationId)),
  });

  if (!existingOrder) {
    return { error: 'Order not found' };
  }

  if (existingOrder.status === 'cancelled') {
    return { error: 'Order is already cancelled' };
  }

  // 2. Return items to inventory — use inventoryItemStockId for precise restocking
  for (const oi of existingOrder.orderItems) {
    if (oi.inventoryItemStockId) {
      // Precise restocking using stock entry ID
      const [stockEntry] = await otcgs
        .select({ id: inventoryItemStock.id, deletedAt: inventoryItemStock.deletedAt })
        .from(inventoryItemStock)
        .where(eq(inventoryItemStock.id, oi.inventoryItemStockId))
        .limit(1);

      if (stockEntry) {
        const updateSet: Record<string, unknown> = {
          quantity: sql`${inventoryItemStock.quantity} + ${oi.quantity}`,
          updatedAt: new Date(),
        };
        if (stockEntry.deletedAt) {
          updateSet.deletedAt = null;
        }
        await otcgs.update(inventoryItemStock).set(updateSet).where(eq(inventoryItemStock.id, oi.inventoryItemStockId));
      } else {
        // Stock entry was hard-deleted — create a new stock entry under the parent
        await restockFallback(existingOrder.organizationId, oi);
      }
    } else if (oi.inventoryItemId) {
      // Legacy: has parent inventoryItemId but no stock ID — find or create stock
      await restockFallback(existingOrder.organizationId, oi);
    } else {
      // Very legacy: no inventoryItemId at all — find by product+condition
      await restockFallbackByProduct(existingOrder.organizationId, oi);
    }
  }

  // 3. Update order status to cancelled
  await otcgs.update(order).set({ status: 'cancelled' }).where(eq(order.id, orderId));

  const items = mapOrderItems(existingOrder.orderItems);
  const { totalCostBasis, totalProfit } = calculateOrderTotals(items);

  // Log the transaction
  await logTransaction({
    organizationId,
    userId,
    action: 'order.cancelled',
    resourceType: 'order',
    resourceId: orderId,
    details: {
      orderNumber: existingOrder.orderNumber,
      customerName: existingOrder.customerName,
      totalAmount: existingOrder.totalAmount,
    },
  });

  return {
    order: {
      id: existingOrder.id,
      organizationId: existingOrder.organizationId,
      orderNumber: existingOrder.orderNumber,
      customerName: existingOrder.customerName,
      status: 'cancelled',
      totalAmount: existingOrder.totalAmount,
      totalCostBasis,
      totalProfit,
      createdAt: safeISOString(existingOrder.createdAt),
      items,
    },
  };
}

/**
 * Fallback restocking: find or create stock entry under the parent inventory item.
 */
async function restockFallback(
  organizationId: string,
  oi: {
    inventoryItemId: number | null;
    productId: number;
    condition: string;
    quantity: number;
    unitPrice: number;
    costBasis: number | null;
  },
): Promise<void> {
  const now = new Date();

  // Find or create the parent
  let parentId = oi.inventoryItemId;
  if (!parentId) {
    // Look up by product+condition
    const [parent] = await otcgs
      .select({ id: inventoryItem.id })
      .from(inventoryItem)
      .where(
        and(
          eq(inventoryItem.organizationId, organizationId),
          eq(inventoryItem.productId, oi.productId),
          eq(inventoryItem.condition, oi.condition),
        ),
      )
      .limit(1);

    if (parent) {
      parentId = parent.id;
    } else {
      const [newParent] = await otcgs
        .insert(inventoryItem)
        .values({
          organizationId,
          productId: oi.productId,
          condition: oi.condition,
          price: oi.unitPrice,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      parentId = newParent.id;
    }
  }

  // Find matching stock entry or create new one
  const costBasis = oi.costBasis ?? 0;
  const [existingStock] = await otcgs
    .select()
    .from(inventoryItemStock)
    .where(and(eq(inventoryItemStock.inventoryItemId, parentId), eq(inventoryItemStock.costBasis, costBasis)))
    .orderBy(asc(inventoryItemStock.createdAt))
    .limit(1);

  if (existingStock) {
    const updateSet: Record<string, unknown> = {
      quantity: sql`${inventoryItemStock.quantity} + ${oi.quantity}`,
      updatedAt: now,
    };
    if (existingStock.deletedAt) {
      updateSet.deletedAt = null;
    }
    await otcgs.update(inventoryItemStock).set(updateSet).where(eq(inventoryItemStock.id, existingStock.id));
  } else {
    await otcgs.insert(inventoryItemStock).values({
      inventoryItemId: parentId,
      quantity: oi.quantity,
      costBasis,
      acquisitionDate: todayDateString(),
      createdAt: now,
      updatedAt: now,
    });
  }
}

/**
 * Very legacy fallback: no inventoryItemId at all.
 */
async function restockFallbackByProduct(
  organizationId: string,
  oi: { productId: number; condition: string; quantity: number; unitPrice: number; costBasis: number | null },
): Promise<void> {
  await restockFallback(organizationId, { ...oi, inventoryItemId: null });
}

export async function updateOrderStatus(
  orderId: number,
  newStatus: string,
  organizationId: string,
  userId: string,
): Promise<{ order?: OrderResult['order']; error?: string }> {
  const validStatuses = ['open', 'completed'];
  if (!validStatuses.includes(newStatus)) {
    return { error: `Invalid status "${newStatus}". Valid statuses: ${validStatuses.join(', ')}` };
  }

  // Scope the lookup to the caller's organization
  const existingOrder = await otcgs.query.order.findFirst({
    with: { orderItems: true },
    where: (o, { eq, and }) => and(eq(o.id, orderId), eq(o.organizationId, organizationId)),
  });

  if (!existingOrder) {
    return { error: 'Order not found' };
  }

  if (existingOrder.status === 'cancelled') {
    return { error: 'Cannot change status of a cancelled order' };
  }

  if (existingOrder.status === newStatus) {
    return { error: `Order is already ${newStatus}` };
  }

  await otcgs.update(order).set({ status: newStatus }).where(eq(order.id, orderId));

  const items = mapOrderItems(existingOrder.orderItems);
  const { totalCostBasis, totalProfit } = calculateOrderTotals(items);

  // Log the transaction
  await logTransaction({
    organizationId,
    userId,
    action: 'order.status_updated',
    resourceType: 'order',
    resourceId: orderId,
    details: {
      orderNumber: existingOrder.orderNumber,
      previousStatus: existingOrder.status,
      newStatus,
    },
  });

  return {
    order: {
      id: existingOrder.id,
      organizationId: existingOrder.organizationId,
      orderNumber: existingOrder.orderNumber,
      customerName: existingOrder.customerName,
      status: newStatus,
      totalAmount: existingOrder.totalAmount,
      totalCostBasis,
      totalProfit,
      createdAt: safeISOString(existingOrder.createdAt),
      items,
    },
  };
}

export async function getOrders(
  organizationId: string,
  pagination?: { page?: number; pageSize?: number } | null,
  filters?: { status?: string | null; searchTerm?: string | null } | null,
) {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  // Build where conditions (always scope by organization)
  const conditions = [eq(order.organizationId, organizationId)];
  if (filters?.status) {
    conditions.push(eq(order.status, filters.status));
  }
  if (filters?.searchTerm) {
    const term = `%${filters.searchTerm}%`;
    conditions.push(or(like(order.orderNumber, term), like(order.customerName, term))!);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count with filters
  const countQuery = otcgs.select({ total: sql<number>`count(*)` }).from(order);
  const [countResult] = whereClause ? await countQuery.where(whereClause) : await countQuery;
  const totalCount = countResult?.total ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Get orders with items
  const orders = await otcgs.query.order.findMany({
    with: {
      orderItems: true,
    },
    where: whereClause ? () => whereClause : undefined,
    orderBy: (order, { desc }) => [desc(order.createdAt)],
    limit: pageSize,
    offset,
  });

  return {
    orders: orders.map((o) => {
      const items = mapOrderItems(o.orderItems);
      const { totalCostBasis, totalProfit } = calculateOrderTotals(items);
      return {
        id: o.id,
        organizationId: o.organizationId,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        status: o.status,
        totalAmount: o.totalAmount,
        totalCostBasis,
        totalProfit,
        createdAt: safeISOString(o.createdAt),
        items,
      };
    }),
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}
