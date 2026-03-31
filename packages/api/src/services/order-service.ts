import { and, eq, sql, asc, inArray, like, or } from 'drizzle-orm';
import { cartItem, inventoryItem, order, orderItem, otcgs } from '../db';
import { getOrCreateShoppingCart } from './shopping-cart-service';

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
}

interface OrderResult {
  order?: {
    id: number;
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

export async function submitOrder(userId: string, customerName: string): Promise<OrderResult> {
  // 1. Get the user's cart with items (includes inventoryItem join)
  const cart = await getOrCreateShoppingCart(userId);

  if (cart.cartItems.length === 0) {
    return { error: 'Cart is empty' };
  }

  // 2. Validate inventory availability — check total across ALL inventory records
  //    for the same product+condition (not just the specific inventoryItemId in the cart)
  const insufficientItems: InsufficientItemInfo[] = [];
  const cartItemsWithInventory: {
    inventoryItemId: number;
    productId: number;
    productName: string;
    condition: string;
    quantity: number;
    unitPrice: number;
  }[] = [];

  for (const ci of cart.cartItems) {
    if (!ci.inventoryItem?.product) continue;

    const inv = ci.inventoryItem;

    // Check total available across all inventory records for this product+condition
    const [totalResult] = await otcgs
      .select({ total: sql<number>`COALESCE(SUM(${inventoryItem.quantity}), 0)` })
      .from(inventoryItem)
      .where(and(eq(inventoryItem.productId, inv.product.id), eq(inventoryItem.condition, inv.condition)));

    const totalAvailable = totalResult?.total ?? 0;

    if (totalAvailable < ci.quantity) {
      insufficientItems.push({
        productId: inv.product.id,
        productName: inv.product.name,
        condition: inv.condition,
        requested: ci.quantity,
        available: totalAvailable,
      });
    }

    cartItemsWithInventory.push({
      inventoryItemId: ci.inventoryItemId,
      productId: inv.product.id,
      productName: inv.product.name,
      condition: inv.condition,
      quantity: ci.quantity,
      unitPrice: inv.price,
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

  const [insertedOrder] = await otcgs
    .insert(order)
    .values({
      orderNumber,
      customerName,
      userId,
      status: 'open',
      totalAmount,
      createdAt: new Date(),
    })
    .returning();

  // 4. Decrement inventory using FIFO (oldest first by createdAt) for tax purposes.
  //    The cart's inventoryItemId determines product+condition+price, but we consume
  //    from the oldest inventory records first to maintain proper cost basis tracking.
  const allOrderItemValues: {
    orderId: number;
    inventoryItemId: number;
    productId: number;
    productName: string;
    condition: string;
    quantity: number;
    unitPrice: number;
    costBasis: number | null;
  }[] = [];

  for (const item of cartItemsWithInventory) {
    // Get ALL inventory records for this product+condition, ordered by createdAt ASC (FIFO)
    const fifoRecords = await otcgs
      .select({
        id: inventoryItem.id,
        quantity: inventoryItem.quantity,
        costBasis: inventoryItem.costBasis,
      })
      .from(inventoryItem)
      .where(and(eq(inventoryItem.productId, item.productId), eq(inventoryItem.condition, item.condition)))
      .orderBy(asc(inventoryItem.createdAt));

    let remaining = item.quantity;

    for (const record of fifoRecords) {
      if (remaining <= 0) break;
      if (record.quantity <= 0) continue;

      const deduct = Math.min(remaining, record.quantity);
      const newQuantity = record.quantity - deduct;

      await otcgs.update(inventoryItem).set({ quantity: newQuantity }).where(eq(inventoryItem.id, record.id));

      // Create an order item for each inventory record consumed (tracks exact cost basis lot)
      allOrderItemValues.push({
        orderId: insertedOrder.id,
        inventoryItemId: record.id,
        productId: item.productId,
        productName: item.productName,
        condition: item.condition,
        quantity: deduct,
        unitPrice: item.unitPrice,
        costBasis: record.costBasis,
      });

      remaining -= deduct;
    }
  }

  const insertedOrderItems = await otcgs.insert(orderItem).values(allOrderItemValues).returning();

  // 5. Clear the cart
  const cartItemIds = cart.cartItems.map((ci) => ci.id);
  if (cartItemIds.length > 0) {
    await otcgs.delete(cartItem).where(inArray(cartItem.id, cartItemIds));
  }

  // 6. Return the created order
  const items = mapOrderItems(insertedOrderItems);
  const { totalCostBasis, totalProfit } = calculateOrderTotals(items);

  return {
    order: {
      id: insertedOrder.id,
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
}

export async function cancelOrder(orderId: number): Promise<{ order?: OrderResult['order']; error?: string }> {
  // 1. Find the order
  const existingOrder = await otcgs.query.order.findFirst({
    with: {
      orderItems: true,
    },
    where: (o, { eq }) => eq(o.id, orderId),
  });

  if (!existingOrder) {
    return { error: 'Order not found' };
  }

  if (existingOrder.status === 'cancelled') {
    return { error: 'Order is already cancelled' };
  }

  // 2. Return items to inventory — use inventoryItemId for precise restocking
  for (const oi of existingOrder.orderItems) {
    if (oi.inventoryItemId) {
      // Restock the exact inventory record that was decremented
      await otcgs
        .update(inventoryItem)
        .set({ quantity: sql`${inventoryItem.quantity} + ${oi.quantity}`, updatedAt: new Date() })
        .where(eq(inventoryItem.id, oi.inventoryItemId));
    } else {
      // Legacy order items without inventoryItemId — fall back to finding a matching record
      const records = await otcgs
        .select({ id: inventoryItem.id })
        .from(inventoryItem)
        .where(and(eq(inventoryItem.productId, oi.productId), eq(inventoryItem.condition, oi.condition)))
        .orderBy(asc(inventoryItem.createdAt))
        .limit(1);

      if (records.length > 0) {
        await otcgs
          .update(inventoryItem)
          .set({ quantity: sql`${inventoryItem.quantity} + ${oi.quantity}`, updatedAt: new Date() })
          .where(eq(inventoryItem.id, records[0].id));
      } else {
        // No matching inventory record exists — create one
        await otcgs.insert(inventoryItem).values({
          productId: oi.productId,
          condition: oi.condition,
          quantity: oi.quantity,
          price: oi.unitPrice,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  // 3. Update order status to cancelled
  await otcgs.update(order).set({ status: 'cancelled' }).where(eq(order.id, orderId));

  const items = mapOrderItems(existingOrder.orderItems);
  const { totalCostBasis, totalProfit } = calculateOrderTotals(items);

  return {
    order: {
      id: existingOrder.id,
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

export async function updateOrderStatus(
  orderId: number,
  newStatus: string,
): Promise<{ order?: OrderResult['order']; error?: string }> {
  const validStatuses = ['open', 'completed'];
  if (!validStatuses.includes(newStatus)) {
    return { error: `Invalid status "${newStatus}". Valid statuses: ${validStatuses.join(', ')}` };
  }

  const existingOrder = await otcgs.query.order.findFirst({
    with: { orderItems: true },
    where: (o, { eq }) => eq(o.id, orderId),
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

  return {
    order: {
      id: existingOrder.id,
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
  pagination?: { page?: number; pageSize?: number } | null,
  filters?: { status?: string | null; searchTerm?: string | null } | null,
) {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [];
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
