import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock helpers — same chainable pattern as inventory-service.test.ts
// ---------------------------------------------------------------------------

function chainable(rows: unknown[] = []) {
  const chain = Object.assign(Promise.resolve(rows), {} as Record<string, unknown>);
  for (const method of [
    'select',
    'from',
    'where',
    'limit',
    'offset',
    'innerJoin',
    'leftJoin',
    'insert',
    'update',
    'delete',
    'set',
    'values',
    'returning',
    'orderBy',
    'groupBy',
    'having',
  ]) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

let selectChain: ReturnType<typeof chainable>;
let insertChain: ReturnType<typeof chainable>;
let updateChain: ReturnType<typeof chainable>;
let deleteChain: ReturnType<typeof chainable>;

// ---------------------------------------------------------------------------
// Mock database
// ---------------------------------------------------------------------------

const mockOtcgs = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
    // The tx object mirrors the same mock methods so queries inside the transaction work
    const tx = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    // Delegate tx methods to the same mocks so existing test setups work
    tx.select.mockImplementation((...args: unknown[]) => mockOtcgs.select(...args));
    tx.insert.mockImplementation((...args: unknown[]) => mockOtcgs.insert(...args));
    tx.update.mockImplementation((...args: unknown[]) => mockOtcgs.update(...args));
    tx.delete.mockImplementation((...args: unknown[]) => mockOtcgs.delete(...args));
    return fn(tx);
  }),
  query: {
    order: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../db', () => ({
  otcgs: mockOtcgs,
  cartItem: {
    id: 'cart_item.id',
    cartId: 'cart_item.cart_id',
    inventoryItemId: 'cart_item.inventory_item_id',
    quantity: 'cart_item.quantity',
  },
  inventoryItem: {
    id: 'inventory_item.id',
    organizationId: 'inventory_item.organization_id',
    productId: 'inventory_item.product_id',
    condition: 'inventory_item.condition',
    price: 'inventory_item.price',
    createdAt: 'inventory_item.created_at',
    updatedAt: 'inventory_item.updated_at',
  },
  inventoryItemStock: {
    id: 'inventory_item_stock.id',
    inventoryItemId: 'inventory_item_stock.inventory_item_id',
    quantity: 'inventory_item_stock.quantity',
    costBasis: 'inventory_item_stock.cost_basis',
    deletedAt: 'inventory_item_stock.deleted_at',
    createdAt: 'inventory_item_stock.created_at',
    updatedAt: 'inventory_item_stock.updated_at',
  },
  order: {
    id: 'order.id',
    organizationId: 'order.organization_id',
    orderNumber: 'order.order_number',
    customerName: 'order.customer_name',
    userId: 'order.user_id',
    status: 'order.status',
    totalAmount: 'order.total_amount',
    createdAt: 'order.created_at',
  },
  orderItem: {
    id: 'order_item.id',
    orderId: 'order_item.order_id',
    inventoryItemId: 'order_item.inventory_item_id',
    inventoryItemStockId: 'order_item.inventory_item_stock_id',
    productId: 'order_item.product_id',
    productName: 'order_item.product_name',
    condition: 'order_item.condition',
    quantity: 'order_item.quantity',
    unitPrice: 'order_item.unit_price',
    costBasis: 'order_item.cost_basis',
  },
  cart: {
    id: 'cart.id',
    organizationId: 'cart.organization_id',
    userId: 'cart.user_id',
  },
}));

// Mock tcg-data product table
vi.mock('../db/tcg-data/schema', () => ({
  product: {
    id: 'product.id',
    name: 'product.name',
    categoryId: 'product.category_id',
    groupId: 'product.group_id',
  },
}));

// Mock the transaction log service so logging calls don't break tests
const { mockLogTransaction } = vi.hoisted(() => ({
  mockLogTransaction: vi.fn(),
}));

vi.mock('./transaction-log-service', () => ({
  logTransaction: mockLogTransaction,
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => {
  const sqlResult = () => ({ type: 'sql', as: vi.fn().mockReturnValue({ type: 'sql-alias' }) });
  const sqlFn = Object.assign(
    vi.fn((..._args: unknown[]) => sqlResult()),
    {
      raw: vi.fn(),
      join: vi.fn((..._args: unknown[]) => ({ type: 'sql-join' })),
    },
  );
  return {
    eq: vi.fn((...args: unknown[]) => ({ type: 'eq', args })),
    and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
    like: vi.fn((...args: unknown[]) => ({ type: 'like', args })),
    or: vi.fn((...args: unknown[]) => ({ type: 'or', args })),
    sql: sqlFn,
    asc: vi.fn((...args: unknown[]) => ({ type: 'asc', args })),
    inArray: vi.fn((...args: unknown[]) => ({ type: 'inArray', args })),
    isNull: vi.fn((...args: unknown[]) => ({ type: 'isNull', args })),
    gt: vi.fn((...args: unknown[]) => ({ type: 'gt', args })),
  };
});

// ---------------------------------------------------------------------------
// Import the service under test *after* mocks are registered.
// ---------------------------------------------------------------------------
import { submitOrder, cancelOrder, updateOrderStatus, getOrders } from './order-service';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('order-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectChain = chainable([]);
    insertChain = chainable([]);
    updateChain = chainable([]);
    deleteChain = chainable([]);
    mockOtcgs.select.mockImplementation(() => selectChain);
    mockOtcgs.insert.mockImplementation(() => insertChain);
    mockOtcgs.update.mockImplementation(() => updateChain);
    mockOtcgs.delete.mockImplementation(() => deleteChain);
  });

  // -----------------------------------------------------------------------
  // submitOrder
  // -----------------------------------------------------------------------
  describe('submitOrder', () => {
    it('should return error when cart is empty (no cart found)', async () => {
      // select #1: cart lookup returns empty
      const noCartChain = chainable([]);
      mockOtcgs.select.mockImplementation(() => noCartChain);

      const result = await submitOrder('org-1', 'user-1', 'Customer');

      expect(result.error).toBe('Cart is empty');
      expect(result.order).toBeUndefined();
    });

    it('should return error when cart has no items', async () => {
      // select #1: cart lookup returns a cart
      const cartChain = chainable([{ id: 1 }]);
      // select #2: cart items query returns empty
      const emptyItemsChain = chainable([]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        if (selectIdx === 1) return cartChain;
        return emptyItemsChain;
      });

      const result = await submitOrder('org-1', 'user-1', 'Customer');

      expect(result.error).toBe('Cart is empty');
      expect(result.order).toBeUndefined();
    });

    it('should return insufficient inventory error when stock is too low', async () => {
      // select #1: cart lookup
      const cartChain = chainable([{ id: 1 }]);
      // select #2: cart items with inventory+product join
      const cartItemsChain = chainable([
        {
          id: 1,
          inventoryItemId: 100,
          quantity: 10,
          invId: 100,
          invCondition: 'NM',
          invPrice: 5.0,
          productId: 200,
          productName: 'Charizard',
        },
      ]);
      // select #3: batched stock check — only 3 available for invId 100
      const stockCheckChain = chainable([{ inventoryItemId: 100, total: 3 }]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        if (selectIdx === 1) return cartChain;
        if (selectIdx === 2) return cartItemsChain;
        return stockCheckChain;
      });

      const result = await submitOrder('org-1', 'user-1', 'Customer');

      expect(result.error).toBe('Insufficient inventory for one or more items');
      expect(result.insufficientItems).toHaveLength(1);
      expect(result.insufficientItems![0].productName).toBe('Charizard');
      expect(result.insufficientItems![0].requested).toBe(10);
      expect(result.insufficientItems![0].available).toBe(3);
    });

    it('should create order and decrement stock using FIFO', async () => {
      // select #1: cart lookup
      const cartChain = chainable([{ id: 1 }]);
      // select #2: cart items with inventory+product join
      const cartItemsChain = chainable([
        {
          id: 1,
          inventoryItemId: 100,
          quantity: 3,
          invId: 100,
          invCondition: 'NM',
          invPrice: 10.0,
          productId: 200,
          productName: 'Sol Ring',
        },
      ]);
      // select #3: batched stock availability check — 5 available for invId 100
      const stockCheckChain = chainable([{ inventoryItemId: 100, total: 5 }]);
      // select #4: prefetched FIFO stock entries for all inventory items
      const fifoChain = chainable([
        { id: 10, inventoryItemId: 100, quantity: 2, costBasis: 5.0 },
        { id: 11, inventoryItemId: 100, quantity: 3, costBasis: 6.0 },
      ]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        if (selectIdx === 1) return cartChain;
        if (selectIdx === 2) return cartItemsChain;
        if (selectIdx === 3) return stockCheckChain;
        return fifoChain;
      });

      // Insert order: returns inserted order
      const insertOrderChain = chainable([
        {
          id: 1,
          organizationId: 'org-1',
          orderNumber: 'ORD-20260101-1234',
          customerName: 'Customer',
          status: 'open',
          totalAmount: 30.0,
          createdAt: new Date('2026-01-01'),
        },
      ]);

      // Insert order items
      const insertItemsChain = chainable([
        {
          id: 1,
          productId: 200,
          productName: 'Sol Ring',
          condition: 'NM',
          quantity: 2,
          unitPrice: 10.0,
          costBasis: 5.0,
        },
        {
          id: 2,
          productId: 200,
          productName: 'Sol Ring',
          condition: 'NM',
          quantity: 1,
          unitPrice: 10.0,
          costBasis: 6.0,
        },
      ]);

      let insertIdx = 0;
      mockOtcgs.insert.mockImplementation(() => {
        insertIdx++;
        if (insertIdx === 1) return insertOrderChain;
        return insertItemsChain;
      });

      const result = await submitOrder('org-1', 'user-1', 'Customer');

      expect(result.error).toBeUndefined();
      expect(result.order).toBeDefined();
      expect(result.order!.status).toBe('open');
      expect(result.order!.totalAmount).toBe(30.0);
      expect(result.order!.items).toHaveLength(2);
      // Stock should have been updated
      expect(mockOtcgs.update).toHaveBeenCalled();
      // Cart should have been cleared
      expect(mockOtcgs.delete).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // cancelOrder
  // -----------------------------------------------------------------------
  describe('cancelOrder', () => {
    it('should return error when order not found', async () => {
      mockOtcgs.query.order.findFirst.mockResolvedValue(null);

      const result = await cancelOrder(999, 'org-1', 'user-1');

      expect(result.error).toBe('Order not found');
    });

    it('should return error when order is already cancelled', async () => {
      mockOtcgs.query.order.findFirst.mockResolvedValue({
        id: 1,
        status: 'cancelled',
        orderItems: [],
      });

      const result = await cancelOrder(1, 'org-1', 'user-1');

      expect(result.error).toBe('Order is already cancelled');
    });

    it('should cancel an open order and restock using stock entry ID', async () => {
      mockOtcgs.query.order.findFirst.mockResolvedValue({
        id: 1,
        organizationId: 'org-1',
        orderNumber: 'ORD-20260101-0001',
        customerName: 'Customer',
        status: 'open',
        totalAmount: 10.0,
        createdAt: new Date('2026-01-01'),
        orderItems: [
          {
            id: 1,
            inventoryItemId: 100,
            inventoryItemStockId: 10,
            productId: 200,
            productName: 'Sol Ring',
            condition: 'NM',
            quantity: 2,
            unitPrice: 5.0,
            costBasis: 3.0,
          },
        ],
      });

      // Stock entry lookup for restocking
      const stockLookupChain = chainable([{ id: 10, deletedAt: null }]);
      mockOtcgs.select.mockImplementation(() => stockLookupChain);

      const result = await cancelOrder(1, 'org-1', 'user-1');

      expect(result.error).toBeUndefined();
      expect(result.order).toBeDefined();
      expect(result.order!.status).toBe('cancelled');
      // Stock should be updated (restocked)
      expect(mockOtcgs.update).toHaveBeenCalled();
    });

    it('should cancel and restock when stock entry was deleted (undelete)', async () => {
      mockOtcgs.query.order.findFirst.mockResolvedValue({
        id: 1,
        organizationId: 'org-1',
        orderNumber: 'ORD-20260101-0001',
        customerName: 'Customer',
        status: 'open',
        totalAmount: 5.0,
        createdAt: new Date('2026-01-01'),
        orderItems: [
          {
            id: 1,
            inventoryItemId: 100,
            inventoryItemStockId: 10,
            productId: 200,
            productName: 'Card A',
            condition: 'NM',
            quantity: 1,
            unitPrice: 5.0,
            costBasis: 2.0,
          },
        ],
      });

      // Stock entry lookup — the entry has a deletedAt (was soft-deleted)
      const stockLookupChain = chainable([{ id: 10, deletedAt: new Date() }]);
      mockOtcgs.select.mockImplementation(() => stockLookupChain);

      const result = await cancelOrder(1, 'org-1', 'user-1');

      expect(result.order).toBeDefined();
      expect(result.order!.status).toBe('cancelled');
      expect(mockOtcgs.update).toHaveBeenCalled();
    });

    it('should fall back to restockFallback when stock entry is hard-deleted', async () => {
      mockOtcgs.query.order.findFirst.mockResolvedValue({
        id: 1,
        organizationId: 'org-1',
        orderNumber: 'ORD-20260101-0001',
        customerName: 'Customer',
        status: 'open',
        totalAmount: 5.0,
        createdAt: new Date('2026-01-01'),
        orderItems: [
          {
            id: 1,
            inventoryItemId: 100,
            inventoryItemStockId: 10,
            productId: 200,
            productName: 'Card B',
            condition: 'LP',
            quantity: 1,
            unitPrice: 5.0,
            costBasis: null,
          },
        ],
      });

      // Stock entry lookup — not found (hard-deleted), then restockFallback
      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        // First: stock entry lookup (not found)
        if (selectIdx === 1) return chainable([]);
        // Second: matching stock entry by costBasis in restockFallback
        if (selectIdx === 2) return chainable([{ id: 50, deletedAt: null }]);
        return chainable([]);
      });

      const result = await cancelOrder(1, 'org-1', 'user-1');

      expect(result.order).toBeDefined();
      expect(result.order!.status).toBe('cancelled');
    });

    it('should use legacy fallback when no inventoryItemStockId but has inventoryItemId', async () => {
      mockOtcgs.query.order.findFirst.mockResolvedValue({
        id: 1,
        organizationId: 'org-1',
        orderNumber: 'ORD-20260101-0001',
        customerName: 'Customer',
        status: 'open',
        totalAmount: 5.0,
        createdAt: new Date('2026-01-01'),
        orderItems: [
          {
            id: 1,
            inventoryItemId: 100,
            inventoryItemStockId: null,
            productId: 200,
            productName: 'Legacy Card',
            condition: 'NM',
            quantity: 1,
            unitPrice: 5.0,
            costBasis: 2.0,
          },
        ],
      });

      // restockFallback: look for matching stock entry
      const existingStockChain = chainable([{ id: 50, deletedAt: null }]);
      mockOtcgs.select.mockImplementation(() => existingStockChain);

      const result = await cancelOrder(1, 'org-1', 'user-1');

      expect(result.order).toBeDefined();
      expect(result.order!.status).toBe('cancelled');
    });

    it('should use very legacy fallback when no inventoryItemId at all', async () => {
      mockOtcgs.query.order.findFirst.mockResolvedValue({
        id: 1,
        organizationId: 'org-1',
        orderNumber: 'ORD-20260101-0001',
        customerName: 'Customer',
        status: 'open',
        totalAmount: 5.0,
        createdAt: new Date('2026-01-01'),
        orderItems: [
          {
            id: 1,
            inventoryItemId: null,
            inventoryItemStockId: null,
            productId: 200,
            productName: 'Very Old Card',
            condition: 'NM',
            quantity: 1,
            unitPrice: 5.0,
            costBasis: null,
          },
        ],
      });

      // restockFallbackByProduct → restockFallback with null inventoryItemId
      // Will look up parent by product+condition, then look for matching stock entry
      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        // First: parent lookup by product+condition
        if (selectIdx === 1) return chainable([{ id: 100 }]);
        // Second: stock entry lookup (none found → will insert new)
        return chainable([]);
      });

      const result = await cancelOrder(1, 'org-1', 'user-1');

      expect(result.order).toBeDefined();
      expect(result.order!.status).toBe('cancelled');
    });
  });

  // -----------------------------------------------------------------------
  // updateOrderStatus
  // -----------------------------------------------------------------------
  describe('updateOrderStatus', () => {
    it('should return error for invalid status', async () => {
      const result = await updateOrderStatus(1, 'shipped', 'org-1', 'user-1');

      expect(result.error).toBe('Invalid status "shipped". Valid statuses: open, completed');
    });

    it('should return error when order not found', async () => {
      mockOtcgs.query.order.findFirst.mockResolvedValue(null);

      const result = await updateOrderStatus(1, 'completed', 'org-1', 'user-1');

      expect(result.error).toBe('Order not found');
    });

    it('should return error when order is already cancelled', async () => {
      mockOtcgs.query.order.findFirst.mockResolvedValue({
        id: 1,
        status: 'cancelled',
        orderItems: [],
      });

      const result = await updateOrderStatus(1, 'completed', 'org-1', 'user-1');

      expect(result.error).toBe('Cannot change status of a cancelled order');
    });

    it('should return error when order already has the target status', async () => {
      mockOtcgs.query.order.findFirst.mockResolvedValue({
        id: 1,
        status: 'open',
        orderItems: [],
      });

      const result = await updateOrderStatus(1, 'open', 'org-1', 'user-1');

      expect(result.error).toBe('Order is already open');
    });

    it('should update status from open to completed', async () => {
      mockOtcgs.query.order.findFirst.mockResolvedValue({
        id: 1,
        organizationId: 'org-1',
        orderNumber: 'ORD-20260101-0001',
        customerName: 'Customer',
        status: 'open',
        totalAmount: 10.0,
        createdAt: new Date('2026-01-01'),
        orderItems: [
          {
            id: 1,
            productId: 200,
            productName: 'Sol Ring',
            condition: 'NM',
            quantity: 1,
            unitPrice: 10.0,
            costBasis: 5.0,
          },
        ],
      });

      const result = await updateOrderStatus(1, 'completed', 'org-1', 'user-1');

      expect(result.error).toBeUndefined();
      expect(result.order).toBeDefined();
      expect(result.order!.status).toBe('completed');
      expect(mockOtcgs.update).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // getOrders
  // -----------------------------------------------------------------------
  describe('getOrders', () => {
    it('should return paginated orders with defaults', async () => {
      // Count query
      const countChain = chainable([{ total: 2 }]);
      mockOtcgs.select.mockImplementation(() => countChain);

      // Orders query
      mockOtcgs.query.order.findMany.mockResolvedValue([
        {
          id: 1,
          organizationId: 'org-1',
          orderNumber: 'ORD-20260101-0001',
          customerName: 'Alice',
          status: 'open',
          totalAmount: 10.0,
          createdAt: new Date('2026-01-01'),
          orderItems: [
            {
              id: 1,
              productId: 200,
              productName: 'Card A',
              condition: 'NM',
              quantity: 1,
              unitPrice: 10.0,
              costBasis: 5.0,
            },
          ],
        },
        {
          id: 2,
          organizationId: 'org-1',
          orderNumber: 'ORD-20260101-0002',
          customerName: 'Bob',
          status: 'completed',
          totalAmount: 20.0,
          createdAt: new Date('2026-01-02'),
          orderItems: [],
        },
      ]);

      const result = await getOrders('org-1');

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
      expect(result.totalCount).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.orders).toHaveLength(2);
      expect(result.orders[0].orderNumber).toBe('ORD-20260101-0001');
    });

    it('should apply status filter', async () => {
      const countChain = chainable([{ total: 1 }]);
      mockOtcgs.select.mockImplementation(() => countChain);

      mockOtcgs.query.order.findMany.mockResolvedValue([
        {
          id: 1,
          organizationId: 'org-1',
          orderNumber: 'ORD-20260101-0001',
          customerName: 'Alice',
          status: 'open',
          totalAmount: 10.0,
          createdAt: new Date('2026-01-01'),
          orderItems: [],
        },
      ]);

      const result = await getOrders('org-1', null, { status: 'open' });

      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].status).toBe('open');
    });

    it('should apply search filter', async () => {
      const countChain = chainable([{ total: 1 }]);
      mockOtcgs.select.mockImplementation(() => countChain);

      mockOtcgs.query.order.findMany.mockResolvedValue([
        {
          id: 1,
          organizationId: 'org-1',
          orderNumber: 'ORD-20260101-0001',
          customerName: 'Alice',
          status: 'open',
          totalAmount: 10.0,
          createdAt: new Date('2026-01-01'),
          orderItems: [],
        },
      ]);

      const result = await getOrders('org-1', null, { searchTerm: 'Alice' });

      expect(result.orders).toHaveLength(1);
    });

    it('should respect custom pagination', async () => {
      const countChain = chainable([{ total: 50 }]);
      mockOtcgs.select.mockImplementation(() => countChain);
      mockOtcgs.query.order.findMany.mockResolvedValue([]);

      const result = await getOrders('org-1', { page: 3, pageSize: 10 });

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(5);
    });

    it('should calculate cost basis and profit for order items', async () => {
      const countChain = chainable([{ total: 1 }]);
      mockOtcgs.select.mockImplementation(() => countChain);

      mockOtcgs.query.order.findMany.mockResolvedValue([
        {
          id: 1,
          organizationId: 'org-1',
          orderNumber: 'ORD-001',
          customerName: 'Alice',
          status: 'completed',
          totalAmount: 20.0,
          createdAt: new Date('2026-01-01'),
          orderItems: [
            {
              id: 1,
              productId: 200,
              productName: 'Card A',
              condition: 'NM',
              quantity: 2,
              unitPrice: 10.0,
              costBasis: 5.0,
            },
          ],
        },
      ]);

      const result = await getOrders('org-1');

      const order = result.orders[0];
      expect(order.items[0].profit).toBe(10.0); // (10 * 2) - (5 * 2) = 10
      expect(order.totalCostBasis).toBe(10.0); // 5 * 2
      expect(order.totalProfit).toBe(10.0);
    });

    it('should handle createdAt as string (safeISOString string branch)', async () => {
      const countChain = chainable([{ total: 1 }]);
      mockOtcgs.select.mockImplementation(() => countChain);

      mockOtcgs.query.order.findMany.mockResolvedValue([
        {
          id: 1,
          organizationId: 'org-1',
          orderNumber: 'ORD-001',
          customerName: 'Alice',
          status: 'open',
          totalAmount: 10.0,
          createdAt: '2026-01-15T10:00:00.000Z',
          orderItems: [],
        },
      ]);

      const result = await getOrders('org-1');

      expect(result.orders[0].createdAt).toBe('2026-01-15T10:00:00.000Z');
    });

    it('should handle createdAt as unix timestamp number (safeISOString number branch)', async () => {
      const countChain = chainable([{ total: 1 }]);
      mockOtcgs.select.mockImplementation(() => countChain);

      mockOtcgs.query.order.findMany.mockResolvedValue([
        {
          id: 1,
          organizationId: 'org-1',
          orderNumber: 'ORD-001',
          customerName: 'Bob',
          status: 'open',
          totalAmount: 5.0,
          createdAt: 1735689600, // Unix timestamp
          orderItems: [],
        },
      ]);

      const result = await getOrders('org-1');

      // safeISOString converts number * 1000 to Date
      expect(result.orders[0].createdAt).toBeDefined();
      expect(typeof result.orders[0].createdAt).toBe('string');
    });

    it('should handle null/falsy createdAt (safeISOString falsy branch)', async () => {
      const countChain = chainable([{ total: 1 }]);
      mockOtcgs.select.mockImplementation(() => countChain);

      mockOtcgs.query.order.findMany.mockResolvedValue([
        {
          id: 1,
          organizationId: 'org-1',
          orderNumber: 'ORD-001',
          customerName: 'Charlie',
          status: 'open',
          totalAmount: 5.0,
          createdAt: null,
          orderItems: [],
        },
      ]);

      const result = await getOrders('org-1');

      // safeISOString returns new Date().toISOString() for falsy values
      expect(result.orders[0].createdAt).toBeDefined();
    });

    it('should handle mixed cost basis — some items with, some without', async () => {
      const countChain = chainable([{ total: 1 }]);
      mockOtcgs.select.mockImplementation(() => countChain);

      mockOtcgs.query.order.findMany.mockResolvedValue([
        {
          id: 1,
          organizationId: 'org-1',
          orderNumber: 'ORD-001',
          customerName: 'Mixed',
          status: 'completed',
          totalAmount: 25.0,
          createdAt: new Date('2026-01-01'),
          orderItems: [
            {
              id: 1,
              productId: 200,
              productName: 'Card A',
              condition: 'NM',
              quantity: 1,
              unitPrice: 10.0,
              costBasis: 5.0,
            },
            {
              id: 2,
              productId: 201,
              productName: 'Card B',
              condition: 'LP',
              quantity: 1,
              unitPrice: 15.0,
              costBasis: null,
            },
          ],
        },
      ]);

      const result = await getOrders('org-1');

      const order = result.orders[0];
      // Should have partial cost basis (only from item with costBasis)
      expect(order.totalCostBasis).toBe(5.0); // Only Card A has cost basis
    });

    it('should handle null cost basis in order items', async () => {
      const countChain = chainable([{ total: 1 }]);
      mockOtcgs.select.mockImplementation(() => countChain);

      mockOtcgs.query.order.findMany.mockResolvedValue([
        {
          id: 1,
          organizationId: 'org-1',
          orderNumber: 'ORD-001',
          customerName: 'Bob',
          status: 'open',
          totalAmount: 15.0,
          createdAt: new Date('2026-01-01'),
          orderItems: [
            {
              id: 1,
              productId: 200,
              productName: 'Card B',
              condition: 'LP',
              quantity: 1,
              unitPrice: 15.0,
              costBasis: null,
            },
          ],
        },
      ]);

      const result = await getOrders('org-1');

      const order = result.orders[0];
      expect(order.items[0].profit).toBeNull();
      expect(order.totalCostBasis).toBeNull();
      expect(order.totalProfit).toBeNull();
    });
  });
});
