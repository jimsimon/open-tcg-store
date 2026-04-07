import { createClient } from '@libsql/client';
import { renameSync, readFileSync, writeFileSync, existsSync, unlinkSync, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { client, setDatabaseUpdating, tcgDataFilePath } from '../db/otcgs/index.ts';
import { reconnectTcgData } from '../db/tcg-data/index.ts';

const GITHUB_REPO = 'jimsimon/open-tcg-store';
const RELEASE_TAG_PREFIX = 'initial-db-';
const RELEASE_ASSET_NAME = 'tcg-data.sqlite';

// Derive paths from tcgDataFilePath (exported by the db layer) to ensure
// the update service and the ATTACH statement always reference the same file.
const databaseFilePath = tcgDataFilePath;
const sqliteDataDir = databaseFilePath.substring(0, databaseFilePath.lastIndexOf('/'));
const versionFilePath = `${sqliteDataDir}/tcg-data.version`;
const tempDatabaseFilePath = `${sqliteDataDir}/tcg-data.sqlite.new`;

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Tables that must exist in a valid tcg-data database. */
const REQUIRED_TABLES = ['category', 'group', 'product', 'price'] as const;

export interface GitHubRelease {
  tag_name: string;
  name: string;
  assets: GitHubAsset[];
}

export interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

/**
 * Read the current version tag from disk, or null if no version file exists.
 */
export function getCurrentVersion(): string | null {
  try {
    if (!existsSync(versionFilePath)) return null;
    return readFileSync(versionFilePath, 'utf-8').trim();
  } catch {
    return null;
  }
}

/**
 * Write the current version tag to disk.
 */
function setCurrentVersion(tag: string): void {
  writeFileSync(versionFilePath, tag, 'utf-8');
}

/**
 * Check GitHub for the latest tcg-data release.
 * Returns the release if a newer version is available, null otherwise.
 */
export async function checkForUpdate(): Promise<GitHubRelease | null> {
  const currentVersion = getCurrentVersion();
  console.log(`[tcg-data-update] Current version: ${currentVersion ?? '(none)'}`);

  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=20`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'open-tcg-store',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API responded with ${response.status}: ${response.statusText}`);
  }

  const releases: GitHubRelease[] = await response.json();

  // Filter to releases with our prefix and sort descending by tag name
  // (tags are date-based like "initial-db-20260405" so lexicographic sort is correct)
  const matchingReleases = releases
    .filter((r) => r.tag_name.startsWith(RELEASE_TAG_PREFIX))
    .sort((a, b) => b.tag_name.localeCompare(a.tag_name));

  const latestRelease = matchingReleases[0];
  if (!latestRelease) {
    console.log('[tcg-data-update] No matching releases found on GitHub');
    return null;
  }

  if (latestRelease.tag_name === currentVersion) {
    console.log(`[tcg-data-update] Already up to date (${currentVersion})`);
    return null;
  }

  console.log(`[tcg-data-update] New version available: ${latestRelease.tag_name}`);
  return latestRelease;
}

/**
 * Download the database asset from a release to a temp file.
 */
export async function downloadUpdate(release: GitHubRelease): Promise<string> {
  const asset = release.assets.find((a) => a.name === RELEASE_ASSET_NAME);
  if (!asset) {
    throw new Error(`Release ${release.tag_name} does not contain a ${RELEASE_ASSET_NAME} asset`);
  }

  console.log(`[tcg-data-update] Downloading ${asset.name} (${(asset.size / 1024 / 1024).toFixed(1)} MB)...`);

  const response = await fetch(asset.browser_download_url, {
    headers: { 'User-Agent': 'open-tcg-store' },
  });

  if (!response.ok) {
    throw new Error(`Failed to download asset: ${response.status} ${response.statusText}`);
  }

  // Stream the response body to disk to avoid buffering the entire file in memory
  if (!response.body) {
    throw new Error('Response body is null — cannot stream download');
  }
  const fileStream = createWriteStream(tempDatabaseFilePath);
  await pipeline(Readable.fromWeb(response.body as import('node:stream/web').ReadableStream), fileStream);

  console.log(`[tcg-data-update] Downloaded to ${tempDatabaseFilePath}`);
  return tempDatabaseFilePath;
}

/**
 * Validate that the downloaded file is a valid SQLite database with expected tables.
 * Checks for multiple critical tables to reduce the chance of accepting a truncated download.
 */
export async function validateDatabase(filePath: string): Promise<boolean> {
  const client = createClient({ url: `file:${filePath}` });
  try {
    const placeholders = REQUIRED_TABLES.map(() => '?').join(', ');
    const result = await client.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`,
      args: [...REQUIRED_TABLES],
    });
    const foundTables = new Set(result.rows.map((r) => r.name as string));
    const missingTables = REQUIRED_TABLES.filter((t) => !foundTables.has(t));
    if (missingTables.length > 0) {
      console.error(`[tcg-data-update] Validation failed: missing tables: ${missingTables.join(', ')}`);
      return false;
    }
    console.log('[tcg-data-update] Validation passed');
    return true;
  } catch (err) {
    console.error('[tcg-data-update] Validation failed:', err);
    return false;
  } finally {
    client.close();
  }
}

/**
 * Perform the hot-swap of the tcg-data database:
 * 1. Set updating flag (triggers 503 responses)
 * 2. Brief drain delay for in-flight requests
 * 3. DETACH the old database from the otcgs connection
 * 4. Rename temp file to the real file (atomic on same filesystem)
 * 5. Re-ATTACH the new database
 * 6. Reconnect the standalone tcgData connection
 * 7. Update version file
 * 8. Clear updating flag
 */
export async function applyUpdate(release: GitHubRelease): Promise<void> {
  setDatabaseUpdating(true);
  console.log('[tcg-data-update] Database updating flag set, draining in-flight requests...');

  let detached = false;

  try {
    // Drain delay: give in-flight requests time to finish after the 503 flag is set.
    // The 503 middleware prevents new requests from reaching the database, so this
    // only needs to cover requests that were already past the middleware check.
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Detach the old tcg-data database from the otcgs connection
    console.log('[tcg-data-update] Detaching tcg_data from otcgs connection...');
    await client.execute('DETACH DATABASE tcg_data;');
    detached = true;

    // Atomically replace the database file
    console.log('[tcg-data-update] Replacing database file...');
    renameSync(tempDatabaseFilePath, databaseFilePath);

    // Re-attach the new database
    console.log('[tcg-data-update] Re-attaching tcg_data...');
    await client.execute(`ATTACH DATABASE '${tcgDataFilePath}' AS tcg_data;`);

    // Reconnect the standalone tcgData drizzle connection
    console.log('[tcg-data-update] Reconnecting standalone tcgData connection...');
    reconnectTcgData();

    // Record the new version
    setCurrentVersion(release.tag_name);
    console.log(`[tcg-data-update] Successfully updated to ${release.tag_name}`);
  } catch (err) {
    console.error('[tcg-data-update] Error during database swap:', err);

    // Attempt recovery: re-ATTACH the database file.
    // If the error occurred BEFORE rename, the original file is still at databaseFilePath.
    // If the error occurred AFTER rename, the new file is now at databaseFilePath.
    // In both cases, tcgDataFilePath (== databaseFilePath) points to whatever file
    // is currently on disk, so the ATTACH is valid as long as DETACH succeeded.
    if (detached) {
      try {
        console.log('[tcg-data-update] Attempting to re-ATTACH database...');
        await client.execute(`ATTACH DATABASE '${tcgDataFilePath}' AS tcg_data;`);
        console.log('[tcg-data-update] Recovery successful');
      } catch (recoveryErr) {
        console.error('[tcg-data-update] CRITICAL: Recovery failed, tcg_data is unavailable:', recoveryErr);
      }
    }

    throw err;
  } finally {
    setDatabaseUpdating(false);
    console.log('[tcg-data-update] Database updating flag cleared');
  }
}

/**
 * Clean up the temp file if it exists.
 */
function cleanupTempFile(): void {
  try {
    if (existsSync(tempDatabaseFilePath)) {
      unlinkSync(tempDatabaseFilePath);
    }
  } catch {
    // Ignore cleanup errors
  }
}

// Cache the latest release info from the last check so the UI can query it
// without hitting the GitHub API on every page load.
let _cachedLatestRelease: GitHubRelease | null = null;

/**
 * Return the current data update status for the settings UI.
 * Uses cached release info from the last scheduler check to avoid
 * hitting the GitHub API on every page load.
 */
export function getDataUpdateStatus(): {
  currentVersion: string | null;
  latestVersion: string | null;
  updateAvailable: boolean;
  isUpdating: boolean;
} {
  const currentVersion = getCurrentVersion();
  const latestVersion = _cachedLatestRelease?.tag_name ?? currentVersion;
  const updateAvailable = _cachedLatestRelease !== null;
  return {
    currentVersion,
    latestVersion,
    updateAvailable,
    isUpdating: _isCheckRunning,
  };
}

/**
 * Check for updates by querying GitHub (refreshes the cached release info).
 * Returns the updated status.
 */
export async function refreshUpdateStatus(): Promise<{
  currentVersion: string | null;
  latestVersion: string | null;
  updateAvailable: boolean;
  isUpdating: boolean;
}> {
  try {
    _cachedLatestRelease = await checkForUpdate();
  } catch (err) {
    console.error('[tcg-data-update] Failed to refresh update status:', err);
  }
  return getDataUpdateStatus();
}

/**
 * Manually trigger a data update. Returns a result object indicating success/failure.
 * Rejects if an update check is already in progress.
 */
export async function triggerManualUpdate(): Promise<{
  success: boolean;
  message: string;
  newVersion: string | null;
}> {
  if (_isCheckRunning) {
    return { success: false, message: 'An update is already in progress', newVersion: null };
  }

  _isCheckRunning = true;
  try {
    // Refresh the cached release info first
    _cachedLatestRelease = await checkForUpdate();
    if (!_cachedLatestRelease) {
      return { success: false, message: 'No update available', newVersion: null };
    }

    // Run the full update pipeline (reuses performUpdateCheck logic inline
    // because we need to return a result object instead of void)
    const release = _cachedLatestRelease;
    const tempPath = await downloadUpdate(release);

    const isValid = await validateDatabase(tempPath);
    if (!isValid) {
      cleanupTempFile();
      return { success: false, message: 'Downloaded database failed validation', newVersion: null };
    }

    await applyUpdate(release);
    _cachedLatestRelease = null; // Clear cache since we just applied the update
    return { success: true, message: `Successfully updated to ${release.tag_name}`, newVersion: release.tag_name };
  } catch (err) {
    cleanupTempFile();
    const message = err instanceof Error ? err.message : 'Update failed';
    return { success: false, message, newVersion: null };
  } finally {
    _isCheckRunning = false;
  }
}

let _isCheckRunning = false;

/**
 * Orchestrate a full update check: check -> download -> validate -> apply.
 * Guarded against concurrent execution — if a check is already in progress,
 * subsequent calls are silently skipped.
 */
export async function performUpdateCheck(): Promise<void> {
  if (_isCheckRunning) {
    console.log('[tcg-data-update] Update check already in progress, skipping');
    return;
  }
  _isCheckRunning = true;
  try {
    console.log('[tcg-data-update] Checking for updates...');
    const release = await checkForUpdate();
    _cachedLatestRelease = release;
    if (!release) return;

    const tempPath = await downloadUpdate(release);

    const isValid = await validateDatabase(tempPath);
    if (!isValid) {
      console.error('[tcg-data-update] Downloaded database failed validation, skipping update');
      cleanupTempFile();
      return;
    }

    await applyUpdate(release);
    _cachedLatestRelease = null; // Clear cache after successful update
  } catch (err) {
    console.error('[tcg-data-update] Update check failed:', err);
    cleanupTempFile();
  } finally {
    _isCheckRunning = false;
  }
}

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the update scheduler. Checks on startup and then every 24 hours.
 * Safe to call multiple times — subsequent calls are no-ops if already running.
 */
export function startUpdateScheduler(): void {
  if (schedulerInterval !== null) {
    console.log('[tcg-data-update] Update scheduler already running, ignoring duplicate start');
    return;
  }

  // Check immediately on startup (async, don't block server startup)
  performUpdateCheck();

  // Schedule daily checks
  schedulerInterval = setInterval(performUpdateCheck, CHECK_INTERVAL_MS);

  console.log('[tcg-data-update] Update scheduler started (checking every 24 hours)');
}

/**
 * Stop the update scheduler. Useful for graceful shutdown or testing.
 */
export function stopUpdateScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[tcg-data-update] Update scheduler stopped');
  }
}
