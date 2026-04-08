import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const buyRate = sqliteTable(
  'buy_rate',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    organizationId: text('organization_id').notNull(),
    categoryId: integer('category_id').notNull(),
    description: text('description').notNull(),
    rate: real('rate').notNull(),
    type: text('type').notNull().default('fixed'), // 'fixed' or 'percentage'
    rarity: text('rarity'), // set for rarity-default entries
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index('buy_rate_org_category_idx').on(table.organizationId, table.categoryId),
    index('buy_rate_org_id_idx').on(table.organizationId),
    index('buy_rate_category_id_idx').on(table.categoryId),
    index('buy_rate_sort_order_idx').on(table.sortOrder),
  ],
);
