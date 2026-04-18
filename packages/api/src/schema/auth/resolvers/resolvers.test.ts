import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = vi.hoisted(() => ({
  api: {
    hasPermission: vi.fn(),
  },
}));

vi.mock('../../../auth', () => ({ auth: mockAuth }));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { userPermissions as _userPermissions } from './Query/userPermissions';

const userPermissions = _userPermissions as (...args: unknown[]) => Promise<unknown>;

function ctx(headers: Record<string, string> = {}) {
  return {
    auth: { user: { id: 'user-1' }, session: { activeOrganizationId: 'org-1' } },
    req: { headers: { cookie: 'session=abc', ...headers } },
    res: {},
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('userPermissions resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all true for a user with full permissions', async () => {
    mockAuth.api.hasPermission.mockResolvedValue({ success: true });

    const result = await userPermissions(null, {}, ctx());

    expect(result).toEqual({
      canManageInventory: true,
      canManageLots: true,
      canViewDashboard: true,
      canAccessSettings: true,
      canManageStoreLocations: true,
      canManageUsers: true,
      canViewTransactionLog: true,
      canManageEvents: true,
    });
    expect(mockAuth.api.hasPermission).toHaveBeenCalledTimes(7);
  });

  it('returns only inventory/dashboard false for member role (no transactionLog/settings/locations/users)', async () => {
    mockAuth.api.hasPermission.mockImplementation(({ body }: { body: { permissions: Record<string, string[]> } }) => {
      const resource = Object.keys(body.permissions)[0];
      // member has inventory + order only
      return Promise.resolve({ success: resource === 'inventory' });
    });

    const result = (await userPermissions(null, {}, ctx())) as Record<string, boolean>;

    expect(result.canManageInventory).toBe(true);
    expect(result.canViewTransactionLog).toBe(false);
    expect(result.canViewDashboard).toBe(false); // derived from canViewTransactionLog
    expect(result.canAccessSettings).toBe(false);
    expect(result.canManageStoreLocations).toBe(false);
    expect(result.canManageUsers).toBe(false);
  });

  it('runs all checks in parallel (all 5 calls are made)', async () => {
    mockAuth.api.hasPermission.mockResolvedValue({ success: false });

    await userPermissions(null, {}, ctx());

    const calledResources = (
      mockAuth.api.hasPermission.mock.calls as [{ body: { permissions: Record<string, string[]> } }][]
    ).map((call) => Object.keys(call[0].body.permissions)[0]);
    expect(calledResources).toContain('inventory');
    expect(calledResources).toContain('lot');
    expect(calledResources).toContain('transactionLog');
    expect(calledResources).toContain('companySettings');
    expect(calledResources).toContain('storeLocations');
    expect(calledResources).toContain('userManagement');
    expect(calledResources).toContain('event');
    expect(mockAuth.api.hasPermission).toHaveBeenCalledTimes(7);
  });

  it('returns false for a permission when hasPermission throws', async () => {
    mockAuth.api.hasPermission.mockImplementation(({ body }: { body: { permissions: Record<string, string[]> } }) => {
      const resource = Object.keys(body.permissions)[0];
      if (resource === 'companySettings') return Promise.reject(new Error('Auth server error'));
      return Promise.resolve({ success: true });
    });

    const result = (await userPermissions(null, {}, ctx())) as Record<string, boolean>;

    expect(result.canAccessSettings).toBe(false);
    expect(result.canManageInventory).toBe(true);
  });

  it('forwards request headers to each hasPermission call', async () => {
    mockAuth.api.hasPermission.mockResolvedValue({ success: true });

    await userPermissions(null, {}, ctx({ cookie: 'session=xyz123' }));

    for (const call of mockAuth.api.hasPermission.mock.calls) {
      expect((call as [{ headers: Record<string, string> }])[0].headers).toMatchObject({
        cookie: 'session=xyz123',
      });
    }
  });
});
