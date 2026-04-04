import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock database — must mock the specific barrel used by resolvers
// ---------------------------------------------------------------------------

const mockOtcgs = vi.hoisted(() => ({
  query: {
    group: {
      findMany: vi.fn(),
    },
  },
}));

// getSets imports from '../../../../db' which re-exports from './otcgs/index'.
// We mock both to ensure the mock is picked up regardless of resolution.
vi.mock('../../../db', () => ({
  otcgs: mockOtcgs,
}));

vi.mock('../../../db/otcgs/index', () => ({
  otcgs: mockOtcgs,
}));

import { getSets as _getSets } from './Query/getSets';

const getSets = _getSets as (...args: unknown[]) => Promise<unknown>;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('cards resolvers', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getSets', () => {
    it('should return sets for magic (categoryId=1)', async () => {
      mockOtcgs.query.group.findMany.mockResolvedValue([
        { id: 10, name: 'Alpha' },
        { id: 20, name: 'Beta' },
      ]);

      const result = await getSets(null, { game: 'magic', filters: null }, {});

      expect(result).toEqual([
        { code: '10', name: 'Alpha' },
        { code: '20', name: 'Beta' },
      ]);
    });

    it('should return sets for pokemon (categoryId=2)', async () => {
      mockOtcgs.query.group.findMany.mockResolvedValue([{ id: 30, name: 'Base Set' }]);

      const result = await getSets(null, { game: 'pokemon', filters: null }, {});

      expect(result).toEqual([{ code: '30', name: 'Base Set' }]);
    });

    it('should throw for unsupported game', async () => {
      await expect(getSets(null, { game: 'yugioh', filters: null }, {})).rejects.toThrow('Unsupported game: yugioh');
    });

    it('should pass search filter to query', async () => {
      mockOtcgs.query.group.findMany.mockResolvedValue([]);

      await getSets(null, { game: 'magic', filters: { searchTerm: 'Alpha' } }, {});

      expect(mockOtcgs.query.group.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          columns: { id: true, name: true },
        }),
      );
    });

    it('should return empty array when no sets match', async () => {
      mockOtcgs.query.group.findMany.mockResolvedValue([]);

      const result = await getSets(null, { game: 'magic', filters: { searchTerm: 'nonexistent' } }, {});

      expect(result).toEqual([]);
    });
  });
});
