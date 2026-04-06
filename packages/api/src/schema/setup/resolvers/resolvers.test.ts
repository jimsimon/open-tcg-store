import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks for isSetupPending
// ---------------------------------------------------------------------------

const mockOtcgs = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../../db', () => ({
  otcgs: mockOtcgs,
}));

vi.mock('../../../db/otcgs/schema', () => ({
  user: {
    id: 'user.id',
    isAnonymous: 'user.is_anonymous',
  },
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    count: vi.fn(() => 'count(*)'),
    or: vi.fn((...args: unknown[]) => ({ type: 'or', args })),
    eq: vi.fn((...args: unknown[]) => ({ type: 'eq', args })),
    isNull: vi.fn((...args: unknown[]) => ({ type: 'isNull', args })),
    sql: vi.fn((..._args: unknown[]) => ({ type: 'sql' })),
  };
});

// ---------------------------------------------------------------------------
// Mocks for firstTimeSetup
// ---------------------------------------------------------------------------

const mockAuth = vi.hoisted(() => ({
  api: {
    signUpEmail: vi.fn(),
    signInEmail: vi.fn(),
    createOrganization: vi.fn(),
    setActiveOrganization: vi.fn(),
  },
}));

vi.mock('../../../auth', () => ({
  auth: mockAuth,
}));

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn((headers: unknown) => headers),
}));

vi.mock('../../../db/index', () => ({
  otcgs: mockOtcgs,
}));

vi.mock('../../../db/otcgs/settings-schema', () => ({
  storeSettings: {
    id: 'store_settings.id',
    companyName: 'store_settings.company_name',
    ein: 'store_settings.ein',
  },
}));

vi.mock('../../../db/otcgs/store-supported-game-schema', () => ({
  storeSupportedGame: {
    id: 'store_supported_game.id',
    organizationId: 'store_supported_game.organization_id',
    categoryId: 'store_supported_game.category_id',
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chainable(rows: unknown[] = []) {
  const chain = Object.assign(Promise.resolve(rows), {} as Record<string, unknown>);
  for (const method of [
    'select',
    'from',
    'where',
    'limit',
    'insert',
    'update',
    'delete',
    'set',
    'values',
    'returning',
    'onConflictDoUpdate',
  ]) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { isSetupPending as _isSetupPending } from './Query/isSetupPending';
import { firstTimeSetup as _firstTimeSetup } from './Mutation/firstTimeSetup';

const isSetupPending = _isSetupPending as (...args: unknown[]) => Promise<unknown>;
const firstTimeSetup = _firstTimeSetup as (...args: unknown[]) => Promise<unknown>;

function ctx() {
  return {
    auth: { user: { id: 'user-1' }, session: {} },
    req: { headers: { 'content-type': 'application/json' } },
    res: { append: vi.fn() },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('setup resolvers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isSetupPending', () => {
    it('should return true when no non-anonymous users exist', async () => {
      const selectChain = chainable([{ count: 0 }]);
      mockOtcgs.select.mockReturnValue(selectChain);

      const result = await isSetupPending(null, {}, ctx());

      expect(result).toBe(true);
    });

    it('should return false when non-anonymous users exist', async () => {
      const selectChain = chainable([{ count: 3 }]);
      mockOtcgs.select.mockReturnValue(selectChain);

      const result = await isSetupPending(null, {}, ctx());

      expect(result).toBe(false);
    });
  });

  describe('firstTimeSetup', () => {
    it('should create user, save settings, create org, and return token', async () => {
      // Mock signUpEmail response
      mockAuth.api.signUpEmail.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ user: { id: 'new-user-id' }, token: 'session-token' }),
        headers: {
          getSetCookie: vi.fn().mockReturnValue(['session=abc123']),
        },
      });

      // Mock update and insert for DB operations
      const updateChain = chainable([]);
      const insertChain = chainable([]);
      mockOtcgs.update.mockReturnValue(updateChain);
      mockOtcgs.insert.mockReturnValue(insertChain);

      // Mock createOrganization
      mockAuth.api.createOrganization.mockResolvedValue({ id: 'org-1' });
      mockAuth.api.setActiveOrganization.mockResolvedValue({});

      // Mock signInEmail response (fresh session after setup)
      mockAuth.api.signInEmail.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ token: 'session-token' }),
        headers: {
          getSetCookie: vi.fn().mockReturnValue(['session=fresh123']),
        },
      });

      const args = {
        userDetails: { email: 'admin@test.com', password: 'password123', firstName: 'Admin' },
        company: { companyName: 'Test Corp', ein: '12-3456789' },
        store: {
          name: 'Main Store',
          slug: 'main-store',
          street1: '123 Main',
          city: 'Chicago',
          state: 'IL',
          zip: '60601',
        },
        supportedGameCategoryIds: [1, 3],
      };

      const result = await firstTimeSetup(null, args, ctx());

      expect(result).toBe('session-token');
      expect(mockAuth.api.signUpEmail).toHaveBeenCalled();
      expect(mockAuth.api.createOrganization).toHaveBeenCalled();
      expect(mockAuth.api.setActiveOrganization).toHaveBeenCalled();
      expect(mockAuth.api.signInEmail).toHaveBeenCalled();
    });

    it('should throw when signup fails', async () => {
      mockAuth.api.signUpEmail.mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Email already exists' }),
        headers: { getSetCookie: vi.fn().mockReturnValue([]) },
      });

      const args = {
        userDetails: { email: 'admin@test.com', password: 'password123', firstName: 'Admin' },
        company: { companyName: 'Test Corp', ein: '12-3456789' },
        store: {
          name: 'Main Store',
          slug: 'main-store',
          street1: '123 Main',
          city: 'Chicago',
          state: 'IL',
          zip: '60601',
        },
      };

      await expect(firstTimeSetup(null, args, ctx())).rejects.toThrow('Email already exists');
    });

    it('should rollback user on subsequent failure', async () => {
      mockAuth.api.signUpEmail.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ user: { id: 'new-user-id' }, token: 'token' }),
        headers: { getSetCookie: vi.fn().mockReturnValue(['session=abc123']) },
      });

      const updateChain = chainable([]);
      mockOtcgs.update.mockReturnValue(updateChain);

      // Insert (store settings) succeeds, but createOrganization fails
      const insertChain = chainable([]);
      mockOtcgs.insert.mockReturnValue(insertChain);
      mockAuth.api.createOrganization.mockRejectedValue(new Error('Org creation failed'));

      // Delete for rollback
      const deleteChain = chainable([]);
      mockOtcgs.delete.mockReturnValue(deleteChain);

      const args = {
        userDetails: { email: 'admin@test.com', password: 'pass', firstName: 'Admin' },
        company: { companyName: 'Corp', ein: '00-0000000' },
        store: { name: 'Store', slug: 'store', street1: '1 St', city: 'C', state: 'IL', zip: '60601' },
      };

      await expect(firstTimeSetup(null, args, ctx())).rejects.toThrow('Org creation failed');
      // Should have attempted to delete the user
      expect(mockOtcgs.delete).toHaveBeenCalled();
    });

    it('should throw when signup returns no user id (line 38)', async () => {
      mockAuth.api.signUpEmail.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ user: {}, token: 'token' }),
        headers: { getSetCookie: vi.fn().mockReturnValue([]) },
      });

      const args = {
        userDetails: { email: 'a@b.com', password: 'pass', firstName: 'Admin' },
        company: { companyName: 'Corp', ein: '00-0000000' },
        store: { name: 'Store', slug: 'store', street1: '1 St', city: 'C', state: 'IL', zip: '60601' },
      };

      await expect(firstTimeSetup(null, args, ctx())).rejects.toThrow('Failed to create user account');
    });

    it('should throw when createOrganization returns null (line 89)', async () => {
      mockAuth.api.signUpEmail.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ user: { id: 'user-1' }, token: 'token' }),
        headers: { getSetCookie: vi.fn().mockReturnValue(['session=abc123']) },
      });

      const updateChain = chainable([]);
      const insertChain = chainable([]);
      mockOtcgs.update.mockReturnValue(updateChain);
      mockOtcgs.insert.mockReturnValue(insertChain);

      // createOrganization returns null
      mockAuth.api.createOrganization.mockResolvedValue(null);

      const deleteChain = chainable([]);
      mockOtcgs.delete.mockReturnValue(deleteChain);

      const args = {
        userDetails: { email: 'a@b.com', password: 'pass', firstName: 'Admin' },
        company: { companyName: 'Corp', ein: '00-0000000' },
        store: { name: 'Store', slug: 'store', street1: '1 St', city: 'C', state: 'IL', zip: '60601' },
      };

      await expect(firstTimeSetup(null, args, ctx())).rejects.toThrow('Failed to create organization');
    });

    it('should handle cleanup error during rollback (line 112)', async () => {
      mockAuth.api.signUpEmail.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ user: { id: 'user-1' }, token: 'token' }),
        headers: { getSetCookie: vi.fn().mockReturnValue(['session=abc123']) },
      });

      const updateChain = chainable([]);
      mockOtcgs.update.mockReturnValue(updateChain);

      const insertChain = chainable([]);
      mockOtcgs.insert.mockReturnValue(insertChain);

      mockAuth.api.createOrganization.mockRejectedValue(new Error('Org failed'));

      // Delete (rollback) also fails
      const failDeleteChain = Object.assign(Promise.reject(new Error('Delete failed')), {} as Record<string, unknown>);
      failDeleteChain.where = vi.fn().mockReturnValue(failDeleteChain);
      failDeleteChain.delete = vi.fn().mockReturnValue(failDeleteChain);
      failDeleteChain.from = vi.fn().mockReturnValue(failDeleteChain);
      mockOtcgs.delete.mockReturnValue(failDeleteChain);

      const args = {
        userDetails: { email: 'a@b.com', password: 'pass', firstName: 'Admin' },
        company: { companyName: 'Corp', ein: '00-0000000' },
        store: { name: 'Store', slug: 'store', street1: '1 St', city: 'C', state: 'IL', zip: '60601' },
      };

      // Should still throw the original error, not the cleanup error
      await expect(firstTimeSetup(null, args, ctx())).rejects.toThrow('Org failed');
    });

    it('should use default error message for non-Error throws', async () => {
      mockAuth.api.signUpEmail.mockRejectedValue('string error');

      const args = {
        userDetails: { email: 'a@b.com', password: 'pass', firstName: 'Admin' },
        company: { companyName: 'Corp', ein: '00-0000000' },
        store: { name: 'Store', slug: 'store', street1: '1 St', city: 'C', state: 'IL', zip: '60601' },
      };

      await expect(firstTimeSetup(null, args, ctx())).rejects.toThrow('An unexpected error occurred during setup');
    });

    it('should handle signup failure without error message (default message)', async () => {
      mockAuth.api.signUpEmail.mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({}),
        headers: { getSetCookie: vi.fn().mockReturnValue([]) },
      });

      const args = {
        userDetails: { email: 'a@b.com', password: 'pass', firstName: 'Admin' },
        company: { companyName: 'Corp', ein: '00-0000000' },
        store: { name: 'Store', slug: 'store', street1: '1 St', city: 'C', state: 'IL', zip: '60601' },
      };

      await expect(firstTimeSetup(null, args, ctx())).rejects.toThrow('Failed to create user account');
    });
  });
});
