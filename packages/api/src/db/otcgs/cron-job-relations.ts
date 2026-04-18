import { relations } from 'drizzle-orm/relations';
import { cronJob } from './cron-job-schema';
import { cronJobRun } from './cron-job-run-schema';

export const cronJobRelations = relations(cronJob, ({ many }) => ({
  runs: many(cronJobRun),
}));

export const cronJobRunRelations = relations(cronJobRun, ({ one }) => ({
  job: one(cronJob, {
    fields: [cronJobRun.cronJobId],
    references: [cronJob.id],
  }),
}));
