import { migrate } from 'drizzle-orm/libsql/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { sql } from 'drizzle-orm';
import { databaseFilePath } from './drizzle.config';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';

const MIGRATIONS_FOLDER = resolve(import.meta.dirname, 'migrations');
const MIGRATIONS_TABLE = '__drizzle_migrations';

// ---------------------------------------------------------------------------
// Baseline Seeding
// ---------------------------------------------------------------------------

/**
 * For databases created before the migration system was introduced (via
 * `drizzle-kit push`), we need to seed the __drizzle_migrations table with
 * the initial migration so it gets skipped. This detects existing databases
 * by checking for application tables without a migrations tracking table.
 */
async function seedBaselineIfNeeded(db: LibSQLDatabase<Record<string, unknown>>): Promise<void> {
  // Check if __drizzle_migrations table exists
  const tables = await db.values<[string]>(
    sql`SELECT name FROM sqlite_master WHERE type='table' AND name=${MIGRATIONS_TABLE}`,
  );

  if (tables.length > 0) {
    // Migrations table exists — not a first-time run
    return;
  }

  // Check if application tables exist (indicating a pre-migration database)
  const appTables = await db.values<[string]>(
    sql`SELECT name FROM sqlite_master WHERE type='table' AND name='store_settings'`,
  );

  if (appTables.length === 0) {
    // Fresh database — no seeding needed, migrate() will apply all migrations
    return;
  }

  // Existing database without migration tracking — seed the baseline
  console.log('[migrator] Detected existing database without migration tracking. Seeding baseline...');

  const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
  if (migrations.length === 0) {
    return;
  }

  // Seed the first (baseline) migration as already applied
  const baseline = migrations[0];
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS ${sql.identifier(MIGRATIONS_TABLE)} (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    )
  `);
  await db.run(
    sql`INSERT INTO ${sql.identifier(MIGRATIONS_TABLE)} ("hash", "created_at") VALUES(${baseline.hash}, ${baseline.folderMillis})`,
  );

  console.log('[migrator] Baseline migration seeded successfully.');
}

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

  // Ensure the table exists before querying
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS ${sql.identifier(MIGRATIONS_TABLE)} (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    )
  `);

  const dbMigrations = await db.values<[number, string, number]>(
    sql`SELECT id, hash, created_at FROM ${sql.identifier(MIGRATIONS_TABLE)} ORDER BY created_at DESC LIMIT 1`,
  );

  const lastDbMigration = dbMigrations[0] ?? undefined;

  for (const migration of migrations) {
    if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
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
  await db.run(sql.raw(`VACUUM INTO '${backupPath}'`));
  console.log('[migrator] Local backup created successfully.');
  return backupPath;
}

// ---------------------------------------------------------------------------
// Cloud Backup (Best-Effort)
// ---------------------------------------------------------------------------

async function attemptCloudBackup(): Promise<void> {
  try {
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

  // Integrity check failed or errored — restore from backup
  console.log(`[migrator] Restoring database from backup: ${backupPath}`);
  try {
    copyFileSync(backupPath, databaseFilePath);
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
 * 1. Seed baseline for existing databases (pre-migration era)
 * 2. Check for pending migrations (return early if none)
 * 3. Create local backup via VACUUM INTO
 * 4. Attempt cloud backup if configured (non-blocking)
 * 5. Run drizzle migrations
 * 6. On failure: verify integrity, restore from backup if needed
 */
export async function applyMigrations(db: LibSQLDatabase<Record<string, unknown>>): Promise<void> {
  // 1. Seed baseline for existing databases
  await seedBaselineIfNeeded(db);

  // 2. Check for pending migrations
  const hasPending = await hasPendingMigrations(db);
  if (!hasPending) {
    console.log('[migrator] No pending migrations.');
    return;
  }

  console.log('[migrator] Pending migrations detected. Starting migration process...');

  // 3. Local backup via VACUUM INTO (always)
  const backupPath = await createLocalBackup(db);

  // 4. Cloud backup (best-effort, non-blocking)
  await attemptCloudBackup();

  // 5. Run migrations with rollback protection
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    console.log('[migrator] Migrations applied successfully.');
  } catch (error) {
    await handleMigrationFailure(db, backupPath, error);
    throw error; // Always re-throw to prevent server from starting with bad state
  }
}
