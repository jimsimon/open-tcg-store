import type { JobResult } from '../cron-service.ts';
import { performUpdateCheck } from '../tcg-data-update-service.ts';

/**
 * Cron handler that checks for TCG product data updates.
 * Wraps the existing performUpdateCheck() which handles the full
 * check → download → verify → apply pipeline internally.
 */
export async function tcgDataUpdateHandler(_config: Record<string, unknown>): Promise<JobResult> {
  try {
    await performUpdateCheck();
    return {
      success: true,
      summary: 'Update check completed successfully',
    };
  } catch (err) {
    return {
      success: false,
      summary: 'Update check failed',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
