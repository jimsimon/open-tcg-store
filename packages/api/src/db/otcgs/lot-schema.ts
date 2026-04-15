import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, foreignKey, index } from 'drizzle-orm/sqlite-core';
import { user } from './auth-schema';

export const lot = sqliteTable(
  'lot',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    organizationId: text('organization_id').notNull(),
    name: text('name').notNull(),
    description: text('description', { length: 2000 }),
    amountPaid: integer('amount_paid').notNull(), // cents
    acquisitionDate: text('acquisition_date').notNull(), // YYYY-MM-DD
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
    index('lot_org_id_idx').on(table.organizationId),
    index('lot_created_at_idx').on(table.createdAt),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: 'lot_created_by_fkey',
    }),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [user.id],
      name: 'lot_updated_by_fkey',
    }),
  ],
);
