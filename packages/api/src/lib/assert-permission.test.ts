import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock the auth module used by assertPermission.
// ---------------------------------------------------------------------------

const { mockHasPermission } = vi.hoisted(() => ({
  mockHasPermission: vi.fn(),
}));

vi.mock('../auth', () => ({
  auth: {
    api: {
      hasPermission: mockHasPermission,
    },
  },
}));

// Import after mocks.
import { getOrganizationId, getUserId, getOrganizationIdOptional, assertPermission } from './assert-permission';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      user: { id: 'user-1', name: 'Alice' },
      session: { activeOrganizationId: 'org-1' },
    },
    req: { headers: { authorization: 'Bearer token' } },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('assert-permission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // getOrganizationId
  // -----------------------------------------------------------------------
  describe('getOrganizationId', () => {
    it('should return the active organization ID from context', () => {
      const ctx = makeContext();
      expect(getOrganizationId(ctx as never)).toBe('org-1');
    });

    it('should throw when no auth on context', () => {
      const ctx = makeContext({ auth: null });
      expect(() => getOrganizationId(ctx as never)).toThrow('No active organization');
    });

    it('should throw when session has no activeOrganizationId', () => {
      const ctx = makeContext({
        auth: { user: { id: 'user-1' }, session: {} },
      });
      expect(() => getOrganizationId(ctx as never)).toThrow('No active organization');
    });

    it('should throw when activeOrganizationId is empty string', () => {
      const ctx = makeContext({
        auth: { user: { id: 'user-1' }, session: { activeOrganizationId: '' } },
      });
      expect(() => getOrganizationId(ctx as never)).toThrow('No active organization');
    });
  });

  // -----------------------------------------------------------------------
  // getUserId
  // -----------------------------------------------------------------------
  describe('getUserId', () => {
    it('should return the user ID from context', () => {
      const ctx = makeContext();
      expect(getUserId(ctx as never)).toBe('user-1');
    });

    it('should throw when no auth on context', () => {
      const ctx = makeContext({ auth: null });
      expect(() => getUserId(ctx as never)).toThrow('Unauthorized: Authentication required');
    });

    it('should throw when user is missing', () => {
      const ctx = makeContext({
        auth: { session: { activeOrganizationId: 'org-1' } },
      });
      expect(() => getUserId(ctx as never)).toThrow('Unauthorized: Authentication required');
    });

    it('should throw when user has no id', () => {
      const ctx = makeContext({
        auth: { user: { name: 'Alice' }, session: { activeOrganizationId: 'org-1' } },
      });
      expect(() => getUserId(ctx as never)).toThrow('Unauthorized: Authentication required');
    });
  });

  // -----------------------------------------------------------------------
  // getOrganizationIdOptional
  // -----------------------------------------------------------------------
  describe('getOrganizationIdOptional', () => {
    it('should return the active organization ID when present', () => {
      const ctx = makeContext();
      expect(getOrganizationIdOptional(ctx as never)).toBe('org-1');
    });

    it('should return null when no auth on context', () => {
      const ctx = makeContext({ auth: null });
      expect(getOrganizationIdOptional(ctx as never)).toBeNull();
    });

    it('should return null when session has no activeOrganizationId', () => {
      const ctx = makeContext({
        auth: { user: { id: 'user-1' }, session: {} },
      });
      expect(getOrganizationIdOptional(ctx as never)).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // assertPermission
  // -----------------------------------------------------------------------
  describe('assertPermission', () => {
    it('should resolve when user has required permissions', async () => {
      mockHasPermission.mockResolvedValue({ success: true });
      const ctx = makeContext();

      await expect(assertPermission(ctx as never, { inventory: ['read'] })).resolves.toBeUndefined();
      expect(mockHasPermission).toHaveBeenCalledWith({
        headers: ctx.req.headers,
        body: { permissions: { inventory: ['read'] } },
      });
    });

    it('should throw when user is not authenticated', async () => {
      const ctx = makeContext({ auth: null });

      await expect(assertPermission(ctx as never, { inventory: ['read'] })).rejects.toThrow('Unauthorized');
    });

    it('should throw when user has no user object', async () => {
      const ctx = makeContext({
        auth: { session: { activeOrganizationId: 'org-1' } },
      });

      await expect(assertPermission(ctx as never, { inventory: ['read'] })).rejects.toThrow('Unauthorized');
    });

    it('should throw "Insufficient permissions" when hasPermission returns false', async () => {
      mockHasPermission.mockResolvedValue({ success: false });
      const ctx = makeContext();

      await expect(assertPermission(ctx as never, { inventory: ['delete'] })).rejects.toThrow(
        'Unauthorized: Insufficient permissions',
      );
    });

    it('should re-throw Unauthorized errors from hasPermission', async () => {
      mockHasPermission.mockRejectedValue(new Error('Unauthorized: Token expired'));
      const ctx = makeContext();

      await expect(assertPermission(ctx as never, { inventory: ['read'] })).rejects.toThrow(
        'Unauthorized: Token expired',
      );
    });

    it('should wrap non-Unauthorized errors from hasPermission', async () => {
      mockHasPermission.mockRejectedValue(new Error('Network error'));
      const ctx = makeContext();

      await expect(assertPermission(ctx as never, { inventory: ['read'] })).rejects.toThrow(
        'Unauthorized: No active organization or insufficient permissions',
      );
    });
  });
});
