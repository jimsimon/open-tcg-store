import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, foreignKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './auth-schema';
import { inventoryItem } from './inventory-schema';

export const barcode = sqliteTable(
  'barcode',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    organizationId: text('organization_id').notNull(),
    inventoryItemId: integer('inventory_item_id').notNull(),
    code: text('code').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    createdBy: text('created_by'),
    updatedBy: text('updated_by'),
  },
  (table) => [
    uniqueIndex('barcode_org_code_uniq').on(table.organizationId, table.code),
    index('barcode_org_id_idx').on(table.organizationId),
    index('barcode_inventory_item_idx').on(table.inventoryItemId),
    foreignKey({
      columns: [table.inventoryItemId],
      foreignColumns: [inventoryItem.id],
      name: 'barcode_inventory_item_id_fkey',
    }),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: 'barcode_created_by_fkey',
    }),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [user.id],
      name: 'barcode_updated_by_fkey',
    }),
  ],
);
