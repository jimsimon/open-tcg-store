import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const storeSupportedGame = sqliteTable(
  'store_supported_game',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    organizationId: text('organization_id').notNull(),
    categoryId: integer('category_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('store_supported_game_org_category_idx').on(table.organizationId, table.categoryId),
    index('store_supported_game_org_id_idx').on(table.organizationId),
    index('store_supported_game_category_id_idx').on(table.categoryId),
  ],
);
