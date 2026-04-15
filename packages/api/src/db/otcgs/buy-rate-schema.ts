import { sql } from 'drizzle-orm';
import { sqliteTable, integer, real, text, index } from 'drizzle-orm/sqlite-core';

export const buyRate = sqliteTable(
  'buy_rate',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    categoryId: integer('category_id').notNull(),
    description: text('description').notNull(),
    fixedRateCents: integer('fixed_rate_cents'), // cents — non-null when type='fixed'
    percentageRate: real('percentage_rate'), // 0.0–1.0 — non-null when type='percentage'
    type: text('type').notNull().default('fixed'), // 'fixed' or 'percentage'
    rarity: text('rarity'), // set for rarity-default entries
    hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index('buy_rate_category_id_idx').on(table.categoryId),
    index('buy_rate_sort_order_idx').on(table.sortOrder),
  ],
);
