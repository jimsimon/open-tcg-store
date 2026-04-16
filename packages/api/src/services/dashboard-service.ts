import { and, eq, sql, gte, lte, isNull, ne, count, sum, desc } from 'drizzle-orm';
import { inventoryItem, inventoryItemStock, order, orderItem, otcgs } from '../db';
import type { Granularity as GranularityType } from '../schema/types.generated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SalesSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  orderCount: number;
}

interface SalesDataPoint {
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  orderCount: number;
}

interface SalesBreakdown {
  summary: SalesSummary;
  dataPoints: SalesDataPoint[];
  granularity: GranularityType;
}

interface BestSeller {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface InventorySummaryResult {
  totalSkus: number;
  totalUnits: number;
  totalCostValue: number;
  totalRetailValue: number;
}

interface OrderStatusBreakdownResult {
  open: number;
  completed: number;
  cancelled: number;
  total: number;
}

interface OpenOrderResult {
  id: number;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Granularity = 'hour' | 'day' | 'month';

function determineGranularity(startDate: Date, endDate: Date): Granularity {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 1) return 'hour';
  if (diffDays <= 90) return 'day';
  return 'month';
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Sales Breakdown
// ---------------------------------------------------------------------------

export async function getSalesBreakdown(
  organizationId: string,
  startDateStr: string,
  endDateStr: string,
): Promise<SalesBreakdown> {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const granularity = determineGranularity(startDate, endDate);

  // Fetch all non-cancelled orders in the date range with their items
  const orders = await otcgs.query.order.findMany({
    where: and(
      eq(order.organizationId, organizationId),
      ne(order.status, 'cancelled'),
      gte(order.createdAt, startDate),
      lte(order.createdAt, endDate),
    ),
    with: {
      orderItems: true,
    },
    orderBy: [order.createdAt],
  });

  // Calculate summary
  let totalRevenue = 0;
  let totalCost = 0;
  let orderCount = orders.length;

  for (const o of orders) {
    totalRevenue += o.totalAmount;
    for (const item of o.orderItems) {
      if (item.costBasis != null) {
        totalCost += item.costBasis * item.quantity;
      }
    }
  }

  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Build data points by grouping orders into time buckets
  const bucketMap = new Map<string, SalesDataPoint>();

  for (const o of orders) {
    const createdAt = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);
    let bucketKey: string;
    let label: string;

    if (granularity === 'hour') {
      const hour = createdAt.getHours();
      bucketKey = String(hour);
      label = formatHourLabel(hour);
    } else if (granularity === 'day') {
      bucketKey = createdAt.toISOString().slice(0, 10);
      label = formatDayLabel(bucketKey);
    } else {
      bucketKey = createdAt.toISOString().slice(0, 7);
      label = formatMonthLabel(bucketKey);
    }

    let bucket = bucketMap.get(bucketKey);
    if (!bucket) {
      bucket = { label, revenue: 0, cost: 0, profit: 0, orderCount: 0 };
      bucketMap.set(bucketKey, bucket);
    }

    bucket.revenue += o.totalAmount;
    bucket.orderCount += 1;
    for (const item of o.orderItems) {
      if (item.costBasis != null) {
        bucket.cost += item.costBasis * item.quantity;
      }
    }
  }

  // Compute profit per bucket
  for (const bucket of bucketMap.values()) {
    bucket.profit = bucket.revenue - bucket.cost;
  }

  // Generate all expected bucket keys to fill gaps
  const dataPoints: SalesDataPoint[] = [];

  if (granularity === 'hour') {
    for (let h = 0; h < 24; h++) {
      const key = String(h);
      const bucket = bucketMap.get(key);
      dataPoints.push(bucket ?? { label: formatHourLabel(h), revenue: 0, cost: 0, profit: 0, orderCount: 0 });
    }
  } else if (granularity === 'day') {
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      const bucket = bucketMap.get(key);
      dataPoints.push(bucket ?? { label: formatDayLabel(key), revenue: 0, cost: 0, profit: 0, orderCount: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    while (cursor <= endMonth) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      const bucket = bucketMap.get(key);
      dataPoints.push(bucket ?? { label: formatMonthLabel(key), revenue: 0, cost: 0, profit: 0, orderCount: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return {
    summary: {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin: Math.round(profitMargin * 10) / 10,
      orderCount,
    },
    dataPoints,
    granularity,
  };
}

// ---------------------------------------------------------------------------
// Best Sellers
// ---------------------------------------------------------------------------

export async function getBestSellers(
  organizationId: string,
  startDateStr: string,
  endDateStr: string,
  sortBy: string,
  limit: number = 10,
): Promise<BestSeller[]> {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const rows = await otcgs
    .select({
      productId: orderItem.productId,
      productName: orderItem.productName,
      totalQuantity: sum(orderItem.quantity).mapWith(Number),
      totalRevenue: sql<number>`SUM(${orderItem.unitPrice} * ${orderItem.quantity})`.mapWith(Number),
    })
    .from(orderItem)
    .innerJoin(order, eq(orderItem.orderId, order.id))
    .where(
      and(
        eq(order.organizationId, organizationId),
        ne(order.status, 'cancelled'),
        gte(order.createdAt, startDate),
        lte(order.createdAt, endDate),
      ),
    )
    .groupBy(orderItem.productId, orderItem.productName)
    .orderBy(
      sortBy === 'revenue'
        ? desc(sql`SUM(${orderItem.unitPrice} * ${orderItem.quantity})`)
        : desc(sum(orderItem.quantity)),
    )
    .limit(limit);

  return rows.map((r) => ({
    productId: r.productId,
    productName: r.productName,
    totalQuantity: r.totalQuantity ?? 0,
    totalRevenue: r.totalRevenue ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Inventory Summary
// ---------------------------------------------------------------------------

export async function getInventorySummary(organizationId: string): Promise<InventorySummaryResult> {
  // Count distinct inventory items (SKUs) for this org
  const skuResult = await otcgs
    .select({ totalSkus: count(inventoryItem.id) })
    .from(inventoryItem)
    .where(eq(inventoryItem.organizationId, organizationId));

  // Sum stock quantities, cost value, and retail value
  const stockResult = await otcgs
    .select({
      totalUnits: sum(inventoryItemStock.quantity).mapWith(Number),
      totalCostValue: sql<number>`SUM(${inventoryItemStock.quantity} * ${inventoryItemStock.costBasis})`.mapWith(
        Number,
      ),
      totalRetailValue: sql<number>`SUM(${inventoryItemStock.quantity} * ${inventoryItem.price})`.mapWith(Number),
    })
    .from(inventoryItemStock)
    .innerJoin(inventoryItem, eq(inventoryItemStock.inventoryItemId, inventoryItem.id))
    .where(
      and(
        eq(inventoryItem.organizationId, organizationId),
        isNull(inventoryItemStock.deletedAt),
        sql`${inventoryItemStock.quantity} > 0`,
      ),
    );

  return {
    totalSkus: skuResult[0]?.totalSkus ?? 0,
    totalUnits: stockResult[0]?.totalUnits ?? 0,
    totalCostValue: stockResult[0]?.totalCostValue ?? 0,
    totalRetailValue: stockResult[0]?.totalRetailValue ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Order Status Breakdown
// ---------------------------------------------------------------------------

export async function getOrderStatusBreakdown(
  organizationId: string,
  startDateStr: string,
  endDateStr: string,
): Promise<OrderStatusBreakdownResult> {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const rows = await otcgs
    .select({
      status: order.status,
      count: count(order.id),
    })
    .from(order)
    .where(
      and(eq(order.organizationId, organizationId), gte(order.createdAt, startDate), lte(order.createdAt, endDate)),
    )
    .groupBy(order.status);

  let open = 0;
  let completed = 0;
  let cancelled = 0;

  for (const row of rows) {
    if (row.status === 'open') open = row.count;
    else if (row.status === 'completed') completed = row.count;
    else if (row.status === 'cancelled') cancelled = row.count;
  }

  return { open, completed, cancelled, total: open + completed + cancelled };
}

// ---------------------------------------------------------------------------
// Open Orders
// ---------------------------------------------------------------------------

export async function getOpenOrders(organizationId: string, limit: number = 10): Promise<OpenOrderResult[]> {
  const orders = await otcgs.query.order.findMany({
    where: and(eq(order.organizationId, organizationId), eq(order.status, 'open')),
    with: {
      orderItems: true,
    },
    orderBy: [desc(order.createdAt)],
    limit,
  });

  return orders.map((o) => {
    const itemCount = o.orderItems.reduce((acc, item) => acc + item.quantity, 0);
    const createdAt = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      totalAmount: o.totalAmount,
      itemCount,
      createdAt: createdAt.toISOString(),
    };
  });
}
