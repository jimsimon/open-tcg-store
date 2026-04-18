import { formatDate } from '../../../lib/date-utils';
import type { cronJob } from '../../../db/otcgs/cron-job-schema';
import type { cronJobRun } from '../../../db/otcgs/cron-job-run-schema';

export function formatCronJob(j: typeof cronJob.$inferSelect) {
  return {
    ...j,
    createdAt: formatDate(j.createdAt) ?? new Date().toISOString(),
    updatedAt: formatDate(j.updatedAt) ?? new Date().toISOString(),
    lastRunAt: formatDate(j.lastRunAt),
    nextRunAt: formatDate(j.nextRunAt),
  };
}

export function formatCronJobRun(r: typeof cronJobRun.$inferSelect) {
  return {
    ...r,
    startedAt: formatDate(r.startedAt) ?? new Date().toISOString(),
    completedAt: formatDate(r.completedAt),
    createdAt: formatDate(r.createdAt) ?? new Date().toISOString(),
  };
}
