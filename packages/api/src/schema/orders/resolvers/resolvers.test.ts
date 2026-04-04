import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockAssertPermission,
  mockGetOrganizationId,
  mockGetUserId,
  mockSubmitOrder,
  mockCancelOrder,
  mockUpdateOrderStatus,
  mockGetOrders,
} = vi.hoisted(() => ({
  mockAssertPermission: vi.fn(),
  mockGetOrganizationId: vi.fn().mockReturnValue('org-1'),
  mockGetUserId: vi.fn().mockReturnValue('user-1'),
  mockSubmitOrder: vi.fn(),
  mockCancelOrder: vi.fn(),
  mockUpdateOrderStatus: vi.fn(),
  mockGetOrders: vi.fn(),
}));

vi.mock('../../../lib/assert-permission', () => ({
  assertPermission: mockAssertPermission,
  getOrganizationId: mockGetOrganizationId,
  getUserId: mockGetUserId,
}));

vi.mock('../../../services/order-service', () => ({
  submitOrder: mockSubmitOrder,
  cancelOrder: mockCancelOrder,
  updateOrderStatus: mockUpdateOrderStatus,
  getOrders: mockGetOrders,
}));

import { submitOrder as _submitOrder } from './Mutation/submitOrder';
import { cancelOrder as _cancelOrder } from './Mutation/cancelOrder';
import { updateOrderStatus as _updateOrderStatus } from './Mutation/updateOrderStatus';
import { getOrders as _getOrders } from './Query/getOrders';

const submitOrder = _submitOrder as (...args: unknown[]) => Promise<unknown>;
const cancelOrder = _cancelOrder as (...args: unknown[]) => Promise<unknown>;
const updateOrderStatus = _updateOrderStatus as (...args: unknown[]) => Promise<unknown>;
const getOrders = _getOrders as (...args: unknown[]) => Promise<unknown>;

function ctx() {
  return {
    auth: { user: { id: 'user-1' }, session: { activeOrganizationId: 'org-1' } },
    req: { headers: {} },
  };
}

describe('orders resolvers', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('submitOrder', () => {
    it('should get organization and delegate to service', async () => {
      mockSubmitOrder.mockResolvedValue({ order: { id: 1 } });

      const result = await submitOrder(null, { input: { customerName: 'Alice' } }, ctx());

      expect(mockGetOrganizationId).toHaveBeenCalled();
      expect(mockSubmitOrder).toHaveBeenCalledWith('org-1', 'user-1', 'Alice');
      expect(result).toEqual({ order: { id: 1 } });
    });
  });

  describe('cancelOrder', () => {
    it('should check permissions and delegate to service', async () => {
      mockCancelOrder.mockResolvedValue({ order: { id: 1, status: 'cancelled' } });

      await cancelOrder(null, { orderId: 1 }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { order: ['cancel'] });
      expect(mockCancelOrder).toHaveBeenCalledWith(1, 'org-1', 'user-1');
    });
  });

  describe('updateOrderStatus', () => {
    it('should check permissions and delegate to service', async () => {
      mockUpdateOrderStatus.mockResolvedValue({ order: { id: 1, status: 'completed' } });

      await updateOrderStatus(null, { orderId: 1, status: 'completed' }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { order: ['update'] });
      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(1, 'completed', 'org-1', 'user-1');
    });
  });

  describe('getOrders', () => {
    it('should check permissions and delegate with mapped args', async () => {
      mockGetOrders.mockResolvedValue({ orders: [], totalCount: 0 });

      await getOrders(
        null,
        { pagination: { page: 2, pageSize: 10 }, filters: { status: 'open', searchTerm: 'Alice' } },
        ctx(),
      );

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { order: ['read'] });
      expect(mockGetOrders).toHaveBeenCalledWith(
        'org-1',
        { page: 2, pageSize: 10 },
        { status: 'open', searchTerm: 'Alice' },
      );
    });

    it('should pass null pagination and filters when not provided', async () => {
      mockGetOrders.mockResolvedValue({ orders: [], totalCount: 0 });

      await getOrders(null, { pagination: null, filters: null }, ctx());

      expect(mockGetOrders).toHaveBeenCalledWith('org-1', null, null);
    });

    it('should convert null page/pageSize to undefined in pagination', async () => {
      mockGetOrders.mockResolvedValue({ orders: [], totalCount: 0 });

      await getOrders(
        null,
        { pagination: { page: null, pageSize: null }, filters: { status: null, searchTerm: null } },
        ctx(),
      );

      expect(mockGetOrders).toHaveBeenCalledWith(
        'org-1',
        { page: undefined, pageSize: undefined },
        { status: undefined, searchTerm: undefined },
      );
    });
  });
});
