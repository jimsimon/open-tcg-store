import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Use vi.hoisted so mock variables are available when vi.mock factories run.
// ---------------------------------------------------------------------------

const {
  mockGetStoreSettings,
  mockUpdateStoreSettings,
  mockLookupSalesTax,
  mockGetBackupSettings,
  mockUpdateBackupSettings,
  mockGetIntegrationSettings,
  mockUpdateStripeIntegration,
  mockUpdateShopifyIntegration,
  mockPerformBackup,
  mockPerformRestore,
  mockRefreshUpdateStatus,
  mockTriggerManualUpdate,
  mockAssertPermission,
  mockGetUserId,
} = vi.hoisted(() => ({
  mockGetStoreSettings: vi.fn(),
  mockUpdateStoreSettings: vi.fn(),
  mockLookupSalesTax: vi.fn(),
  mockGetBackupSettings: vi.fn(),
  mockUpdateBackupSettings: vi.fn(),
  mockGetIntegrationSettings: vi.fn(),
  mockUpdateStripeIntegration: vi.fn(),
  mockUpdateShopifyIntegration: vi.fn(),
  mockPerformBackup: vi.fn(),
  mockPerformRestore: vi.fn(),
  mockRefreshUpdateStatus: vi.fn(),
  mockTriggerManualUpdate: vi.fn(),
  mockAssertPermission: vi.fn(),
  mockGetUserId: vi.fn().mockReturnValue('admin-1'),
}));

vi.mock('../../../services/settings-service', () => ({
  getStoreSettings: mockGetStoreSettings,
  updateStoreSettings: mockUpdateStoreSettings,
  lookupSalesTax: mockLookupSalesTax,
  getBackupSettings: mockGetBackupSettings,
  updateBackupSettings: mockUpdateBackupSettings,
  getIntegrationSettings: mockGetIntegrationSettings,
  updateStripeIntegration: mockUpdateStripeIntegration,
  updateShopifyIntegration: mockUpdateShopifyIntegration,
}));

vi.mock('../../../services/backup-service', () => ({
  performBackup: mockPerformBackup,
  performRestore: mockPerformRestore,
}));

vi.mock('../../../services/tcg-data-update-service', () => ({
  refreshUpdateStatus: mockRefreshUpdateStatus,
  triggerManualUpdate: mockTriggerManualUpdate,
}));

vi.mock('../../../lib/assert-permission', () => ({
  assertPermission: mockAssertPermission,
  getUserId: mockGetUserId,
}));

// ---------------------------------------------------------------------------
// Import resolvers after mocks.
// Cast each to a callable function to avoid TS union type issues with
// the generated Resolver type (which includes ResolverWithResolve).
// ---------------------------------------------------------------------------
import { getStoreSettings as _getStoreSettings } from './Query/getStoreSettings';
import { getBackupSettings as _getBackupSettings } from './Query/getBackupSettings';
import { getIntegrationSettings as _getIntegrationSettings } from './Query/getIntegrationSettings';
import { lookupSalesTax as _lookupSalesTax } from './Query/lookupSalesTax';
import { updateStoreSettings as _updateStoreSettings } from './Mutation/updateStoreSettings';
import { updateBackupSettings as _updateBackupSettings } from './Mutation/updateBackupSettings';
import { triggerBackup as _triggerBackup } from './Mutation/triggerBackup';
import { triggerRestore as _triggerRestore } from './Mutation/triggerRestore';
import { updateStripeIntegration as _updateStripeIntegration } from './Mutation/updateStripeIntegration';
import { updateShopifyIntegration as _updateShopifyIntegration } from './Mutation/updateShopifyIntegration';
import { checkForDataUpdates as _checkForDataUpdates } from './Query/checkForDataUpdates';
import { triggerDataUpdate as _triggerDataUpdate } from './Mutation/triggerDataUpdate';

// Cast to callable functions
const getStoreSettings = _getStoreSettings as (...args: unknown[]) => Promise<unknown>;
const getBackupSettings = _getBackupSettings as (...args: unknown[]) => Promise<unknown>;
const getIntegrationSettings = _getIntegrationSettings as (...args: unknown[]) => Promise<unknown>;
const lookupSalesTax = _lookupSalesTax as (...args: unknown[]) => Promise<unknown>;
const updateStoreSettings = _updateStoreSettings as (...args: unknown[]) => Promise<unknown>;
const updateBackupSettings = _updateBackupSettings as (...args: unknown[]) => Promise<unknown>;
const triggerBackup = _triggerBackup as (...args: unknown[]) => Promise<unknown>;
const triggerRestore = _triggerRestore as (...args: unknown[]) => Promise<unknown>;
const updateStripeIntegration = _updateStripeIntegration as (...args: unknown[]) => Promise<unknown>;
const updateShopifyIntegration = _updateShopifyIntegration as (...args: unknown[]) => Promise<unknown>;
const checkForDataUpdates = _checkForDataUpdates as (...args: unknown[]) => Promise<unknown>;
const triggerDataUpdate = _triggerDataUpdate as (...args: unknown[]) => Promise<unknown>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function adminContext() {
  // Configure assertPermission to succeed for admin
  mockAssertPermission.mockResolvedValue(undefined);
  mockGetUserId.mockReturnValue('admin-1');
  return {
    auth: {
      user: { id: 'admin-1', role: 'owner' },
      session: { activeOrganizationId: 'org-1' },
    },
    req: { headers: {} },
  };
}

function employeeContext() {
  // Configure assertPermission to reject for employees
  mockAssertPermission.mockRejectedValue(new Error('Unauthorized: Insufficient permissions'));
  return {
    auth: {
      user: { id: 'emp-1', role: 'employee' },
      session: { activeOrganizationId: 'org-1' },
    },
    req: { headers: {} },
  };
}

function anonymousContext() {
  // Configure assertPermission to reject for anonymous
  mockAssertPermission.mockRejectedValue(new Error('Unauthorized: Insufficient permissions'));
  return {
    auth: null,
    req: { headers: {} },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('settings resolvers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Access Control (shared across all resolvers)
  // -----------------------------------------------------------------------
  describe('access control', () => {
    it('should reject non-admin users for getStoreSettings', async () => {
      await expect(getStoreSettings({}, {}, employeeContext(), {})).rejects.toThrow(
        'Unauthorized: Insufficient permissions',
      );
    });

    it('should reject anonymous users for getStoreSettings', async () => {
      await expect(getStoreSettings({}, {}, anonymousContext(), {})).rejects.toThrow(
        'Unauthorized: Insufficient permissions',
      );
    });

    it('should reject non-admin users for getBackupSettings', async () => {
      await expect(getBackupSettings({}, {}, employeeContext(), {})).rejects.toThrow(
        'Unauthorized: Insufficient permissions',
      );
    });

    it('should reject non-admin users for getIntegrationSettings', async () => {
      await expect(getIntegrationSettings({}, {}, employeeContext(), {})).rejects.toThrow(
        'Unauthorized: Insufficient permissions',
      );
    });

    it('should reject non-admin users for lookupSalesTax', async () => {
      await expect(lookupSalesTax({}, { countryCode: 'US', stateCode: 'MI' }, employeeContext(), {})).rejects.toThrow(
        'Unauthorized: Insufficient permissions',
      );
    });

    it('should reject non-admin users for updateStoreSettings', async () => {
      await expect(updateStoreSettings({}, { input: { companyName: 'Test' } }, employeeContext(), {})).rejects.toThrow(
        'Unauthorized: Insufficient permissions',
      );
    });

    it('should reject non-admin users for updateBackupSettings', async () => {
      await expect(updateBackupSettings({}, { input: { provider: 'dropbox' } }, employeeContext(), {})).rejects.toThrow(
        'Unauthorized: Insufficient permissions',
      );
    });

    it('should reject non-admin users for triggerBackup', async () => {
      await expect(triggerBackup({}, {}, employeeContext(), {})).rejects.toThrow(
        'Unauthorized: Insufficient permissions',
      );
    });

    it('should reject non-admin users for triggerRestore', async () => {
      await expect(triggerRestore({}, { provider: 'google_drive' }, employeeContext(), {})).rejects.toThrow(
        'Unauthorized: Insufficient permissions',
      );
    });

    it('should reject non-admin users for updateStripeIntegration', async () => {
      await expect(updateStripeIntegration({}, { input: { enabled: true } }, employeeContext(), {})).rejects.toThrow(
        'Unauthorized: Insufficient permissions',
      );
    });

    it('should reject non-admin users for updateShopifyIntegration', async () => {
      await expect(updateShopifyIntegration({}, { input: { enabled: true } }, employeeContext(), {})).rejects.toThrow(
        'Unauthorized: Insufficient permissions',
      );
    });

    it('should reject non-admin users for checkForDataUpdates', async () => {
      await expect(checkForDataUpdates({}, {}, employeeContext(), {})).rejects.toThrow(
        'Unauthorized: Insufficient permissions',
      );
    });

    it('should reject non-admin users for triggerDataUpdate', async () => {
      await expect(triggerDataUpdate({}, {}, employeeContext(), {})).rejects.toThrow(
        'Unauthorized: Insufficient permissions',
      );
    });
  });

  // -----------------------------------------------------------------------
  // Query Resolvers
  // -----------------------------------------------------------------------
  describe('getStoreSettings resolver', () => {
    it('should return store settings for admin', async () => {
      const mockResult = { companyName: 'My Store', ein: '12-3456789' };
      mockGetStoreSettings.mockResolvedValue(mockResult);

      const result = await getStoreSettings({}, {}, adminContext(), {});

      expect(result).toEqual(mockResult);
      expect(mockGetStoreSettings).toHaveBeenCalled();
    });
  });

  describe('getBackupSettings resolver', () => {
    it('should return backup settings for admin', async () => {
      const mockResult = {
        provider: 'google_drive',
        frequency: 'daily',
        lastBackupAt: '2025-01-15T10:00:00.000Z',
        googleDriveConnected: true,
        dropboxConnected: false,
        onedriveConnected: false,
      };
      mockGetBackupSettings.mockResolvedValue(mockResult);

      const result = await getBackupSettings({}, {}, adminContext(), {});

      expect(result).toEqual(mockResult);
    });
  });

  describe('getIntegrationSettings resolver', () => {
    it('should return integration settings for admin', async () => {
      const mockResult = {
        stripe: { enabled: true, hasApiKey: true },
        shopify: { enabled: false, hasApiKey: false, shopDomain: null },
      };
      mockGetIntegrationSettings.mockResolvedValue(mockResult);

      const result = await getIntegrationSettings({}, {}, adminContext(), {});

      expect(result).toEqual(mockResult);
    });
  });

  describe('lookupSalesTax resolver', () => {
    it('should return tax info for admin', async () => {
      const mockResult = { rate: 0.06, type: 'state', currency: 'USD' };
      mockLookupSalesTax.mockResolvedValue(mockResult);

      const result = await lookupSalesTax({}, { countryCode: 'US', stateCode: 'MI' }, adminContext(), {});

      expect(result).toEqual(mockResult);
      expect(mockLookupSalesTax).toHaveBeenCalledWith('US', 'MI');
    });
  });

  // -----------------------------------------------------------------------
  // Mutation Resolvers
  // -----------------------------------------------------------------------
  describe('updateStoreSettings resolver', () => {
    it('should update store settings for admin', async () => {
      const input = { companyName: 'Updated Store' };
      const mockResult = { companyName: 'Updated Store', ein: null };
      mockUpdateStoreSettings.mockResolvedValue(mockResult);

      const result = await updateStoreSettings({}, { input }, adminContext(), {});

      expect(result).toEqual(mockResult);
      expect(mockUpdateStoreSettings).toHaveBeenCalledWith(input, 'admin-1');
    });
  });

  describe('updateBackupSettings resolver', () => {
    it('should update backup settings for admin', async () => {
      const input = { provider: 'dropbox', frequency: 'weekly' };
      const mockResult = { provider: 'dropbox', frequency: 'weekly' };
      mockUpdateBackupSettings.mockResolvedValue(mockResult);

      const result = await updateBackupSettings({}, { input }, adminContext(), {});

      expect(result).toEqual(mockResult);
      expect(mockUpdateBackupSettings).toHaveBeenCalledWith(input, 'admin-1');
    });
  });

  describe('triggerBackup resolver', () => {
    it('should trigger backup when provider is configured', async () => {
      mockGetBackupSettings.mockResolvedValue({ provider: 'google_drive' });
      mockPerformBackup.mockResolvedValue({
        success: true,
        message: 'Backup created',
        timestamp: '2025-01-15T10:00:00.000Z',
      });

      const result = (await triggerBackup({}, {}, adminContext(), {})) as {
        success: boolean;
        message: string;
      };

      expect(result.success).toBe(true);
      expect(mockPerformBackup).toHaveBeenCalledWith('google_drive');
    });

    it('should return failure when no provider is configured', async () => {
      mockGetBackupSettings.mockResolvedValue({ provider: null });

      const result = (await triggerBackup({}, {}, adminContext(), {})) as {
        success: boolean;
        message: string;
      };

      expect(result.success).toBe(false);
      expect(result.message).toBe('No backup provider configured');
      expect(mockPerformBackup).not.toHaveBeenCalled();
    });
  });

  describe('triggerRestore resolver', () => {
    it('should trigger restore for admin', async () => {
      mockPerformRestore.mockResolvedValue({ success: true, message: 'Restored' });

      const result = (await triggerRestore({}, { provider: 'google_drive' }, adminContext(), {})) as {
        success: boolean;
      };

      expect(result.success).toBe(true);
      expect(mockPerformRestore).toHaveBeenCalledWith('google_drive');
    });
  });

  describe('updateStripeIntegration resolver', () => {
    it('should update stripe settings for admin', async () => {
      const input = { enabled: true, apiKey: 'sk_test_new' };
      const mockResult = { enabled: true, hasApiKey: true };
      mockUpdateStripeIntegration.mockResolvedValue(mockResult);

      const result = await updateStripeIntegration({}, { input }, adminContext(), {});

      expect(result).toEqual(mockResult);
      expect(mockUpdateStripeIntegration).toHaveBeenCalledWith(input, 'admin-1');
    });
  });

  describe('updateShopifyIntegration resolver', () => {
    it('should update shopify settings for admin', async () => {
      const input = { enabled: true, shopDomain: 'test.myshopify.com' };
      const mockResult = { enabled: true, hasApiKey: false, shopDomain: 'test.myshopify.com' };
      mockUpdateShopifyIntegration.mockResolvedValue(mockResult);

      const result = await updateShopifyIntegration({}, { input }, adminContext(), {});

      expect(result).toEqual(mockResult);
      expect(mockUpdateShopifyIntegration).toHaveBeenCalledWith(input, 'admin-1');
    });
  });

  describe('checkForDataUpdates resolver', () => {
    it('should return data update status for admin', async () => {
      const mockResult = {
        currentVersion: '2026-04-05T12:00:00.000Z',
        latestVersion: 'tcg-data-abc123',
        updateAvailable: true,
        isUpdating: false,
      };
      mockRefreshUpdateStatus.mockResolvedValue(mockResult);

      const result = await checkForDataUpdates({}, {}, adminContext(), {});

      expect(result).toEqual(mockResult);
      expect(mockRefreshUpdateStatus).toHaveBeenCalled();
    });

    it('should return up-to-date status when no update available', async () => {
      const mockResult = {
        currentVersion: '2026-04-05T12:00:00.000Z',
        latestVersion: null,
        updateAvailable: false,
        isUpdating: false,
      };
      mockRefreshUpdateStatus.mockResolvedValue(mockResult);

      const result = await checkForDataUpdates({}, {}, adminContext(), {});

      expect(result).toEqual(mockResult);
    });
  });

  describe('triggerDataUpdate resolver', () => {
    it('should trigger data update for admin', async () => {
      const mockResult = {
        success: true,
        message: 'Successfully updated to tcg-data-abc123',
        newVersion: 'tcg-data-abc123',
      };
      mockTriggerManualUpdate.mockResolvedValue(mockResult);

      const result = (await triggerDataUpdate({}, {}, adminContext(), {})) as {
        success: boolean;
        message: string;
      };

      expect(result.success).toBe(true);
      expect(mockTriggerManualUpdate).toHaveBeenCalled();
    });

    it('should return failure when no update is available', async () => {
      const mockResult = { success: false, message: 'No update available', newVersion: null };
      mockTriggerManualUpdate.mockResolvedValue(mockResult);

      const result = (await triggerDataUpdate({}, {}, adminContext(), {})) as {
        success: boolean;
        message: string;
      };

      expect(result.success).toBe(false);
      expect(result.message).toBe('No update available');
    });

    it('should return failure when update is already in progress', async () => {
      const mockResult = { success: false, message: 'An update is already in progress', newVersion: null };
      mockTriggerManualUpdate.mockResolvedValue(mockResult);

      const result = (await triggerDataUpdate({}, {}, adminContext(), {})) as {
        success: boolean;
        message: string;
      };

      expect(result.success).toBe(false);
      expect(result.message).toBe('An update is already in progress');
    });
  });
});
