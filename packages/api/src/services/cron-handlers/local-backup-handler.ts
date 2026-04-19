import { mkdirSync, existsSync, readdirSync, unlinkSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { JobResult } from '../cron-service.ts';
import { createSafeBackupFile } from '../backup-service.ts';
import { databaseFilePath } from '../../db/otcgs/drizzle.config.ts';

/** Default number of local backup files to keep. Configurable via job config `maxBackups`. */
const DEFAULT_MAX_BACKUPS = 10;

/**
 * Cron handler that creates a local SQLite backup using VACUUM INTO.
 * Stores timestamped backups in a `backups/` directory next to the main database file.
 * Automatically rotates old backups, keeping the most recent N files.
 */
export async function localBackupHandler(config: Record<string, unknown>): Promise<JobResult> {
  const maxBackups = typeof config.maxBackups === 'number' ? config.maxBackups : DEFAULT_MAX_BACKUPS;

  try {
    // Ensure the backups directory exists next to the database file
    const backupsDir = join(dirname(databaseFilePath), 'backups');
    if (!existsSync(backupsDir)) {
      mkdirSync(backupsDir, { recursive: true });
    }

    // Create a consistent snapshot via VACUUM INTO
    const tempPath = await createSafeBackupFile();

    // Copy the snapshot to a timestamped file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `otcgs-backup-${timestamp}.sqlite`;
    const backupPath = join(backupsDir, backupFileName);

    try {
      copyFileSync(tempPath, backupPath);
    } finally {
      // Clean up the temp file
      try {
        unlinkSync(tempPath);
        rmSync(join(tempPath, '..'), { recursive: true, force: true });
      } catch {
        // Best-effort cleanup
      }
    }

    // Rotate old backups: keep only the most recent maxBackups files
    const backupFiles = readdirSync(backupsDir)
      .filter((f) => f.startsWith('otcgs-backup-') && f.endsWith('.sqlite'))
      .sort()
      .reverse(); // newest first

    let removedCount = 0;
    for (const file of backupFiles.slice(maxBackups)) {
      try {
        unlinkSync(join(backupsDir, file));
        removedCount++;
      } catch {
        // Best-effort cleanup
      }
    }

    const rotationNote = removedCount > 0 ? ` (removed ${removedCount} old backup(s))` : '';
    return {
      success: true,
      summary: `Local backup created: ${backupFileName}${rotationNote}`,
    };
  } catch (err) {
    return {
      success: false,
      summary: 'Local backup failed',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
