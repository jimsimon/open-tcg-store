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
  ]) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

let insertChain: ReturnType<typeof chainable>;

// ---------------------------------------------------------------------------
// Mock database
// ---------------------------------------------------------------------------

const mockOtcgs = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
}));

vi.mock('../db', () => ({
  otcgs: mockOtcgs,
  transactionLog: {
    id: 'transaction_log.id',
    organizationId: 'transaction_log.organization_id',
    userId: 'transaction_log.user_id',
    action: 'transaction_log.action',
    resourceType: 'transaction_log.resource_type',
    resourceId: 'transaction_log.resource_id',
    details: 'transaction_log.details',
    createdAt: 'transaction_log.created_at',
  },
}));

vi.mock('../db/otcgs/auth-schema', () => ({
  user: {
    id: 'user.id',
    name: 'user.name',
    email: 'user.email',
  },
}));

import { logTransaction, getTransactionLogs } from './transaction-log-service';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('transaction-log-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // logTransaction
  // -----------------------------------------------------------------------

  describe('logTransaction', () => {
    it('should insert a transaction log entry', async () => {
      insertChain = chainable([]);
      mockOtcgs.insert.mockReturnValue(insertChain);

      await logTransaction({
        organizationId: 'org-1',
        userId: 'user-1',
        action: 'order.created',
        resourceType: 'order',
        resourceId: 42,
        details: { orderNumber: 'ORD-001', totalAmount: 25.5 },
      });

      expect(mockOtcgs.insert).toHaveBeenCalled();
    });

    it('should handle missing optional resourceId', async () => {
      insertChain = chainable([]);
      mockOtcgs.insert.mockReturnValue(insertChain);

      await logTransaction({
        organizationId: 'org-1',
        userId: 'user-1',
        action: 'inventory.item_created',
        resourceType: 'inventory',
        details: { productName: 'Black Lotus' },
      });

      expect(mockOtcgs.insert).toHaveBeenCalled();
    });

    it('should silently handle insert failures', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOtcgs.insert.mockImplementation(() => {
        throw new Error('DB connection failed');
      });

      // Should not throw
      await logTransaction({
        organizationId: 'org-1',
        userId: 'user-1',
        action: 'order.created',
        resourceType: 'order',
        details: {},
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to log transaction:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // getTransactionLogs
  // -----------------------------------------------------------------------

  describe('getTransactionLogs', () => {
    it('should return paginated results with correct shape', async () => {
      // First call: count query
      const countChain = chainable([{ total: 2 }]);
      // Second call: data query
      const dataChain = chainable([
        {
          id: 1,
          action: 'order.created',
          resourceType: 'order',
          resourceId: '1',
          details: '{"orderNumber":"ORD-001"}',
          createdAt: new Date('2026-01-15T10:00:00Z'),
          userName: 'Admin User',
          userEmail: 'admin@test.com',
        },
        {
          id: 2,
          action: 'inventory.stock_added',
          resourceType: 'inventory',
          resourceId: '5',
          details: '{"quantity":10}',
          createdAt: new Date('2026-01-14T09:00:00Z'),
          userName: 'Admin User',
          userEmail: 'admin@test.com',
        },
      ]);

      let selectCallCount = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectCallCount++;
        return selectCallCount === 1 ? countChain : dataChain;
      });

      const result = await getTransactionLogs('org-1', null, { page: 1, pageSize: 25 });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('totalCount', 2);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('pageSize', 25);
      expect(result).toHaveProperty('totalPages', 1);
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toHaveProperty('action', 'order.created');
      expect(result.items[0]).toHaveProperty('userName', 'Admin User');
      expect(result.items[0]).toHaveProperty('userEmail', 'admin@test.com');
    });

    it('should return empty results when no matches', async () => {
      const countChain = chainable([{ total: 0 }]);
      const dataChain = chainable([]);

      let selectCallCount = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectCallCount++;
        return selectCallCount === 1 ? countChain : dataChain;
      });

      const result = await getTransactionLogs('org-1');

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.totalPages).toBe(1);
    });

    it('should use default pagination when not provided', async () => {
      const countChain = chainable([{ total: 0 }]);
      const dataChain = chainable([]);

      let selectCallCount = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectCallCount++;
        return selectCallCount === 1 ? countChain : dataChain;
      });

      const result = await getTransactionLogs('org-1');

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
    });

    it('should apply filters when provided', async () => {
      const countChain = chainable([{ total: 1 }]);
      const dataChain = chainable([
        {
          id: 1,
          action: 'order.created',
          resourceType: 'order',
          resourceId: '1',
          details: '{}',
          createdAt: new Date('2026-03-15T10:00:00Z'),
          userName: 'Admin',
          userEmail: 'admin@test.com',
        },
      ]);

      let selectCallCount = 0;
      mockOtcgs.select.mockImplementation(() => {
        selectCallCount++;
        return selectCallCount === 1 ? countChain : dataChain;
      });

      const result = await getTransactionLogs(
        'org-1',
        { month: 3, year: 2026, resourceType: 'order', searchTerm: 'ORD' },
        { page: 1, pageSize: 10 },
      );

      expect(result.items).toHaveLength(1);
      expect(result.pageSize).toBe(10);
    });
  });
});
