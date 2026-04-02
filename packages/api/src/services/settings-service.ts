import { eq } from 'drizzle-orm';
import { otcgs } from '../db/otcgs/index';
import { storeSettings } from '../db/otcgs/settings-schema';
import { encrypt, encryptIfPresent, decryptIfPresent } from '../lib/encryption';
import SalesTax from 'sales-tax';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

/**
 * Ensure the single settings row exists. Returns the row.
 */
async function ensureSettingsRow() {
  const [existing] = await otcgs.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);

  if (existing) return existing;

  // Create the initial row
  const [created] = await otcgs
    .insert(storeSettings)
    .values({
      id: 1,
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

// ---------------------------------------------------------------------------
// Store Settings
// ---------------------------------------------------------------------------

export interface StoreSettingsResult {
  companyName: string | null;
  ein: string | null;
}

export async function getStoreSettings(): Promise<StoreSettingsResult> {
  const row = await ensureSettingsRow();
  return {
    companyName: row.companyName,
    ein: row.ein,
  };
}

export interface UpdateStoreSettingsInput {
  companyName?: string | null;
  ein?: string | null;
}

export async function updateStoreSettings(
  input: UpdateStoreSettingsInput,
  userId: string,
): Promise<StoreSettingsResult> {
  await ensureSettingsRow();

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: userId,
  };

  if (input.companyName !== undefined) updates.companyName = input.companyName;
  if (input.ein !== undefined) updates.ein = input.ein;

  await otcgs.update(storeSettings).set(updates).where(eq(storeSettings.id, 1));

  return getStoreSettings();
}

// ---------------------------------------------------------------------------
// Sales Tax Lookup
// ---------------------------------------------------------------------------

export interface SalesTaxResult {
  rate: number;
  type: string;
  currency: string | null;
}

export async function lookupSalesTax(countryCode: string, stateCode: string): Promise<SalesTaxResult> {
  const tax = await SalesTax.getSalesTax(countryCode, stateCode);
  return {
    rate: tax.rate,
    type: tax.type,
    currency: tax.currency ?? null,
  };
}

// ---------------------------------------------------------------------------
// Backup Settings
// ---------------------------------------------------------------------------

export interface BackupSettingsResult {
  provider: string | null;
  frequency: string | null;
  lastBackupAt: string | null;
  googleDriveConnected: boolean;
  dropboxConnected: boolean;
  onedriveConnected: boolean;
}

export async function getBackupSettings(): Promise<BackupSettingsResult> {
  const row = await ensureSettingsRow();
  return {
    provider: row.backupProvider,
    frequency: row.backupFrequency,
    lastBackupAt: formatDate(row.lastBackupAt),
    googleDriveConnected: !!row.googleDriveRefreshToken,
    dropboxConnected: !!row.dropboxRefreshToken,
    onedriveConnected: !!row.onedriveRefreshToken,
  };
}

export interface UpdateBackupSettingsInput {
  provider?: string | null;
  frequency?: string | null;
}

export async function updateBackupSettings(
  input: UpdateBackupSettingsInput,
  userId: string,
): Promise<BackupSettingsResult> {
  await ensureSettingsRow();

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: userId,
  };

  if (input.provider !== undefined) updates.backupProvider = input.provider;
  if (input.frequency !== undefined) updates.backupFrequency = input.frequency;

  await otcgs.update(storeSettings).set(updates).where(eq(storeSettings.id, 1));

  return getBackupSettings();
}

// ---------------------------------------------------------------------------
// Integration Settings
// ---------------------------------------------------------------------------

export interface IntegrationSettingsResult {
  stripe: { enabled: boolean; hasApiKey: boolean };
  shopify: { enabled: boolean; hasApiKey: boolean; shopDomain: string | null };
  quickbooks: { enabled: boolean; hasClientId: boolean; hasClientSecret: boolean };
}

export async function getIntegrationSettings(): Promise<IntegrationSettingsResult> {
  const row = await ensureSettingsRow();
  return {
    stripe: {
      enabled: !!row.stripeEnabled,
      hasApiKey: !!row.stripeApiKey,
    },
    shopify: {
      enabled: !!row.shopifyEnabled,
      hasApiKey: !!row.shopifyApiKey,
      shopDomain: row.shopifyShopDomain,
    },
    quickbooks: {
      enabled: !!row.quickbooksEnabled,
      hasClientId: !!row.quickbooksClientId,
      hasClientSecret: !!row.quickbooksClientSecret,
    },
  };
}

export interface UpdateStripeInput {
  enabled?: boolean | null;
  apiKey?: string | null;
}

export async function updateStripeIntegration(
  input: UpdateStripeInput,
  userId: string,
): Promise<{ enabled: boolean; hasApiKey: boolean }> {
  await ensureSettingsRow();

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: userId,
  };

  if (input.enabled !== undefined && input.enabled !== null) updates.stripeEnabled = input.enabled;
  if (input.apiKey !== undefined) {
    updates.stripeApiKey = encryptIfPresent(input.apiKey);
  }

  await otcgs.update(storeSettings).set(updates).where(eq(storeSettings.id, 1));

  const row = await ensureSettingsRow();
  return {
    enabled: !!row.stripeEnabled,
    hasApiKey: !!row.stripeApiKey,
  };
}

export interface UpdateShopifyInput {
  enabled?: boolean | null;
  apiKey?: string | null;
  shopDomain?: string | null;
}

export async function updateShopifyIntegration(
  input: UpdateShopifyInput,
  userId: string,
): Promise<{ enabled: boolean; hasApiKey: boolean; shopDomain: string | null }> {
  await ensureSettingsRow();

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: userId,
  };

  if (input.enabled !== undefined && input.enabled !== null) updates.shopifyEnabled = input.enabled;
  if (input.apiKey !== undefined) {
    updates.shopifyApiKey = encryptIfPresent(input.apiKey);
  }
  if (input.shopDomain !== undefined) updates.shopifyShopDomain = input.shopDomain;

  await otcgs.update(storeSettings).set(updates).where(eq(storeSettings.id, 1));

  const row = await ensureSettingsRow();
  return {
    enabled: !!row.shopifyEnabled,
    hasApiKey: !!row.shopifyApiKey,
    shopDomain: row.shopifyShopDomain,
  };
}

export interface UpdateQuickBooksInput {
  enabled?: boolean | null;
  clientId?: string | null;
  clientSecret?: string | null;
}

export async function updateQuickBooksIntegration(
  input: UpdateQuickBooksInput,
  userId: string,
): Promise<{ enabled: boolean; hasClientId: boolean; hasClientSecret: boolean }> {
  await ensureSettingsRow();

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: userId,
  };

  if (input.enabled !== undefined && input.enabled !== null) updates.quickbooksEnabled = input.enabled;
  if (input.clientId !== undefined) updates.quickbooksClientId = input.clientId;
  if (input.clientSecret !== undefined) {
    updates.quickbooksClientSecret = encryptIfPresent(input.clientSecret);
  }

  await otcgs.update(storeSettings).set(updates).where(eq(storeSettings.id, 1));

  const row = await ensureSettingsRow();
  return {
    enabled: !!row.quickbooksEnabled,
    hasClientId: !!row.quickbooksClientId,
    hasClientSecret: !!row.quickbooksClientSecret,
  };
}

// ---------------------------------------------------------------------------
// OAuth Token Management (used by backup-service)
// ---------------------------------------------------------------------------

export async function storeOAuthTokens(
  provider: 'google_drive' | 'dropbox' | 'onedrive',
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await ensureSettingsRow();

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  switch (provider) {
    case 'google_drive':
      updates.googleDriveAccessToken = encrypt(accessToken);
      updates.googleDriveRefreshToken = encrypt(refreshToken);
      break;
    case 'dropbox':
      updates.dropboxAccessToken = encrypt(accessToken);
      updates.dropboxRefreshToken = encrypt(refreshToken);
      break;
    case 'onedrive':
      updates.onedriveAccessToken = encrypt(accessToken);
      updates.onedriveRefreshToken = encrypt(refreshToken);
      break;
  }

  await otcgs.update(storeSettings).set(updates).where(eq(storeSettings.id, 1));
}

export async function getOAuthTokens(
  provider: 'google_drive' | 'dropbox' | 'onedrive',
): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const row = await ensureSettingsRow();

  switch (provider) {
    case 'google_drive':
      return {
        accessToken: decryptIfPresent(row.googleDriveAccessToken),
        refreshToken: decryptIfPresent(row.googleDriveRefreshToken),
      };
    case 'dropbox':
      return {
        accessToken: decryptIfPresent(row.dropboxAccessToken),
        refreshToken: decryptIfPresent(row.dropboxRefreshToken),
      };
    case 'onedrive':
      return {
        accessToken: decryptIfPresent(row.onedriveAccessToken),
        refreshToken: decryptIfPresent(row.onedriveRefreshToken),
      };
  }
}

export async function clearOAuthTokens(provider: 'google_drive' | 'dropbox' | 'onedrive'): Promise<void> {
  await ensureSettingsRow();

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  switch (provider) {
    case 'google_drive':
      updates.googleDriveAccessToken = null;
      updates.googleDriveRefreshToken = null;
      break;
    case 'dropbox':
      updates.dropboxAccessToken = null;
      updates.dropboxRefreshToken = null;
      break;
    case 'onedrive':
      updates.onedriveAccessToken = null;
      updates.onedriveRefreshToken = null;
      break;
  }

  await otcgs.update(storeSettings).set(updates).where(eq(storeSettings.id, 1));
}

export async function updateLastBackupAt(): Promise<void> {
  await ensureSettingsRow();
  await otcgs
    .update(storeSettings)
    .set({ lastBackupAt: new Date(), updatedAt: new Date() })
    .where(eq(storeSettings.id, 1));
}
