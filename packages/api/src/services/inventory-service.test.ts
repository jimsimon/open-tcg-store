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
  getInventoryItemById,
  getInventoryItemDetails,
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

    it('should apply game filter when provided', async () => {
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
      const priceRows: unknown[] = [];

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? chainable(productRows) : chainable(priceRows);
      });

      const result = await searchProducts('Charizard', 'pokemon');

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

  // -----------------------------------------------------------------------
  // Validation branch coverage
  // -----------------------------------------------------------------------
  describe('addInventoryItem validation', () => {
    it('should throw when productId is missing', async () => {
      await expect(
        addInventoryItem(
          'org-1',
          {
            productId: 0,
            condition: 'NM',
            quantity: 1,
            price: 5,
            costBasis: 3,
            acquisitionDate: '2026-01-01',
          } as never,
          'user-1',
        ),
      ).rejects.toThrow('productId is required');
    });

    it('should throw when condition is missing', async () => {
      await expect(
        addInventoryItem(
          'org-1',
          { productId: 1, condition: '', quantity: 1, price: 5, costBasis: 3, acquisitionDate: '2026-01-01' } as never,
          'user-1',
        ),
      ).rejects.toThrow('condition is required');
    });

    it('should throw when quantity is less than 1', async () => {
      await expect(
        addInventoryItem(
          'org-1',
          {
            productId: 1,
            condition: 'NM',
            quantity: 0,
            price: 5,
            costBasis: 3,
            acquisitionDate: '2026-01-01',
          } as never,
          'user-1',
        ),
      ).rejects.toThrow('quantity is required');
    });

    it('should throw when price is null', async () => {
      await expect(
        addInventoryItem(
          'org-1',
          {
            productId: 1,
            condition: 'NM',
            quantity: 1,
            price: null,
            costBasis: 3,
            acquisitionDate: '2026-01-01',
          } as never,
          'user-1',
        ),
      ).rejects.toThrow('price is required');
    });

    it('should throw when costBasis is null', async () => {
      await expect(
        addInventoryItem(
          'org-1',
          {
            productId: 1,
            condition: 'NM',
            quantity: 1,
            price: 5,
            costBasis: null,
            acquisitionDate: '2026-01-01',
          } as never,
          'user-1',
        ),
      ).rejects.toThrow('costBasis is required');
    });

    it('should throw when acquisitionDate is missing', async () => {
      await expect(
        addInventoryItem(
          'org-1',
          { productId: 1, condition: 'NM', quantity: 1, price: 5, costBasis: 3, acquisitionDate: '' } as never,
          'user-1',
        ),
      ).rejects.toThrow('acquisitionDate is required');
    });

    it('should throw for invalid condition', async () => {
      await expect(
        addInventoryItem(
          'org-1',
          {
            productId: 1,
            condition: 'INVALID',
            quantity: 1,
            price: 5,
            costBasis: 3,
            acquisitionDate: '2026-01-01',
          } as never,
          'user-1',
        ),
      ).rejects.toThrow('Invalid condition: INVALID');
    });
  });

  describe('updateInventoryItem validation', () => {
    it('should throw when id is missing', async () => {
      await expect(updateInventoryItem({ id: 0 } as never, 'user-1')).rejects.toThrow('id is required');
    });

    it('should throw for invalid condition on update', async () => {
      await expect(updateInventoryItem({ id: 1, condition: 'BAD' } as never, 'user-1')).rejects.toThrow(
        'Invalid condition: BAD',
      );
    });

    it('should update condition to new parent when no existing target', async () => {
      // Fetch current item
      const currentChain = chainable([{ id: 1, organizationId: 'test-org-id', productId: 100, condition: 'NM' }]);
      // No existing target for new condition
      const noTargetChain = chainable([]);
      // Simple update + getInventoryItemById
      const updChain = chainable([]);
      const fetchChain = chainable([fakeInventoryRow({ id: 1, condition: 'HP' })]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        if (selectIdx === 1) return currentChain;
        if (selectIdx === 2) return noTargetChain;
        return fetchChain;
      });
      mockOtcgs.update.mockReturnValue(updChain);

      const result = await updateInventoryItem({ id: 1, condition: 'HP' }, 'user-1');

      expect(result).toBeDefined();
    });

    it('should handle simple price-only update without condition change', async () => {
      const updChain = chainable([]);
      const fetchChain = chainable([fakeInventoryRow({ id: 1, price: 19.99 })]);

      mockOtcgs.update.mockReturnValue(updChain);
      mockOtcgs.select.mockReturnValue(fetchChain);

      const result = await updateInventoryItem({ id: 1, price: 19.99 }, 'user-1');

      expect(result).toBeDefined();
      expect(result.price).toBe(19.99);
    });
  });

  // -----------------------------------------------------------------------
  // getInventoryItemById — branch coverage
  // -----------------------------------------------------------------------
  describe('getInventoryItemById', () => {
    it('should return null when item not found', async () => {
      const emptyChain = chainable([]);
      mockOtcgs.select.mockReturnValue(emptyChain);

      const result = await getInventoryItemById(999);

      expect(result).toBeNull();
    });

    it('should return item with isSingle/isSealed computed', async () => {
      const row = fakeInventoryRow({ id: 1, isSingle: 1 });
      const dataChain = chainable([row]);
      mockOtcgs.select.mockReturnValue(dataChain);

      const result = await getInventoryItemById(1);

      expect(result).toBeDefined();
      expect(result!.isSingle).toBe(true);
      expect(result!.isSealed).toBe(false);
    });

    it('should return isSealed=true for non-single items', async () => {
      const row = fakeInventoryRow({ id: 2, isSingle: 0 });
      const dataChain = chainable([row]);
      mockOtcgs.select.mockReturnValue(dataChain);

      const result = await getInventoryItemById(2);

      expect(result).toBeDefined();
      expect(result!.isSingle).toBe(false);
      expect(result!.isSealed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // getInventoryItemDetails — branch coverage
  // -----------------------------------------------------------------------
  describe('getInventoryItemDetails', () => {
    it('should return paginated stock entries for an item', async () => {
      // 3 selects: parent check, count, data
      const parentChain = chainable([{ id: 1 }]);
      const countChain = chainable([{ total: 2 }]);
      const dataChain = chainable([fakeStockRow({ id: 10 }), fakeStockRow({ id: 11 })]);

      let callIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return parentChain;
        if (callIdx === 2) return countChain;
        return dataChain;
      });

      const result = await getInventoryItemDetails('test-org-id', 1, { page: 1, pageSize: 25 });

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it('should return empty when parent not found', async () => {
      const noParentChain = chainable([]);
      mockOtcgs.select.mockReturnValue(noParentChain);

      const result = await getInventoryItemDetails('test-org-id', 999, null);

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // addStock — duplicate reuse with soft-deleted entry
  // -----------------------------------------------------------------------
  describe('addStock (duplicate handling)', () => {
    it('should reuse soft-deleted stock entry with base quantity 0', async () => {
      // Parent exists
      const parentChain = chainable([{ id: 1 }]);
      // Existing soft-deleted duplicate
      const dupChain = chainable([{ id: 50, quantity: 3, deletedAt: new Date(), notes: 'old note' }]);
      // Updated stock fetch
      const fetchChain = chainable([fakeStockRow({ id: 50, quantity: 5 })]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        if (selectIdx === 1) return parentChain;
        if (selectIdx === 2) return dupChain;
        return fetchChain;
      });
      mockOtcgs.update.mockReturnValue(chainable([]));

      const result = await addStock(
        { inventoryItemId: 1, quantity: 5, costBasis: 10, acquisitionDate: '2026-01-01' },
        'user-1',
      );

      expect(result).toBeDefined();
      expect(mockOtcgs.update).toHaveBeenCalled();
    });

    it('should throw when parent inventory item not found', async () => {
      const noParentChain = chainable([]);
      mockOtcgs.select.mockReturnValue(noParentChain);

      await expect(
        addStock({ inventoryItemId: 999, quantity: 1, costBasis: 5, acquisitionDate: '2026-01-01' }, 'user-1'),
      ).rejects.toThrow('Inventory item not found');
    });
  });

  // -----------------------------------------------------------------------
  // updateStock — branch coverage
  // -----------------------------------------------------------------------
  describe('updateStock (branch coverage)', () => {
    it('should throw when quantity is negative', async () => {
      await expect(updateStock({ id: 10, quantity: -1 }, 'user-1')).rejects.toThrow('quantity must be non-negative');
    });

    it('should throw when stock entry not found', async () => {
      const emptyChain = chainable([]);
      mockOtcgs.select.mockReturnValue(emptyChain);

      await expect(updateStock({ id: 999 }, 'user-1')).rejects.toThrow('Stock entry not found');
    });

    it('should merge with duplicate when costBasis changes', async () => {
      // Current entry
      const currentChain = chainable([
        { id: 10, inventoryItemId: 1, costBasis: 5, acquisitionDate: '2026-01-01', quantity: 3, deletedAt: null },
      ]);
      // Duplicate entry found with new costBasis
      const dupChain = chainable([
        {
          id: 20,
          inventoryItemId: 1,
          costBasis: 8,
          acquisitionDate: '2026-01-01',
          quantity: 2,
          deletedAt: null,
          notes: null,
        },
      ]);
      // getStockById for result
      const fetchChain = chainable([fakeStockRow({ id: 20, quantity: 5 })]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        if (selectIdx === 1) return currentChain;
        if (selectIdx === 2) return dupChain;
        return fetchChain;
      });
      mockOtcgs.update.mockReturnValue(chainable([]));

      const result = await updateStock({ id: 10, costBasis: 8 }, 'user-1');

      expect(result).toBeDefined();
      // Should have called update at least twice (merge into dup + soft-delete original)
      expect(mockOtcgs.update).toHaveBeenCalled();
    });

    it('should handle simple update without costBasis/acquisitionDate change', async () => {
      const currentChain = chainable([
        { id: 10, inventoryItemId: 1, costBasis: 5, acquisitionDate: '2026-01-01', quantity: 3, deletedAt: null },
      ]);
      const fetchChain = chainable([fakeStockRow({ id: 10, quantity: 8 })]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        return selectIdx === 1 ? currentChain : fetchChain;
      });
      mockOtcgs.update.mockReturnValue(chainable([]));

      const result = await updateStock({ id: 10, quantity: 8, notes: 'updated' }, 'user-1');

      expect(result).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // bulkUpdateStock — costBasis/acquisitionDate merge path
  // -----------------------------------------------------------------------
  describe('bulkUpdateStock (branch coverage)', () => {
    it('should delegate to updateStock when costBasis is changing', async () => {
      // updateStock will be called for each id; mock the select chain
      const currentChain = chainable([
        { id: 10, inventoryItemId: 1, costBasis: 5, acquisitionDate: '2026-01-01', quantity: 3, deletedAt: null },
      ]);
      const noDupChain = chainable([]);
      const fetchChain = chainable([fakeStockRow({ id: 10 })]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        if (selectIdx % 3 === 1) return currentChain;
        if (selectIdx % 3 === 2) return noDupChain;
        return fetchChain;
      });
      mockOtcgs.update.mockReturnValue(chainable([]));

      const result = await bulkUpdateStock(
        { ids: [10], costBasis: 8, acquisitionDate: null, quantity: null, notes: null },
        'user-1',
      );

      expect(result).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // getInventoryItems — filter branch coverage
  // -----------------------------------------------------------------------
  describe('getInventoryItems (filter branches)', () => {
    it('should apply gameName filter', async () => {
      const dataChain = chainable([]);
      const countChain = chainable([{ total: 0 }]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? dataChain : countChain;
      });

      const result = await getInventoryItems('test-org-id', { gameName: 'magic' });

      expect(result.items).toHaveLength(0);
    });

    it('should apply setName filter', async () => {
      const dataChain = chainable([]);
      const countChain = chainable([{ total: 0 }]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? dataChain : countChain;
      });

      const result = await getInventoryItems('test-org-id', { setName: 'Alpha' });

      expect(result.items).toHaveLength(0);
    });

    it('should apply rarity filter', async () => {
      const dataChain = chainable([]);
      const countChain = chainable([{ total: 0 }]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? dataChain : countChain;
      });

      const result = await getInventoryItems('test-org-id', { rarity: 'Rare' });

      expect(result.items).toHaveLength(0);
    });

    it('should apply includeSingles filter', async () => {
      const dataChain = chainable([]);
      const countChain = chainable([{ total: 0 }]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? dataChain : countChain;
      });

      const result = await getInventoryItems('test-org-id', { includeSingles: true });

      expect(result.items).toHaveLength(0);
    });

    it('should apply includeSealed filter', async () => {
      const dataChain = chainable([]);
      const countChain = chainable([{ total: 0 }]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? dataChain : countChain;
      });

      const result = await getInventoryItems('test-org-id', { includeSealed: true });

      expect(result.items).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // addInventoryItem — soft-deleted stock reuse
  // -----------------------------------------------------------------------
  describe('addInventoryItem (soft-deleted stock reuse)', () => {
    it('should reuse soft-deleted stock when adding to existing parent', async () => {
      // Find existing parent
      const parentChain = chainable([{ id: 10, price: 5.0 }]);
      // Update parent price
      const updChain = chainable([]);
      // Find existing soft-deleted stock with same costBasis+acquisitionDate
      const stockChain = chainable([{ id: 50, quantity: 0, deletedAt: new Date(), notes: null }]);
      // getInventoryItemById
      const fetchChain = chainable([fakeInventoryRow({ id: 10, totalQuantity: 2 })]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        if (selectIdx === 1) return parentChain;
        if (selectIdx === 2) return stockChain;
        return fetchChain;
      });
      mockOtcgs.update.mockReturnValue(updChain);

      const result = await addInventoryItem(
        'test-org-id',
        { productId: 100, condition: 'NM', quantity: 2, price: 9.99, costBasis: 5, acquisitionDate: '2026-01-01' },
        'user-1',
      );

      expect(result).toBeDefined();
      // Should have called update to reuse the soft-deleted stock
      expect(mockOtcgs.update).toHaveBeenCalled();
    });

    it('should create new stock when no existing stock matches', async () => {
      // Find existing parent
      const parentChain = chainable([{ id: 10, price: 5.0 }]);
      // Update parent price
      const updParentChain = chainable([]);
      // No existing stock
      const noStockChain = chainable([]);
      // Insert new stock
      const insStockChain = chainable([]);
      // getInventoryItemById
      const fetchChain = chainable([fakeInventoryRow({ id: 10, totalQuantity: 2 })]);

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        if (selectIdx === 1) return parentChain;
        if (selectIdx === 2) return noStockChain;
        return fetchChain;
      });
      mockOtcgs.update.mockReturnValue(updParentChain);
      mockOtcgs.insert.mockReturnValue(insStockChain);

      const result = await addInventoryItem(
        'test-org-id',
        { productId: 100, condition: 'NM', quantity: 2, price: 9.99, costBasis: 5, acquisitionDate: '2026-01-01' },
        'user-1',
      );

      expect(result).toBeDefined();
      expect(mockOtcgs.insert).toHaveBeenCalled();
    });
  });
});
