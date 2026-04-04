import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetOrganizationId, mockGetOrCreateShoppingCart, mockMapToGraphqlShoppingCart } = vi.hoisted(() => ({
  mockGetOrganizationId: vi.fn().mockReturnValue('org-1'),
  mockGetOrCreateShoppingCart: vi.fn(),
  mockMapToGraphqlShoppingCart: vi.fn(),
}));

vi.mock('../../../lib/assert-permission', () => ({
  getOrganizationId: mockGetOrganizationId,
}));

vi.mock('../../../services/shopping-cart-service', () => ({
  getOrCreateShoppingCart: mockGetOrCreateShoppingCart,
  mapToGraphqlShoppingCart: mockMapToGraphqlShoppingCart,
}));

// Mock DB + drizzle for resolvers that do inline DB operations
const mockOtcgs = vi.hoisted(() => ({
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  query: { cart: { findFirst: vi.fn() } },
}));

vi.mock('../../../db', () => ({
  otcgs: mockOtcgs,
  cartItem: {
    id: 'cart_item.id',
    cartId: 'cart_item.cart_id',
    inventoryItemId: 'cart_item.inventory_item_id',
    quantity: 'cart_item.quantity',
  },
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    sql: vi.fn((..._args: unknown[]) => ({ type: 'sql' })),
    eq: vi.fn((...args: unknown[]) => ({ type: 'eq', args })),
    inArray: vi.fn((...args: unknown[]) => ({ type: 'inArray', args })),
  };
});

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

function chainableMock(rows: unknown[] = []) {
  const chain = Object.assign(Promise.resolve(rows), {} as Record<string, unknown>);
  for (const method of [
    'select',
    'from',
    'where',
    'values',
    'set',
    'returning',
    'onConflictDoUpdate',
    'delete',
    'insert',
    'update',
  ]) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  return chain;
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
    it('should find cart, insert item, and return updated cart', async () => {
      mockOtcgs.query.cart.findFirst.mockResolvedValue({ id: 5 });
      const insertChain = chainableMock([]);
      mockOtcgs.insert.mockReturnValue(insertChain);

      const mockCart = { id: 5, cartItems: [{ id: 1 }] };
      mockGetOrCreateShoppingCart.mockResolvedValue(mockCart);
      mockMapToGraphqlShoppingCart.mockResolvedValue({ items: [{ productName: 'Card' }] });

      const result = await addToCart(null, { cartItem: { inventoryItemId: 100, quantity: 2 } }, ctx());

      expect(mockOtcgs.insert).toHaveBeenCalled();
      expect(result).toEqual({ items: [{ productName: 'Card' }] });
    });

    it('should throw when cart not found', async () => {
      mockOtcgs.query.cart.findFirst.mockResolvedValue(null);

      await expect(addToCart(null, { cartItem: { inventoryItemId: 100, quantity: 1 } }, ctx())).rejects.toThrow(
        'Unable to find cart for user',
      );
    });
  });

  describe('removeFromCart', () => {
    it('should skip delete when no matching items found', async () => {
      mockGetOrCreateShoppingCart
        .mockResolvedValueOnce({
          cartItems: [{ id: 10, inventoryItemId: 200 }],
        })
        .mockResolvedValueOnce({ cartItems: [{ id: 10, inventoryItemId: 200 }] });

      mockMapToGraphqlShoppingCart.mockResolvedValue({ items: [{ inventoryItemId: 200 }] });

      await removeFromCart(null, { cartItem: { inventoryItemId: 999 } }, ctx());

      // delete should NOT be called since no items matched
      expect(mockOtcgs.delete).not.toHaveBeenCalled();
    });

    it('should find matching items and delete them', async () => {
      mockGetOrCreateShoppingCart
        .mockResolvedValueOnce({
          cartItems: [
            { id: 10, inventoryItemId: 100 },
            { id: 11, inventoryItemId: 200 },
          ],
        })
        .mockResolvedValueOnce({ cartItems: [{ id: 11, inventoryItemId: 200 }] });

      const deleteChain = chainableMock([]);
      mockOtcgs.delete.mockReturnValue(deleteChain);
      mockMapToGraphqlShoppingCart.mockResolvedValue({ items: [] });

      await removeFromCart(null, { cartItem: { inventoryItemId: 100 } }, ctx());

      expect(mockOtcgs.delete).toHaveBeenCalled();
    });
  });

  describe('updateItemInCart', () => {
    it('should skip update when item not found in cart', async () => {
      mockGetOrCreateShoppingCart.mockResolvedValue({
        cartItems: [{ id: 10, inventoryItemId: 100, quantity: 1 }],
      });
      mockMapToGraphqlShoppingCart.mockResolvedValue({ items: [{ quantity: 1 }] });

      await updateItemInCart(null, { cartItem: { inventoryItemId: 999, quantity: 5 } }, ctx());

      // update should NOT be called since item wasn't found
      expect(mockOtcgs.update).not.toHaveBeenCalled();
    });

    it('should find item in cart and update quantity', async () => {
      mockGetOrCreateShoppingCart.mockResolvedValue({
        cartItems: [{ id: 10, inventoryItemId: 100, quantity: 1 }],
      });
      const updateChain = chainableMock([]);
      mockOtcgs.update.mockReturnValue(updateChain);
      mockMapToGraphqlShoppingCart.mockResolvedValue({ items: [{ quantity: 3 }] });

      const result = await updateItemInCart(null, { cartItem: { inventoryItemId: 100, quantity: 3 } }, ctx());

      expect(mockOtcgs.update).toHaveBeenCalled();
      expect(result).toEqual({ items: [{ quantity: 3 }] });
    });
  });

  describe('clearCart', () => {
    it('should delete all cart items and return empty cart', async () => {
      mockGetOrCreateShoppingCart.mockResolvedValue({
        cartItems: [{ id: 10 }, { id: 11 }],
      });
      const deleteChain = chainableMock([]);
      mockOtcgs.delete.mockReturnValue(deleteChain);

      const result = await clearCart(null, {}, ctx());

      expect(mockOtcgs.delete).toHaveBeenCalled();
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
