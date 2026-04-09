import { sql } from 'drizzle-orm';
import { sqliteTable, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const storeSupportedGame = sqliteTable(
  'store_supported_game',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    categoryId: integer('category_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [uniqueIndex('store_supported_game_category_idx').on(table.categoryId)],
);
