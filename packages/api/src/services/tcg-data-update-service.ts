import { createClient } from '@libsql/client';
import { renameSync, readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { workspaceRootSync } from 'workspace-root';
import { getOtcgsClient, setDatabaseUpdating, tcgDataFilePath } from '../db/otcgs/index.ts';
import { reconnectTcgData } from '../db/tcg-data/index.ts';

const GITHUB_REPO = 'jimsimon/open-tcg-store';
const RELEASE_TAG_PREFIX = 'initial-db-';
const RELEASE_ASSET_NAME = 'tcg-data.sqlite';

const workspaceRoot = workspaceRootSync()!;
const sqliteDataDir = `${workspaceRoot}/sqlite-data`;
const versionFilePath = `${sqliteDataDir}/tcg-data.version`;
const databaseFilePath = `${sqliteDataDir}/tcg-data.sqlite`;
const tempDatabaseFilePath = `${sqliteDataDir}/tcg-data.sqlite.new`;

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

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

  // Find the most recent release with our tag prefix
  const latestRelease = releases.find((r) => r.tag_name.startsWith(RELEASE_TAG_PREFIX));
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

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(tempDatabaseFilePath, buffer);

  console.log(`[tcg-data-update] Downloaded to ${tempDatabaseFilePath}`);
  return tempDatabaseFilePath;
}

/**
 * Validate that the downloaded file is a valid SQLite database with expected tables.
 */
export async function validateDatabase(filePath: string): Promise<boolean> {
  const client = createClient({ url: `file:${filePath}` });
  try {
    const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='category'");
    if (result.rows.length === 0) {
      console.error('[tcg-data-update] Validation failed: "category" table not found');
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
  const otcgsClient = getOtcgsClient();

  setDatabaseUpdating(true);
  console.log('[tcg-data-update] Database updating flag set, draining in-flight requests...');

  try {
    // Brief delay to let in-flight requests complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Detach the old tcg-data database from the otcgs connection
    console.log('[tcg-data-update] Detaching tcg_data from otcgs connection...');
    await otcgsClient.execute('DETACH DATABASE tcg_data;');

    // Atomically replace the database file
    console.log('[tcg-data-update] Replacing database file...');
    renameSync(tempDatabaseFilePath, databaseFilePath);

    // Re-attach the new database
    console.log('[tcg-data-update] Re-attaching tcg_data...');
    await otcgsClient.execute(`ATTACH DATABASE '${tcgDataFilePath}' AS tcg_data;`);

    // Reconnect the standalone tcgData drizzle connection
    console.log('[tcg-data-update] Reconnecting standalone tcgData connection...');
    reconnectTcgData();

    // Record the new version
    setCurrentVersion(release.tag_name);
    console.log(`[tcg-data-update] Successfully updated to ${release.tag_name}`);
  } catch (err) {
    console.error('[tcg-data-update] Error during database swap:', err);

    // Attempt recovery: try to re-ATTACH the original file
    try {
      console.log('[tcg-data-update] Attempting to re-ATTACH original database...');
      await otcgsClient.execute(`ATTACH DATABASE '${tcgDataFilePath}' AS tcg_data;`);
      console.log('[tcg-data-update] Recovery successful');
    } catch (recoveryErr) {
      console.error('[tcg-data-update] CRITICAL: Recovery failed, tcg_data is unavailable:', recoveryErr);
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
 * Orchestrate a full update check: check -> download -> validate -> apply.
 */
export async function performUpdateCheck(): Promise<void> {
  try {
    console.log('[tcg-data-update] Checking for updates...');
    const release = await checkForUpdate();
    if (!release) return;

    const tempPath = await downloadUpdate(release);

    const isValid = await validateDatabase(tempPath);
    if (!isValid) {
      console.error('[tcg-data-update] Downloaded database failed validation, skipping update');
      cleanupTempFile();
      return;
    }

    await applyUpdate(release);
  } catch (err) {
    console.error('[tcg-data-update] Update check failed:', err);
    cleanupTempFile();
  }
}

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the update scheduler. Checks on startup and then every 24 hours.
 */
export function startUpdateScheduler(): void {
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
