import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const event = sqliteTable(
  'event',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    organizationId: text('organization_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    eventType: text('event_type').notNull(), // tournament, casual_play, release_event, draft, prerelease, league, other
    categoryId: integer('category_id'), // Optional FK to tcg-data category for game association
    startTime: integer('start_time', { mode: 'timestamp_ms' }).notNull(),
    endTime: integer('end_time', { mode: 'timestamp_ms' }),
    capacity: integer('capacity'), // null = unlimited
    entryFeeInCents: integer('entry_fee_in_cents'), // informational only, null = free
    status: text('status').notNull().default('scheduled'), // scheduled, cancelled, completed
    recurrenceRule: text('recurrence_rule'), // JSON: { frequency: 'weekly'|'biweekly'|'monthly' }. Only on template event.
    recurrenceGroupId: text('recurrence_group_id'), // UUID linking recurring instances
    isRecurrenceTemplate: integer('is_recurrence_template', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    createdBy: text('created_by'), // FK to user.id
  },
  (table) => [
    index('event_organization_id_idx').on(table.organizationId),
    index('event_start_time_idx').on(table.startTime),
    index('event_status_idx').on(table.status),
    index('event_recurrence_group_id_idx').on(table.recurrenceGroupId),
  ],
);
