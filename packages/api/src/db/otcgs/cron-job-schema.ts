import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const cronJob = sqliteTable(
  'cron_job',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    displayName: text('display_name').notNull(),
    description: text('description'),
    cronExpression: text('cron_expression').notNull(),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    lastRunAt: integer('last_run_at', { mode: 'timestamp_ms' }),
    lastRunStatus: text('last_run_status'), // 'success' | 'failure' | 'running'
    lastRunDurationMs: integer('last_run_duration_ms'),
    lastRunError: text('last_run_error'),
    nextRunAt: integer('next_run_at', { mode: 'timestamp_ms' }),
    config: text('config'), // JSON blob for job-specific settings
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [uniqueIndex('cron_job_name_uniq').on(table.name)],
);
