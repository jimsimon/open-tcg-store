import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock the database layer.  The inventory-service imports `otcgs` (the Drizzle
// instance) and several schema tables from sibling modules.  We replace the
// entire `../db/otcgs/index` module with a lightweight mock that exposes the
// chainable query-builder API Drizzle uses (select → from → where → limit …).
// ---------------------------------------------------------------------------

// Helper: build a chainable mock that resolves to `rows` at the end of the chain.
// We assign chainable query-builder methods onto a real Promise so that `await`
// resolves to `rows` without adding a `then` property to a plain object (which
// linters flag as creating an accidentally-thenable object).
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
    productId: 'inventory_item.product_id',
    condition: 'inventory_item.condition',
    quantity: 'inventory_item.quantity',
    price: 'inventory_item.price',
    costBasis: 'inventory_item.cost_basis',
    acquisitionDate: 'inventory_item.acquisition_date',
    notes: 'inventory_item.notes',
    createdAt: 'inventory_item.created_at',
    updatedAt: 'inventory_item.updated_at',
    createdBy: 'inventory_item.created_by',
    updatedBy: 'inventory_item.updated_by',
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
  category: { id: 'category.id', name: 'category.name' },
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
  // sql needs to work both as a function call and as a tagged template literal.
  // Tagged templates receive (strings[], ...values) and the result needs .as().
  const sqlResult = () => ({ type: 'sql', as: vi.fn().mockReturnValue({ type: 'sql-alias' }) });
  const sqlFn = Object.assign(
    vi.fn((..._args: unknown[]) => sqlResult()),
    {
      raw: vi.fn(),
    },
  );
  // Make it callable as a tagged template: sql`...` invokes the function
  // with (TemplateStringsArray, ...expressions). The vi.fn() handles this,
  // but we need to ensure the return value has .as().
  return {
    eq: vi.fn((...args: unknown[]) => ({ type: 'eq', args })),
    and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
    like: vi.fn((...args: unknown[]) => ({ type: 'like', args })),
    sql: sqlFn,
    inArray: vi.fn((...args: unknown[]) => ({ type: 'inArray', args })),
    isNull: vi.fn((...args: unknown[]) => ({ type: 'isNull', args })),
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
  bulkUpdateInventoryItems,
  bulkDeleteInventoryItems,
  searchProducts,
} from './inventory-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A realistic row shape returned by baseInventoryQuery. */
function fakeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    productId: 100,
    productName: 'Black Lotus',
    gameName: 'Magic',
    setName: 'Alpha',
    condition: 'NM',
    quantity: 4,
    price: 50000,
    costBasis: 40000,
    acquisitionDate: new Date('2024-01-15'),
    notes: 'Graded',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
    rarity: 'Mythic Rare',
    isSingle: 1,
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
      // First call: count query → returns total
      const countChain = chainable([{ total: 2 }]);
      // Second call: data query → returns rows
      const dataChain = chainable([fakeRow({ id: 1 }), fakeRow({ id: 2 })]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        // First select is the count query, second is the data query
        return callIndex === 1 ? countChain : dataChain;
      });

      const result = await getInventoryItems();

      expect(result).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.totalPages).toBe(1);
    });

    it('should apply search filter', async () => {
      const countChain = chainable([{ total: 1 }]);
      const dataChain = chainable([fakeRow({ productName: 'Charizard' })]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? countChain : dataChain;
      });

      const result = await getInventoryItems({ searchTerm: 'Charizard' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productName).toBe('Charizard');
    });

    it('should apply condition filter', async () => {
      const countChain = chainable([{ total: 1 }]);
      const dataChain = chainable([fakeRow({ condition: 'LP' })]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? countChain : dataChain;
      });

      const result = await getInventoryItems({ condition: 'LP' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].condition).toBe('LP');
    });

    it('should apply product type filter for singles', async () => {
      const countChain = chainable([{ total: 1 }]);
      const dataChain = chainable([fakeRow({ isSingle: 1 })]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? countChain : dataChain;
      });

      const result = await getInventoryItems({ includeSingles: true, includeSealed: false });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].isSingle).toBe(true);
      expect(result.items[0].isSealed).toBe(false);
    });

    it('should apply product type filter for sealed', async () => {
      const countChain = chainable([{ total: 1 }]);
      const dataChain = chainable([fakeRow({ isSingle: 0 })]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? countChain : dataChain;
      });

      const result = await getInventoryItems({ includeSealed: true, includeSingles: false });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].isSingle).toBe(false);
      expect(result.items[0].isSealed).toBe(true);
    });

    it('should return correct pagination metadata', async () => {
      const countChain = chainable([{ total: 75 }]);
      const dataChain = chainable(Array.from({ length: 25 }, (_, i) => fakeRow({ id: i + 26 })));

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? countChain : dataChain;
      });

      const result = await getInventoryItems(null, { page: 2, pageSize: 25 });

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
    it('should add a new inventory item', async () => {
      // First select: duplicate check → no existing row
      const dupCheckChain = chainable([]);
      // Insert chain → returns inserted row
      const insChain = chainable([{ id: 42 }]);
      // getInventoryItemById select → returns full row
      const fetchChain = chainable([fakeRow({ id: 42, productId: 100, condition: 'NM', quantity: 2, price: 9.99 })]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? dupCheckChain : fetchChain;
      });
      mockOtcgs.insert.mockReturnValue(insChain);

      const result = await addInventoryItem({ productId: 100, condition: 'NM', quantity: 2, price: 9.99, costBasis: 0, acquisitionDate: '2026-01-01' }, 'user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe(42);
      expect(mockOtcgs.insert).toHaveBeenCalled();
    });

    it('should merge with existing item when same productId + condition + costBasis + acquisitionDate', async () => {
      // Duplicate check → finds existing row
      const dupCheckChain = chainable([{ id: 10, quantity: 3, price: 5.0 }]);
      // Update chain
      const updChain = chainable([]);
      // getInventoryItemById → returns merged row
      const fetchChain = chainable([fakeRow({ id: 10, quantity: 5, price: 9.99 })]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? dupCheckChain : fetchChain;
      });
      mockOtcgs.update.mockReturnValue(updChain);

      const result = await addInventoryItem(
        { productId: 100, condition: 'NM', quantity: 2, price: 9.99, costBasis: 5.0, acquisitionDate: '2026-01-01' },
        'user-1',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(10);
      expect(mockOtcgs.update).toHaveBeenCalled();
      // insert should NOT have been called since we merged
      expect(mockOtcgs.insert).not.toHaveBeenCalled();
    });

    it('should handle zero costBasis correctly', async () => {
      // Duplicate check with zero costBasis → no match
      const dupCheckChain = chainable([]);
      const insChain = chainable([{ id: 55 }]);
      const fetchChain = chainable([fakeRow({ id: 55, costBasis: 0 })]);

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? dupCheckChain : fetchChain;
      });
      mockOtcgs.insert.mockReturnValue(insChain);

      const result = await addInventoryItem({ productId: 100, condition: 'NM', quantity: 1, price: 5.0, costBasis: 0, acquisitionDate: '2026-01-01' }, 'user-1');

      expect(result).toBeDefined();
      expect(result.costBasis).toBe(0);
      expect(mockOtcgs.insert).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // updateInventoryItem
  // -----------------------------------------------------------------------
  describe('updateInventoryItem', () => {
    it('should update only provided fields', async () => {
      const updChain = chainable([]);
      const fetchChain = chainable([fakeRow({ id: 1, price: 19.99 })]);

      mockOtcgs.update.mockReturnValue(updChain);
      mockOtcgs.select.mockReturnValue(fetchChain);

      const result = await updateInventoryItem({ id: 1, price: 19.99 }, 'user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(mockOtcgs.update).toHaveBeenCalled();
    });

    it('should update the updatedBy and updatedAt fields', async () => {
      const updChain = chainable([]);
      const fetchChain = chainable([fakeRow({ id: 1 })]);

      mockOtcgs.update.mockReturnValue(updChain);
      mockOtcgs.select.mockReturnValue(fetchChain);

      await updateInventoryItem({ id: 1, quantity: 10 }, 'user-42');

      // The update chain's `set` should have been called
      expect(updChain.set).toHaveBeenCalled();
      const setCall = (updChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.updatedBy).toBe('user-42');
      expect(setCall.updatedAt).toBeInstanceOf(Date);
    });

    it('should merge with existing item when costBasis change creates duplicate tuple', async () => {
      // Current item being edited: id=1, productId=100, condition=NM, costBasis=10.00, quantity=3
      const currentItemChain = chainable([
        { id: 1, productId: 100, condition: 'NM', costBasis: 10.0, quantity: 3, price: 5.0 },
      ]);
      // Duplicate check finds existing item: id=2, same productId+condition but costBasis=20.00 (the target)
      const dupCheckChain = chainable([
        { id: 2, productId: 100, condition: 'NM', costBasis: 20.0, quantity: 5, price: 6.0 },
      ]);
      // Delete chain for removing the edited item
      const delChain = chainable([]);
      // Update chain for the surviving item
      const updChain = chainable([]);
      // Final fetch of the surviving item
      const fetchChain = chainable([fakeRow({ id: 2, quantity: 8, costBasis: 20.0 })]);

      let selectCallIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectCallIndex++;
        if (selectCallIndex === 1) return currentItemChain; // fetch current item
        if (selectCallIndex === 2) return dupCheckChain; // duplicate check
        return fetchChain; // getInventoryItemById for the survivor
      });
      mockOtcgs.delete.mockReturnValue(delChain);
      mockOtcgs.update.mockReturnValue(updChain);

      const result = await updateInventoryItem({ id: 1, costBasis: 20.0 }, 'user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe(2);
      // The edited item (id=1) should have been deleted
      expect(mockOtcgs.delete).toHaveBeenCalled();
      // The surviving item (id=2) should have been updated with merged quantity
      expect(mockOtcgs.update).toHaveBeenCalled();
      const setCall = (updChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.quantity).toBe(8); // 5 (existing) + 3 (from edited item)
    });

    it('should merge with existing item when condition change creates duplicate tuple', async () => {
      // Current item: id=1, productId=100, condition=NM, costBasis=10.00, quantity=2
      const currentItemChain = chainable([
        { id: 1, productId: 100, condition: 'NM', costBasis: 10.0, quantity: 2, price: 5.0 },
      ]);
      // Duplicate check finds existing item with condition=LP and same costBasis
      const dupCheckChain = chainable([
        { id: 3, productId: 100, condition: 'LP', costBasis: 10.0, quantity: 7, price: 4.0 },
      ]);
      const delChain = chainable([]);
      const updChain = chainable([]);
      const fetchChain = chainable([fakeRow({ id: 3, quantity: 9, condition: 'LP' })]);

      let selectCallIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectCallIndex++;
        if (selectCallIndex === 1) return currentItemChain;
        if (selectCallIndex === 2) return dupCheckChain;
        return fetchChain;
      });
      mockOtcgs.delete.mockReturnValue(delChain);
      mockOtcgs.update.mockReturnValue(updChain);

      const result = await updateInventoryItem({ id: 1, condition: 'LP' }, 'user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe(3);
      expect(mockOtcgs.delete).toHaveBeenCalled();
      expect(mockOtcgs.update).toHaveBeenCalled();
      const setCall = (updChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.quantity).toBe(9); // 7 (existing) + 2 (from edited item)
    });

    it('should use input quantity when merging if quantity is provided', async () => {
      // Current item: id=1, quantity=3
      const currentItemChain = chainable([
        { id: 1, productId: 100, condition: 'NM', costBasis: 10.0, quantity: 3, price: 5.0 },
      ]);
      // Existing match: id=2, quantity=5
      const dupCheckChain = chainable([
        { id: 2, productId: 100, condition: 'NM', costBasis: 20.0, quantity: 5, price: 6.0 },
      ]);
      const delChain = chainable([]);
      const updChain = chainable([]);
      const fetchChain = chainable([fakeRow({ id: 2, quantity: 15 })]);

      let selectCallIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectCallIndex++;
        if (selectCallIndex === 1) return currentItemChain;
        if (selectCallIndex === 2) return dupCheckChain;
        return fetchChain;
      });
      mockOtcgs.delete.mockReturnValue(delChain);
      mockOtcgs.update.mockReturnValue(updChain);

      // Provide explicit quantity=10 along with costBasis change
      const result = await updateInventoryItem({ id: 1, costBasis: 20.0, quantity: 10 }, 'user-1');

      expect(result).toBeDefined();
      const setCall = (updChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      // Should use input quantity (10) instead of current item quantity (3)
      expect(setCall.quantity).toBe(15); // 5 (existing) + 10 (input override)
    });

    it('should not merge when costBasis change does not create a duplicate', async () => {
      // Current item: id=1, productId=100, condition=NM, costBasis=10.00
      const currentItemChain = chainable([
        { id: 1, productId: 100, condition: 'NM', costBasis: 10.0, quantity: 3, price: 5.0 },
      ]);
      // Duplicate check finds the same item (id=1), no other match
      const dupCheckChain = chainable([
        { id: 1, productId: 100, condition: 'NM', costBasis: 30.0, quantity: 3, price: 5.0 },
      ]);
      const updChain = chainable([]);
      const fetchChain = chainable([fakeRow({ id: 1, costBasis: 30.0 })]);

      let selectCallIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectCallIndex++;
        if (selectCallIndex === 1) return currentItemChain;
        if (selectCallIndex === 2) return dupCheckChain;
        return fetchChain;
      });
      mockOtcgs.update.mockReturnValue(updChain);

      const result = await updateInventoryItem({ id: 1, costBasis: 30.0 }, 'user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      // Should NOT delete anything – just a normal update
      expect(mockOtcgs.delete).not.toHaveBeenCalled();
      expect(mockOtcgs.update).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // deleteInventoryItem
  // -----------------------------------------------------------------------
  describe('deleteInventoryItem', () => {
    it('should delete an item by id', async () => {
      const delChain = chainable([]);
      mockOtcgs.delete.mockReturnValue(delChain);

      await deleteInventoryItem(1);

      expect(mockOtcgs.delete).toHaveBeenCalled();
    });

    it('should return true on successful deletion', async () => {
      const delChain = chainable([]);
      mockOtcgs.delete.mockReturnValue(delChain);

      const result = await deleteInventoryItem(1);

      expect(result).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // bulkUpdateInventoryItems
  // -----------------------------------------------------------------------
  describe('bulkUpdateInventoryItems', () => {
    it('should update multiple items', async () => {
      const updChain = chainable([]);
      const fetchChain = chainable([fakeRow({ id: 1 }), fakeRow({ id: 2 })]);

      mockOtcgs.update.mockReturnValue(updChain);
      mockOtcgs.select.mockReturnValue(fetchChain);

      const result = await bulkUpdateInventoryItems({ ids: [1, 2], condition: 'LP' }, 'user-1');

      expect(result).toHaveLength(2);
      expect(mockOtcgs.update).toHaveBeenCalled();
    });

    it('should only apply non-null fields', async () => {
      const updChain = chainable([]);
      const fetchChain = chainable([fakeRow({ id: 1 })]);

      mockOtcgs.update.mockReturnValue(updChain);
      mockOtcgs.select.mockReturnValue(fetchChain);

      await bulkUpdateInventoryItems({ ids: [1], price: 15.0 }, 'user-1');

      const setCall = (updChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.updatedBy).toBe('user-1');
      expect(setCall.updatedAt).toBeInstanceOf(Date);
      expect(setCall.price).toBe(15.0);
      // condition was not provided, so it should not be in the set call
      expect(setCall.condition).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // bulkDeleteInventoryItems
  // -----------------------------------------------------------------------
  describe('bulkDeleteInventoryItems', () => {
    it('should delete multiple items by ids', async () => {
      const delChain = chainable([]);
      mockOtcgs.delete.mockReturnValue(delChain);

      const result = await bulkDeleteInventoryItems([1, 2, 3]);

      expect(result).toBe(true);
      expect(mockOtcgs.delete).toHaveBeenCalled();
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

    it('should filter by game when provided', async () => {
      const productRows = [
        {
          id: 1,
          name: 'Pikachu',
          gameName: 'Pokemon',
          setName: 'Base Set',
          imageUrl: null,
          rarity: 'Common',
          isSingle: 1,
        },
      ];

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? chainable(productRows) : chainable([]);
      });

      const result = await searchProducts('Pikachu', 'Pokemon');

      expect(result).toHaveLength(1);
      expect(result[0].gameName).toBe('Pokemon');
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

    it('should determine isSingle/isSealed correctly', async () => {
      const productRows = [
        {
          id: 1,
          name: 'Booster Box',
          gameName: 'Pokemon',
          setName: 'Base Set',
          imageUrl: null,
          rarity: null,
          isSingle: 0,
        },
        {
          id: 2,
          name: 'Charizard',
          gameName: 'Pokemon',
          setName: 'Base Set',
          imageUrl: null,
          rarity: 'Rare',
          isSingle: 1,
        },
      ];

      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? chainable(productRows) : chainable([]);
      });

      const result = await searchProducts('Pokemon');

      expect(result).toHaveLength(2);
      // Sealed product
      expect(result[0].isSingle).toBe(false);
      expect(result[0].isSealed).toBe(true);
      // Single card
      expect(result[1].isSingle).toBe(true);
      expect(result[1].isSealed).toBe(false);
    });
  });
});
