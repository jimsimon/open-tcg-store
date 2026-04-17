import { and, eq, sql, asc, inArray, like, or, isNull, gt } from 'drizzle-orm';
import { cart, cartItem, inventoryItem, inventoryItemStock, order, orderItem, otcgs } from '../db';
import { product } from '../db/tcg-data/schema';
import { logTransaction } from './transaction-log-service';

import { todayDateString, safeISOString } from '../lib/date-utils';
import type { CardCondition, OrderStatus } from '../schema/types.generated';

interface OrderItemResult {
  id: number;
  productId: number;
  productName: string;
  condition: CardCondition;
  quantity: number;
  unitPrice: number;
  costBasis: number | null;
  profit: number | null;
  lotId: number | null;
}

interface OrderData {
  id: number;
  organizationId: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: number;
  totalCostBasis: number | null;
  totalProfit: number | null;
  createdAt: string;
  items: OrderItemResult[];
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
      condition: oi.condition as CardCondition,
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

function generateOrderNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `ORD-${datePart}-${randomPart}`;
}

export async function submitOrder(organizationId: string, userId: string, customerName: string): Promise<OrderData> {
  if (!customerName || customerName.trim().length === 0) {
    throw new Error('Customer name is required');
  }

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
      throw new Error('Cart is empty');
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
      throw new Error('Cart is empty');
    }

    // 2. Validate inventory availability — batch-check stock totals for all cart items in one query
    const invIds = cartItems.map((ci) => ci.invId);
    const stockTotals = await tx
      .select({
        inventoryItemId: inventoryItemStock.inventoryItemId,
        total: sql<number>`COALESCE(SUM(${inventoryItemStock.quantity}), 0)`.as('total'),
      })
      .from(inventoryItemStock)
      .where(and(inArray(inventoryItemStock.inventoryItemId, invIds), isNull(inventoryItemStock.deletedAt)))
      .groupBy(inventoryItemStock.inventoryItemId);

    const stockMap = new Map(stockTotals.map((s) => [s.inventoryItemId, s.total]));

    const insufficientItems: { productName: string; condition: string; requested: number; available: number }[] = [];
    const cartItemsWithInventory: {
      cartItemId: number;
      inventoryItemId: number;
      productId: number;
      productName: string;
      condition: CardCondition;
      quantity: number;
      unitPrice: number;
    }[] = [];

    for (const ci of cartItems) {
      const totalAvailable = stockMap.get(ci.invId) ?? 0;

      if (totalAvailable < ci.quantity) {
        insufficientItems.push({
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
        condition: ci.invCondition as CardCondition,
        quantity: ci.quantity,
        unitPrice: ci.invPrice,
      });
    }

    if (insufficientItems.length > 0) {
      const details = insufficientItems
        .map((i) => `${i.productName} (${i.condition}): requested ${i.requested}, available ${i.available}`)
        .join('; ');
      throw new Error(`Insufficient inventory: ${details}`);
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
    //    Prefetch all stock entries for all inventory items in one query, then process per-item in JS.
    const allInvIds = cartItemsWithInventory.map((ci) => ci.inventoryItemId);
    const allFifoStockEntries = await tx
      .select({
        id: inventoryItemStock.id,
        inventoryItemId: inventoryItemStock.inventoryItemId,
        quantity: inventoryItemStock.quantity,
        costBasis: inventoryItemStock.costBasis,
        lotId: inventoryItemStock.lotId,
      })
      .from(inventoryItemStock)
      .where(
        and(
          inArray(inventoryItemStock.inventoryItemId, allInvIds),
          isNull(inventoryItemStock.deletedAt),
          gt(inventoryItemStock.quantity, 0),
        ),
      )
      .orderBy(asc(inventoryItemStock.createdAt));

    // Group by inventoryItemId for FIFO processing
    const stockByInvId = new Map<number, typeof allFifoStockEntries>();
    for (const entry of allFifoStockEntries) {
      const arr = stockByInvId.get(entry.inventoryItemId) ?? [];
      arr.push(entry);
      stockByInvId.set(entry.inventoryItemId, arr);
    }

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
      const fifoStockEntries = stockByInvId.get(item.inventoryItemId) ?? [];
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

        // Keep in-memory state consistent with the DB update so that if
        // a future change allows the same stock entry to be visited by
        // multiple cart items, quantities won't be double-counted.
        stockEntry.quantity = newQuantity;

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
      id: insertedOrder.id,
      organizationId: insertedOrder.organizationId,
      orderNumber: insertedOrder.orderNumber,
      customerName: insertedOrder.customerName,
      status: insertedOrder.status as OrderStatus,
      totalAmount: insertedOrder.totalAmount,
      totalCostBasis,
      totalProfit,
      createdAt: safeISOString(insertedOrder.createdAt),
      items,
    };
  });

  // Log after the transaction commits — best-effort, won't be rolled back with the order
  await logTransaction({
    organizationId,
    userId,
    action: 'order.created',
    resourceType: 'order',
    resourceId: result.id,
    details: {
      orderNumber: result.orderNumber,
      customerName,
      totalAmount: result.totalAmount,
      itemCount: result.items.length,
    },
  });

  return result;
}

export async function cancelOrder(orderId: number, organizationId: string, userId: string): Promise<OrderData> {
  // Wrap the entire cancel flow in a transaction to prevent concurrent cancels
  // from double-restoring inventory and to ensure atomicity of restock + status change.
  const result = await otcgs.transaction(async (tx) => {
    // 1. Find the order — scoped to the caller's organization.
    //    Uses tx.select() (not otcgs.query) to ensure the read is part of the transaction.
    const [existingOrder] = await tx
      .select()
      .from(order)
      .where(and(eq(order.id, orderId), eq(order.organizationId, organizationId)))
      .limit(1);

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Only allow cancelling open orders — completed/shipped orders should not be restocked
    if (existingOrder.status !== 'open') {
      throw new Error(
        existingOrder.status === 'cancelled'
          ? 'Order is already cancelled'
          : `Cannot cancel an order with status "${existingOrder.status}"`,
      );
    }

    // Fetch order items within the transaction
    const existingOrderItems = await tx
      .select()
      .from(orderItem)
      .where(eq(orderItem.orderId, orderId));

    // 2. Return items to inventory — batch-fetch all stock entries first, then process
    const stockIds = existingOrderItems
      .filter((oi) => oi.inventoryItemStockId != null)
      .map((oi) => oi.inventoryItemStockId!);

    const stockEntries =
      stockIds.length > 0
        ? await tx
            .select({ id: inventoryItemStock.id, deletedAt: inventoryItemStock.deletedAt })
            .from(inventoryItemStock)
            .where(inArray(inventoryItemStock.id, stockIds))
        : [];

    const stockEntryMap = new Map(stockEntries.map((s) => [s.id, s]));

    for (const oi of existingOrderItems) {
      if (oi.inventoryItemStockId) {
        const stockEntry = stockEntryMap.get(oi.inventoryItemStockId);

        if (stockEntry) {
          const updateSet: Record<string, unknown> = {
            quantity: sql`${inventoryItemStock.quantity} + ${oi.quantity}`,
            updatedAt: new Date(),
          };
          if (stockEntry.deletedAt) {
            updateSet.deletedAt = null;
          }
          await tx
            .update(inventoryItemStock)
            .set(updateSet)
            .where(eq(inventoryItemStock.id, oi.inventoryItemStockId));
        } else {
          await restockFallback(tx, existingOrder.organizationId, oi);
        }
      } else if (oi.inventoryItemId) {
        await restockFallback(tx, existingOrder.organizationId, oi);
      } else {
        await restockFallbackByProduct(tx, existingOrder.organizationId, oi);
      }
    }

    // 3. Update order status to cancelled
    await tx.update(order).set({ status: 'cancelled' }).where(eq(order.id, orderId));

    const items = mapOrderItems(existingOrderItems);
    const { totalCostBasis, totalProfit } = calculateOrderTotals(items);

    return {
      id: existingOrder.id,
      organizationId: existingOrder.organizationId,
      orderNumber: existingOrder.orderNumber,
      customerName: existingOrder.customerName,
      status: 'cancelled' as const,
      totalAmount: existingOrder.totalAmount,
      totalCostBasis,
      totalProfit,
      createdAt: safeISOString(existingOrder.createdAt),
      items,
    };
  });

  // Log the transaction (outside DB transaction — best-effort)
  await logTransaction({
    organizationId,
    userId,
    action: 'order.cancelled',
    resourceType: 'order',
    resourceId: orderId,
    details: {
      orderNumber: result.orderNumber,
      customerName: result.customerName,
      totalAmount: result.totalAmount,
    },
  });

  return result;
}

type TxHandle = Parameters<Parameters<typeof otcgs.transaction>[0]>[0];

/**
 * Fallback restocking: find or create stock entry under the parent inventory item.
 * Accepts a transaction handle to ensure atomicity with the caller.
 */
async function restockFallback(
  tx: TxHandle,
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
    const [parent] = await tx
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
      const [newParent] = await tx
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

  // Find matching stock entry or create new one — preserve null costBasis
  const costBasis = oi.costBasis;
  const costBasisCondition =
    costBasis != null
      ? eq(inventoryItemStock.costBasis, costBasis)
      : isNull(inventoryItemStock.costBasis);
  const [existingStock] = await tx
    .select()
    .from(inventoryItemStock)
    .where(and(eq(inventoryItemStock.inventoryItemId, parentId), costBasisCondition))
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
    await tx.update(inventoryItemStock).set(updateSet).where(eq(inventoryItemStock.id, existingStock.id));
  } else {
    await tx.insert(inventoryItemStock).values({
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
  tx: TxHandle,
  organizationId: string,
  oi: { productId: number; condition: string; quantity: number; unitPrice: number; costBasis: number | null },
): Promise<void> {
  await restockFallback(tx, organizationId, { ...oi, inventoryItemId: null });
}

export async function updateOrderStatus(
  orderId: number,
  newStatus: string,
  organizationId: string,
  userId: string,
): Promise<OrderData> {
  const validStatuses = ['open', 'completed'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status "${newStatus}". Valid statuses: ${validStatuses.join(', ')}`);
  }

  // Wrap in a transaction to prevent concurrent status updates from racing
  const result = await otcgs.transaction(async (tx) => {
    // Scope the lookup to the caller's organization.
    // Uses tx.select() (not otcgs.query) to ensure the read is part of the transaction.
    const [existingOrder] = await tx
      .select()
      .from(order)
      .where(and(eq(order.id, orderId), eq(order.organizationId, organizationId)))
      .limit(1);

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    if (existingOrder.status === 'cancelled') {
      throw new Error('Cannot change status of a cancelled order');
    }

    if (existingOrder.status === newStatus) {
      throw new Error(`Order is already ${newStatus}`);
    }

    // Use conditional WHERE with .returning() to ensure status hasn't changed since we read it.
    // If the WHERE doesn't match (concurrent modification), returning() yields an empty array.
    const [updated] = await tx
      .update(order)
      .set({ status: newStatus })
      .where(and(eq(order.id, orderId), eq(order.status, existingOrder.status)))
      .returning({ id: order.id });

    if (!updated) {
      throw new Error('Order status was changed by another request, please retry');
    }

    // Fetch order items within the transaction
    const existingOrderItems = await tx
      .select()
      .from(orderItem)
      .where(eq(orderItem.orderId, orderId));

    const items = mapOrderItems(existingOrderItems);
    const { totalCostBasis, totalProfit } = calculateOrderTotals(items);

    return {
      order: existingOrder,
      items,
      totalCostBasis,
      totalProfit,
    };
  });

  // Log the transaction (outside DB transaction — best-effort)
  await logTransaction({
    organizationId,
    userId,
    action: 'order.status_updated',
    resourceType: 'order',
    resourceId: orderId,
    details: {
      orderNumber: result.order.orderNumber,
      previousStatus: result.order.status,
      newStatus,
    },
  });

  return {
    id: result.order.id,
    organizationId: result.order.organizationId,
    orderNumber: result.order.orderNumber,
    customerName: result.order.customerName,
    status: newStatus as OrderStatus,
    totalAmount: result.order.totalAmount,
    totalCostBasis: result.totalCostBasis,
    totalProfit: result.totalProfit,
    createdAt: safeISOString(result.order.createdAt),
    items: result.items,
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
    items: orders.map((o) => {
      const items = mapOrderItems(o.orderItems);
      const { totalCostBasis, totalProfit } = calculateOrderTotals(items);
      return {
        id: o.id,
        organizationId: o.organizationId,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        status: o.status as OrderStatus,
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
