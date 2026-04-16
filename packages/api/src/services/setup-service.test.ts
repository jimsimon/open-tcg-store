import { describe, it, expect, vi, beforeEach } from 'vitest';

import { chainable } from '../test-utils';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockOtcgs = vi.hoisted(() => {
  const mock = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        select: (...args: unknown[]) => mock.select(...args),
        insert: (...args: unknown[]) => mock.insert(...args),
        update: (...args: unknown[]) => mock.update(...args),
        delete: (...args: unknown[]) => mock.delete(...args),
      };
      return fn(tx);
    }),
  };
  return mock;
});

const mockAuth = vi.hoisted(() => ({
  api: {
    signUpEmail: vi.fn(),
    signInEmail: vi.fn(),
    createOrganization: vi.fn(),
    setActiveOrganization: vi.fn(),
  },
}));

vi.mock('../db/index', () => ({
  otcgs: mockOtcgs,
}));

vi.mock('../db/otcgs/schema', () => ({
  user: {
    id: 'user.id',
    isAnonymous: 'user.is_anonymous',
    role: 'user.role',
  },
}));

vi.mock('../db/otcgs/company-settings-schema', () => ({
  companySettings: {
    id: 'company_settings.id',
    companyName: 'company_settings.company_name',
    ein: 'company_settings.ein',
  },
}));

vi.mock('../db/otcgs/store-supported-game-schema', () => ({
  storeSupportedGame: {
    categoryId: 'store_supported_game.category_id',
  },
}));

vi.mock('../auth', () => ({
  auth: mockAuth,
}));

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn((headers: unknown) => headers),
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    count: vi.fn(() => 'count(*)'),
    or: vi.fn((...args: unknown[]) => ({ type: 'or', args })),
    eq: vi.fn((...args: unknown[]) => ({ type: 'eq', args })),
    isNull: vi.fn((...args: unknown[]) => ({ type: 'isNull', args })),
  };
});

import { isSetupPending, performFirstTimeSetup } from './setup-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq() {
  return { headers: { host: 'localhost' } } as never;
}

const defaultUser = { email: 'admin@test.com', password: 'securepass123!', firstName: 'Admin' };
const defaultCompany = { companyName: 'Test Store', ein: '12-3456789' };
const defaultStore = {
  name: 'Test Store',
  slug: 'test-store',
  street1: '123 Main',
  street2: null,
  city: 'Springfield',
  state: 'IL',
  zip: '62701',
  phone: null,
};

function mockSuccessfulSignUp() {
  mockAuth.api.signUpEmail.mockResolvedValue({
    ok: true,
    json: async () => ({ user: { id: 'user-1' } }),
    headers: { getSetCookie: () => ['session=abc'] },
  });
}

function mockSuccessfulSignIn() {
  mockAuth.api.signInEmail.mockResolvedValue({
    ok: true,
    json: async () => ({ token: 'fresh-token' }),
    headers: { getSetCookie: () => ['session=fresh'] },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('setup-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: guard transaction passes (0 users), insert succeeds
    mockOtcgs.select.mockReturnValue(chainable([{ count: 0 }]));
    mockOtcgs.insert.mockReturnValue(chainable([]));
    mockOtcgs.update.mockReturnValue(chainable([]));
    mockOtcgs.delete.mockReturnValue(chainable([]));
  });

  // -----------------------------------------------------------------------
  // isSetupPending
  // -----------------------------------------------------------------------

  describe('isSetupPending', () => {
    it('should return true when no non-anonymous users exist', async () => {
      mockOtcgs.select.mockReturnValue(chainable([{ count: 0 }]));

      const result = await isSetupPending();

      expect(result).toBe(true);
    });

    it('should return false when non-anonymous users exist', async () => {
      mockOtcgs.select.mockReturnValue(chainable([{ count: 3 }]));

      const result = await isSetupPending();

      expect(result).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // performFirstTimeSetup
  // -----------------------------------------------------------------------

  describe('performFirstTimeSetup', () => {
    it('should complete full setup flow and return token', async () => {
      mockSuccessfulSignUp();
      mockAuth.api.createOrganization.mockResolvedValue({ id: 'org-1' });
      mockAuth.api.setActiveOrganization.mockResolvedValue({});
      mockSuccessfulSignIn();

      const setCookie = vi.fn();
      const token = await performFirstTimeSetup(
        defaultUser,
        defaultCompany,
        defaultStore,
        [1, 2],
        makeReq(),
        setCookie,
      );

      expect(token).toBe('fresh-token');
      expect(mockAuth.api.signUpEmail).toHaveBeenCalled();
      expect(mockAuth.api.createOrganization).toHaveBeenCalled();
      expect(mockAuth.api.setActiveOrganization).toHaveBeenCalled();
      expect(mockAuth.api.signInEmail).toHaveBeenCalled();
      expect(setCookie).toHaveBeenCalledWith('session=fresh');
      // Should update user role to owner
      expect(mockOtcgs.update).toHaveBeenCalled();
      // Should insert supported games
      expect(mockOtcgs.insert).toHaveBeenCalled();
    });

    it('should throw when setup is already complete (users exist)', async () => {
      mockOtcgs.select.mockReturnValue(chainable([{ count: 1 }]));

      await expect(
        performFirstTimeSetup(defaultUser, defaultCompany, defaultStore, [1], makeReq(), vi.fn()),
      ).rejects.toThrow('Setup has already been completed');
    });

    it('should throw when signup fails with error response', async () => {
      mockAuth.api.signUpEmail.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Email already in use' }),
        headers: { getSetCookie: () => [] },
      });

      await expect(
        performFirstTimeSetup(defaultUser, defaultCompany, defaultStore, [1], makeReq(), vi.fn()),
      ).rejects.toThrow('Email already in use');
    });

    it('should throw when signup returns no user id', async () => {
      mockAuth.api.signUpEmail.mockResolvedValue({
        ok: true,
        json: async () => ({ user: {} }),
        headers: { getSetCookie: () => [] },
      });

      await expect(
        performFirstTimeSetup(defaultUser, defaultCompany, defaultStore, [1], makeReq(), vi.fn()),
      ).rejects.toThrow('Failed to create user account');
    });

    it('should throw when createOrganization returns null', async () => {
      mockSuccessfulSignUp();
      mockAuth.api.createOrganization.mockResolvedValue(null);

      await expect(
        performFirstTimeSetup(defaultUser, defaultCompany, defaultStore, [1], makeReq(), vi.fn()),
      ).rejects.toThrow('Failed to create organization');
    });

    it('should throw when no supported game category IDs provided', async () => {
      mockSuccessfulSignUp();
      mockAuth.api.createOrganization.mockResolvedValue({ id: 'org-1' });
      mockAuth.api.setActiveOrganization.mockResolvedValue({});

      await expect(
        performFirstTimeSetup(defaultUser, defaultCompany, defaultStore, [], makeReq(), vi.fn()),
      ).rejects.toThrow('At least one supported game must be selected');
    });

    it('should throw when sign-in fails after setup', async () => {
      mockSuccessfulSignUp();
      mockAuth.api.createOrganization.mockResolvedValue({ id: 'org-1' });
      mockAuth.api.setActiveOrganization.mockResolvedValue({});
      mockAuth.api.signInEmail.mockResolvedValue({
        ok: false,
        json: async () => ({}),
        headers: { getSetCookie: () => [] },
      });

      await expect(
        performFirstTimeSetup(defaultUser, defaultCompany, defaultStore, [1], makeReq(), vi.fn()),
      ).rejects.toThrow('failed to create authenticated session');
    });

    it('should rollback user and company settings on failure', async () => {
      mockSuccessfulSignUp();
      mockAuth.api.createOrganization.mockRejectedValue(new Error('Org creation failed'));

      await expect(
        performFirstTimeSetup(defaultUser, defaultCompany, defaultStore, [1], makeReq(), vi.fn()),
      ).rejects.toThrow('Org creation failed');

      // Should have called delete for user and company settings
      expect(mockOtcgs.delete).toHaveBeenCalled();
    });

    it('should still throw original error when cleanup also fails', async () => {
      mockSuccessfulSignUp();
      mockAuth.api.createOrganization.mockRejectedValue(new Error('Org creation failed'));
      mockOtcgs.delete.mockReturnValue(chainable([]));
      // Make the second delete call (company settings) throw
      let deleteCallCount = 0;
      mockOtcgs.delete.mockImplementation(() => {
        deleteCallCount++;
        if (deleteCallCount === 2) {
          throw new Error('Delete failed');
        }
        return chainable([]);
      });

      await expect(
        performFirstTimeSetup(defaultUser, defaultCompany, defaultStore, [1], makeReq(), vi.fn()),
      ).rejects.toThrow('Org creation failed');
    });

    it('should wrap non-Error throws in a generic message', async () => {
      mockAuth.api.signUpEmail.mockRejectedValue('string error');

      await expect(
        performFirstTimeSetup(defaultUser, defaultCompany, defaultStore, [1], makeReq(), vi.fn()),
      ).rejects.toThrow('An unexpected error occurred during setup');
    });
  });
});
