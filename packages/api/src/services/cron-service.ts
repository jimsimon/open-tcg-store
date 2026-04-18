import { Cron } from 'croner';
import { eq, desc, count } from 'drizzle-orm';
import { otcgs } from '../db/otcgs/index.ts';
import { cronJob } from '../db/otcgs/cron-job-schema.ts';
import { cronJobRun } from '../db/otcgs/cron-job-run-schema.ts';
import { normalizePagination } from '../lib/sql-utils.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobResult = { success: boolean; summary: string; error?: string };
export type JobHandler = (config: Record<string, unknown>) => Promise<JobResult>;

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

const jobHandlers = new Map<string, JobHandler>();
const activeJobs = new Map<number, Cron>();

/** Maximum time a job can stay in "running" before being considered stale. */
const STALE_RUNNING_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// Handler registry
// ---------------------------------------------------------------------------

export function registerJobHandler(name: string, handler: JobHandler): void {
  jobHandlers.set(name, handler);
}

// ---------------------------------------------------------------------------
// Seed default jobs
// ---------------------------------------------------------------------------

interface DefaultJob {
  name: string;
  displayName: string;
  description: string;
  cronExpression: string;
  enabled: boolean;
  config: string;
}

const DEFAULT_JOBS: DefaultJob[] = [
  {
    name: 'tcg-data-update',
    displayName: 'TCG Data Update',
    description: 'Checks for TCG product data updates from the upstream release repository.',
    cronExpression: '0 3 * * *',
    enabled: true,
    config: '{}',
  },
  {
    name: 'backup',
    displayName: 'Scheduled Backup',
    description: 'Runs an automated backup to the configured cloud storage provider.',
    cronExpression: '0 4 * * *',
    enabled: false,
    config: '{}',
  },
  {
    name: 'event-recurrence-generator',
    displayName: 'Event Recurrence Generator',
    description: 'Generates future event instances for recurring event series based on a rolling window.',
    cronExpression: '0 0 * * *',
    enabled: true,
    config: '{"windowWeeks": 8}',
  },
];

export async function seedDefaultJobs(): Promise<void> {
  for (const job of DEFAULT_JOBS) {
    const existing = await otcgs.select({ id: cronJob.id }).from(cronJob).where(eq(cronJob.name, job.name)).limit(1);

    if (existing.length === 0) {
      await otcgs.insert(cronJob).values(job);
      console.log(`[cron] Seeded default job: ${job.name}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Scheduler lifecycle
// ---------------------------------------------------------------------------

export async function startScheduler(): Promise<void> {
  const jobs = await otcgs.select().from(cronJob).where(eq(cronJob.enabled, true));

  for (const job of jobs) {
    scheduleJob(job);
  }

  console.log(`[cron] Scheduler started with ${jobs.length} enabled job(s)`);
}

export function stopScheduler(): void {
  for (const [id, cron] of activeJobs) {
    cron.stop();
    activeJobs.delete(id);
  }
  console.log('[cron] Scheduler stopped');
}

function scheduleJob(job: typeof cronJob.$inferSelect): void {
  const handler = jobHandlers.get(job.name);
  if (!handler) {
    console.warn(`[cron] No handler registered for job '${job.name}', skipping`);
    return;
  }

  // Stop existing schedule if any
  const existing = activeJobs.get(job.id);
  if (existing) {
    existing.stop();
  }

  const cronInstance = new Cron(job.cronExpression, { protect: true }, async () => {
    await executeJobInternal(job.id);
  });

  activeJobs.set(job.id, cronInstance);

  // Persist next run time
  const nextRun = cronInstance.nextRun();
  if (nextRun) {
    otcgs
      .update(cronJob)
      .set({ nextRunAt: nextRun })
      .where(eq(cronJob.id, job.id))
      .catch((err) => console.warn(`[cron] Failed to update nextRunAt for job ${job.name}:`, err));
  }
}

// ---------------------------------------------------------------------------
// Job execution
// ---------------------------------------------------------------------------

async function executeJobInternal(jobId: number): Promise<typeof cronJobRun.$inferSelect> {
  const [job] = await otcgs.select().from(cronJob).where(eq(cronJob.id, jobId)).limit(1);
  if (!job) throw new Error(`Job ${jobId} not found`);

  const handler = jobHandlers.get(job.name);
  if (!handler) throw new Error(`No handler registered for job '${job.name}'`);

  // Concurrency guard: Checks lastRunStatus from a fresh SELECT. This is not fully
  // atomic (two concurrent manual triggers could both read 'not running'), but croner's
  // built-in `protect: true` prevents overlapping calls from the scheduled Cron instance.
  // The remaining risk is limited to rapid-fire manual "Run Now" clicks, which is acceptable.
  if (job.lastRunStatus === 'running') {
    const staleThreshold = Date.now() - STALE_RUNNING_THRESHOLD_MS;
    if (job.lastRunAt && job.lastRunAt.getTime() > staleThreshold) {
      console.log(`[cron] Job '${job.name}' is already running, skipping`);
      // Return a synthetic run record
      return {
        id: 0,
        cronJobId: jobId,
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 0,
        status: 'skipped',
        error: null,
        summary: 'Job already running, skipped',
        createdAt: new Date(),
      };
    }
    console.warn(`[cron] Job '${job.name}' was stuck in running state, resetting`);
  }

  const startedAt = new Date();

  // Mark as running
  await otcgs
    .update(cronJob)
    .set({ lastRunStatus: 'running', lastRunAt: startedAt, updatedAt: startedAt })
    .where(eq(cronJob.id, jobId));

  // Insert run record
  const [runRecord] = await otcgs
    .insert(cronJobRun)
    .values({ cronJobId: jobId, startedAt, status: 'running' })
    .returning();

  let result: JobResult;

  try {
    const config = job.config ? (JSON.parse(job.config) as Record<string, unknown>) : {};
    result = await handler(config);
  } catch (err) {
    result = {
      success: false,
      summary: 'Unhandled error',
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();
  const status = result.success ? 'success' : 'failure';

  // Update run record
  await otcgs
    .update(cronJobRun)
    .set({
      completedAt,
      durationMs,
      status,
      error: result.error ?? null,
      summary: result.summary,
    })
    .where(eq(cronJobRun.id, runRecord.id));

  // Update job status + compute next run
  const cronInstance = activeJobs.get(jobId);
  const nextRunAt = cronInstance?.nextRun() ?? null;

  await otcgs
    .update(cronJob)
    .set({
      lastRunAt: startedAt,
      lastRunStatus: status,
      lastRunDurationMs: durationMs,
      lastRunError: result.error ?? null,
      nextRunAt,
      updatedAt: completedAt,
    })
    .where(eq(cronJob.id, jobId));

  console.log(`[cron] Job '${job.name}' ${status}: ${result.summary} (${durationMs}ms)`);

  return {
    ...runRecord,
    completedAt,
    durationMs,
    status,
    error: result.error ?? null,
    summary: result.summary,
  };
}

/**
 * Manually trigger a job. Returns the run record.
 */
export async function executeJob(jobId: number): Promise<typeof cronJobRun.$inferSelect> {
  return executeJobInternal(jobId);
}

// ---------------------------------------------------------------------------
// Admin queries
// ---------------------------------------------------------------------------

export async function getJobs() {
  return otcgs.select().from(cronJob).orderBy(cronJob.id);
}

export async function getJob(jobId: number) {
  const [job] = await otcgs.select().from(cronJob).where(eq(cronJob.id, jobId)).limit(1);
  return job ?? null;
}

export async function getJobRuns(
  cronJobId: number,
  pagination?: { page?: number | null; pageSize?: number | null } | null,
) {
  const { page, pageSize, offset } = normalizePagination(pagination);

  const [runs, [countResult]] = await Promise.all([
    otcgs
      .select()
      .from(cronJobRun)
      .where(eq(cronJobRun.cronJobId, cronJobId))
      .orderBy(desc(cronJobRun.startedAt))
      .limit(pageSize)
      .offset(offset),
    otcgs.select({ count: count() }).from(cronJobRun).where(eq(cronJobRun.cronJobId, cronJobId)),
  ]);

  const totalCount = countResult.count;
  return {
    items: runs,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Admin mutations
// ---------------------------------------------------------------------------

export async function updateJobSchedule(jobId: number, cronExpression: string) {
  // Validate the cron expression by attempting to create a Cron instance
  try {
    const test = new Cron(cronExpression);
    test.stop();
  } catch {
    throw new Error(`Invalid cron expression: '${cronExpression}'`);
  }

  const [updated] = await otcgs
    .update(cronJob)
    .set({ cronExpression, updatedAt: new Date() })
    .where(eq(cronJob.id, jobId))
    .returning();

  if (!updated) throw new Error(`Job ${jobId} not found`);

  // Reschedule if currently active
  if (activeJobs.has(jobId)) {
    scheduleJob(updated);
  }

  return updated;
}

export async function enableJob(jobId: number) {
  const [updated] = await otcgs
    .update(cronJob)
    .set({ enabled: true, updatedAt: new Date() })
    .where(eq(cronJob.id, jobId))
    .returning();

  if (!updated) throw new Error(`Job ${jobId} not found`);

  scheduleJob(updated);
  return updated;
}

export async function disableJob(jobId: number) {
  const existing = activeJobs.get(jobId);
  if (existing) {
    existing.stop();
    activeJobs.delete(jobId);
  }

  const [updated] = await otcgs
    .update(cronJob)
    .set({ enabled: false, nextRunAt: null, updatedAt: new Date() })
    .where(eq(cronJob.id, jobId))
    .returning();

  if (!updated) throw new Error(`Job ${jobId} not found`);

  return updated;
}

export async function updateJobConfig(jobId: number, config: string) {
  // Validate JSON
  try {
    JSON.parse(config);
  } catch {
    throw new Error('Invalid JSON config');
  }

  const [updated] = await otcgs
    .update(cronJob)
    .set({ config, updatedAt: new Date() })
    .where(eq(cronJob.id, jobId))
    .returning();

  if (!updated) throw new Error(`Job ${jobId} not found`);

  return updated;
}
