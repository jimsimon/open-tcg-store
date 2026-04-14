import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockIsSetupPending, mockPerformFirstTimeSetup } = vi.hoisted(() => ({
  mockIsSetupPending: vi.fn(),
  mockPerformFirstTimeSetup: vi.fn(),
}));

vi.mock('../../../services/setup-service', () => ({
  isSetupPending: mockIsSetupPending,
  performFirstTimeSetup: mockPerformFirstTimeSetup,
}));

import { isSetupPending as _isSetupPending } from './Query/isSetupPending';
import { firstTimeSetup as _firstTimeSetup } from './Mutation/firstTimeSetup';

const isSetupPending = _isSetupPending as (...args: unknown[]) => Promise<unknown>;
const firstTimeSetup = _firstTimeSetup as (...args: unknown[]) => Promise<unknown>;

function ctx() {
  return {
    auth: { user: { id: 'user-1' }, session: { activeOrganizationId: 'org-1' } },
    req: { headers: {} },
    res: { append: vi.fn() },
  };
}

describe('setup resolvers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // isSetupPending
  // -----------------------------------------------------------------------

  describe('isSetupPending', () => {
    it('should return true when no users exist', async () => {
      mockIsSetupPending.mockResolvedValue(true);
      const result = await isSetupPending(null, {}, ctx());
      expect(result).toBe(true);
      expect(mockIsSetupPending).toHaveBeenCalled();
    });

    it('should return false when users exist', async () => {
      mockIsSetupPending.mockResolvedValue(false);
      const result = await isSetupPending(null, {}, ctx());
      expect(result).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // firstTimeSetup
  // -----------------------------------------------------------------------

  describe('firstTimeSetup', () => {
    const setupArgs = {
      userDetails: { email: 'admin@test.com', password: 'password123!', firstName: 'Admin' },
      company: { companyName: 'Test Store', ein: '12-3456789' },
      store: {
        name: 'Test Store',
        slug: 'test-store',
        street1: '123 Main St',
        street2: null,
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        phone: null,
      },
      supportedGameCategoryIds: [1, 2],
    };

    it('should delegate to performFirstTimeSetup and return token', async () => {
      mockPerformFirstTimeSetup.mockResolvedValue('session-token-123');

      const result = await firstTimeSetup(null, setupArgs, ctx());

      expect(result).toBe('session-token-123');
      expect(mockPerformFirstTimeSetup).toHaveBeenCalledWith(
        setupArgs.userDetails,
        setupArgs.company,
        setupArgs.store,
        setupArgs.supportedGameCategoryIds,
        expect.anything(), // req
        expect.any(Function), // setCookie callback
      );
    });

    it('should propagate errors from the service', async () => {
      mockPerformFirstTimeSetup.mockRejectedValue(new Error('Setup has already been completed.'));

      await expect(firstTimeSetup(null, setupArgs, ctx())).rejects.toThrow('Setup has already been completed.');
    });

    it('should pass a setCookie callback that calls ctx.res.append', async () => {
      let capturedSetCookie: ((cookie: string) => void) | undefined;
      mockPerformFirstTimeSetup.mockImplementation(
        async (
          _user: unknown,
          _company: unknown,
          _store: unknown,
          _games: unknown,
          _req: unknown,
          setCookie: (cookie: string) => void,
        ) => {
          capturedSetCookie = setCookie;
          return 'token';
        },
      );

      const context = ctx();
      await firstTimeSetup(null, setupArgs, context);

      // Verify the setCookie callback forwards to ctx.res.append
      capturedSetCookie!('session=abc123; Path=/');
      expect(context.res.append).toHaveBeenCalledWith('Set-Cookie', 'session=abc123; Path=/');
    });
  });
});
