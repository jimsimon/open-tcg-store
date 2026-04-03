import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock the database layer.  The inventory-service imports `otcgs` (the Drizzle
// instance) and several schema tables from sibling modules.  We replace the
// entire `../db/otcgs/index` module with a lightweight mock that exposes the
// chainable query-builder API Drizzle uses (select → from → where → limit …).
// ---------------------------------------------------------------------------

// Helper: build a chainable mock that resolves to `rows` at the end of the chain.
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

// We keep references so individual tests can override return values.
let selectChain: ReturnType<typeof chainable>;
let insertChain: ReturnType<typeof chainable>;
let updateChain: ReturnType<typeof chainable>;
let deleteChain: ReturnType<typeof chainable>;

// Use vi.hoisted so mockOtcgs is available when vi.mock factories are hoisted.
const mockOtcgs = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../db/otcgs/index', () => ({
  otcgs: mockOtcgs,
  inventoryItem: {
    id: 'inventory_item.id',
    organizationId: 'inventory_item.organization_id',
    productId: 'inventory_item.product_id',
    condition: 'inventory_item.condition',
    price: 'inventory_item.price',
    createdAt: 'inventory_item.created_at',
    updatedAt: 'inventory_item.updated_at',
    createdBy: 'inventory_item.created_by',
    updatedBy: 'inventory_item.updated_by',
  },
  inventoryItemStock: {
    id: 'inventory_item_stock.id',
    inventoryItemId: 'inventory_item_stock.inventory_item_id',
    quantity: 'inventory_item_stock.quantity',
    costBasis: 'inventory_item_stock.cost_basis',
    acquisitionDate: 'inventory_item_stock.acquisition_date',
    notes: 'inventory_item_stock.notes',
    deletedAt: 'inventory_item_stock.deleted_at',
    createdAt: 'inventory_item_stock.created_at',
    updatedAt: 'inventory_item_stock.updated_at',
    createdBy: 'inventory_item_stock.created_by',
    updatedBy: 'inventory_item_stock.updated_by',
  },
}));

vi.mock('../db/tcg-data/schema', () => ({
  product: {
    id: 'product.id',
    name: 'product.name',
    groupId: 'product.group_id',
    categoryId: 'product.category_id',
    imageUrl: 'product.image_url',
  },
  group: { id: 'group.id', name: 'group.name' },
  category: { id: 'category.id', name: 'category.name', seoCategoryName: 'category.seo_category_name' },
  productExtendedData: { productId: 'ped.product_id', name: 'ped.name', value: 'ped.value' },
  price: {
    productId: 'price.product_id',
    subTypeName: 'price.sub_type_name',
    lowPrice: 'price.low_price',
    midPrice: 'price.mid_price',
    highPrice: 'price.high_price',
    marketPrice: 'price.market_price',
    directLowPrice: 'price.direct_low_price',
  },
}));

// Mock drizzle-orm operators so they don't throw
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
    sql: sqlFn,
    inArray: vi.fn((...args: unknown[]) => ({ type: 'inArray', args })),
    isNull: vi.fn((...args: unknown[]) => ({ type: 'isNull', args })),
    gt: vi.fn((...args: unknown[]) => ({ type: 'gt', args })),
  };
});

// ---------------------------------------------------------------------------
// Import the service under test *after* mocks are registered.
// ---------------------------------------------------------------------------
import {
  getInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  addStock,
  updateStock,
  deleteStock,
  bulkUpdateStock,
  bulkDeleteStock,
  searchProducts,
} from './inventory-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A realistic row returned by getInventoryItems (parent with derived stock totals). */
function fakeInventoryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    organizationId: 'test-org-id',
    productId: 100,
    productName: 'Black Lotus',
    gameName: 'Magic',
    setName: 'Alpha',
    condition: 'NM',
    price: 50000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
    totalQuantity: 4,
    entryCount: 1,
    rarity: 'Mythic Rare',
    isSingle: 1,
    ...overrides,
  };
}

/** A realistic stock entry row. */
function fakeStockRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    inventoryItemId: 1,
    quantity: 4,
    costBasis: 40000,
    acquisitionDate: '2024-01-15',
    notes: 'Graded',
    deletedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('inventory-service', () => {
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
  // getInventoryItems
  // -----------------------------------------------------------------------
  describe('getInventoryItems', () => {
    it('should return paginated results with default pagination', async () => {
      const dataChain = chainable([fakeInventoryRow({ id: 1 }), fakeInventoryRow({ id: 2 })]);
      const countChain = chainable([{ total: 2 }]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? dataChain : countChain;
      });

      const result = await getInventoryItems('test-org-id');

      expect(result).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.totalPages).toBe(1);
    });

    it('should apply search filter', async () => {
      const dataChain = chainable([fakeInventoryRow({ productName: 'Charizard' })]);
      const countChain = chainable([{ total: 1 }]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? dataChain : countChain;
      });

      const result = await getInventoryItems('test-org-id', { searchTerm: 'Charizard' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productName).toBe('Charizard');
    });

    it('should apply condition filter', async () => {
      const dataChain = chainable([fakeInventoryRow({ condition: 'LP' })]);
      const countChain = chainable([{ total: 1 }]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? dataChain : countChain;
      });

      const result = await getInventoryItems('test-org-id', { condition: 'LP' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].condition).toBe('LP');
    });

    it('should return correct pagination metadata', async () => {
      const dataChain = chainable(Array.from({ length: 25 }, (_, i) => fakeInventoryRow({ id: i + 26 })));
      const countChain = chainable([{ total: 75 }]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? dataChain : countChain;
      });

      const result = await getInventoryItems('test-org-id', null, { page: 2, pageSize: 25 });

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(25);
      expect(result.totalCount).toBe(75);
      expect(result.totalPages).toBe(3);
      expect(result.items).toHaveLength(25);
    });
  });

  // -----------------------------------------------------------------------
  // addInventoryItem
  // -----------------------------------------------------------------------
  describe('addInventoryItem', () => {
    it('should create parent and stock entry for a new item', async () => {
      // First select: check for existing parent → no match
      const parentCheckChain = chainable([]);
      // Insert parent → returns new parent
      const insParentChain = chainable([{ id: 42 }]);
      // Second select: check for existing stock → no match
      const stockCheckChain = chainable([]);
      // Insert stock
      const insStockChain = chainable([{ id: 100 }]);
      // getInventoryItemById select
      const fetchChain = chainable([fakeInventoryRow({ id: 42, totalQuantity: 2, price: 9.99 })]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        if (selectIdx === 1) return parentCheckChain;
        if (selectIdx === 2) return stockCheckChain;
        return fetchChain;
      });

      let insertIdx = 0;
      mockOtcgs.insert.mockImplementation(() => {
        insertIdx++;
        return insertIdx === 1 ? insParentChain : insStockChain;
      });

      const result = await addInventoryItem(
        'test-org-id',
        { productId: 100, condition: 'NM', quantity: 2, price: 9.99, costBasis: 5, acquisitionDate: '2026-01-01' },
        'user-1',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(42);
      expect(mockOtcgs.insert).toHaveBeenCalled();
    });

    it('should merge stock when same costBasis+acquisitionDate already exists', async () => {
      // Find existing parent
      const parentCheckChain = chainable([{ id: 10, price: 5.0 }]);
      // Update parent price
      const updParentChain = chainable([]);
      // Find existing stock with same costBasis+acquisitionDate
      const stockCheckChain = chainable([{ id: 50, quantity: 3, notes: null }]);
      // getInventoryItemById
      const fetchChain = chainable([fakeInventoryRow({ id: 10, totalQuantity: 5 })]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        if (selectIdx === 1) return parentCheckChain;
        if (selectIdx === 2) return stockCheckChain;
        return fetchChain;
      });
      mockOtcgs.update.mockImplementation(() => {
        return updParentChain;
      });

      const result = await addInventoryItem(
        'test-org-id',
        { productId: 100, condition: 'NM', quantity: 2, price: 9.99, costBasis: 5, acquisitionDate: '2026-01-01' },
        'user-1',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(10);
      expect(mockOtcgs.update).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // updateInventoryItem — updates parent (condition, price)
  // -----------------------------------------------------------------------
  describe('updateInventoryItem', () => {
    it('should update parent fields', async () => {
      const updChain = chainable([]);
      const fetchChain = chainable([fakeInventoryRow({ id: 1, price: 19.99 })]);

      mockOtcgs.update.mockReturnValue(updChain);
      mockOtcgs.select.mockReturnValue(fetchChain);

      const result = await updateInventoryItem({ id: 1, price: 19.99 }, 'user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(mockOtcgs.update).toHaveBeenCalled();
    });

    it('should handle condition change with merge', async () => {
      // Fetch current item
      const currentItemChain = chainable([
        { id: 1, organizationId: 'test-org-id', productId: 100, condition: 'NM', price: 5.0 },
      ]);
      // Find existing target parent for new condition
      const targetCheckChain = chainable([
        { id: 3, organizationId: 'test-org-id', productId: 100, condition: 'LP', price: 4.0 },
      ]);
      // Update/merge operations
      const updChain = chainable([]);
      // Merge stock duplicates query
      const mergeStockChain = chainable([]);
      // getInventoryItemById for result
      const fetchChain = chainable([fakeInventoryRow({ id: 3, condition: 'LP' })]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        if (selectIdx === 1) return currentItemChain;
        if (selectIdx === 2) return targetCheckChain;
        if (selectIdx === 3) return mergeStockChain;
        return fetchChain;
      });
      mockOtcgs.update.mockReturnValue(updChain);

      const result = await updateInventoryItem({ id: 1, condition: 'LP' }, 'user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe(3);
      expect(mockOtcgs.update).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // deleteInventoryItem
  // -----------------------------------------------------------------------
  describe('deleteInventoryItem', () => {
    it('should soft-delete stock entries only (parent is never deleted)', async () => {
      const updChain = chainable([]);
      mockOtcgs.update.mockReturnValue(updChain);

      const result = await deleteInventoryItem(1);

      expect(result).toBe(true);
      // Should call update once: only stock entries are soft-deleted
      expect(mockOtcgs.update).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // addStock
  // -----------------------------------------------------------------------
  describe('addStock', () => {
    it('should add a new stock entry', async () => {
      // Verify parent exists
      const parentCheckChain = chainable([{ id: 1 }]);
      // Check for duplicate stock
      const dupCheckChain = chainable([]);
      // Insert stock
      const insChain = chainable([{ id: 100 }]);
      // getStockById
      const fetchChain = chainable([fakeStockRow({ id: 100 })]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        if (selectIdx === 1) return parentCheckChain;
        if (selectIdx === 2) return dupCheckChain;
        return fetchChain;
      });
      mockOtcgs.insert.mockReturnValue(insChain);

      const result = await addStock(
        { inventoryItemId: 1, quantity: 5, costBasis: 10, acquisitionDate: '2026-01-01' },
        'user-1',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(100);
      expect(mockOtcgs.insert).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // updateStock
  // -----------------------------------------------------------------------
  describe('updateStock', () => {
    it('should update stock entry fields', async () => {
      // Fetch current stock
      const currentStockChain = chainable([fakeStockRow({ id: 10 })]);
      const updChain = chainable([]);
      const fetchChain = chainable([fakeStockRow({ id: 10, quantity: 8 })]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        if (selectIdx === 1) return currentStockChain;
        return fetchChain;
      });
      mockOtcgs.update.mockReturnValue(updChain);

      const result = await updateStock({ id: 10, quantity: 8 }, 'user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe(10);
      expect(mockOtcgs.update).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // deleteStock
  // -----------------------------------------------------------------------
  describe('deleteStock', () => {
    it('should soft-delete a stock entry', async () => {
      const updChain = chainable([]);
      mockOtcgs.update.mockReturnValue(updChain);

      const result = await deleteStock(10);

      expect(result).toBe(true);
      expect(mockOtcgs.update).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // bulkUpdateStock
  // -----------------------------------------------------------------------
  describe('bulkUpdateStock', () => {
    it('should update multiple stock entries', async () => {
      const updChain = chainable([]);
      const fetchChain = chainable([fakeStockRow({ id: 10 }), fakeStockRow({ id: 11 })]);

      mockOtcgs.update.mockReturnValue(updChain);
      mockOtcgs.select.mockReturnValue(fetchChain);

      const result = await bulkUpdateStock({ ids: [10, 11], quantity: 5 }, 'user-1');

      expect(result).toHaveLength(2);
      expect(mockOtcgs.update).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // bulkDeleteStock
  // -----------------------------------------------------------------------
  describe('bulkDeleteStock', () => {
    it('should soft-delete multiple stock entries', async () => {
      const updChain = chainable([]);
      mockOtcgs.update.mockReturnValue(updChain);

      const result = await bulkDeleteStock([10, 11, 12]);

      expect(result).toBe(true);
      expect(mockOtcgs.update).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // searchProducts
  // -----------------------------------------------------------------------
  describe('searchProducts', () => {
    it('should search products by name', async () => {
      const productRows = [
        {
          id: 1,
          name: 'Charizard',
          gameName: 'Pokemon',
          setName: 'Base Set',
          imageUrl: null,
          rarity: 'Rare',
          isSingle: 1,
        },
      ];
      const priceRows = [
        {
          productId: 1,
          subTypeName: 'Normal',
          lowPrice: 100,
          midPrice: 150,
          highPrice: 200,
          marketPrice: 160,
          directLowPrice: null,
        },
      ];

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? chainable(productRows) : chainable(priceRows);
      });

      const result = await searchProducts('Charizard');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Charizard');
    });

    it('should include prices in results', async () => {
      const productRows = [
        {
          id: 10,
          name: 'Sol Ring',
          gameName: 'Magic',
          setName: 'Commander',
          imageUrl: null,
          rarity: 'Uncommon',
          isSingle: 1,
        },
      ];
      const priceRows = [
        {
          productId: 10,
          subTypeName: 'Normal',
          lowPrice: 0.5,
          midPrice: 1.0,
          highPrice: 2.0,
          marketPrice: 0.8,
          directLowPrice: 0.6,
        },
        {
          productId: 10,
          subTypeName: 'Foil',
          lowPrice: 2.0,
          midPrice: 3.0,
          highPrice: 5.0,
          marketPrice: 2.5,
          directLowPrice: null,
        },
      ];

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? chainable(productRows) : chainable(priceRows);
      });

      const result = await searchProducts('Sol Ring');

      expect(result).toHaveLength(1);
      expect(result[0].prices).toHaveLength(2);
      expect(result[0].prices[0].subTypeName).toBe('Normal');
      expect(result[0].prices[0].marketPrice).toBe(0.8);
      expect(result[0].prices[1].subTypeName).toBe('Foil');
    });
  });
});
