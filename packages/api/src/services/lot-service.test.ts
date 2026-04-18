import { describe, it, expect, vi, beforeEach } from 'vitest';

import { chainable } from '../test-utils';

// We keep references so individual tests can override return values.
let selectChain: ReturnType<typeof chainable>;
let insertChain: ReturnType<typeof chainable>;
let updateChain: ReturnType<typeof chainable>;
let deleteChain: ReturnType<typeof chainable>;

// ---------------------------------------------------------------------------
// Mock database
// ---------------------------------------------------------------------------

const mockOtcgs = vi.hoisted(() => {
  const mock = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        select: (...args: unknown[]) => mock.select(...args),
        insert: (...args: unknown[]) => mock.insert(...args),
        update: (...args: unknown[]) => mock.update(...args),
        delete: (...args: unknown[]) => mock.delete(...args),
      };
      return fn(tx);
    }),
    query: {},
  };
  return mock;
});

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
    lotId: 'inventory_item_stock.lot_id',
    deletedAt: 'inventory_item_stock.deleted_at',
    createdAt: 'inventory_item_stock.created_at',
    updatedAt: 'inventory_item_stock.updated_at',
    createdBy: 'inventory_item_stock.created_by',
    updatedBy: 'inventory_item_stock.updated_by',
  },
}));

vi.mock('../db/otcgs/lot-schema', () => ({
  lot: {
    id: 'lot.id',
    organizationId: 'lot.organization_id',
    name: 'lot.name',
    description: 'lot.description',
    amountPaid: 'lot.amount_paid',
    acquisitionDate: 'lot.acquisition_date',
    createdAt: 'lot.created_at',
    updatedAt: 'lot.updated_at',
    createdBy: 'lot.created_by',
    updatedBy: 'lot.updated_by',
  },
}));

vi.mock('../db/otcgs/lot-item-schema', () => ({
  lotItem: {
    id: 'lot_item.id',
    lotId: 'lot_item.lot_id',
    productId: 'lot_item.product_id',
    condition: 'lot_item.condition',
    quantity: 'lot_item.quantity',
    costBasis: 'lot_item.cost_basis',
    costOverridden: 'lot_item.cost_overridden',
    inventoryItemStockId: 'lot_item.inventory_item_stock_id',
    createdAt: 'lot_item.created_at',
    updatedAt: 'lot_item.updated_at',
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
    sql: sqlFn,
    inArray: vi.fn((...args: unknown[]) => ({ type: 'inArray', args })),
  };
});

vi.mock('./transaction-log-service', () => ({
  logTransaction: vi.fn(),
}));

vi.mock('../lib/sql-utils', () => ({
  likeEscaped: vi.fn((...args: unknown[]) => ({ type: 'likeEscaped', args })),
  normalizePagination: vi.fn((pagination?: { page?: number | null; pageSize?: number | null } | null) => {
    const page = Math.max(1, pagination?.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, pagination?.pageSize ?? 25));
    return { page, pageSize, offset: (page - 1) * pageSize };
  }),
}));

vi.mock('../lib/date-utils', () => ({
  formatDate: vi.fn((d: Date | null | undefined) => (d ? d.toISOString() : null)),
  isValidDateString: vi.fn((s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { createLot, updateLot, deleteLot, getLots, getLot, getLotStats, getDistinctRarities } from './lot-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeLotRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    organizationId: 'org-1',
    name: 'Test Lot',
    description: 'A test lot',
    amountPaid: 1000,
    acquisitionDate: '2025-01-15',
    createdAt: new Date('2025-01-15T00:00:00Z'),
    updatedAt: new Date('2025-01-15T00:00:00Z'),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    ...overrides,
  };
}

function fakeLotItemRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    lotId: 1,
    productId: 100,
    productName: 'Charizard',
    gameName: 'Pokemon',
    setName: 'Base Set',
    condition: 'NM',
    quantity: 2,
    costBasis: 500,
    costOverridden: false,
    rarity: 'Rare',
    isSingle: true,
    ...overrides,
  };
}

function fakeExistingLotItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    lotId: 1,
    productId: 100,
    condition: 'NM',
    quantity: 2,
    costBasis: 500,
    costOverridden: false,
    inventoryItemStockId: 50,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('lot-service', () => {
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
  // validateLotInput (tested indirectly via createLot)
  // -----------------------------------------------------------------------
  describe('validateLotInput', () => {
    it('should throw when name is empty', async () => {
      await expect(
        createLot(
          'org-1',
          {
            name: '',
            amountPaid: 0,
            acquisitionDate: '2025-01-15',
            items: [{ productId: 1, quantity: 1, costBasis: 0, costOverridden: false }],
          },
          'user-1',
        ),
      ).rejects.toThrow('Lot name is required');
    });

    it('should throw when name is only whitespace', async () => {
      await expect(
        createLot(
          'org-1',
          {
            name: '   ',
            amountPaid: 0,
            acquisitionDate: '2025-01-15',
            items: [{ productId: 1, quantity: 1, costBasis: 0, costOverridden: false }],
          },
          'user-1',
        ),
      ).rejects.toThrow('Lot name is required');
    });

    it('should throw when amountPaid is negative', async () => {
      await expect(
        createLot(
          'org-1',
          {
            name: 'Lot',
            amountPaid: -1,
            acquisitionDate: '2025-01-15',
            items: [{ productId: 1, quantity: 1, costBasis: 0, costOverridden: false }],
          },
          'user-1',
        ),
      ).rejects.toThrow('Amount paid must be non-negative');
    });

    it('should throw when acquisitionDate is missing', async () => {
      await expect(
        createLot(
          'org-1',
          {
            name: 'Lot',
            amountPaid: 0,
            acquisitionDate: '',
            items: [{ productId: 1, quantity: 1, costBasis: 0, costOverridden: false }],
          },
          'user-1',
        ),
      ).rejects.toThrow('Acquisition date is required');
    });

    it('should throw when acquisitionDate is invalid', async () => {
      const { isValidDateString } = await import('../lib/date-utils');
      vi.mocked(isValidDateString).mockReturnValueOnce(false);

      await expect(
        createLot(
          'org-1',
          {
            name: 'Lot',
            amountPaid: 0,
            acquisitionDate: 'not-a-date',
            items: [{ productId: 1, quantity: 1, costBasis: 0, costOverridden: false }],
          },
          'user-1',
        ),
      ).rejects.toThrow('Acquisition date must be a valid date in YYYY-MM-DD format');
    });

    it('should throw when items array is empty', async () => {
      await expect(
        createLot('org-1', { name: 'Lot', amountPaid: 0, acquisitionDate: '2025-01-15', items: [] }, 'user-1'),
      ).rejects.toThrow('At least one item is required');
    });

    it('should throw when an item has no productId', async () => {
      await expect(
        createLot(
          'org-1',
          {
            name: 'Lot',
            amountPaid: 0,
            acquisitionDate: '2025-01-15',
            items: [{ productId: 0, quantity: 1, costBasis: 0, costOverridden: false }],
          },
          'user-1',
        ),
      ).rejects.toThrow('Each item must have a productId');
    });

    it('should throw when an item has quantity < 1', async () => {
      await expect(
        createLot(
          'org-1',
          {
            name: 'Lot',
            amountPaid: 0,
            acquisitionDate: '2025-01-15',
            items: [{ productId: 1, quantity: 0, costBasis: 0, costOverridden: false }],
          },
          'user-1',
        ),
      ).rejects.toThrow('Each item must have a quantity >= 1');
    });

    it('should throw when an item has negative costBasis', async () => {
      await expect(
        createLot(
          'org-1',
          {
            name: 'Lot',
            amountPaid: 0,
            acquisitionDate: '2025-01-15',
            items: [{ productId: 1, quantity: 1, costBasis: -1, costOverridden: false }],
          },
          'user-1',
        ),
      ).rejects.toThrow('Each item must have a non-negative costBasis');
    });

    it('should throw when an item has invalid condition', async () => {
      await expect(
        createLot(
          'org-1',
          {
            name: 'Lot',
            amountPaid: 500,
            acquisitionDate: '2025-01-15',
            items: [{ productId: 1, quantity: 1, costBasis: 500, costOverridden: false, condition: 'INVALID' }],
          },
          'user-1',
        ),
      ).rejects.toThrow('Invalid condition: INVALID');
    });

    it('should throw when cost total does not match amountPaid', async () => {
      await expect(
        createLot(
          'org-1',
          {
            name: 'Lot',
            amountPaid: 999,
            acquisitionDate: '2025-01-15',
            items: [{ productId: 1, quantity: 1, costBasis: 500, costOverridden: false }],
          },
          'user-1',
        ),
      ).rejects.toThrow('Total cost');
    });
  });

  // -----------------------------------------------------------------------
  // createLot
  // -----------------------------------------------------------------------
  describe('createLot', () => {
    it('should create a lot with new inventory stock entries', async () => {
      // Transaction inner calls:
      // 1. insert lot → returning newLot
      // 2. select price for getMarketPriceForProduct
      // 3. select inventoryItem for findOrCreateInventoryItem → not found
      // 4. insert inventoryItem → returning {id: 42}
      // 5. select inventoryItemStock for existing stock check → not found
      // 6. insert inventoryItemStock → returning {id: 100}
      // 7. insert lotItem
      //
      // After transaction:
      // 8. select lotItem (buildLotItemResults)
      // 9. select price (market prices)

      const newLot = fakeLotRow({ id: 1 });
      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([{ subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]); // getMarketPriceForProduct
          case 2:
            return chainable([]); // findOrCreateInventoryItem → no existing
          case 3:
            return chainable([]); // existing stock check → none
          case 4:
            return chainable([fakeLotItemRow()]); // buildLotItemResults
          case 5:
            return chainable([{ productId: 100, subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]); // market prices
          default:
            return chainable([]);
        }
      });

      let insertIdx = 0;
      mockOtcgs.insert.mockImplementation(() => {
        insertIdx++;
        switch (insertIdx) {
          case 1:
            return chainable([newLot]); // insert lot
          case 2:
            return chainable([{ id: 42 }]); // insert inventoryItem
          case 3:
            return chainable([{ id: 100 }]); // insert inventoryItemStock
          case 4:
            return chainable([]); // insert lotItem
          default:
            return chainable([]);
        }
      });

      const result = await createLot(
        'org-1',
        {
          name: 'Test Lot',
          description: 'A test lot',
          amountPaid: 1000,
          acquisitionDate: '2025-01-15',
          items: [{ productId: 100, quantity: 2, costBasis: 500, costOverridden: false, condition: 'NM' }],
        },
        'user-1',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Lot');
      expect(mockOtcgs.transaction).toHaveBeenCalled();
      expect(mockOtcgs.insert).toHaveBeenCalled();
    });

    it('should reuse existing inventory item when one exists', async () => {
      const newLot = fakeLotRow({ id: 2 });
      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([{ subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]); // getMarketPriceForProduct
          case 2:
            return chainable([{ id: 42, organizationId: 'org-1', productId: 100, condition: 'NM', price: 800 }]); // existing inventoryItem
          case 3:
            return chainable([]); // existing stock check → none
          case 4:
            return chainable([fakeLotItemRow({ lotId: 2 })]); // buildLotItemResults
          case 5:
            return chainable([{ productId: 100, subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]); // market prices
          default:
            return chainable([]);
        }
      });

      let insertIdx = 0;
      mockOtcgs.insert.mockImplementation(() => {
        insertIdx++;
        switch (insertIdx) {
          case 1:
            return chainable([newLot]); // insert lot
          case 2:
            return chainable([{ id: 100 }]); // insert inventoryItemStock
          case 3:
            return chainable([]); // insert lotItem
          default:
            return chainable([]);
        }
      });

      const result = await createLot(
        'org-1',
        {
          name: 'Another Lot',
          amountPaid: 1000,
          acquisitionDate: '2025-01-15',
          items: [{ productId: 100, quantity: 2, costBasis: 500, costOverridden: false, condition: 'NM' }],
        },
        'user-1',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(2);
    });

    it('should reuse existing stock entry with no lot association', async () => {
      const newLot = fakeLotRow({ id: 3 });
      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([{ subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]); // price
          case 2:
            return chainable([{ id: 42 }]); // existing inventoryItem
          case 3:
            return chainable([
              {
                id: 50,
                inventoryItemId: 42,
                costBasis: 500,
                acquisitionDate: '2025-01-15',
                quantity: 1,
                lotId: null,
                deletedAt: null,
              },
            ]); // existing stock, no lot
          case 4:
            return chainable([fakeLotItemRow({ lotId: 3 })]); // buildLotItemResults
          case 5:
            return chainable([{ productId: 100, subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]);
          default:
            return chainable([]);
        }
      });

      let insertIdx = 0;
      mockOtcgs.insert.mockImplementation(() => {
        insertIdx++;
        switch (insertIdx) {
          case 1:
            return chainable([newLot]); // insert lot
          case 2:
            return chainable([]); // insert lotItem
          default:
            return chainable([]);
        }
      });

      const result = await createLot(
        'org-1',
        {
          name: 'Reuse Stock',
          amountPaid: 1000,
          acquisitionDate: '2025-01-15',
          items: [{ productId: 100, quantity: 2, costBasis: 500, costOverridden: false }],
        },
        'user-1',
      );

      expect(result).toBeDefined();
      // Should have called update to reuse existing stock
      expect(mockOtcgs.update).toHaveBeenCalled();
    });

    it('should add to existing stock when another lot owns it', async () => {
      const newLot = fakeLotRow({ id: 4 });
      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([{ subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]);
          case 2:
            return chainable([{ id: 42 }]); // existing inventoryItem
          case 3:
            return chainable([
              {
                id: 50,
                inventoryItemId: 42,
                costBasis: 500,
                acquisitionDate: '2025-01-15',
                quantity: 1,
                lotId: 999,
                deletedAt: null,
              },
            ]); // stock owned by lot 999
          case 4:
            return chainable([fakeLotItemRow({ lotId: 4 })]); // buildLotItemResults
          case 5:
            return chainable([{ productId: 100, subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]);
          default:
            return chainable([]);
        }
      });

      let insertIdx = 0;
      mockOtcgs.insert.mockImplementation(() => {
        insertIdx++;
        switch (insertIdx) {
          case 1:
            return chainable([newLot]);
          case 2:
            return chainable([]); // insert lotItem
          default:
            return chainable([]);
        }
      });

      const result = await createLot(
        'org-1',
        {
          name: 'Shared Stock',
          amountPaid: 1000,
          acquisitionDate: '2025-01-15',
          items: [{ productId: 100, quantity: 2, costBasis: 500, costOverridden: false }],
        },
        'user-1',
      );

      expect(result).toBeDefined();
      expect(mockOtcgs.update).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // updateLot
  // -----------------------------------------------------------------------
  describe('updateLot', () => {
    it('should update lot metadata', async () => {
      // Transaction calls:
      // 1. select existing lot
      // 2. update lot metadata
      // 3. select existing lot items → empty (no items to remove/update)
      //
      // For the single input item (new):
      // 4. select price
      // 5. select inventoryItem → new
      // 6. insert inventoryItem
      // 7. select existing stock → none
      // 8. insert inventoryItemStock
      // 9. insert lotItem
      //
      // After transaction:
      // 10. select updated lot row
      // 11-12. buildLotItemResults

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([fakeLotRow()]); // existing lot
          case 2:
            return chainable([]); // existing lot items → empty
          case 3:
            return chainable([{ subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]); // getMarketPriceForProduct
          case 4:
            return chainable([]); // findOrCreateInventoryItem → none
          case 5:
            return chainable([]); // existing stock check → none
          // After transaction:
          case 6:
            return chainable([fakeLotRow({ name: 'Updated Lot' })]); // fetch updated lot
          case 7:
            return chainable([fakeLotItemRow()]); // buildLotItemResults
          case 8:
            return chainable([{ productId: 100, subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]); // prices
          default:
            return chainable([]);
        }
      });

      let insertIdx = 0;
      mockOtcgs.insert.mockImplementation(() => {
        insertIdx++;
        switch (insertIdx) {
          case 1:
            return chainable([{ id: 42 }]); // inventoryItem
          case 2:
            return chainable([{ id: 100 }]); // inventoryItemStock
          case 3:
            return chainable([]); // lotItem
          default:
            return chainable([]);
        }
      });

      const result = await updateLot(
        {
          id: 1,
          name: 'Updated Lot',
          amountPaid: 1000,
          acquisitionDate: '2025-01-15',
          items: [{ productId: 100, quantity: 2, costBasis: 500, costOverridden: false }],
        },
        'user-1',
        'org-1',
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Lot');
      expect(mockOtcgs.transaction).toHaveBeenCalled();
    });

    it('should throw when lot is not found', async () => {
      mockOtcgs.select.mockImplementation(() => chainable([])); // lot not found

      await expect(
        updateLot(
          {
            id: 999,
            name: 'Missing',
            amountPaid: 500,
            acquisitionDate: '2025-01-15',
            items: [{ productId: 1, quantity: 1, costBasis: 500, costOverridden: false }],
          },
          'user-1',
          'org-1',
        ),
      ).rejects.toThrow('Lot not found');
    });

    it('should remove items and soft-delete associated stock', async () => {
      const existingItem = fakeExistingLotItem();

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([fakeLotRow()]); // existing lot
          case 2:
            return chainable([existingItem]); // existing lot items (will be removed)
          // New item flow:
          case 3:
            return chainable([{ subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]); // price
          case 4:
            return chainable([]); // findOrCreate → none
          case 5:
            return chainable([]); // stock check → none
          // After transaction:
          case 6:
            return chainable([fakeLotRow()]); // fetch updated lot
          case 7:
            return chainable([fakeLotItemRow({ id: 20 })]); // buildLotItemResults
          case 8:
            return chainable([{ productId: 200, subTypeName: 'Normal', marketPrice: 1000, midPrice: 900 }]);
          default:
            return chainable([]);
        }
      });

      let insertIdx = 0;
      mockOtcgs.insert.mockImplementation(() => {
        insertIdx++;
        switch (insertIdx) {
          case 1:
            return chainable([{ id: 43 }]); // new inventoryItem
          case 2:
            return chainable([{ id: 101 }]); // new inventoryItemStock
          case 3:
            return chainable([]); // new lotItem
          default:
            return chainable([]);
        }
      });

      const result = await updateLot(
        {
          id: 1,
          name: 'Test Lot',
          amountPaid: 1000,
          acquisitionDate: '2025-01-15',
          items: [{ productId: 200, quantity: 2, costBasis: 500, costOverridden: false }], // completely new item, old one removed
        },
        'user-1',
        'org-1',
      );

      expect(result).toBeDefined();
      // Soft-delete stock + delete lotItem for removed items
      expect(mockOtcgs.update).toHaveBeenCalled();
      expect(mockOtcgs.delete).toHaveBeenCalled();
    });

    it('should update existing items', async () => {
      const existingItem = fakeExistingLotItem({ id: 10 });

      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([fakeLotRow()]); // existing lot
          case 2:
            return chainable([existingItem]); // existing lot items
          // After transaction:
          case 3:
            return chainable([fakeLotRow()]); // fetch updated lot
          case 4:
            return chainable([fakeLotItemRow({ quantity: 5 })]); // buildLotItemResults
          case 5:
            return chainable([{ productId: 100, subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]);
          default:
            return chainable([]);
        }
      });

      const result = await updateLot(
        {
          id: 1,
          name: 'Test Lot',
          amountPaid: 2500,
          acquisitionDate: '2025-01-15',
          items: [{ id: 10, productId: 100, quantity: 5, costBasis: 500, costOverridden: false, condition: 'NM' }],
        },
        'user-1',
        'org-1',
      );

      expect(result).toBeDefined();
      // Should have called update for lotItem and inventoryItemStock
      expect(mockOtcgs.update).toHaveBeenCalled();
    });

    it('should add new items during update', async () => {
      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([fakeLotRow()]); // existing lot
          case 2:
            return chainable([]); // no existing lot items
          // New item flow:
          case 3:
            return chainable([{ subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]); // price
          case 4:
            return chainable([]); // findOrCreate → none
          case 5:
            return chainable([]); // stock check → none
          // After transaction:
          case 6:
            return chainable([fakeLotRow()]); // fetch updated lot
          case 7:
            return chainable([fakeLotItemRow()]); // buildLotItemResults
          case 8:
            return chainable([{ productId: 100, subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]);
          default:
            return chainable([]);
        }
      });

      let insertIdx = 0;
      mockOtcgs.insert.mockImplementation(() => {
        insertIdx++;
        switch (insertIdx) {
          case 1:
            return chainable([{ id: 42 }]); // inventoryItem
          case 2:
            return chainable([{ id: 100 }]); // inventoryItemStock
          case 3:
            return chainable([]); // lotItem
          default:
            return chainable([]);
        }
      });

      const result = await updateLot(
        {
          id: 1,
          name: 'Test Lot',
          amountPaid: 1000,
          acquisitionDate: '2025-01-15',
          items: [{ productId: 100, quantity: 2, costBasis: 500, costOverridden: false }], // new item (no id)
        },
        'user-1',
        'org-1',
      );

      expect(result).toBeDefined();
      expect(mockOtcgs.insert).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // deleteLot
  // -----------------------------------------------------------------------
  describe('deleteLot', () => {
    it('should delete a lot with cascading soft-delete of stock entries', async () => {
      mockOtcgs.select.mockImplementation(() => chainable([fakeLotRow()])); // lot exists

      const result = await deleteLot(1, 'org-1', 'user-1');

      expect(result).toBe(true);
      expect(mockOtcgs.transaction).toHaveBeenCalled();
      // Soft-delete stock, delete lotItems, delete lot
      expect(mockOtcgs.update).toHaveBeenCalled();
      expect(mockOtcgs.delete).toHaveBeenCalled();
    });

    it('should throw when lot is not found', async () => {
      mockOtcgs.select.mockImplementation(() => chainable([])); // lot not found

      await expect(deleteLot(999, 'org-1', 'user-1')).rejects.toThrow('Lot not found');
    });
  });

  // -----------------------------------------------------------------------
  // getLots
  // -----------------------------------------------------------------------
  describe('getLots', () => {
    it('should return paginated results with default pagination', async () => {
      const lotRow = fakeLotRow();
      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([{ total: 1 }]); // count
          case 2:
            return chainable([lotRow]); // data
          // buildLotResults — batch query for all lot items
          case 3:
            return chainable([fakeLotItemRow()]); // allItems
          case 4:
            return chainable([{ productId: 100, subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]); // prices
          default:
            return chainable([]);
        }
      });

      const result = await getLots('org-1');

      expect(result).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
      expect(result.totalCount).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Test Lot');
    });

    it('should apply search filter', async () => {
      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([{ total: 1 }]); // count
          case 2:
            return chainable([fakeLotRow({ name: 'Magic Cards' })]); // data
          case 3:
            return chainable([fakeLotItemRow()]); // allItems
          case 4:
            return chainable([{ productId: 100, subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]); // prices
          default:
            return chainable([]);
        }
      });

      const result = await getLots('org-1', { searchTerm: 'Magic' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Magic Cards');
    });

    it('should return empty results', async () => {
      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([{ total: 0 }]); // count
          case 2:
            return chainable([]); // data — no lots
          default:
            return chainable([]);
        }
      });

      const result = await getLots('org-1');

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.totalPages).toBe(1);
    });

    it('should respect custom pagination', async () => {
      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([{ total: 30 }]); // count
          case 2:
            return chainable([fakeLotRow({ id: 11 })]); // data page 2
          case 3:
            return chainable([fakeLotItemRow()]); // allItems
          case 4:
            return chainable([{ productId: 100, subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]); // prices
          default:
            return chainable([]);
        }
      });

      const result = await getLots('org-1', null, { page: 2, pageSize: 10 });

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(3);
    });
  });

  // -----------------------------------------------------------------------
  // getLot
  // -----------------------------------------------------------------------
  describe('getLot', () => {
    it('should return a lot when found', async () => {
      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([fakeLotRow()]); // lot row
          case 2:
            return chainable([fakeLotItemRow()]); // buildLotItemResults
          case 3:
            return chainable([{ productId: 100, subTypeName: 'Normal', marketPrice: 800, midPrice: 750 }]); // prices
          default:
            return chainable([]);
        }
      });

      const result = await getLot(1, 'org-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.name).toBe('Test Lot');
    });

    it('should return null when not found', async () => {
      mockOtcgs.select.mockImplementation(() => chainable([]));

      const result = await getLot(999, 'org-1');

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getLotStats
  // -----------------------------------------------------------------------
  describe('getLotStats', () => {
    it('should return aggregate stats', async () => {
      let selectIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([{ totalLots: 3, totalInvested: 5000 }]); // lot aggregation
          case 2:
            return chainable([{ id: 1 }, { id: 2 }, { id: 3 }]); // orgLotIds subquery (not actually awaited, used as subquery)
          // Actually the subquery is inline — the items query uses it
          // So selectIdx 2 is the items query
          case 3:
            return chainable([{ productId: 100, subTypeName: 'Normal', marketPrice: 1200, midPrice: 1000 }]); // prices
          default:
            return chainable([]);
        }
      });

      // The items query (select 2) returns lot items
      mockOtcgs.select.mockImplementation(() => {
        selectIdx++;
        switch (selectIdx) {
          case 1:
            return chainable([{ totalLots: 3, totalInvested: 5000 }]);
          case 2:
            return chainable([
              { productId: 100, quantity: 2 },
              { productId: 200, quantity: 1 },
            ]); // items
          case 3:
            return chainable([
              { productId: 100, subTypeName: 'Normal', marketPrice: 1200, midPrice: 1000 },
              { productId: 200, subTypeName: 'Normal', marketPrice: 800, midPrice: 700 },
            ]); // prices
          default:
            return chainable([]);
        }
      });

      selectIdx = 0; // reset after re-mock

      const result = await getLotStats('org-1');

      expect(result).toBeDefined();
      expect(result.totalLots).toBe(3);
      expect(result.totalInvested).toBe(5000);
    });

    it('should return zeros when no lots exist', async () => {
      mockOtcgs.select.mockImplementation(() => chainable([{ totalLots: 0, totalInvested: 0 }]));

      const result = await getLotStats('org-1');

      expect(result).toEqual({ totalLots: 0, totalInvested: 0, totalMarketValue: 0, totalProfitLoss: 0 });
    });
  });

  // -----------------------------------------------------------------------
  // getDistinctRarities
  // -----------------------------------------------------------------------
  describe('getDistinctRarities', () => {
    it('should return distinct rarity values', async () => {
      mockOtcgs.select.mockImplementation(() =>
        chainable([{ value: 'Common' }, { value: 'Uncommon' }, { value: 'Rare' }]),
      );

      const result = await getDistinctRarities(1);

      expect(result).toEqual(['Common', 'Uncommon', 'Rare']);
    });

    it('should return empty array when no rarities', async () => {
      mockOtcgs.select.mockImplementation(() => chainable([]));

      const result = await getDistinctRarities(1);

      expect(result).toEqual([]);
    });

    it('should filter out falsy values', async () => {
      mockOtcgs.select.mockImplementation(() =>
        chainable([{ value: 'Common' }, { value: null }, { value: '' }, { value: 'Rare' }]),
      );

      const result = await getDistinctRarities(1);

      expect(result).toEqual(['Common', 'Rare']);
    });
  });
});
