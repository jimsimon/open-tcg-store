import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, foreignKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './auth-schema';

export const inventoryItem = sqliteTable(
  'inventory_item',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    organizationId: text('organization_id').notNull(),
    productId: integer('product_id').notNull(),
    condition: text('condition').notNull(), // NM, LP, MP, HP, D
    price: real('price').notNull(),
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
    uniqueIndex('inventory_item_org_product_condition_idx').on(table.organizationId, table.productId, table.condition),
    index('inventory_item_org_id_idx').on(table.organizationId),
    index('inventory_item_product_id_idx').on(table.productId),
    index('inventory_item_condition_idx').on(table.condition),
    index('inventory_item_price_idx').on(table.price),
    index('inventory_item_created_at_idx').on(table.createdAt),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: 'inventory_item_created_by_fkey',
    }),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [user.id],
      name: 'inventory_item_updated_by_fkey',
    }),
  ],
);
