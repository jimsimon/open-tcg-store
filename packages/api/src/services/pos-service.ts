import { and, eq, sql, asc, inArray, isNull, gt } from 'drizzle-orm';
import { inventoryItem, inventoryItemStock, order, orderItem, otcgs } from '../db';
import { companySettings } from '../db/otcgs/company-settings-schema';
import { product } from '../db/tcg-data/schema';
import { logTransaction } from './transaction-log-service';
import { generateOrderNumber, mapOrderItems, calculateOrderTotals } from '../lib/order-utils';
import type { OrderItemResult } from '../lib/order-utils';
import { safeISOString } from '../lib/date-utils';
import SalesTax from 'sales-tax';
import type { OrderStatus } from '../schema/types.generated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TxHandle = Parameters<Parameters<typeof otcgs.transaction>[0]>[0];

interface PosLineItemInput {
  inventoryItemId: number;
  quantity: number;
}

interface OrderData {
  id: number;
  organizationId: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: number;
  taxAmount: number;
  paymentMethod: string;
  totalCostBasis: number | null;
  totalProfit: number | null;
  createdAt: string;
  items: OrderItemResult[];
}

/**
 * FIFO stock decrement for a set of line items.
 * Returns the order item values to batch-insert.
 */
async function fifoStockDecrement(
  tx: TxHandle,
  orderId: number,
  lineItems: {
    inventoryItemId: number;
    productId: number;
    productName: string;
    condition: string;
    quantity: number;
    unitPrice: number;
  }[],
) {
  const allInvIds = lineItems.map((li) => li.inventoryItemId);

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

  for (const item of lineItems) {
    const fifoStockEntries = stockByInvId.get(item.inventoryItemId) ?? [];
    let remaining = item.quantity;

    for (const stockEntry of fifoStockEntries) {
      if (remaining <= 0) break;
      if (stockEntry.quantity <= 0) continue;

      const deduct = Math.min(remaining, stockEntry.quantity);

      // Atomic SQL decrement — prevents double-decrement race conditions
      const [decremented] = await tx
        .update(inventoryItemStock)
        .set({
          quantity: sql`${inventoryItemStock.quantity} - ${deduct}`,
          updatedAt: new Date(),
        })
        .where(and(eq(inventoryItemStock.id, stockEntry.id), sql`${inventoryItemStock.quantity} >= ${deduct}`))
        .returning({ id: inventoryItemStock.id });

      if (!decremented) {
        throw new Error('Inventory changed while processing the order. Please try again.');
      }

      stockEntry.quantity -= deduct;

      allOrderItemValues.push({
        orderId,
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

    if (remaining > 0) {
      throw new Error(`Insufficient inventory for ${item.productName} (${item.condition})`);
    }
  }

  return allOrderItemValues;
}

// ---------------------------------------------------------------------------
// submitPosOrder — create a new order from POS line items
// ---------------------------------------------------------------------------

export async function submitPosOrder(
  organizationId: string,
  input: {
    customerName: string;
    items: PosLineItemInput[];
    taxAmount: number;
    paymentMethod: string;
    stripePaymentIntentId?: string | null;
  },
  userId: string,
): Promise<OrderData> {
  // Default to 'Walk-in' for POS walk-in customers who don't provide a name
  const trimmedName = input.customerName?.trim() || 'Walk-in';
  if (trimmedName.length > 500) {
    throw new Error('Customer name must be 500 characters or less');
  }
  if (!input.items || input.items.length === 0) {
    throw new Error('At least one item is required');
  }
  if (!['cash', 'card'].includes(input.paymentMethod)) {
    throw new Error('Payment method must be "cash" or "card"');
  }
  if (input.paymentMethod === 'card' && !input.stripePaymentIntentId) {
    throw new Error('Stripe payment intent ID is required for card payments');
  }
  if (input.taxAmount < 0) {
    throw new Error('Tax amount cannot be negative');
  }

  const result = await otcgs.transaction(async (tx) => {
    // Resolve inventory items with product info
    const invIds = input.items.map((i) => i.inventoryItemId);
    const inventoryRows = await tx
      .select({
        id: inventoryItem.id,
        organizationId: inventoryItem.organizationId,
        condition: inventoryItem.condition,
        price: inventoryItem.price,
        productId: product.id,
        productName: product.name,
      })
      .from(inventoryItem)
      .innerJoin(product, eq(inventoryItem.productId, product.id))
      .where(and(inArray(inventoryItem.id, invIds), eq(inventoryItem.organizationId, organizationId)));

    const invMap = new Map(inventoryRows.map((r) => [r.id, r]));

    // Validate all items exist and belong to org
    const lineItems = input.items.map((li) => {
      const inv = invMap.get(li.inventoryItemId);
      if (!inv) {
        throw new Error(`Inventory item ${li.inventoryItemId} not found`);
      }
      return {
        inventoryItemId: inv.id,
        productId: inv.productId,
        productName: inv.productName,
        condition: inv.condition,
        quantity: li.quantity,
        unitPrice: inv.price,
      };
    });

    // Validate stock availability
    const stockTotals = await tx
      .select({
        inventoryItemId: inventoryItemStock.inventoryItemId,
        total: sql<number>`COALESCE(SUM(${inventoryItemStock.quantity}), 0)`.as('total'),
      })
      .from(inventoryItemStock)
      .where(and(inArray(inventoryItemStock.inventoryItemId, invIds), isNull(inventoryItemStock.deletedAt)))
      .groupBy(inventoryItemStock.inventoryItemId);

    const stockMap = new Map(stockTotals.map((s) => [s.inventoryItemId, s.total]));

    const insufficientItems: string[] = [];
    for (const li of lineItems) {
      const available = stockMap.get(li.inventoryItemId) ?? 0;
      if (available < li.quantity) {
        insufficientItems.push(`${li.productName} (${li.condition}): requested ${li.quantity}, available ${available}`);
      }
    }
    if (insufficientItems.length > 0) {
      throw new Error(`Insufficient inventory: ${insufficientItems.join('; ')}`);
    }

    // Create order
    const orderNumber = generateOrderNumber();
    const totalAmount = lineItems.reduce((sum, li) => sum + li.unitPrice * li.quantity, 0);

    const [insertedOrder] = await tx
      .insert(order)
      .values({
        organizationId,
        orderNumber,
        customerName: trimmedName,
        userId,
        status: 'completed',
        totalAmount,
        taxAmount: input.taxAmount,
        paymentMethod: input.paymentMethod,
        stripePaymentIntentId: input.stripePaymentIntentId ?? null,
        createdAt: new Date(),
      })
      .returning();

    // FIFO stock decrement + create order items
    const orderItemValues = await fifoStockDecrement(tx, insertedOrder.id, lineItems);
    const insertedOrderItems = await tx.insert(orderItem).values(orderItemValues).returning();

    const items = mapOrderItems(insertedOrderItems);
    const { totalCostBasis, totalProfit } = calculateOrderTotals(items);

    return {
      id: insertedOrder.id,
      organizationId: insertedOrder.organizationId,
      orderNumber: insertedOrder.orderNumber,
      customerName: insertedOrder.customerName,
      status: 'completed' as OrderStatus,
      totalAmount: insertedOrder.totalAmount,
      taxAmount: insertedOrder.taxAmount ?? 0,
      paymentMethod: insertedOrder.paymentMethod ?? input.paymentMethod,
      totalCostBasis,
      totalProfit,
      createdAt: safeISOString(insertedOrder.createdAt) ?? new Date().toISOString(),
      items,
    };
  });

  // Log after transaction commits — best-effort
  await logTransaction({
    organizationId,
    userId,
    action: 'pos.order_created',
    resourceType: 'order',
    resourceId: result.id,
    details: {
      orderNumber: result.orderNumber,
      customerName: trimmedName,
      totalAmount: result.totalAmount,
      taxAmount: result.taxAmount,
      paymentMethod: result.paymentMethod,
      itemCount: result.items.length,
    },
  });

  return result;
}

// ---------------------------------------------------------------------------
// completePosOrder — add items to an existing open order and complete it
// ---------------------------------------------------------------------------

export async function completePosOrder(
  organizationId: string,
  input: {
    orderId: number;
    newItems?: PosLineItemInput[] | null;
    taxAmount: number;
    paymentMethod: string;
    stripePaymentIntentId?: string | null;
  },
  userId: string,
): Promise<OrderData> {
  if (!['cash', 'card'].includes(input.paymentMethod)) {
    throw new Error('Payment method must be "cash" or "card"');
  }
  if (input.paymentMethod === 'card' && !input.stripePaymentIntentId) {
    throw new Error('Stripe payment intent ID is required for card payments');
  }
  if (input.taxAmount < 0) {
    throw new Error('Tax amount cannot be negative');
  }

  const result = await otcgs.transaction(async (tx) => {
    // 1. Find the existing order
    const [existingOrder] = await tx
      .select()
      .from(order)
      .where(and(eq(order.id, input.orderId), eq(order.organizationId, organizationId)))
      .limit(1);

    if (!existingOrder) {
      throw new Error('Order not found');
    }
    if (existingOrder.status !== 'open') {
      throw new Error(`Cannot complete an order with status "${existingOrder.status}"`);
    }

    // 2. Fetch existing order items
    const existingOrderItems = await tx.select().from(orderItem).where(eq(orderItem.orderId, input.orderId));

    let newInsertedItems: typeof existingOrderItems = [];

    // 3. If there are new items, process them (stock decrement)
    if (input.newItems && input.newItems.length > 0) {
      const invIds = input.newItems.map((i) => i.inventoryItemId);
      const inventoryRows = await tx
        .select({
          id: inventoryItem.id,
          organizationId: inventoryItem.organizationId,
          condition: inventoryItem.condition,
          price: inventoryItem.price,
          productId: product.id,
          productName: product.name,
        })
        .from(inventoryItem)
        .innerJoin(product, eq(inventoryItem.productId, product.id))
        .where(and(inArray(inventoryItem.id, invIds), eq(inventoryItem.organizationId, organizationId)));

      const invMap = new Map(inventoryRows.map((r) => [r.id, r]));

      const lineItems = input.newItems.map((li) => {
        const inv = invMap.get(li.inventoryItemId);
        if (!inv) {
          throw new Error(`Inventory item ${li.inventoryItemId} not found`);
        }
        return {
          inventoryItemId: inv.id,
          productId: inv.productId,
          productName: inv.productName,
          condition: inv.condition,
          quantity: li.quantity,
          unitPrice: inv.price,
        };
      });

      const orderItemValues = await fifoStockDecrement(tx, input.orderId, lineItems);
      newInsertedItems = await tx.insert(orderItem).values(orderItemValues).returning();
    }

    // 4. Calculate new total
    const allItems = [...existingOrderItems, ...newInsertedItems];
    const totalAmount = allItems.reduce((sum, oi) => sum + oi.unitPrice * oi.quantity, 0);

    // 5. Update order
    await tx
      .update(order)
      .set({
        status: 'completed',
        totalAmount,
        taxAmount: input.taxAmount,
        paymentMethod: input.paymentMethod,
        stripePaymentIntentId: input.stripePaymentIntentId ?? null,
      })
      .where(eq(order.id, input.orderId));

    const items = mapOrderItems(allItems);
    const { totalCostBasis, totalProfit } = calculateOrderTotals(items);

    return {
      id: existingOrder.id,
      organizationId: existingOrder.organizationId,
      orderNumber: existingOrder.orderNumber,
      customerName: existingOrder.customerName,
      status: 'completed' as OrderStatus,
      totalAmount,
      taxAmount: input.taxAmount,
      paymentMethod: input.paymentMethod,
      totalCostBasis,
      totalProfit,
      createdAt: safeISOString(existingOrder.createdAt) ?? new Date().toISOString(),
      items,
    };
  });

  // Log after transaction commits — best-effort
  await logTransaction({
    organizationId,
    userId,
    action: 'pos.order_completed',
    resourceType: 'order',
    resourceId: result.id,
    details: {
      orderNumber: result.orderNumber,
      totalAmount: result.totalAmount,
      taxAmount: result.taxAmount,
      paymentMethod: result.paymentMethod,
      itemCount: result.items.length,
    },
  });

  return result;
}

// ---------------------------------------------------------------------------
// getPosConfig — configuration needed by the POS UI
// ---------------------------------------------------------------------------

export async function getPosConfig(stateCode?: string | null) {
  let taxRate = 0;
  if (stateCode) {
    const tax = await SalesTax.getSalesTax('US', stateCode);
    taxRate = tax.rate;
  }

  const [row] = await otcgs
    .select({
      stripeEnabled: companySettings.stripeEnabled,
      stripePublishableKey: companySettings.stripePublishableKey,
    })
    .from(companySettings)
    .where(eq(companySettings.id, 1))
    .limit(1);

  return {
    taxRate,
    stripeEnabled: !!row?.stripeEnabled,
    stripePublishableKey: row?.stripePublishableKey ?? null,
  };
}
