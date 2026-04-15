import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock helpers
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
    'onConflictDoUpdate',
  ]) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

let selectChain: ReturnType<typeof chainable>;
let insertChain: ReturnType<typeof chainable>;
let deleteChain: ReturnType<typeof chainable>;

// ---------------------------------------------------------------------------
// Mock database
// ---------------------------------------------------------------------------

const mockOtcgs = vi.hoisted(() => {
  const mock = {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  };
  // transaction calls the callback with the mock itself (tx has the same API)
  mock.transaction.mockImplementation(async (fn: (tx: typeof mock) => Promise<void>) => fn(mock));
  return mock;
});

vi.mock('../db/otcgs/index', () => ({
  otcgs: mockOtcgs,
}));

vi.mock('../db/otcgs/store-supported-game-schema', () => ({
  storeSupportedGame: {
    id: 'store_supported_game.id',
    categoryId: 'store_supported_game.category_id',
  },
}));

vi.mock('../db/otcgs/buy-rate-schema', () => ({
  buyRate: {
    id: 'buy_rate.id',
    categoryId: 'buy_rate.category_id',
    description: 'buy_rate.description',
    fixedRateCents: 'buy_rate.fixed_rate_cents',
    percentageRate: 'buy_rate.percentage_rate',
    hidden: 'buy_rate.hidden',
    sortOrder: 'buy_rate.sort_order',
  },
}));

vi.mock('../db/tcg-data/schema', () => ({
  category: {
    id: 'category.id',
    name: 'category.name',
    displayName: 'category.display_name',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: 'eq', args })),
  asc: vi.fn((...args: unknown[]) => ({ type: 'asc', args })),
  and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
  inArray: vi.fn((...args: unknown[]) => ({ type: 'inArray', args })),
}));

// Import after mocks
import {
  getAvailableGames,
  getSupportedGames,
  setSupportedGames,
  getBuyRates,
  saveBuyRates,
  deleteBuyRates,
  getPublicBuyRates,
} from './buy-rate-service';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buy-rate-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectChain = chainable([]);
    insertChain = chainable([]);
    deleteChain = chainable([]);
    mockOtcgs.select.mockImplementation(() => selectChain);
    mockOtcgs.insert.mockImplementation(() => insertChain);
    mockOtcgs.delete.mockImplementation(() => deleteChain);
  });

  // -----------------------------------------------------------------------
  // getAvailableGames
  // -----------------------------------------------------------------------
  describe('getAvailableGames', () => {
    it('should return all categories from tcg-data', async () => {
      const categories = [
        { id: 1, name: 'Magic', displayName: 'Magic: The Gathering' },
        { id: 3, name: 'Pokemon', displayName: 'Pokemon' },
      ];
      selectChain = chainable(categories);
      mockOtcgs.select.mockImplementation(() => selectChain);

      const result = await getAvailableGames();

      expect(result).toEqual([
        { categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' },
        { categoryId: 3, name: 'Pokemon', displayName: 'Pokemon' },
      ]);
      expect(mockOtcgs.select).toHaveBeenCalled();
    });

    it('should return empty array when no categories exist', async () => {
      selectChain = chainable([]);
      mockOtcgs.select.mockImplementation(() => selectChain);

      const result = await getAvailableGames();

      expect(result).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // getSupportedGames
  // -----------------------------------------------------------------------
  describe('getSupportedGames', () => {
    it('should return supported games', async () => {
      const rows = [
        { categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' },
        { categoryId: 3, name: 'Pokemon', displayName: 'Pokemon' },
      ];
      selectChain = chainable(rows);
      mockOtcgs.select.mockImplementation(() => selectChain);

      const result = await getSupportedGames();

      expect(result).toEqual(rows);
      expect(mockOtcgs.select).toHaveBeenCalled();
    });

    it('should return empty array when no games are supported', async () => {
      selectChain = chainable([]);
      mockOtcgs.select.mockImplementation(() => selectChain);

      const result = await getSupportedGames();

      expect(result).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // setSupportedGames
  // -----------------------------------------------------------------------
  describe('setSupportedGames', () => {
    it('should delete old games and insert new ones', async () => {
      let callIndex = 0;
      // Call 1: select current supported games
      // Call 2: getSupportedGames after insert (returns the newly set games)
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) {
          return chainable([{ categoryId: 1 }, { categoryId: 3 }]);
        }
        // Second select is for getSupportedGames at the end
        return chainable([
          { categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' },
          { categoryId: 5, name: 'OnePiece', displayName: 'One Piece Card Game' },
        ]);
      });

      const result = await setSupportedGames([1, 5]);

      // Should have called delete for buy rates of removed game (categoryId: 3)
      expect(mockOtcgs.delete).toHaveBeenCalled();
      // Should have called insert for new supported games
      expect(mockOtcgs.insert).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should handle setting empty supported games', async () => {
      mockOtcgs.select.mockImplementation(() => {
        return chainable([{ categoryId: 1 }]);
      });

      await setSupportedGames([]);

      // Should delete existing games and buy rates for removed game
      expect(mockOtcgs.delete).toHaveBeenCalled();
      // Should NOT insert since empty list
    });
  });

  // -----------------------------------------------------------------------
  // getBuyRates
  // -----------------------------------------------------------------------
  describe('getBuyRates', () => {
    it('should return buy rates for a game ordered by sortOrder', async () => {
      const rows = [
        {
          id: 1,
          description: 'Commons',
          fixedRateCents: 1,
          percentageRate: null,
          type: 'fixed',
          rarity: null,
          hidden: false,
          sortOrder: 0,
        },
        {
          id: 2,
          description: 'Rares',
          fixedRateCents: 5,
          percentageRate: null,
          type: 'fixed',
          rarity: null,
          hidden: false,
          sortOrder: 1,
        },
        {
          id: 3,
          description: 'Holos',
          fixedRateCents: null,
          percentageRate: 0.1,
          type: 'percentage',
          rarity: null,
          hidden: false,
          sortOrder: 2,
        },
      ];
      selectChain = chainable(rows);
      mockOtcgs.select.mockImplementation(() => selectChain);

      const result = await getBuyRates(1);

      expect(result).toEqual([
        {
          id: 1,
          description: 'Commons',
          fixedRateCents: 1,
          percentageRate: null,
          type: 'fixed',
          rarity: null,
          hidden: false,
          sortOrder: 0,
        },
        {
          id: 2,
          description: 'Rares',
          fixedRateCents: 5,
          percentageRate: null,
          type: 'fixed',
          rarity: null,
          hidden: false,
          sortOrder: 1,
        },
        {
          id: 3,
          description: 'Holos',
          fixedRateCents: null,
          percentageRate: 0.1,
          type: 'percentage',
          rarity: null,
          hidden: false,
          sortOrder: 2,
        },
      ]);
    });

    it('should return empty array when no buy rates exist', async () => {
      selectChain = chainable([]);
      mockOtcgs.select.mockImplementation(() => selectChain);

      const result = await getBuyRates(1);

      expect(result).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // saveBuyRates
  // -----------------------------------------------------------------------
  describe('saveBuyRates', () => {
    it('should delete existing entries and insert new ones', async () => {
      const savedRows = [
        { id: 10, description: 'Commons', fixedRateCents: 1, percentageRate: null, type: 'fixed', sortOrder: 0 },
        { id: 11, description: 'Rares', fixedRateCents: 5, percentageRate: null, type: 'fixed', sortOrder: 1 },
      ];
      // First select is getBuyRates after save
      selectChain = chainable(savedRows);
      mockOtcgs.select.mockImplementation(() => selectChain);

      const result = await saveBuyRates(1, [
        { description: 'Commons', fixedRateCents: 1, type: 'fixed', sortOrder: 0 },
        { description: 'Rares', fixedRateCents: 5, type: 'fixed', sortOrder: 1 },
      ]);

      expect(mockOtcgs.delete).toHaveBeenCalled();
      expect(mockOtcgs.insert).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('Commons');
    });

    it('should only delete when saving empty entries', async () => {
      selectChain = chainable([]);
      mockOtcgs.select.mockImplementation(() => selectChain);

      const result = await saveBuyRates(1, []);

      expect(mockOtcgs.delete).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should allow hidden rarity entries with zero rate', async () => {
      const savedRows = [
        {
          id: 10,
          description: 'Common',
          fixedRateCents: 0,
          percentageRate: null,
          type: 'fixed',
          hidden: true,
          sortOrder: 0,
        },
      ];
      selectChain = chainable(savedRows);
      mockOtcgs.select.mockImplementation(() => selectChain);

      // Should not throw — hidden rarity entries can have rate 0
      const result = await saveBuyRates(1, [
        { description: 'Common', fixedRateCents: 0, type: 'fixed', rarity: 'Common', hidden: true, sortOrder: 0 },
      ]);

      expect(mockOtcgs.delete).toHaveBeenCalled();
      expect(mockOtcgs.insert).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should reject visible rarity entries with zero rate', async () => {
      await expect(
        saveBuyRates(1, [
          { description: 'Common', fixedRateCents: 0, type: 'fixed', rarity: 'Common', hidden: false, sortOrder: 0 },
        ]),
      ).rejects.toThrow('Buy rate for rarity "Common" must be greater than 0');
    });
  });

  // -----------------------------------------------------------------------
  // deleteBuyRates
  // -----------------------------------------------------------------------
  describe('deleteBuyRates', () => {
    it('should delete all buy rates for a game and return true', async () => {
      const result = await deleteBuyRates(1);

      expect(mockOtcgs.delete).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // getPublicBuyRates
  // -----------------------------------------------------------------------
  describe('getPublicBuyRates', () => {
    it('should return games with their buy rate entries', async () => {
      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) {
          // getSupportedGames query
          return chainable([
            { categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' },
            { categoryId: 3, name: 'Pokemon', displayName: 'Pokemon' },
          ]);
        }
        // Buy rates query
        return chainable([
          {
            id: 1,
            categoryId: 1,
            description: 'Commons',
            fixedRateCents: 1,
            percentageRate: null,
            type: 'fixed',
            hidden: false,
            sortOrder: 0,
          },
          {
            id: 2,
            categoryId: 1,
            description: 'Rares',
            fixedRateCents: 5,
            percentageRate: null,
            type: 'fixed',
            hidden: false,
            sortOrder: 1,
          },
          {
            id: 3,
            categoryId: 3,
            description: 'Commons',
            fixedRateCents: 2,
            percentageRate: null,
            type: 'fixed',
            hidden: false,
            sortOrder: 0,
          },
        ]);
      });

      const result = await getPublicBuyRates();

      expect(result.games).toHaveLength(2);
      expect(result.games[0].gameName).toBe('Magic');
      expect(result.games[0].entries).toHaveLength(2);
      expect(result.games[1].gameName).toBe('Pokemon');
      expect(result.games[1].entries).toHaveLength(1);
    });

    it('should exclude hidden entries from public buy rates via DB query', async () => {
      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) {
          return chainable([{ categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' }]);
        }
        // Simulates DB returning only visible entries (hidden=false WHERE clause applied)
        return chainable([
          {
            id: 1,
            categoryId: 1,
            description: 'Commons',
            fixedRateCents: 1,
            percentageRate: null,
            type: 'fixed',
            hidden: false,
            sortOrder: 0,
          },
          {
            id: 3,
            categoryId: 1,
            description: 'Holos',
            fixedRateCents: null,
            percentageRate: 0.1,
            type: 'percentage',
            hidden: false,
            sortOrder: 2,
          },
        ]);
      });

      const result = await getPublicBuyRates();

      expect(result.games).toHaveLength(1);
      expect(result.games[0].entries).toHaveLength(2);
      expect(result.games[0].entries[0].description).toBe('Commons');
      expect(result.games[0].entries[1].description).toBe('Holos');
    });

    it('should return empty games array when no supported games', async () => {
      selectChain = chainable([]);
      mockOtcgs.select.mockImplementation(() => selectChain);

      const result = await getPublicBuyRates();

      expect(result.games).toEqual([]);
    });

    it('should exclude games with no buy rate entries', async () => {
      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) {
          return chainable([
            { categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' },
            { categoryId: 3, name: 'Pokemon', displayName: 'Pokemon' },
          ]);
        }
        // Only Magic has entries
        return chainable([
          {
            id: 1,
            categoryId: 1,
            description: 'Commons',
            fixedRateCents: 1,
            percentageRate: null,
            type: 'fixed',
            hidden: false,
            sortOrder: 0,
          },
        ]);
      });

      const result = await getPublicBuyRates();

      expect(result.games).toHaveLength(1);
      expect(result.games[0].gameName).toBe('Magic');
    });
  });
});
