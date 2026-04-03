import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, foreignKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { inventoryItem } from './inventory-schema';
import { user } from './auth-schema';

export const inventoryItemStock = sqliteTable(
  'inventory_item_stock',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    inventoryItemId: integer('inventory_item_id').notNull(),
    quantity: integer('quantity').notNull().default(0),
    costBasis: real('cost_basis').notNull().default(0),
    acquisitionDate: text('acquisition_date').notNull(), // YYYY-MM-DD
    notes: text('notes', { length: 1000 }),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    createdBy: text('created_by'),
    updatedBy: text('updated_by'),
  },
  (table) => [
    uniqueIndex('inventory_stock_item_cost_acqdate_idx').on(
      table.inventoryItemId,
      table.costBasis,
      table.acquisitionDate,
    ),
    index('inventory_stock_item_id_idx').on(table.inventoryItemId),
    index('inventory_stock_cost_basis_idx').on(table.costBasis),
    index('inventory_stock_acq_date_idx').on(table.acquisitionDate),
    index('inventory_stock_deleted_at_idx').on(table.deletedAt),
    index('inventory_stock_created_at_idx').on(table.createdAt),
    foreignKey({
      columns: [table.inventoryItemId],
      foreignColumns: [inventoryItem.id],
      name: 'inventory_stock_item_id_fkey',
    }),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: 'inventory_stock_created_by_fkey',
    }),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [user.id],
      name: 'inventory_stock_updated_by_fkey',
    }),
  ],
);
