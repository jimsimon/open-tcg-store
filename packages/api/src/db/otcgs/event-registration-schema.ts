import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, foreignKey } from 'drizzle-orm/sqlite-core';
import { event } from './event-schema';

export const eventRegistration = sqliteTable(
  'event_registration',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    eventId: integer('event_id').notNull(),
    registrantName: text('registrant_name').notNull(),
    registrantEmail: text('registrant_email'),
    registrantPhone: text('registrant_phone'),
    status: text('status').notNull().default('registered'), // registered, cancelled
    checkedIn: integer('checked_in', { mode: 'boolean' }).default(false),
    checkedInAt: integer('checked_in_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    createdBy: text('created_by'), // FK to user.id, null for anonymous self-registrations
  },
  (table) => [
    index('event_registration_event_status_idx').on(table.eventId, table.status),
    foreignKey({
      columns: [table.eventId],
      foreignColumns: [event.id],
      name: 'event_registration_event_id_fkey',
    }),
  ],
);
