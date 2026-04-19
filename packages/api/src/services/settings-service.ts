import { eq } from 'drizzle-orm';
import { otcgs } from '../db/otcgs/index';
import { companySettings } from '../db/otcgs/company-settings-schema';
import { encrypt, encryptIfPresent, decryptIfPresent } from '../lib/encryption';
import SalesTax from 'sales-tax';

import { formatDate } from '../lib/date-utils';
import type { BackupProvider } from '../schema/types.generated';

/**
 * Ensure the single settings row exists. Returns the row.
 */
async function ensureSettingsRow() {
  const [existing] = await otcgs.select().from(companySettings).where(eq(companySettings.id, 1)).limit(1);

  if (existing) return existing;

  // Create the initial row
  const [created] = await otcgs
    .insert(companySettings)
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

  await otcgs.update(companySettings).set(updates).where(eq(companySettings.id, 1));

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
  provider: BackupProvider | null;
  frequency: string | null;
  lastBackupAt: string | null;
  googleDriveConnected: boolean;
  dropboxConnected: boolean;
  onedriveConnected: boolean;
  googleDriveClientId: string | null;
  dropboxClientId: string | null;
  onedriveClientId: string | null;
}

export async function getBackupSettings(): Promise<BackupSettingsResult> {
  const row = await ensureSettingsRow();
  return {
    provider: row.backupProvider as BackupProvider | null,
    frequency: row.backupFrequency,
    lastBackupAt: formatDate(row.lastBackupAt),
    googleDriveConnected: !!row.googleDriveRefreshToken,
    dropboxConnected: !!row.dropboxRefreshToken,
    onedriveConnected: !!row.onedriveRefreshToken,
    googleDriveClientId: decryptIfPresent(row.googleDriveClientId),
    dropboxClientId: decryptIfPresent(row.dropboxClientId),
    onedriveClientId: decryptIfPresent(row.onedriveClientId),
  };
}

export interface UpdateBackupSettingsInput {
  provider?: string | null;
  frequency?: string | null;
  googleDriveClientId?: string | null;
  dropboxClientId?: string | null;
  onedriveClientId?: string | null;
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
  if (input.googleDriveClientId !== undefined)
    updates.googleDriveClientId = encryptIfPresent(input.googleDriveClientId);
  if (input.dropboxClientId !== undefined) updates.dropboxClientId = encryptIfPresent(input.dropboxClientId);
  if (input.onedriveClientId !== undefined) updates.onedriveClientId = encryptIfPresent(input.onedriveClientId);

  await otcgs.update(companySettings).set(updates).where(eq(companySettings.id, 1));

  return getBackupSettings();
}

// ---------------------------------------------------------------------------
// Integration Settings
// ---------------------------------------------------------------------------

export interface IntegrationSettingsResult {
  stripe: { enabled: boolean; hasApiKey: boolean; hasPublishableKey: boolean };
  shopify: { enabled: boolean; hasApiKey: boolean; shopDomain: string | null };
}

export async function getIntegrationSettings(): Promise<IntegrationSettingsResult> {
  const row = await ensureSettingsRow();
  return {
    stripe: {
      enabled: !!row.stripeEnabled,
      hasApiKey: !!row.stripeApiKey,
      hasPublishableKey: !!row.stripePublishableKey,
    },
    shopify: {
      enabled: !!row.shopifyEnabled,
      hasApiKey: !!row.shopifyApiKey,
      shopDomain: row.shopifyShopDomain,
    },
  };
}

export interface UpdateStripeInput {
  enabled?: boolean | null;
  apiKey?: string | null;
  publishableKey?: string | null;
}

export async function updateStripeIntegration(
  input: UpdateStripeInput,
  userId: string,
): Promise<{ enabled: boolean; hasApiKey: boolean; hasPublishableKey: boolean }> {
  await ensureSettingsRow();

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: userId,
  };

  if (input.enabled !== undefined && input.enabled !== null) updates.stripeEnabled = input.enabled;
  if (input.apiKey !== undefined) {
    updates.stripeApiKey = encryptIfPresent(input.apiKey);
  }
  if (input.publishableKey !== undefined) {
    // Publishable key is not encrypted — it's meant to be exposed client-side
    updates.stripePublishableKey = input.publishableKey?.trim() || null;
  }

  await otcgs.update(companySettings).set(updates).where(eq(companySettings.id, 1));

  const row = await ensureSettingsRow();
  return {
    enabled: !!row.stripeEnabled,
    hasApiKey: !!row.stripeApiKey,
    hasPublishableKey: !!row.stripePublishableKey,
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

  await otcgs.update(companySettings).set(updates).where(eq(companySettings.id, 1));

  const row = await ensureSettingsRow();
  return {
    enabled: !!row.shopifyEnabled,
    hasApiKey: !!row.shopifyApiKey,
    shopDomain: row.shopifyShopDomain,
  };
}

// ---------------------------------------------------------------------------
// OAuth Client ID Management (used by backup-service)
// ---------------------------------------------------------------------------

export async function storeOAuthClientId(
  provider: 'google_drive' | 'dropbox' | 'onedrive',
  clientId: string,
): Promise<void> {
  await ensureSettingsRow();

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  switch (provider) {
    case 'google_drive':
      updates.googleDriveClientId = encrypt(clientId);
      break;
    case 'dropbox':
      updates.dropboxClientId = encrypt(clientId);
      break;
    case 'onedrive':
      updates.onedriveClientId = encrypt(clientId);
      break;
  }

  await otcgs.update(companySettings).set(updates).where(eq(companySettings.id, 1));
}

export async function getOAuthClientId(provider: 'google_drive' | 'dropbox' | 'onedrive'): Promise<string | null> {
  const row = await ensureSettingsRow();

  switch (provider) {
    case 'google_drive':
      return decryptIfPresent(row.googleDriveClientId);
    case 'dropbox':
      return decryptIfPresent(row.dropboxClientId);
    case 'onedrive':
      return decryptIfPresent(row.onedriveClientId);
  }
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

  await otcgs.update(companySettings).set(updates).where(eq(companySettings.id, 1));
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
      updates.googleDriveClientId = null;
      updates.googleDriveAccessToken = null;
      updates.googleDriveRefreshToken = null;
      break;
    case 'dropbox':
      updates.dropboxClientId = null;
      updates.dropboxAccessToken = null;
      updates.dropboxRefreshToken = null;
      break;
    case 'onedrive':
      updates.onedriveClientId = null;
      updates.onedriveAccessToken = null;
      updates.onedriveRefreshToken = null;
      break;
  }

  await otcgs.update(companySettings).set(updates).where(eq(companySettings.id, 1));
}

export async function updateLastBackupAt(): Promise<void> {
  await ensureSettingsRow();
  await otcgs
    .update(companySettings)
    .set({ lastBackupAt: new Date(), updatedAt: new Date() })
    .where(eq(companySettings.id, 1));
}
