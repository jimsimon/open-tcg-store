import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const companySettings = sqliteTable('company_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Company Info (address/tax moved to store_location)
  companyName: text('company_name'),
  ein: text('ein'),

  // Backup Settings
  backupProvider: text('backup_provider'),
  backupFrequency: text('backup_frequency'),
  lastBackupAt: integer('last_backup_at', { mode: 'timestamp_ms' }),

  // Integration: Stripe
  stripeEnabled: integer('stripe_enabled', { mode: 'boolean' }).default(false),
  stripeApiKey: text('stripe_api_key'),

  // Integration: Shopify
  shopifyEnabled: integer('shopify_enabled', { mode: 'boolean' }).default(false),
  shopifyApiKey: text('shopify_api_key'),
  shopifyShopDomain: text('shopify_shop_domain'),

  // OAuth Tokens (encrypted)
  googleDriveAccessToken: text('google_drive_access_token'),
  googleDriveRefreshToken: text('google_drive_refresh_token'),
  dropboxAccessToken: text('dropbox_access_token'),
  dropboxRefreshToken: text('dropbox_refresh_token'),
  onedriveAccessToken: text('onedrive_access_token'),
  onedriveRefreshToken: text('onedrive_refresh_token'),

  // Metadata
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedBy: text('updated_by'),
});
