import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, foreignKey } from 'drizzle-orm/sqlite-core';
import { cronJob } from './cron-job-schema';

export const cronJobRun = sqliteTable(
  'cron_job_run',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cronJobId: integer('cron_job_id').notNull(),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    durationMs: integer('duration_ms'),
    status: text('status').notNull(), // 'success' | 'failure'
    error: text('error'),
    summary: text('summary'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index('cron_job_run_cron_job_id_idx').on(table.cronJobId),
    index('cron_job_run_started_at_idx').on(table.startedAt),
    foreignKey({
      columns: [table.cronJobId],
      foreignColumns: [cronJob.id],
      name: 'cron_job_run_cron_job_id_fkey',
    }),
  ],
);
