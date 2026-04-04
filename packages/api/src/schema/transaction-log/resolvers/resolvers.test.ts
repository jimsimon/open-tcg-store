import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAssertPermission, mockGetOrganizationId, mockGetTransactionLogs } = vi.hoisted(() => ({
  mockAssertPermission: vi.fn(),
  mockGetOrganizationId: vi.fn().mockReturnValue('org-1'),
  mockGetTransactionLogs: vi.fn(),
}));

vi.mock('../../../lib/assert-permission', () => ({
  assertPermission: mockAssertPermission,
  getOrganizationId: mockGetOrganizationId,
}));

vi.mock('../../../services/transaction-log-service', () => ({
  getTransactionLogs: mockGetTransactionLogs,
}));

import { getTransactionLogs as _getTransactionLogs } from './Query/getTransactionLogs';

const getTransactionLogs = _getTransactionLogs as (...args: unknown[]) => Promise<unknown>;

function ctx() {
  return {
    auth: { user: { id: 'user-1' }, session: { activeOrganizationId: 'org-1' } },
    req: { headers: {} },
  };
}

describe('transaction-log resolvers', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getTransactionLogs', () => {
    it('should check permissions and delegate with mapped args', async () => {
      mockGetTransactionLogs.mockResolvedValue({ items: [], totalCount: 0 });

      await getTransactionLogs(
        null,
        {
          pagination: { page: 2, pageSize: 10 },
          filters: { month: 3, year: 2026, searchTerm: 'order', resourceType: 'order', action: 'order.created' },
        },
        ctx(),
      );

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { transactionLog: ['read'] });
      expect(mockGetTransactionLogs).toHaveBeenCalledWith(
        'org-1',
        { month: 3, year: 2026, searchTerm: 'order', resourceType: 'order', action: 'order.created' },
        { page: 2, pageSize: 10 },
      );
    });

    it('should pass null pagination and filters when not provided', async () => {
      mockGetTransactionLogs.mockResolvedValue({ items: [], totalCount: 0 });

      await getTransactionLogs(null, { pagination: null, filters: null }, ctx());

      expect(mockGetTransactionLogs).toHaveBeenCalledWith('org-1', null, null);
    });

    it('should convert null page/pageSize to undefined in pagination', async () => {
      mockGetTransactionLogs.mockResolvedValue({ items: [], totalCount: 0 });

      await getTransactionLogs(
        null,
        {
          pagination: { page: null, pageSize: null },
          filters: { month: null, year: null, searchTerm: null, action: null, resourceType: null },
        },
        ctx(),
      );

      expect(mockGetTransactionLogs).toHaveBeenCalledWith(
        'org-1',
        { month: undefined, year: undefined, searchTerm: undefined, action: undefined, resourceType: undefined },
        { page: undefined, pageSize: undefined },
      );
    });

    it('should return service result directly', async () => {
      const mockResult = {
        items: [{ id: 1, action: 'order.created' }],
        totalCount: 1,
        page: 1,
        pageSize: 25,
        totalPages: 1,
      };
      mockGetTransactionLogs.mockResolvedValue(mockResult);

      const result = await getTransactionLogs(null, { pagination: null, filters: null }, ctx());

      expect(result).toEqual(mockResult);
    });
  });
});
