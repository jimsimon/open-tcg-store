import { createClient } from '@libsql/client';
import { createHash } from 'node:crypto';
import { renameSync, readFileSync, existsSync, unlinkSync, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { client, setDatabaseUpdating, tcgDataFilePath } from '../db/otcgs/index.ts';
import { reconnectTcgData } from '../db/tcg-data/index.ts';

const GITHUB_REPO = 'jimsimon/open-tcg-store';
const RELEASE_TAG_PREFIX = 'tcg-data-';
const RELEASE_ASSET_NAME = 'tcg-data.sqlite';
const RELEASE_HASH_ASSET_NAME = 'tcg-data.sqlite.sha256';

// Derive paths from tcgDataFilePath (exported by the db layer) to ensure
// the update service and the ATTACH statement always reference the same file.
const databaseFilePath = tcgDataFilePath;
const sqliteDataDir = databaseFilePath.substring(0, databaseFilePath.lastIndexOf('/'));
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

export interface UpdateCheckResult {
  release: GitHubRelease;
  expectedHash: string;
}

/**
 * Compute the SHA-256 hash of a file on disk.
 * Returns null if the file does not exist or cannot be read.
 */
export function computeFileHash(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath);
    return createHash('sha256').update(content).digest('hex');
  } catch {
    return null;
  }
}

/**
 * Download the SHA-256 hash asset from a GitHub release.
 * Returns the hex hash string, or null if the asset is missing or cannot be fetched.
 */
export async function fetchReleaseHash(release: GitHubRelease): Promise<string | null> {
  const hashAsset = release.assets.find((a) => a.name === RELEASE_HASH_ASSET_NAME);
  if (!hashAsset) return null;

  const response = await fetch(hashAsset.browser_download_url, {
    headers: { 'User-Agent': 'open-tcg-store' },
  });
  if (!response.ok) return null;

  const text = await response.text();
  // sha256sum output format: "<hash>  <filename>" — extract just the hash
  return text.trim().split(/\s+/)[0] ?? null;
}

/**
 * Check GitHub for the latest tcg-data release.
 * Compares the local database file hash against the published hash.
 * Returns the release and expected hash if an update is available, null otherwise.
 */
export async function checkForUpdate(): Promise<UpdateCheckResult | null> {
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

  // Filter to releases with our prefix. The GitHub API returns releases in
  // reverse-chronological order, so the first match is the most recent.
  const latestRelease = releases.find((r) => r.tag_name.startsWith(RELEASE_TAG_PREFIX));
  if (!latestRelease) {
    console.log('[tcg-data-update] No matching releases found on GitHub');
    return null;
  }

  // Fetch the published hash for the latest release
  const expectedHash = await fetchReleaseHash(latestRelease);
  if (!expectedHash) {
    console.log(`[tcg-data-update] Release ${latestRelease.tag_name} has no hash asset, skipping`);
    return null;
  }

  // Compare with local database file hash
  const localHash = computeFileHash(databaseFilePath);
  console.log(`[tcg-data-update] Local DB hash: ${localHash ?? '(no file)'}, release hash: ${expectedHash}`);

  if (localHash === expectedHash) {
    console.log(`[tcg-data-update] Already up to date (${latestRelease.tag_name})`);
    return null;
  }

  console.log(`[tcg-data-update] New version available: ${latestRelease.tag_name}`);
  return { release: latestRelease, expectedHash };
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
 * Verify that the downloaded file's SHA-256 hash matches the expected hash
 * published with the release.
 */
export function verifyDownloadHash(filePath: string, expectedHash: string): boolean {
  const actualHash = computeFileHash(filePath);
  if (actualHash !== expectedHash) {
    console.error(`[tcg-data-update] Hash mismatch: expected ${expectedHash}, got ${actualHash ?? '(no file)'}`);
    return false;
  }
  console.log('[tcg-data-update] Download hash verified');
  return true;
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
 * 7. Clear updating flag
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

/**
 * Read the `created_at` timestamp from the tcg-data database's metadata table.
 * Returns the ISO timestamp string, or null if not available.
 */
export async function getCreatedAt(): Promise<string | null> {
  try {
    const result = await client.execute({
      sql: `SELECT value FROM tcg_data.metadata WHERE key = ?`,
      args: ['created_at'],
    });
    return (result.rows[0]?.value as string) ?? null;
  } catch {
    return null;
  }
}

// Cache the latest release info from the last check so the UI can query it
// without hitting the GitHub API on every page load.
let _cachedLatestRelease: GitHubRelease | null = null;

/**
 * Return the current data update status for the settings UI.
 * Reads the creation timestamp from the database itself.
 * Uses cached release info from the last scheduler check to avoid
 * hitting the GitHub API on every page load.
 */
export async function getDataUpdateStatus(): Promise<{
  currentVersion: string | null;
  latestVersion: string | null;
  updateAvailable: boolean;
  isUpdating: boolean;
}> {
  const createdAt = await getCreatedAt();
  const updateAvailable = _cachedLatestRelease !== null;
  return {
    currentVersion: createdAt,
    latestVersion: _cachedLatestRelease?.tag_name ?? null,
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
    const result = await checkForUpdate();
    _cachedLatestRelease = result?.release ?? null;
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
    const result = await checkForUpdate();
    _cachedLatestRelease = result?.release ?? null;
    if (!result) {
      return { success: false, message: 'No update available', newVersion: null };
    }

    const { release, expectedHash } = result;
    const tempPath = await downloadUpdate(release);

    if (!verifyDownloadHash(tempPath, expectedHash)) {
      cleanupTempFile();
      return { success: false, message: 'Downloaded file hash does not match release', newVersion: null };
    }

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
 * Orchestrate a full update check: check -> download -> verify hash -> validate -> apply.
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
    const result = await checkForUpdate();
    _cachedLatestRelease = result?.release ?? null;
    if (!result) return;

    const { release, expectedHash } = result;
    const tempPath = await downloadUpdate(release);

    if (!verifyDownloadHash(tempPath, expectedHash)) {
      console.error('[tcg-data-update] Downloaded file hash does not match release, skipping update');
      cleanupTempFile();
      return;
    }

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
