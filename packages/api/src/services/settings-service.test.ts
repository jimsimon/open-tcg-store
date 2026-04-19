import { describe, it, expect, vi, beforeEach } from 'vitest';

import { chainable } from '../test-utils';

let selectChain: ReturnType<typeof chainable>;
let insertChain: ReturnType<typeof chainable>;
let updateChain: ReturnType<typeof chainable>;

// Use vi.hoisted so mocks are available when vi.mock factories are hoisted.
const mockOtcgs = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

const mockGetSalesTax = vi.hoisted(() => vi.fn());

vi.mock('../db/otcgs/index', () => ({
  otcgs: mockOtcgs,
}));

vi.mock('../db/otcgs/company-settings-schema', () => ({
  companySettings: {
    id: 'company_settings.id',
    companyName: 'company_settings.company_name',
    ein: 'company_settings.ein',
    backupProvider: 'company_settings.backup_provider',
    backupFrequency: 'company_settings.backup_frequency',
    lastBackupAt: 'company_settings.last_backup_at',
    stripeEnabled: 'company_settings.stripe_enabled',
    stripeApiKey: 'company_settings.stripe_api_key',
    shopifyEnabled: 'company_settings.shopify_enabled',
    shopifyApiKey: 'company_settings.shopify_api_key',
    shopifyShopDomain: 'company_settings.shopify_shop_domain',
    googleDriveAccessToken: 'company_settings.google_drive_access_token',
    googleDriveRefreshToken: 'company_settings.google_drive_refresh_token',
    dropboxAccessToken: 'company_settings.dropbox_access_token',
    dropboxRefreshToken: 'company_settings.dropbox_refresh_token',
    onedriveAccessToken: 'company_settings.onedrive_access_token',
    onedriveRefreshToken: 'company_settings.onedrive_refresh_token',
    updatedAt: 'company_settings.updated_at',
    updatedBy: 'company_settings.updated_by',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: 'eq', args })),
}));

// Mock the encryption module
vi.mock('../lib/encryption', () => ({
  encrypt: vi.fn((val: string) => `encrypted:${val}`),
  encryptIfPresent: vi.fn((val: string | null | undefined) => {
    if (val == null || val === '') return null;
    return `encrypted:${val}`;
  }),
  decryptIfPresent: vi.fn((val: string | null | undefined) => {
    if (val == null || val === '') return null;
    return val.replace('encrypted:', '');
  }),
}));

// Mock sales-tax module
vi.mock('sales-tax', () => ({
  default: {
    getSalesTax: mockGetSalesTax,
  },
}));

// ---------------------------------------------------------------------------
// Import the service under test *after* mocks are registered.
// ---------------------------------------------------------------------------
import {
  getStoreSettings,
  updateStoreSettings,
  lookupSalesTax,
  getBackupSettings,
  updateBackupSettings,
  getIntegrationSettings,
  updateStripeIntegration,
  updateShopifyIntegration,
  storeOAuthTokens,
  getOAuthTokens,
  clearOAuthTokens,
  updateLastBackupAt,
} from './settings-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeSettingsRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    companyName: 'Test Store',
    ein: '12-3456789',
    backupProvider: 'google_drive',
    backupFrequency: 'daily',
    lastBackupAt: new Date('2025-01-15T10:00:00Z'),
    stripeEnabled: true,
    stripeApiKey: 'encrypted:sk_test_123',
    shopifyEnabled: false,
    shopifyApiKey: null,
    shopifyShopDomain: null,
    googleDriveClientId: null,
    dropboxClientId: null,
    onedriveClientId: null,
    googleDriveClientSecret: null,
    googleDriveAccessToken: 'encrypted:gd-access',
    googleDriveRefreshToken: 'encrypted:gd-refresh',
    dropboxAccessToken: null,
    dropboxRefreshToken: null,
    onedriveAccessToken: null,
    onedriveRefreshToken: null,
    updatedAt: new Date(),
    updatedBy: 'admin-1',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('settings-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectChain = chainable([fakeSettingsRow()]);
    insertChain = chainable([fakeSettingsRow()]);
    updateChain = chainable([]);
    mockOtcgs.select.mockImplementation(() => selectChain);
    mockOtcgs.insert.mockImplementation(() => insertChain);
    mockOtcgs.update.mockImplementation(() => updateChain);
  });

  // -----------------------------------------------------------------------
  // getStoreSettings
  // -----------------------------------------------------------------------
  describe('getStoreSettings', () => {
    it('should return store settings from existing row', async () => {
      const result = await getStoreSettings();

      expect(result).toBeDefined();
      expect(result.companyName).toBe('Test Store');
      expect(result.ein).toBe('12-3456789');
    });

    it('should create settings row if none exists', async () => {
      // First select returns empty (no row), second returns the created row
      const emptyChain = chainable([]);
      let callIndex = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIndex++;
        return callIndex === 1 ? emptyChain : selectChain;
      });

      const result = await getStoreSettings();

      expect(mockOtcgs.insert).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should return null fields when not set', async () => {
      selectChain = chainable([
        fakeSettingsRow({
          companyName: null,
          ein: null,
        }),
      ]);
      mockOtcgs.select.mockImplementation(() => selectChain);

      const result = await getStoreSettings();

      expect(result.companyName).toBeNull();
      expect(result.ein).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // updateStoreSettings
  // -----------------------------------------------------------------------
  describe('updateStoreSettings', () => {
    it('should update company name', async () => {
      const result = await updateStoreSettings({ companyName: 'New Store Name' }, 'admin-1');

      expect(mockOtcgs.update).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.companyName).toBe('Test Store'); // Returns from the mock select
    });

    it('should update ein field', async () => {
      await updateStoreSettings(
        {
          ein: '98-7654321',
        },
        'admin-1',
      );

      expect(mockOtcgs.update).toHaveBeenCalled();
      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.ein).toBe('98-7654321');
    });

    it('should set updatedBy and updatedAt', async () => {
      await updateStoreSettings({ companyName: 'Updated' }, 'user-42');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.updatedBy).toBe('user-42');
      expect(setCall.updatedAt).toBeInstanceOf(Date);
    });

    it('should only include provided fields in update', async () => {
      await updateStoreSettings({ companyName: 'Only Name' }, 'admin-1');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.companyName).toBe('Only Name');
      // Fields not provided should not be in the update
      expect(setCall.ein).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // lookupSalesTax
  // -----------------------------------------------------------------------
  describe('lookupSalesTax', () => {
    it('should return tax rate for a valid state', async () => {
      mockGetSalesTax.mockResolvedValue({ rate: 0.06, type: 'state', currency: 'USD' });

      const result = await lookupSalesTax('US', 'MI');

      expect(result.rate).toBe(0.06);
      expect(result.type).toBe('state');
      expect(result.currency).toBe('USD');
    });

    it('should handle null currency', async () => {
      mockGetSalesTax.mockResolvedValue({ rate: 0, type: 'none' });

      const result = await lookupSalesTax('US', 'OR');

      expect(result.rate).toBe(0);
      expect(result.currency).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getBackupSettings
  // -----------------------------------------------------------------------
  describe('getBackupSettings', () => {
    it('should return backup settings', async () => {
      const result = await getBackupSettings();

      expect(result.provider).toBe('google_drive');
      expect(result.frequency).toBe('daily');
      expect(result.lastBackupAt).toBe('2025-01-15T10:00:00.000Z');
      expect(result.googleDriveConnected).toBe(true);
      expect(result.dropboxConnected).toBe(false);
      expect(result.onedriveConnected).toBe(false);
    });

    it('should return false for all providers when no tokens stored', async () => {
      selectChain = chainable([
        fakeSettingsRow({
          googleDriveRefreshToken: null,
          dropboxRefreshToken: null,
          onedriveRefreshToken: null,
        }),
      ]);
      mockOtcgs.select.mockImplementation(() => selectChain);

      const result = await getBackupSettings();

      expect(result.googleDriveConnected).toBe(false);
      expect(result.dropboxConnected).toBe(false);
      expect(result.onedriveConnected).toBe(false);
    });

    it('should return null lastBackupAt when no backup has been made', async () => {
      selectChain = chainable([fakeSettingsRow({ lastBackupAt: null })]);
      mockOtcgs.select.mockImplementation(() => selectChain);

      const result = await getBackupSettings();

      expect(result.lastBackupAt).toBeNull();
    });

    it('should return googleDriveHasClientSecret as true when secret is stored', async () => {
      selectChain = chainable([fakeSettingsRow({ googleDriveClientSecret: 'encrypted:secret' })]);
      mockOtcgs.select.mockImplementation(() => selectChain);

      const result = await getBackupSettings();

      expect(result.googleDriveHasClientSecret).toBe(true);
    });

    it('should return googleDriveHasClientSecret as false when no secret', async () => {
      const result = await getBackupSettings();

      expect(result.googleDriveHasClientSecret).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // updateBackupSettings
  // -----------------------------------------------------------------------
  describe('updateBackupSettings', () => {
    it('should update backup provider', async () => {
      await updateBackupSettings({ provider: 'dropbox' }, 'admin-1');

      expect(mockOtcgs.update).toHaveBeenCalled();
      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.backupProvider).toBe('dropbox');
    });

    it('should update backup frequency', async () => {
      await updateBackupSettings({ frequency: 'weekly' }, 'admin-1');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.backupFrequency).toBe('weekly');
    });

    it('should only include provided fields', async () => {
      await updateBackupSettings({ provider: 'onedrive' }, 'admin-1');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.backupProvider).toBe('onedrive');
      expect(setCall.backupFrequency).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // getIntegrationSettings
  // -----------------------------------------------------------------------
  describe('getIntegrationSettings', () => {
    it('should return integration settings', async () => {
      const result = await getIntegrationSettings();

      expect(result.stripe.enabled).toBe(true);
      expect(result.stripe.hasApiKey).toBe(true);
      expect(result.shopify.enabled).toBe(false);
      expect(result.shopify.hasApiKey).toBe(false);
      expect(result.shopify.shopDomain).toBeNull();
    });

    it('should detect when all integrations are enabled', async () => {
      selectChain = chainable([
        fakeSettingsRow({
          stripeEnabled: true,
          stripeApiKey: 'encrypted:key',
          shopifyEnabled: true,
          shopifyApiKey: 'encrypted:key',
          shopifyShopDomain: 'test.myshopify.com',
        }),
      ]);
      mockOtcgs.select.mockImplementation(() => selectChain);

      const result = await getIntegrationSettings();

      expect(result.stripe.enabled).toBe(true);
      expect(result.stripe.hasApiKey).toBe(true);
      expect(result.shopify.enabled).toBe(true);
      expect(result.shopify.hasApiKey).toBe(true);
      expect(result.shopify.shopDomain).toBe('test.myshopify.com');
    });
  });

  // -----------------------------------------------------------------------
  // updateStripeIntegration
  // -----------------------------------------------------------------------
  describe('updateStripeIntegration', () => {
    it('should update stripe enabled status', async () => {
      await updateStripeIntegration({ enabled: true }, 'admin-1');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.stripeEnabled).toBe(true);
    });

    it('should encrypt API key when provided', async () => {
      await updateStripeIntegration({ apiKey: 'sk_test_new' }, 'admin-1');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.stripeApiKey).toBe('encrypted:sk_test_new');
    });

    it('should set API key to null when null is provided', async () => {
      await updateStripeIntegration({ apiKey: null }, 'admin-1');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.stripeApiKey).toBeNull();
    });

    it('should not update enabled when null is provided', async () => {
      await updateStripeIntegration({ enabled: null }, 'admin-1');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.stripeEnabled).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // updateShopifyIntegration
  // -----------------------------------------------------------------------
  describe('updateShopifyIntegration', () => {
    it('should update shopify enabled and domain', async () => {
      await updateShopifyIntegration({ enabled: true, shopDomain: 'test.myshopify.com' }, 'admin-1');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.shopifyEnabled).toBe(true);
      expect(setCall.shopifyShopDomain).toBe('test.myshopify.com');
    });

    it('should encrypt API key when provided', async () => {
      await updateShopifyIntegration({ apiKey: 'shpat_abc123' }, 'admin-1');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.shopifyApiKey).toBe('encrypted:shpat_abc123');
    });
  });

  // -----------------------------------------------------------------------
  // OAuth Token Management
  // -----------------------------------------------------------------------
  describe('storeOAuthTokens', () => {
    it('should store Google Drive tokens (encrypted)', async () => {
      await storeOAuthTokens('google_drive', 'access-token', 'refresh-token');

      expect(mockOtcgs.update).toHaveBeenCalled();
      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.googleDriveAccessToken).toBe('encrypted:access-token');
      expect(setCall.googleDriveRefreshToken).toBe('encrypted:refresh-token');
    });

    it('should store Dropbox tokens (encrypted)', async () => {
      await storeOAuthTokens('dropbox', 'dbx-access', 'dbx-refresh');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.dropboxAccessToken).toBe('encrypted:dbx-access');
      expect(setCall.dropboxRefreshToken).toBe('encrypted:dbx-refresh');
    });

    it('should store OneDrive tokens (encrypted)', async () => {
      await storeOAuthTokens('onedrive', 'od-access', 'od-refresh');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.onedriveAccessToken).toBe('encrypted:od-access');
      expect(setCall.onedriveRefreshToken).toBe('encrypted:od-refresh');
    });
  });

  describe('getOAuthTokens', () => {
    it('should return decrypted Google Drive tokens', async () => {
      const result = await getOAuthTokens('google_drive');

      expect(result.accessToken).toBe('gd-access');
      expect(result.refreshToken).toBe('gd-refresh');
    });

    it('should return null tokens for Dropbox when not connected', async () => {
      const result = await getOAuthTokens('dropbox');

      expect(result.accessToken).toBeNull();
      expect(result.refreshToken).toBeNull();
    });

    it('should return null tokens for OneDrive when not connected', async () => {
      const result = await getOAuthTokens('onedrive');

      expect(result.accessToken).toBeNull();
      expect(result.refreshToken).toBeNull();
    });
  });

  describe('clearOAuthTokens', () => {
    it('should clear Google Drive tokens and client secret', async () => {
      await clearOAuthTokens('google_drive');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.googleDriveClientSecret).toBeNull();
      expect(setCall.googleDriveAccessToken).toBeNull();
      expect(setCall.googleDriveRefreshToken).toBeNull();
    });

    it('should clear Dropbox tokens', async () => {
      await clearOAuthTokens('dropbox');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.dropboxAccessToken).toBeNull();
      expect(setCall.dropboxRefreshToken).toBeNull();
    });

    it('should clear OneDrive tokens', async () => {
      await clearOAuthTokens('onedrive');

      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.onedriveAccessToken).toBeNull();
      expect(setCall.onedriveRefreshToken).toBeNull();
    });
  });

  describe('updateLastBackupAt', () => {
    it('should update lastBackupAt timestamp', async () => {
      await updateLastBackupAt();

      expect(mockOtcgs.update).toHaveBeenCalled();
      const setCall = (updateChain.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(setCall.lastBackupAt).toBeInstanceOf(Date);
      expect(setCall.updatedAt).toBeInstanceOf(Date);
    });
  });
});
