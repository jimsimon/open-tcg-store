import { describe, it, expect, vi, beforeEach } from 'vitest';

import { chainable } from '../test-utils';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockOtcgs = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  query: {
    category: { findFirst: vi.fn() },
    product: { findFirst: vi.fn(), findMany: vi.fn() },
    group: { findMany: vi.fn() },
  },
}));

vi.mock('../db', () => ({
  otcgs: mockOtcgs,
}));

vi.mock('../db/tcg-data/schema', () => ({
  product: {
    id: 'product.id',
    name: 'product.name',
    categoryId: 'product.category_id',
    groupId: 'product.group_id',
    tcgpProductId: 'product.tcgp_product_id',
    productType: 'product.product_type',
  },
}));

vi.mock('../db/otcgs/inventory-schema', () => ({
  inventoryItem: {
    id: 'inventory_item.id',
    organizationId: 'inventory_item.organization_id',
    productId: 'inventory_item.product_id',
    condition: 'inventory_item.condition',
    price: 'inventory_item.price',
  },
}));

vi.mock('../db/otcgs/inventory-stock-schema', () => ({
  inventoryItemStock: {
    id: 'inventory_item_stock.id',
    inventoryItemId: 'inventory_item_stock.inventory_item_id',
    quantity: 'inventory_item_stock.quantity',
    deletedAt: 'inventory_item_stock.deleted_at',
  },
}));

vi.mock('../lib/sql-utils', () => ({
  likeEscaped: vi.fn((_col, _term) => ({ type: 'likeEscaped' })),
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  // sql tagged template returns an object with .as() for column aliasing
  const sqlResult = { type: 'sql', as: vi.fn().mockReturnThis() };
  return {
    ...actual,
    sql: Object.assign(
      vi.fn((..._args: unknown[]) => ({ ...sqlResult, as: vi.fn().mockReturnThis() })),
      {
        join: vi.fn((..._args: unknown[]) => ({ type: 'sql.join' })),
      },
    ),
    eq: vi.fn((...args: unknown[]) => ({ type: 'eq', args })),
    and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
    exists: vi.fn((...args: unknown[]) => ({ type: 'exists', args })),
    isNull: vi.fn((...args: unknown[]) => ({ type: 'isNull', args })),
    gt: vi.fn((...args: unknown[]) => ({ type: 'gt', args })),
  };
});

import {
  resolveCategoryId,
  getCardById,
  getProductById,
  getSets,
  getSingleCardInventory,
  getProductListings,
} from './card-service';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('card-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // resolveCategoryId
  // -----------------------------------------------------------------------

  describe('resolveCategoryId', () => {
    it('should return the category ID for a valid game name', async () => {
      mockOtcgs.query.category.findFirst.mockResolvedValue({ id: 42 });

      const result = await resolveCategoryId('Magic');

      expect(result).toBe(42);
      expect(mockOtcgs.query.category.findFirst).toHaveBeenCalled();
    });

    it('should throw for an unsupported game', async () => {
      mockOtcgs.query.category.findFirst.mockResolvedValue(null);

      await expect(resolveCategoryId('Nonexistent')).rejects.toThrow('Unsupported game: Nonexistent');
    });
  });

  // -----------------------------------------------------------------------
  // getCardById
  // -----------------------------------------------------------------------

  describe('getCardById', () => {
    const fakeProduct = {
      id: 100,
      name: 'Black Lotus',
      tcgpProductId: 9999,
      group: { name: 'Alpha' },
      prices: [{ marketPrice: 5000000, midPrice: 4500000, subTypeName: 'Normal' }], // cents
      rarityDisplay: 'Rare',
      subType: 'Artifact',
      oracleText: 'Sacrifice...',
      flavorText: '',
      productType: 'single',
    };

    it('should return a fully formed card with inventory', async () => {
      mockOtcgs.query.product.findFirst.mockResolvedValue(fakeProduct);
      const invChain = chainable([{ condition: 'NM', totalQuantity: 3, lowestPrice: 49000 }]);
      mockOtcgs.select.mockReturnValue(invChain);

      const card = await getCardById(100, 1, 'org-1');

      expect(card.id).toBe('100');
      expect(card.name).toBe('Black Lotus');
      expect(card.setName).toBe('Alpha');
      expect(card.rarity).toBe('Rare');
      expect(card.type).toBe('Artifact');
      expect(card.text).toBe('Sacrifice...');
      expect(card.images!.small).toContain('9999');
      expect(card.images!.large).toContain('9999');
      expect(card.finishes).toEqual(['Normal']);
      expect(card.inventory).toHaveLength(1);
      expect(card.inventory![0]!.NM.quantity).toBe(3);
      expect(card.inventory![0]!.NM.price).toBe(49000);
    });

    it('should use fallback pricing with condition multipliers when no inventory', async () => {
      mockOtcgs.query.product.findFirst.mockResolvedValue(fakeProduct);
      const invChain = chainable([]); // no inventory
      mockOtcgs.select.mockReturnValue(invChain);

      const card = await getCardById(100, 1, null);

      // NM: toCents(50000*1.0)=5000000, LP: toCents(50000*0.8)=4000000, etc.
      expect(card.inventory![0]!.NM.price).toBe(5000000);
      expect(card.inventory![0]!.LP.price).toBe(4000000);
      expect(card.inventory![0]!.MP.price).toBe(2500000);
      expect(card.inventory![0]!.HP!.price).toBe(1500000);
      expect(card.inventory![0]!.D!.price).toBe(1000000);
      expect(card.inventory![0]!.NM.quantity).toBe(0);
    });

    it('should throw when product not found', async () => {
      mockOtcgs.query.product.findFirst.mockResolvedValue(null);

      await expect(getCardById(999, 1, null)).rejects.toThrow('Unable to find card with id: 999');
    });

    it('should default setName to Unknown Set when group is null', async () => {
      mockOtcgs.query.product.findFirst.mockResolvedValue({
        ...fakeProduct,
        group: null,
      });
      mockOtcgs.select.mockReturnValue(chainable([]));

      const card = await getCardById(100, 1, null);
      expect(card.setName).toBe('Unknown Set');
    });

    it('should use midPrice when marketPrice is null', async () => {
      mockOtcgs.query.product.findFirst.mockResolvedValue({
        ...fakeProduct,
        prices: [{ marketPrice: null, midPrice: 10000, subTypeName: 'Normal' }], // cents
      });
      mockOtcgs.select.mockReturnValue(chainable([]));

      const card = await getCardById(100, 1, null);
      expect(card.inventory![0]!.NM.price).toBe(10000); // toCents(100 * 1.0)
      expect(card.inventory![0]!.LP.price).toBe(8000); // toCents(100 * 0.8)
    });
  });

  // -----------------------------------------------------------------------
  // getProductById
  // -----------------------------------------------------------------------

  describe('getProductById', () => {
    const fakeProduct = {
      id: 200,
      name: 'Sol Ring',
      tcgpProductId: 8888,
      categoryId: 1,
      group: { name: 'Commander' },
      category: { name: 'Magic' },
      prices: [{ marketPrice: 500, midPrice: 400, subTypeName: 'Normal' }], // cents
      rarityDisplay: 'Uncommon',
      subType: 'Artifact',
      productType: 'single',
    };

    it('should return a single product as a card', async () => {
      mockOtcgs.query.product.findFirst.mockResolvedValue(fakeProduct);
      const invChain = chainable([{ id: 10, condition: 'NM', price: 4.5, totalQuantity: 5 }]);
      mockOtcgs.select.mockReturnValue(invChain);

      const result = await getProductById(200, 'org-1');

      expect(result.id).toBe('200');
      expect(result.name).toBe('Sol Ring');
      expect(result.gameName).toBe('Magic');
      expect(result.isSingle).toBe(true);
      expect(result.isSealed).toBe(false);
      expect(result.rarity).toBe('Uncommon');
      expect(result.inventoryRecords).toHaveLength(1);
      expect(result.inventoryRecords[0].inventoryItemId).toBe(10);
    });

    it('should classify sealed products correctly', async () => {
      mockOtcgs.query.product.findFirst.mockResolvedValue({
        ...fakeProduct,
        rarityDisplay: null,
        subType: null,
        description: 'Booster box',
        productType: 'sealed',
      });
      mockOtcgs.select.mockReturnValue(chainable([]));

      const result = await getProductById(200, null);

      expect(result.isSingle).toBe(false);
      expect(result.isSealed).toBe(true);
    });

    it('should throw when product not found', async () => {
      mockOtcgs.query.product.findFirst.mockResolvedValue(null);

      await expect(getProductById(999, null)).rejects.toThrow('Product not found: 999');
    });

    it('should default gameName and setName when missing', async () => {
      mockOtcgs.query.product.findFirst.mockResolvedValue({
        ...fakeProduct,
        group: null,
        category: null,
      });
      mockOtcgs.select.mockReturnValue(chainable([]));

      const result = await getProductById(200, null);
      expect(result.setName).toBe('Unknown Set');
      expect(result.gameName).toBe('Unknown');
    });
  });

  // -----------------------------------------------------------------------
  // getSets
  // -----------------------------------------------------------------------

  describe('getSets', () => {
    it('should return sets mapped to code/name pairs', async () => {
      mockOtcgs.query.group.findMany.mockResolvedValue([
        { id: 1, name: 'Alpha' },
        { id: 2, name: 'Beta' },
      ]);

      const result = await getSets(42, null);

      expect(result).toEqual([
        { code: '1', name: 'Alpha' },
        { code: '2', name: 'Beta' },
      ]);
    });

    it('should return empty array when no sets match', async () => {
      mockOtcgs.query.group.findMany.mockResolvedValue([]);

      const result = await getSets(42, { searchTerm: 'nonexistent' });

      expect(result).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // getSingleCardInventory
  // -----------------------------------------------------------------------

  describe('getSingleCardInventory', () => {
    it('should return cards with per-condition inventory', async () => {
      mockOtcgs.query.product.findMany.mockResolvedValue([
        {
          id: 100,
          name: 'Lightning Bolt',
          tcgpProductId: 7777,
          group: { name: 'Alpha' },
          prices: [{ marketPrice: 1000, midPrice: 800, subTypeName: 'Normal' }], // cents
        },
      ]);
      // Inventory query
      const invChain = chainable([{ productId: 100, condition: 'NM', totalQuantity: 5, lowestPrice: 9 }]);
      mockOtcgs.select.mockReturnValue(invChain);

      const cards = await getSingleCardInventory(42, null, 'org-1');

      expect(cards).toHaveLength(1);
      expect(cards[0].name).toBe('Lightning Bolt');
      expect(cards[0].inventory![0]!.NM.quantity).toBe(5);
      expect(cards[0].inventory![0]!.NM.price).toBe(9); // 9 cents from mock lowestPrice
      // LP should use fallback: toCents(10 * 0.8) = 800
      expect(cards[0].inventory![0]!.LP.price).toBe(800);
    });

    it('should return empty array when no products match', async () => {
      mockOtcgs.query.product.findMany.mockResolvedValue([]);

      const cards = await getSingleCardInventory(42, { searchTerm: 'nonexistent' }, null);

      expect(cards).toEqual([]);
    });

    it('should create one card per price/finish', async () => {
      mockOtcgs.query.product.findMany.mockResolvedValue([
        {
          id: 100,
          name: 'Lightning Bolt',
          tcgpProductId: 7777,
          group: { name: 'Alpha' },
          prices: [
            { marketPrice: 1000, midPrice: 800, subTypeName: 'Normal' }, // cents
            { marketPrice: 2000, midPrice: 1800, subTypeName: 'Foil' }, // cents
          ],
        },
      ]);
      mockOtcgs.select.mockReturnValue(chainable([]));

      const cards = await getSingleCardInventory(42, null, null);

      expect(cards).toHaveLength(2);
      expect(cards[0].finishes).toEqual(['Normal']);
      expect(cards[1].finishes).toEqual(['Foil']);
    });
  });

  // -----------------------------------------------------------------------
  // getProductListings
  // -----------------------------------------------------------------------

  describe('getProductListings', () => {
    it('should return empty items when no results', async () => {
      mockOtcgs.query.category.findFirst.mockResolvedValue({ id: 1 });

      // Both the base query and count query share the same chain.
      // The count extracts `count` field, the main query extracts `id`.
      // When results are empty, the chain resolves to [{ count: 0 }];
      // productIds will be [undefined] (length 1) so we need the chain to
      // resolve to an empty array (results with no rows).
      // Instead, resolve to an array with count=0 and no id — the service
      // will try results.map(r => r.id) = [undefined], which passes the
      // length check. To properly test empty results, we need different
      // data per select call.
      let selectCall = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectCall++;
        // Call 1: base query (will be awaited 2nd via orderBy().limit().offset())
        if (selectCall === 1) return chainable([]);
        // Call 2: count query (awaited first)
        return chainable([{ count: 0 }]);
      });

      const result = await getProductListings({ gameName: 'Magic' }, { page: 1, pageSize: 25 }, null);

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
      expect(result.totalPages).toBe(0);
    });

    it('should compute pagination correctly', async () => {
      mockOtcgs.query.category.findFirst.mockResolvedValue({ id: 1 });

      // select calls: 1=baseQuery, 2=countQuery, 3=conditionPrices, 4=inventoryIds
      let selectCall = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectCall++;
        if (selectCall === 1)
          return chainable([
            { id: 1, name: 'Card A', tcgpProductId: 111, groupId: 1, totalQuantity: 5, lowestPrice: 10 },
          ]);
        if (selectCall === 2) return chainable([{ count: 50 }]);
        return chainable([]); // conditionPrices, inventoryIds
      });

      mockOtcgs.query.product.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Card A',
          tcgpProductId: 111,
          categoryId: 1,
          group: { name: 'Alpha' },
          category: { name: 'Magic' },
          prices: [{ subTypeName: 'Normal', marketPrice: 1000 }], // cents
          rarityDisplay: 'Rare',
          productType: 'single',
        },
      ]);

      const result = await getProductListings({ gameName: 'Magic' }, { page: 2, pageSize: 10 }, 'org-1');

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(50);
      expect(result.totalPages).toBe(5);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Card A');
      expect(result.items[0].setName).toBe('Alpha');
      expect(result.items[0].rarity).toBe('Rare');
    });

    it('should fall back to market price when no inventory price', async () => {
      mockOtcgs.query.category.findFirst.mockResolvedValue({ id: 1 });

      let selectCall = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectCall++;
        if (selectCall === 1)
          return chainable([
            { id: 1, name: 'Card', tcgpProductId: 111, groupId: 1, totalQuantity: 0, lowestPrice: null },
          ]);
        if (selectCall === 2) return chainable([{ count: 1 }]);
        return chainable([]);
      });

      mockOtcgs.query.product.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Card',
          tcgpProductId: 111,
          categoryId: 1,
          group: { name: 'Set' },
          category: { name: 'Magic' },
          prices: [{ subTypeName: 'Normal', marketPrice: 1550 }], // cents
          productType: 'sealed',
        },
      ]);

      const result = await getProductListings({ gameName: 'Magic' }, { page: 1, pageSize: 10 }, null);

      expect(result.items[0].lowestPrice).toBe(1550); // toCents(15.50)
    });

    it('should build image URLs with tcgpProductId', async () => {
      mockOtcgs.query.category.findFirst.mockResolvedValue({ id: 1 });

      let selectCall = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectCall++;
        if (selectCall === 1)
          return chainable([
            { id: 1, name: 'Card', tcgpProductId: 42, groupId: 1, totalQuantity: 0, lowestPrice: null },
          ]);
        if (selectCall === 2) return chainable([{ count: 1 }]);
        return chainable([]);
      });

      mockOtcgs.query.product.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Card',
          tcgpProductId: 42,
          categoryId: 1,
          group: null,
          category: null,
          prices: [],
          productType: 'sealed',
        },
      ]);

      const result = await getProductListings({ gameName: 'Magic' }, { page: 1, pageSize: 10 }, null);

      expect(result.items[0].images.small).toBe('https://tcgplayer-cdn.tcgplayer.com/product/42_in_400x400.jpg');
      expect(result.items[0].images.large).toBe('https://tcgplayer-cdn.tcgplayer.com/product/42_in_1000x1000.jpg');
    });
  });
});
