import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const {
  mockAssertPermission,
  mockGetOrganizationId,
  mockGetUserId,
  mockAddInventoryItem,
  mockUpdateInventoryItem,
  mockDeleteInventoryItem,
  mockAddStock,
  mockUpdateStock,
  mockDeleteStock,
  mockBulkUpdateStock,
  mockBulkDeleteStock,
  mockGetInventoryItems,
  mockGetInventoryItemById,
  mockGetInventoryItemDetails,
  mockSearchProducts,
} = vi.hoisted(() => ({
  mockAssertPermission: vi.fn(),
  mockGetOrganizationId: vi.fn().mockReturnValue('org-1'),
  mockGetUserId: vi.fn().mockReturnValue('user-1'),
  mockAddInventoryItem: vi.fn(),
  mockUpdateInventoryItem: vi.fn(),
  mockDeleteInventoryItem: vi.fn(),
  mockAddStock: vi.fn(),
  mockUpdateStock: vi.fn(),
  mockDeleteStock: vi.fn(),
  mockBulkUpdateStock: vi.fn(),
  mockBulkDeleteStock: vi.fn(),
  mockGetInventoryItems: vi.fn(),
  mockGetInventoryItemById: vi.fn(),
  mockGetInventoryItemDetails: vi.fn(),
  mockSearchProducts: vi.fn(),
}));

vi.mock('../../../lib/assert-permission', () => ({
  assertPermission: mockAssertPermission,
  getOrganizationId: mockGetOrganizationId,
  getUserId: mockGetUserId,
}));

vi.mock('../../../services/inventory-service', () => ({
  addInventoryItem: mockAddInventoryItem,
  updateInventoryItem: mockUpdateInventoryItem,
  deleteInventoryItem: mockDeleteInventoryItem,
  addStock: mockAddStock,
  updateStock: mockUpdateStock,
  deleteStock: mockDeleteStock,
  bulkUpdateStock: mockBulkUpdateStock,
  bulkDeleteStock: mockBulkDeleteStock,
  getInventoryItems: mockGetInventoryItems,
  getInventoryItemById: mockGetInventoryItemById,
  getInventoryItemDetails: mockGetInventoryItemDetails,
  searchProducts: mockSearchProducts,
}));

// Import resolvers after mocks
import { addInventoryItem as _addInventoryItem } from './Mutation/addInventoryItem';
import { updateInventoryItem as _updateInventoryItem } from './Mutation/updateInventoryItem';
import { deleteInventoryItem as _deleteInventoryItem } from './Mutation/deleteInventoryItem';
import { addStock as _addStock } from './Mutation/addStock';
import { updateStock as _updateStock } from './Mutation/updateStock';
import { deleteStock as _deleteStock } from './Mutation/deleteStock';
import { bulkUpdateStock as _bulkUpdateStock } from './Mutation/bulkUpdateStock';
import { bulkDeleteStock as _bulkDeleteStock } from './Mutation/bulkDeleteStock';
import { bulkDeleteInventory as _bulkDeleteInventory } from './Mutation/bulkDeleteInventory';
import { bulkUpdateInventory as _bulkUpdateInventory } from './Mutation/bulkUpdateInventory';
import { getInventory as _getInventory } from './Query/getInventory';
import { getInventoryItem as _getInventoryItem } from './Query/getInventoryItem';
import { getInventoryItemDetails as _getInventoryItemDetails } from './Query/getInventoryItemDetails';
import { searchProducts as _searchProducts } from './Query/searchProducts';

const addInventoryItem = _addInventoryItem as (...args: unknown[]) => Promise<unknown>;
const updateInventoryItem = _updateInventoryItem as (...args: unknown[]) => Promise<unknown>;
const deleteInventoryItem = _deleteInventoryItem as (...args: unknown[]) => Promise<unknown>;
const addStock = _addStock as (...args: unknown[]) => Promise<unknown>;
const updateStock = _updateStock as (...args: unknown[]) => Promise<unknown>;
const deleteStock = _deleteStock as (...args: unknown[]) => Promise<unknown>;
const bulkUpdateStock = _bulkUpdateStock as (...args: unknown[]) => Promise<unknown>;
const bulkDeleteStock = _bulkDeleteStock as (...args: unknown[]) => Promise<unknown>;
const getInventory = _getInventory as (...args: unknown[]) => Promise<unknown>;
const getInventoryItem = _getInventoryItem as (...args: unknown[]) => Promise<unknown>;
const getInventoryItemDetails = _getInventoryItemDetails as (...args: unknown[]) => Promise<unknown>;
const searchProducts = _searchProducts as (...args: unknown[]) => Promise<unknown>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ctx() {
  return { auth: { user: { id: 'user-1' }, session: { activeOrganizationId: 'org-1' } }, req: { headers: {} } };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('inventory resolvers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mutations
  describe('addInventoryItem', () => {
    it('should check permissions and delegate to service', async () => {
      const input = { productId: 1, condition: 'NM', quantity: 2, price: 5 };
      mockAddInventoryItem.mockResolvedValue({ id: 42 });

      const result = await addInventoryItem(null, { input }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { inventory: ['create'] });
      expect(mockAddInventoryItem).toHaveBeenCalledWith('org-1', input, 'user-1');
      expect(result).toEqual({ id: 42 });
    });
  });

  describe('updateInventoryItem', () => {
    it('should check permissions and delegate to service', async () => {
      const input = { id: 1, price: 9.99 };
      mockUpdateInventoryItem.mockResolvedValue({ id: 1 });

      await updateInventoryItem(null, { input }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { inventory: ['update'] });
      expect(mockUpdateInventoryItem).toHaveBeenCalledWith(input, 'user-1', 'org-1');
    });
  });

  describe('deleteInventoryItem', () => {
    it('should check permissions and delegate to service', async () => {
      mockDeleteInventoryItem.mockResolvedValue(true);

      await deleteInventoryItem(null, { id: 1 }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { inventory: ['delete'] });
      expect(mockDeleteInventoryItem).toHaveBeenCalledWith(1, 'org-1', 'user-1');
    });
  });

  describe('addStock', () => {
    it('should check permissions and delegate to service', async () => {
      const input = { inventoryItemId: 1, quantity: 5, costBasis: 3 };
      mockAddStock.mockResolvedValue({ id: 100 });

      await addStock(null, { input }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { inventory: ['create'] });
      expect(mockAddStock).toHaveBeenCalledWith(input, 'user-1', 'org-1');
    });
  });

  describe('updateStock', () => {
    it('should check permissions and delegate to service', async () => {
      const input = { id: 10, quantity: 8 };
      mockUpdateStock.mockResolvedValue({ id: 10 });

      await updateStock(null, { input }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { inventory: ['update'] });
      expect(mockUpdateStock).toHaveBeenCalledWith(input, 'user-1', 'org-1');
    });
  });

  describe('deleteStock', () => {
    it('should check permissions and delegate to service', async () => {
      mockDeleteStock.mockResolvedValue(true);

      await deleteStock(null, { id: 10 }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { inventory: ['delete'] });
      expect(mockDeleteStock).toHaveBeenCalledWith(10, 'org-1', 'user-1');
    });
  });

  describe('bulkUpdateStock', () => {
    it('should check permissions and delegate to service', async () => {
      const input = { ids: [10, 11], quantity: 5 };
      mockBulkUpdateStock.mockResolvedValue([{ id: 10 }, { id: 11 }]);

      await bulkUpdateStock(null, { input }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { inventory: ['update'] });
      expect(mockBulkUpdateStock).toHaveBeenCalledWith(input, 'user-1', 'org-1');
    });
  });

  describe('bulkDeleteStock', () => {
    it('should check permissions and delegate to service', async () => {
      const input = { ids: [10, 11] };
      mockBulkDeleteStock.mockResolvedValue(true);

      await bulkDeleteStock(null, { input }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { inventory: ['delete'] });
      expect(mockBulkDeleteStock).toHaveBeenCalledWith([10, 11], 'org-1', 'user-1');
    });
  });

  describe('bulkDeleteInventory (deprecated)', () => {
    it('should throw deprecation error', async () => {
      await expect(_bulkDeleteInventory()).rejects.toThrow('bulkDeleteInventory has been replaced by bulkDeleteStock');
    });
  });

  describe('bulkUpdateInventory (deprecated)', () => {
    it('should throw deprecation error', async () => {
      await expect(_bulkUpdateInventory()).rejects.toThrow('bulkUpdateInventory has been replaced by bulkUpdateStock');
    });
  });

  // Queries
  describe('getInventory', () => {
    it('should check permissions and delegate to service', async () => {
      mockGetInventoryItems.mockResolvedValue({ items: [], totalCount: 0 });

      await getInventory(null, { filters: null, pagination: null }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { inventory: ['read'] });
      expect(mockGetInventoryItems).toHaveBeenCalledWith('org-1', null, null);
    });
  });

  describe('getInventoryItem', () => {
    it('should check permissions and delegate to service', async () => {
      mockGetInventoryItemById.mockResolvedValue({ id: 1 });

      await getInventoryItem(null, { id: 1 }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { inventory: ['read'] });
      expect(mockGetInventoryItemById).toHaveBeenCalledWith(1, 'org-1');
    });
  });

  describe('getInventoryItemDetails', () => {
    it('should check permissions and delegate to service', async () => {
      mockGetInventoryItemDetails.mockResolvedValue({ item: {}, stocks: [] });

      await getInventoryItemDetails(null, { inventoryItemId: 1, pagination: null }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { inventory: ['read'] });
      expect(mockGetInventoryItemDetails).toHaveBeenCalledWith('org-1', 1, null);
    });
  });

  describe('searchProducts', () => {
    it('should check permissions and delegate to service', async () => {
      mockSearchProducts.mockResolvedValue([]);

      await searchProducts(null, { searchTerm: 'Charizard', game: 'pokemon' }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { inventory: ['read'] });
      expect(mockSearchProducts).toHaveBeenCalledWith('Charizard', 'pokemon', undefined, undefined);
    });
  });
});
