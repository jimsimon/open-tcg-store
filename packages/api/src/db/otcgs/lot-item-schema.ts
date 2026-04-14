import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, foreignKey, index } from 'drizzle-orm/sqlite-core';
import { lot } from './lot-schema';
import { inventoryItemStock } from './inventory-stock-schema';

export const lotItem = sqliteTable(
  'lot_item',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    lotId: integer('lot_id').notNull(),
    productId: integer('product_id').notNull(),
    condition: text('condition'), // NM, LP, MP, HP, D — only for singles
    quantity: integer('quantity').notNull(),
    costBasis: real('cost_basis').notNull(),
    costOverridden: integer('cost_overridden').notNull().default(0), // boolean
    inventoryItemStockId: integer('inventory_item_stock_id'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index('lot_item_lot_id_idx').on(table.lotId),
    index('lot_item_stock_id_idx').on(table.inventoryItemStockId),
    foreignKey({
      columns: [table.lotId],
      foreignColumns: [lot.id],
      name: 'lot_item_lot_id_fkey',
    }),
    foreignKey({
      columns: [table.inventoryItemStockId],
      foreignColumns: [inventoryItemStock.id],
      name: 'lot_item_stock_id_fkey',
    }),
  ],
);
