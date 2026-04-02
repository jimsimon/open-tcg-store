import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const storeHours = sqliteTable(
  'store_hours',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    organizationId: text('organization_id').notNull(),
    dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday through 6=Saturday
    openTime: text('open_time'), // HH:MM format, null = closed
    closeTime: text('close_time'), // HH:MM format, null = closed
  },
  (table) => [
    uniqueIndex('store_hours_org_day_uniq').on(table.organizationId, table.dayOfWeek),
    index('store_hours_organization_id_idx').on(table.organizationId),
  ],
);
