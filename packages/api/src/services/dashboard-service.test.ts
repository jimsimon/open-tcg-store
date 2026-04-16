import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chainable } from '../test-utils';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let selectChain: ReturnType<typeof chainable>;

const mockOtcgs = vi.hoisted(() => ({
  select: vi.fn(),
  query: {
    order: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../db', () => ({
  otcgs: mockOtcgs,
  inventoryItem: {
    id: 'inventory_item.id',
    organizationId: 'inventory_item.organization_id',
    price: 'inventory_item.price',
  },
  inventoryItemStock: {
    id: 'inventory_item_stock.id',
    inventoryItemId: 'inventory_item_stock.inventory_item_id',
    quantity: 'inventory_item_stock.quantity',
    costBasis: 'inventory_item_stock.cost_basis',
    deletedAt: 'inventory_item_stock.deleted_at',
  },
  order: {
    id: 'order.id',
    organizationId: 'order.organization_id',
    status: 'order.status',
    totalAmount: 'order.total_amount',
    createdAt: 'order.created_at',
    orderNumber: 'order.order_number',
    customerName: 'order.customer_name',
  },
  orderItem: {
    id: 'order_item.id',
    orderId: 'order_item.order_id',
    productId: 'order_item.product_id',
    productName: 'order_item.product_name',
    quantity: 'order_item.quantity',
    unitPrice: 'order_item.unit_price',
    costBasis: 'order_item.cost_basis',
  },
}));

vi.mock('drizzle-orm', () => {
  const sqlResult = () => ({ type: 'sql', mapWith: vi.fn().mockReturnValue({ type: 'mapped-sql' }) });
  const sqlFn = Object.assign(
    vi.fn((..._args: unknown[]) => sqlResult()),
    {
      raw: vi.fn(),
      join: vi.fn(),
    },
  );

  return {
    eq: vi.fn((...args: unknown[]) => ({ type: 'eq', args })),
    and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
    ne: vi.fn((...args: unknown[]) => ({ type: 'ne', args })),
    gte: vi.fn((...args: unknown[]) => ({ type: 'gte', args })),
    lte: vi.fn((...args: unknown[]) => ({ type: 'lte', args })),
    isNull: vi.fn((...args: unknown[]) => ({ type: 'isNull', args })),
    count: vi.fn((...args: unknown[]) => ({ type: 'count', args })),
    sum: vi.fn((...args: unknown[]) => ({
      type: 'sum',
      args,
      mapWith: vi.fn().mockReturnValue({ type: 'mapped-sum' }),
    })),
    desc: vi.fn((...args: unknown[]) => ({ type: 'desc', args })),
    sql: sqlFn,
  };
});

// Import after mocks
import {
  getSalesBreakdown,
  getBestSellers,
  getInventorySummary,
  getOrderStatusBreakdown,
  getOpenOrders,
} from './dashboard-service';

const ORG_ID = 'org-1';

beforeEach(() => {
  vi.clearAllMocks();
  selectChain = chainable([]);
  mockOtcgs.select.mockImplementation(() => selectChain);
  mockOtcgs.query.order.findMany.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// getSalesBreakdown
// ---------------------------------------------------------------------------

describe('getSalesBreakdown', () => {
  it('should return empty summary with hourly granularity for same-day range with no orders', async () => {
    const result = await getSalesBreakdown(ORG_ID, '2024-03-15T00:00:00', '2024-03-15T23:59:59');

    expect(result.granularity).toBe('hour');
    expect(result.summary).toEqual({
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      profitMargin: 0,
      orderCount: 0,
    });
    expect(result.dataPoints).toHaveLength(24);
    expect(result.dataPoints[0].label).toBe('12 AM');
    expect(result.dataPoints[12].label).toBe('12 PM');
    expect(result.dataPoints[15].label).toBe('3 PM');
  });

  it('should use day granularity for multi-day range <= 90 days', async () => {
    const result = await getSalesBreakdown(ORG_ID, '2024-03-01', '2024-03-03');

    expect(result.granularity).toBe('day');
    expect(result.dataPoints.length).toBeGreaterThanOrEqual(3);
  });

  it('should use month granularity for ranges > 90 days', async () => {
    const result = await getSalesBreakdown(ORG_ID, '2024-01-01', '2024-06-01');

    expect(result.granularity).toBe('month');
    expect(result.dataPoints.length).toBeGreaterThanOrEqual(6);
  });

  it('should calculate revenue, cost and profit correctly', async () => {
    mockOtcgs.query.order.findMany.mockResolvedValue([
      {
        totalAmount: 5000,
        createdAt: new Date('2024-03-15T10:00:00'),
        orderItems: [
          { costBasis: 1000, quantity: 2 },
          { costBasis: 500, quantity: 1 },
        ],
      },
      {
        totalAmount: 3000,
        createdAt: new Date('2024-03-15T14:00:00'),
        orderItems: [{ costBasis: null, quantity: 3 }],
      },
    ]);

    const result = await getSalesBreakdown(ORG_ID, '2024-03-15T00:00:00', '2024-03-15T23:59:59');

    expect(result.summary.totalRevenue).toBe(8000);
    expect(result.summary.totalCost).toBe(2500); // 1000*2 + 500*1 = 2500; null skipped
    expect(result.summary.totalProfit).toBe(5500);
    expect(result.summary.orderCount).toBe(2);
    expect(result.summary.profitMargin).toBeCloseTo(68.8, 0);
  });

  it('should handle createdAt as string values', async () => {
    mockOtcgs.query.order.findMany.mockResolvedValue([
      {
        totalAmount: 1000,
        createdAt: '2024-03-15T10:00:00.000Z',
        orderItems: [],
      },
    ]);

    const result = await getSalesBreakdown(ORG_ID, '2024-03-15T00:00:00', '2024-03-15T23:59:59');

    expect(result.summary.orderCount).toBe(1);
    expect(result.summary.totalRevenue).toBe(1000);
  });

  it('should group orders into correct hourly buckets', async () => {
    mockOtcgs.query.order.findMany.mockResolvedValue([
      { totalAmount: 1000, createdAt: new Date('2024-03-15T10:30:00'), orderItems: [] },
      { totalAmount: 2000, createdAt: new Date('2024-03-15T10:45:00'), orderItems: [] },
      { totalAmount: 500, createdAt: new Date('2024-03-15T14:00:00'), orderItems: [] },
    ]);

    const result = await getSalesBreakdown(ORG_ID, '2024-03-15T00:00:00', '2024-03-15T23:59:59');

    const hour10 = result.dataPoints[10];
    expect(hour10.revenue).toBe(3000);
    expect(hour10.orderCount).toBe(2);

    const hour14 = result.dataPoints[14];
    expect(hour14.revenue).toBe(500);
    expect(hour14.orderCount).toBe(1);

    // Empty hours should be zero
    expect(result.dataPoints[0].revenue).toBe(0);
    expect(result.dataPoints[0].orderCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getBestSellers
// ---------------------------------------------------------------------------

describe('getBestSellers', () => {
  it('should return empty array when no results', async () => {
    const result = await getBestSellers(ORG_ID, '2024-03-01', '2024-03-31', 'quantity');

    expect(result).toEqual([]);
  });

  it('should map results and default nulls to 0', async () => {
    selectChain = chainable([
      { productId: 1, productName: 'Card A', totalQuantity: null, totalRevenue: null },
      { productId: 2, productName: 'Card B', totalQuantity: 10, totalRevenue: 5000 },
    ]);
    mockOtcgs.select.mockImplementation(() => selectChain);

    const result = await getBestSellers(ORG_ID, '2024-03-01', '2024-03-31', 'quantity');

    expect(result).toEqual([
      { productId: 1, productName: 'Card A', totalQuantity: 0, totalRevenue: 0 },
      { productId: 2, productName: 'Card B', totalQuantity: 10, totalRevenue: 5000 },
    ]);
  });

  it('should use default limit of 10', async () => {
    await getBestSellers(ORG_ID, '2024-03-01', '2024-03-31', 'quantity');

    // Verify limit was called on the chain
    expect((selectChain as Record<string, unknown>).limit).toHaveBeenCalledWith(10);
  });

  it('should pass custom limit', async () => {
    await getBestSellers(ORG_ID, '2024-03-01', '2024-03-31', 'revenue', 5);

    expect((selectChain as Record<string, unknown>).limit).toHaveBeenCalledWith(5);
  });
});

// ---------------------------------------------------------------------------
// getInventorySummary
// ---------------------------------------------------------------------------

describe('getInventorySummary', () => {
  it('should return zeroes when no inventory', async () => {
    // First call: SKU count returns 0
    const skuChain = chainable([{ totalSkus: 0 }]);
    // Second call: stock summary returns empty
    const stockChain = chainable([{ totalUnits: null, totalCostValue: null, totalRetailValue: null }]);

    mockOtcgs.select.mockImplementationOnce(() => skuChain).mockImplementationOnce(() => stockChain);

    const result = await getInventorySummary(ORG_ID);

    expect(result).toEqual({
      totalSkus: 0,
      totalUnits: 0,
      totalCostValue: 0,
      totalRetailValue: 0,
    });
  });

  it('should aggregate inventory data correctly', async () => {
    const skuChain = chainable([{ totalSkus: 15 }]);
    const stockChain = chainable([{ totalUnits: 150, totalCostValue: 50000, totalRetailValue: 75000 }]);

    mockOtcgs.select.mockImplementationOnce(() => skuChain).mockImplementationOnce(() => stockChain);

    const result = await getInventorySummary(ORG_ID);

    expect(result).toEqual({
      totalSkus: 15,
      totalUnits: 150,
      totalCostValue: 50000,
      totalRetailValue: 75000,
    });
  });

  it('should handle empty result sets gracefully', async () => {
    const skuChain = chainable([]);
    const stockChain = chainable([]);

    mockOtcgs.select.mockImplementationOnce(() => skuChain).mockImplementationOnce(() => stockChain);

    const result = await getInventorySummary(ORG_ID);

    expect(result).toEqual({
      totalSkus: 0,
      totalUnits: 0,
      totalCostValue: 0,
      totalRetailValue: 0,
    });
  });
});

// ---------------------------------------------------------------------------
// getOrderStatusBreakdown
// ---------------------------------------------------------------------------

describe('getOrderStatusBreakdown', () => {
  it('should return zeroes when no orders', async () => {
    const result = await getOrderStatusBreakdown(ORG_ID, '2024-03-01', '2024-03-31');

    expect(result).toEqual({ open: 0, completed: 0, cancelled: 0, total: 0 });
  });

  it('should tally statuses correctly', async () => {
    selectChain = chainable([
      { status: 'open', count: 5 },
      { status: 'completed', count: 20 },
      { status: 'cancelled', count: 3 },
    ]);
    mockOtcgs.select.mockImplementation(() => selectChain);

    const result = await getOrderStatusBreakdown(ORG_ID, '2024-03-01', '2024-03-31');

    expect(result).toEqual({ open: 5, completed: 20, cancelled: 3, total: 28 });
  });

  it('should handle partial status results', async () => {
    selectChain = chainable([{ status: 'completed', count: 10 }]);
    mockOtcgs.select.mockImplementation(() => selectChain);

    const result = await getOrderStatusBreakdown(ORG_ID, '2024-03-01', '2024-03-31');

    expect(result).toEqual({ open: 0, completed: 10, cancelled: 0, total: 10 });
  });

  it('should ignore unknown statuses', async () => {
    selectChain = chainable([
      { status: 'open', count: 2 },
      { status: 'unknown-status', count: 99 },
    ]);
    mockOtcgs.select.mockImplementation(() => selectChain);

    const result = await getOrderStatusBreakdown(ORG_ID, '2024-03-01', '2024-03-31');

    expect(result).toEqual({ open: 2, completed: 0, cancelled: 0, total: 2 });
  });
});

// ---------------------------------------------------------------------------
// getOpenOrders
// ---------------------------------------------------------------------------

describe('getOpenOrders', () => {
  it('should return empty array when no open orders', async () => {
    const result = await getOpenOrders(ORG_ID);

    expect(result).toEqual([]);
  });

  it('should map orders with computed item count', async () => {
    mockOtcgs.query.order.findMany.mockResolvedValue([
      {
        id: 1,
        orderNumber: 'ORD-001',
        customerName: 'Alice',
        totalAmount: 5000,
        createdAt: new Date('2024-03-15T10:00:00Z'),
        orderItems: [{ quantity: 2 }, { quantity: 3 }],
      },
    ]);

    const result = await getOpenOrders(ORG_ID);

    expect(result).toEqual([
      {
        id: 1,
        orderNumber: 'ORD-001',
        customerName: 'Alice',
        totalAmount: 5000,
        itemCount: 5,
        createdAt: '2024-03-15T10:00:00.000Z',
      },
    ]);
  });

  it('should handle createdAt as string', async () => {
    mockOtcgs.query.order.findMany.mockResolvedValue([
      {
        id: 2,
        orderNumber: 'ORD-002',
        customerName: 'Bob',
        totalAmount: 1000,
        createdAt: '2024-03-15T14:30:00.000Z',
        orderItems: [{ quantity: 1 }],
      },
    ]);

    const result = await getOpenOrders(ORG_ID);

    expect(result[0].createdAt).toBe('2024-03-15T14:30:00.000Z');
    expect(result[0].itemCount).toBe(1);
  });

  it('should use default limit of 10', async () => {
    await getOpenOrders(ORG_ID);

    expect(mockOtcgs.query.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
  });

  it('should pass custom limit', async () => {
    await getOpenOrders(ORG_ID, 5);

    expect(mockOtcgs.query.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
  });
});
