import type { JobResult } from '../cron-service.ts';
import { performBackup } from '../backup-service.ts';
import { getBackupSettings } from '../settings-service.ts';

/**
 * Cron handler that runs a scheduled backup to the configured cloud provider.
 * Reads the backup provider from company settings. Skips gracefully if no
 * provider is configured.
 */
export async function backupHandler(_config: Record<string, unknown>): Promise<JobResult> {
  try {
    const settings = await getBackupSettings();

    if (!settings.provider) {
      return {
        success: true,
        summary: 'No backup provider configured, skipping',
      };
    }

    const result = await performBackup(settings.provider);

    return {
      success: result.success,
      summary: result.message,
      error: result.success ? undefined : result.message,
    };
  } catch (err) {
    return {
      success: false,
      summary: 'Backup failed',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
