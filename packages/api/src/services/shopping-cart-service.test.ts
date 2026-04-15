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

let selectChain: ReturnType<typeof chainable>;
let insertChain: ReturnType<typeof chainable>;

// ---------------------------------------------------------------------------
// Mock database
// ---------------------------------------------------------------------------

const mockOtcgs = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  query: {
    cart: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../db', () => ({
  otcgs: mockOtcgs,
  cart: {
    id: 'cart.id',
    organizationId: 'cart.organization_id',
    userId: 'cart.user_id',
  },
  inventoryItemStock: {
    id: 'inventory_item_stock.id',
    inventoryItemId: 'inventory_item_stock.inventory_item_id',
    quantity: 'inventory_item_stock.quantity',
    deletedAt: 'inventory_item_stock.deleted_at',
  },
}));

// Mock drizzle-orm operators
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
    inArray: vi.fn((...args: unknown[]) => ({ type: 'inArray', args })),
    sql: sqlFn,
    isNull: vi.fn((...args: unknown[]) => ({ type: 'isNull', args })),
  };
});

// Mock the generated types (CartItemOutput is used as a type only, so an empty mock suffices)
vi.mock('../schema/types.generated', () => ({}));

// Import after mocks
import { getOrCreateShoppingCart, mapToGraphqlShoppingCart } from './shopping-cart-service';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('shopping-cart-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectChain = chainable([]);
    insertChain = chainable([]);
    mockOtcgs.select.mockImplementation(() => selectChain);
    mockOtcgs.insert.mockImplementation(() => insertChain);
  });

  // -----------------------------------------------------------------------
  // getOrCreateShoppingCart
  // -----------------------------------------------------------------------
  describe('getOrCreateShoppingCart', () => {
    it('should return existing cart when found', async () => {
      const existingCart = {
        id: 1,
        organizationId: 'org-1',
        userId: 'user-1',
        cartItems: [
          {
            id: 10,
            inventoryItemId: 100,
            quantity: 2,
            inventoryItem: {
              id: 100,
              productId: 200,
              condition: 'NM',
              price: 5.0,
              product: { id: 200, name: 'Card A' },
            },
          },
        ],
      };
      mockOtcgs.query.cart.findFirst.mockResolvedValue(existingCart);

      const result = await getOrCreateShoppingCart('org-1', 'user-1');

      expect(result).toBe(existingCart);
      expect(result.cartItems).toHaveLength(1);
      expect(mockOtcgs.insert).not.toHaveBeenCalled();
    });

    it('should create a new cart when none exists', async () => {
      mockOtcgs.query.cart.findFirst.mockResolvedValue(null);

      const newCart = { id: 2, organizationId: 'org-1', userId: 'user-1' };
      insertChain = chainable([newCart]);
      mockOtcgs.insert.mockImplementation(() => insertChain);

      const result = await getOrCreateShoppingCart('org-1', 'user-1');

      expect(result.id).toBe(2);
      expect(result.organizationId).toBe('org-1');
      expect(result.userId).toBe('user-1');
      expect(result.cartItems).toEqual([]);
      expect(mockOtcgs.insert).toHaveBeenCalled();
    });

    it('should return undefined when result is undefined (no cart found and insert returned undefined)', async () => {
      mockOtcgs.query.cart.findFirst.mockResolvedValue(undefined);

      const newCart = { id: 3, organizationId: 'org-1', userId: 'user-2' };
      insertChain = chainable([newCart]);
      mockOtcgs.insert.mockImplementation(() => insertChain);

      const result = await getOrCreateShoppingCart('org-1', 'user-2');

      expect(result).toBeDefined();
      expect(result.cartItems).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // mapToGraphqlShoppingCart
  // -----------------------------------------------------------------------
  describe('mapToGraphqlShoppingCart', () => {
    it('should map cart items to GraphQL output with stock totals', async () => {
      const cart = {
        organizationId: 'org-1',
        cartItems: [
          {
            id: 10,
            inventoryItemId: 100,
            quantity: 2,
            inventoryItem: {
              id: 100,
              productId: 200,
              condition: 'NM',
              price: 5.0,
              product: { id: 200, name: 'Card A' },
            },
          },
        ],
      };

      // Batched stock query returns grouped totals per inventoryItemId
      const stockChain = chainable([{ inventoryItemId: 100, total: 8 }]);
      mockOtcgs.select.mockImplementation(() => stockChain);

      const result = await mapToGraphqlShoppingCart(cart as never);

      expect(result.organizationId).toBe('org-1');
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        inventoryItemId: 100,
        productId: 200,
        productName: 'Card A',
        condition: 'NM',
        quantity: 2,
        unitPrice: 5.0,
        maxAvailable: 8,
      });
    });

    it('should filter out cart items without inventory product', async () => {
      const cart = {
        organizationId: 'org-1',
        cartItems: [
          {
            id: 10,
            inventoryItemId: 100,
            quantity: 1,
            inventoryItem: null,
          },
          {
            id: 11,
            inventoryItemId: 101,
            quantity: 1,
            inventoryItem: {
              id: 101,
              productId: 201,
              condition: 'LP',
              price: 3.0,
              product: null,
            },
          },
        ],
      };

      const result = await mapToGraphqlShoppingCart(cart as never);

      expect(result.items).toHaveLength(0);
    });

    it('should return empty items for empty cart', async () => {
      const cart = {
        organizationId: 'org-1',
        cartItems: [],
      };

      const result = await mapToGraphqlShoppingCart(cart as never);

      expect(result.items).toEqual([]);
    });

    it('should handle multiple cart items with different stock levels', async () => {
      const cart = {
        organizationId: 'org-1',
        cartItems: [
          {
            id: 10,
            inventoryItemId: 100,
            quantity: 1,
            inventoryItem: {
              id: 100,
              productId: 200,
              condition: 'NM',
              price: 10.0,
              product: { id: 200, name: 'Card A' },
            },
          },
          {
            id: 11,
            inventoryItemId: 101,
            quantity: 3,
            inventoryItem: {
              id: 101,
              productId: 201,
              condition: 'LP',
              price: 7.0,
              product: { id: 201, name: 'Card B' },
            },
          },
        ],
      };

      // Batched stock query returns all totals in one result
      const stockChain = chainable([
        { inventoryItemId: 100, total: 5 },
        { inventoryItemId: 101, total: 12 },
      ]);
      mockOtcgs.select.mockImplementation(() => stockChain);

      const result = await mapToGraphqlShoppingCart(cart as never);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].maxAvailable).toBe(5);
      expect(result.items[1].maxAvailable).toBe(12);
    });

    it('should default maxAvailable to 0 when stock query returns no result', async () => {
      const cart = {
        organizationId: 'org-1',
        cartItems: [
          {
            id: 10,
            inventoryItemId: 100,
            quantity: 1,
            inventoryItem: {
              id: 100,
              productId: 200,
              condition: 'NM',
              price: 5.0,
              product: { id: 200, name: 'Card A' },
            },
          },
        ],
      };

      // Batched stock query returns empty (no stock entries found)
      const stockChain = chainable([]);
      mockOtcgs.select.mockImplementation(() => stockChain);

      const result = await mapToGraphqlShoppingCart(cart as never);

      expect(result.items[0].maxAvailable).toBe(0);
    });
  });
});
