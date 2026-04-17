import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const {
  mockGetOrganizationId,
  mockGetUserId,
  mockGetOrCreateShoppingCart,
  mockMapToGraphqlShoppingCart,
  mockAddItemToCart,
  mockRemoveItemFromCart,
  mockUpdateCartItemQuantity,
  mockClearAllCartItems,
} = vi.hoisted(() => ({
  mockGetOrganizationId: vi.fn().mockReturnValue('org-1'),
  mockGetUserId: vi.fn().mockReturnValue('user-1'),
  mockGetOrCreateShoppingCart: vi.fn(),
  mockMapToGraphqlShoppingCart: vi.fn(),
  mockAddItemToCart: vi.fn(),
  mockRemoveItemFromCart: vi.fn(),
  mockUpdateCartItemQuantity: vi.fn(),
  mockClearAllCartItems: vi.fn(),
}));

vi.mock('../../../lib/assert-permission', () => ({
  getOrganizationId: mockGetOrganizationId,
  getUserId: mockGetUserId,
}));

vi.mock('../../../services/shopping-cart-service', () => ({
  getOrCreateShoppingCart: mockGetOrCreateShoppingCart,
  mapToGraphqlShoppingCart: mockMapToGraphqlShoppingCart,
  addItemToCart: mockAddItemToCart,
  removeItemFromCart: mockRemoveItemFromCart,
  updateCartItemQuantity: mockUpdateCartItemQuantity,
  clearAllCartItems: mockClearAllCartItems,
}));

import { getShoppingCart as _getShoppingCart } from './Query/getShoppingCart';
import { addToCart as _addToCart } from './Mutation/addToCart';
import { removeFromCart as _removeFromCart } from './Mutation/removeFromCart';
import { updateItemInCart as _updateItemInCart } from './Mutation/updateItemInCart';
import { clearCart as _clearCart } from './Mutation/clearCart';
import { checkoutWithCart as _checkoutWithCart } from './Mutation/checkoutWithCart';

const getShoppingCart = _getShoppingCart as (...args: unknown[]) => Promise<unknown>;
const addToCart = _addToCart as (...args: unknown[]) => Promise<unknown>;
const removeFromCart = _removeFromCart as (...args: unknown[]) => Promise<unknown>;
const updateItemInCart = _updateItemInCart as (...args: unknown[]) => Promise<unknown>;
const clearCart = _clearCart as (...args: unknown[]) => Promise<unknown>;
const checkoutWithCart = _checkoutWithCart as (...args: unknown[]) => Promise<unknown>;

function ctx() {
  return {
    auth: { user: { id: 'user-1' }, session: { activeOrganizationId: 'org-1' } },
    req: { headers: {} },
  };
}

describe('shopping resolvers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getShoppingCart', () => {
    it('should get or create cart and map to graphql', async () => {
      const mockCart = { id: 1, cartItems: [] };
      mockGetOrCreateShoppingCart.mockResolvedValue(mockCart);
      mockMapToGraphqlShoppingCart.mockResolvedValue({ organizationId: 'org-1', items: [] });

      const result = await getShoppingCart(null, {}, ctx());

      expect(mockGetOrganizationId).toHaveBeenCalled();
      expect(mockGetOrCreateShoppingCart).toHaveBeenCalledWith('org-1', 'user-1');
      expect(mockMapToGraphqlShoppingCart).toHaveBeenCalledWith(mockCart);
      expect(result).toEqual({ organizationId: 'org-1', items: [] });
    });
  });

  describe('addToCart', () => {
    it('should delegate to addItemToCart service', async () => {
      mockAddItemToCart.mockResolvedValue({ items: [{ productName: 'Card' }] });

      const result = await addToCart(null, { cartItem: { inventoryItemId: 100, quantity: 2 } }, ctx());

      expect(mockAddItemToCart).toHaveBeenCalledWith('org-1', 'user-1', 100, 2);
      expect(result).toEqual({ items: [{ productName: 'Card' }] });
    });
  });

  describe('removeFromCart', () => {
    it('should delegate to removeItemFromCart service', async () => {
      mockRemoveItemFromCart.mockResolvedValue({ items: [] });

      const result = await removeFromCart(null, { cartItem: { inventoryItemId: 100 } }, ctx());

      expect(mockRemoveItemFromCart).toHaveBeenCalledWith('org-1', 'user-1', 100);
      expect(result).toEqual({ items: [] });
    });
  });

  describe('updateItemInCart', () => {
    it('should delegate to updateCartItemQuantity service', async () => {
      mockUpdateCartItemQuantity.mockResolvedValue({ items: [{ quantity: 3 }] });

      const result = await updateItemInCart(null, { cartItem: { inventoryItemId: 100, quantity: 3 } }, ctx());

      expect(mockUpdateCartItemQuantity).toHaveBeenCalledWith('org-1', 'user-1', 100, 3);
      expect(result).toEqual({ items: [{ quantity: 3 }] });
    });
  });

  describe('clearCart', () => {
    it('should delegate to clearAllCartItems service', async () => {
      mockClearAllCartItems.mockResolvedValue({ items: [] });

      const result = await clearCart(null, {}, ctx());

      expect(mockClearAllCartItems).toHaveBeenCalledWith('org-1', 'user-1');
      expect(result).toEqual({ items: [] });
    });
  });

  describe('checkoutWithCart', () => {
    it('should return the mapped cart (placeholder)', async () => {
      const mockCart = { id: 1, cartItems: [] };
      mockGetOrCreateShoppingCart.mockResolvedValue(mockCart);
      mockMapToGraphqlShoppingCart.mockResolvedValue({ items: [] });

      const result = await checkoutWithCart(null, {}, ctx());

      expect(result).toEqual({ items: [] });
    });
  });
});
