import { migrate } from 'drizzle-orm/libsql/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { copyFileSync, existsSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { sql } from 'drizzle-orm';
import { databaseFilePath } from './drizzle.config';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';

const MIGRATIONS_FOLDER = resolve(import.meta.dirname, 'migrations');
const MIGRATIONS_TABLE = '__drizzle_migrations';

// ---------------------------------------------------------------------------
// Pending Migration Detection
// ---------------------------------------------------------------------------

async function hasPendingMigrations(db: LibSQLDatabase<Record<string, unknown>>): Promise<boolean> {
  let migrations: ReturnType<typeof readMigrationFiles>;
  try {
    migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
  } catch {
    // No migrations folder or journal — nothing to apply
    return false;
  }

  if (migrations.length === 0) {
    return false;
  }

  // Check if the migrations table exists
  const tables = await db.values<[string]>(
    sql`SELECT name FROM sqlite_master WHERE type='table' AND name=${MIGRATIONS_TABLE}`,
  );

  if (tables.length === 0) {
    // No migrations table yet — all migrations are pending
    return true;
  }

  const dbMigrations = await db.values<[string]>(sql`SELECT hash FROM ${sql.identifier(MIGRATIONS_TABLE)}`);
  const appliedHashes = new Set(dbMigrations.map((row) => row[0]));

  for (const migration of migrations) {
    if (!appliedHashes.has(migration.hash)) {
      return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Local Backup via VACUUM INTO
// ---------------------------------------------------------------------------

function createLocalBackupPath(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return resolve(dirname(databaseFilePath), `otcgs.pre-migration-${timestamp}.sqlite`);
}

async function createLocalBackup(db: LibSQLDatabase<Record<string, unknown>>): Promise<string> {
  const backupPath = createLocalBackupPath();
  console.log(`[migrator] Creating local backup via VACUUM INTO: ${backupPath}`);
  await db.run(sql`VACUUM INTO ${backupPath}`);
  console.log('[migrator] Local backup created successfully.');
  return backupPath;
}

// ---------------------------------------------------------------------------
// Cloud Backup (Best-Effort)
// ---------------------------------------------------------------------------

async function attemptCloudBackup(db: LibSQLDatabase<Record<string, unknown>>): Promise<void> {
  try {
    // Skip cloud backup on fresh databases — no migrations table means this is the
    // first run, there's nothing to back up, and importing settings-service would
    // deadlock due to the top-level await in index.ts.
    const tables = await db.values<[string]>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name=${MIGRATIONS_TABLE}`,
    );
    if (tables.length === 0) {
      return;
    }

    // Dynamically import to avoid circular dependency issues at module load time
    const { getBackupSettings } = await import('../../services/settings-service');
    const settings = await getBackupSettings();

    if (!settings.provider) {
      return;
    }

    // Check if the configured provider is actually connected
    const providerConnected =
      (settings.provider === 'google_drive' && settings.googleDriveConnected) ||
      (settings.provider === 'dropbox' && settings.dropboxConnected) ||
      (settings.provider === 'onedrive' && settings.onedriveConnected);

    if (!providerConnected) {
      return;
    }

    console.log(`[migrator] Triggering cloud backup to ${settings.provider} before migration...`);
    const { performBackup } = await import('../../services/backup-service');
    const result = await performBackup(settings.provider as 'google_drive' | 'dropbox' | 'onedrive');

    if (result.success) {
      console.log(`[migrator] Cloud backup completed: ${result.message}`);
    } else {
      console.warn(`[migrator] Cloud backup failed (non-blocking): ${result.message}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[migrator] Cloud backup failed (non-blocking): ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Migration Failure Handling
// ---------------------------------------------------------------------------

async function handleMigrationFailure(
  db: LibSQLDatabase<Record<string, unknown>>,
  backupPath: string,
  error: unknown,
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error(`[migrator] Migration failed: ${errorMessage}`);

  // Drizzle's batch migration should have already rolled back the transaction.
  // Run an integrity check as a safety net.
  try {
    const integrityResult = await db.values<[string]>(sql`PRAGMA integrity_check`);
    const status = integrityResult[0]?.[0];

    if (status === 'ok') {
      console.log('[migrator] Database integrity check passed after failed migration. Transaction was rolled back.');
      return;
    }

    console.error(`[migrator] Database integrity check FAILED: ${status}`);
  } catch (integrityError) {
    console.error('[migrator] Could not run integrity check:', integrityError);
  }

  // Integrity check failed or errored — restore from backup.
  // Close the connection first to release any locks and WAL/SHM handles.
  console.log('[migrator] Closing database connection before restore...');
  try {
    await db.run(sql`PRAGMA wal_checkpoint(TRUNCATE)`);
  } catch {
    // Best-effort — connection may already be in a bad state
  }

  console.log(`[migrator] Restoring database from backup: ${backupPath}`);
  try {
    copyFileSync(backupPath, databaseFilePath);

    // Remove WAL and SHM auxiliary files to prevent inconsistent state
    const walPath = `${databaseFilePath}-wal`;
    const shmPath = `${databaseFilePath}-shm`;
    if (existsSync(walPath)) unlinkSync(walPath);
    if (existsSync(shmPath)) unlinkSync(shmPath);

    console.log('[migrator] Database restored from backup. Backup file preserved at:', backupPath);
  } catch (restoreError) {
    console.error('[migrator] CRITICAL: Failed to restore database from backup:', restoreError);
    console.error('[migrator] Manual intervention required. Backup file at:', backupPath);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply pending database migrations with automatic backup and rollback.
 *
 * Flow:
 * 1. Check for pending migrations (return early if none)
 * 2. Create local backup via VACUUM INTO
 * 3. Attempt cloud backup if configured (non-blocking)
 * 4. Run drizzle migrations
 * 5. On failure: verify integrity, restore from backup if needed
 */
export async function applyMigrations(db: LibSQLDatabase<Record<string, unknown>>): Promise<void> {
  // 1. Check for pending migrations
  const hasPending = await hasPendingMigrations(db);
  if (!hasPending) {
    console.log('[migrator] No pending migrations.');
    return;
  }

  console.log('[migrator] Pending migrations detected. Starting migration process...');

  // 2. Local backup via VACUUM INTO (always)
  const backupPath = await createLocalBackup(db);

  // 3. Cloud backup (best-effort, non-blocking)
  await attemptCloudBackup(db);

  // 4. Run migrations with rollback protection
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER, migrationsTable: MIGRATIONS_TABLE });
    console.log('[migrator] Migrations applied successfully.');
  } catch (error) {
    await handleMigrationFailure(db, backupPath, error);
    throw error; // Always re-throw to prevent server from starting with bad state
  }
}
