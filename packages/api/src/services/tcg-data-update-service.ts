import { createClient } from '@libsql/client';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { renameSync, existsSync, unlinkSync, rmSync, createWriteStream, createReadStream, copyFileSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { client, setDatabaseUpdating } from '../db/otcgs/index.ts';
import { databaseFilePath as tcgDataFilePath } from '../db/tcg-data/drizzle.config.ts';
import { reconnectTcgData } from '../db/tcg-data/index.ts';

const GITHUB_REPO = 'jimsimon/open-tcg-store';
const RELEASE_TAG_PREFIX = 'tcg-data-';
const RELEASE_ASSET_NAME_COMPRESSED = 'tcg-data.sqlite.7z';
const RELEASE_ASSET_NAME = 'tcg-data.sqlite';
const RELEASE_HASH_ASSET_NAME = 'tcg-data.sqlite.sha256';

// Derive paths from tcgDataFilePath (exported by the db layer) to ensure
// the update service and the ATTACH statement always reference the same file.
const databaseFilePath = tcgDataFilePath;
const sqliteDataDir = databaseFilePath.substring(0, databaseFilePath.lastIndexOf('/'));
const tempDatabaseFilePath = `${sqliteDataDir}/tcg-data.sqlite.new`;
const RELEASE_DELTA_ASSET_NAME_COMPRESSED = 'tcg-data.delta.xd3.7z';
const RELEASE_DELTA_ASSET_NAME = 'tcg-data.delta.xd3';
const RELEASE_FROM_HASH_ASSET_NAME = 'tcg-data.from.sha256';
const MAX_DELTA_CHAIN = 7;

// Check interval was used by the old setInterval scheduler, now managed by cron-service.

/** Tables that must exist in a valid tcg-data database. */
const REQUIRED_TABLES = [
  'category',
  'group',
  'product',
  'price',
  'product_presale_info',
  'metadata',
  'manapool_price',
  'sku',
  'cardtrader_blueprint',
  'price_history',
  'sku_history',
  'price_history_log',
] as const;

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
  allReleases: GitHubRelease[];
}

/**
 * Compute the SHA-256 hash of a file on disk using streaming to avoid
 * buffering the entire file into memory (the database can be hundreds of MB).
 * Returns null if the file does not exist or cannot be read.
 */
export function computeFileHash(filePath: string): Promise<string | null> {
  if (!existsSync(filePath)) return Promise.resolve(null);
  return new Promise((resolve) => {
    const hash = createHash('sha256');
    createReadStream(filePath)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolve(hash.digest('hex')))
      .on('error', () => resolve(null));
  });
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
  const hash = text.trim().split(/\s+/)[0] ?? null;
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) return null;
  return hash;
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

  const releases = (await response.json()) as GitHubRelease[];

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
  const localHash = await computeFileHash(databaseFilePath);
  console.log(`[tcg-data-update] Local DB hash: ${localHash ?? '(no file)'}, release hash: ${expectedHash}`);

  if (localHash === expectedHash) {
    console.log(`[tcg-data-update] Already up to date (${latestRelease.tag_name})`);
    return null;
  }

  console.log(`[tcg-data-update] New version available: ${latestRelease.tag_name}`);
  const allReleases = releases.filter((r) => r.tag_name.startsWith(RELEASE_TAG_PREFIX));
  return { release: latestRelease, expectedHash, allReleases };
}

/**
 * Download the database asset from a release to a temp file.
 * Tries the compressed .7z asset first (smaller download), falling back to the
 * uncompressed .sqlite asset for backward compatibility with older releases.
 */
export async function downloadUpdate(release: GitHubRelease): Promise<string> {
  const compressedAsset = release.assets.find((a) => a.name === RELEASE_ASSET_NAME_COMPRESSED);
  const uncompressedAsset = release.assets.find((a) => a.name === RELEASE_ASSET_NAME);
  const asset = compressedAsset ?? uncompressedAsset;

  if (!asset) {
    throw new Error(`Release ${release.tag_name} does not contain a database asset`);
  }

  console.log(`[tcg-data-update] Downloading ${asset.name} (${(asset.size / 1024 / 1024).toFixed(1)} MB)...`);

  const response = await fetch(asset.browser_download_url, {
    headers: { 'User-Agent': 'open-tcg-store' },
  });

  if (!response.ok) {
    throw new Error(`Failed to download asset: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('Response body is null — cannot stream download');
  }

  if (compressedAsset && asset === compressedAsset) {
    // Download compressed archive, then extract the database.
    // Extract to a temp directory to avoid overwriting the live database file.
    const compressedPath = `${tempDatabaseFilePath}.7z`;
    const extractDir = `${sqliteDataDir}/tcg-data-extract`;
    const fileStream = createWriteStream(compressedPath);
    await pipeline(Readable.fromWeb(response.body as import('node:stream/web').ReadableStream), fileStream);

    console.log('[tcg-data-update] Decompressing database...');
    try {
      execFileSync('7z', ['x', compressedPath, `-o${extractDir}`, '-y'], { stdio: 'pipe', timeout: 300_000 });
      renameSync(`${extractDir}/tcg-data.sqlite`, tempDatabaseFilePath);
    } finally {
      try {
        unlinkSync(compressedPath);
      } catch {
        /* ignore cleanup errors */
      }
      try {
        rmSync(extractDir, { recursive: true, force: true });
      } catch {
        /* ignore cleanup errors */
      }
    }
  } else {
    // Stream the uncompressed response body directly to disk
    const fileStream = createWriteStream(tempDatabaseFilePath);
    await pipeline(Readable.fromWeb(response.body as import('node:stream/web').ReadableStream), fileStream);
  }

  console.log(`[tcg-data-update] Downloaded to ${tempDatabaseFilePath}`);
  return tempDatabaseFilePath;
}

/**
 * Verify that the downloaded file's SHA-256 hash matches the expected hash
 * published with the release.
 */
export async function verifyDownloadHash(filePath: string, expectedHash: string): Promise<boolean> {
  const actualHash = await computeFileHash(filePath);
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

// ---------------------------------------------------------------------------
// xdelta3 binary diff support
// ---------------------------------------------------------------------------

function checkXdelta3Available(): boolean {
  try {
    execFileSync('xdelta3', ['-V'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export async function fetchFromHash(release: GitHubRelease): Promise<string | null> {
  const asset = release.assets.find((a) => a.name === RELEASE_FROM_HASH_ASSET_NAME);
  if (!asset) return null;

  const response = await fetch(asset.browser_download_url, {
    headers: { 'User-Agent': 'open-tcg-store' },
  });
  if (!response.ok) return null;

  const text = await response.text();
  const hash = text.trim().split(/\s+/)[0] ?? null;
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) return null;
  return hash;
}

async function downloadDelta(release: GitHubRelease): Promise<string | null> {
  const compressedAsset = release.assets.find((a) => a.name === RELEASE_DELTA_ASSET_NAME_COMPRESSED);
  const uncompressedAsset = release.assets.find((a) => a.name === RELEASE_DELTA_ASSET_NAME);
  const asset = compressedAsset ?? uncompressedAsset;
  if (!asset) return null;

  console.log(`[tcg-data-update] Downloading delta ${asset.name} (${(asset.size / 1024).toFixed(1)} KB)...`);
  const response = await fetch(asset.browser_download_url, {
    headers: { 'User-Agent': 'open-tcg-store' },
  });
  if (!response.ok) return null;
  if (!response.body) return null;

  const deltaPath = `${sqliteDataDir}/tcg-data.delta.xd3`;

  if (compressedAsset && asset === compressedAsset) {
    // Download compressed delta, then extract.
    const compressedPath = `${deltaPath}.7z`;
    const fileStream = createWriteStream(compressedPath);
    await pipeline(Readable.fromWeb(response.body as import('node:stream/web').ReadableStream), fileStream);

    console.log('[tcg-data-update] Decompressing delta...');
    try {
      execFileSync('7z', ['x', compressedPath, `-o${sqliteDataDir}`, '-y'], { stdio: 'pipe', timeout: 60_000 });
    } finally {
      try {
        unlinkSync(compressedPath);
      } catch {
        /* ignore cleanup errors */
      }
    }
  } else {
    const fileStream = createWriteStream(deltaPath);
    await pipeline(Readable.fromWeb(response.body as import('node:stream/web').ReadableStream), fileStream);
  }

  return deltaPath;
}

function applyXdelta3(sourcePath: string, deltaPath: string, outputPath: string): boolean {
  try {
    execFileSync('xdelta3', ['-d', '-s', sourcePath, deltaPath, outputPath], {
      stdio: 'pipe',
      timeout: 300_000,
    });
    return true;
  } catch (err) {
    console.error('[tcg-data-update] xdelta3 patch failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

/**
 * Pre-fetch all from/to hashes for releases in parallel to avoid
 * sequential HTTP requests when building delta chains.
 */
async function buildReleaseHashIndex(
  releases: GitHubRelease[],
): Promise<Map<string, { release: GitHubRelease; toHash: string }>> {
  const entries = await Promise.all(
    releases.map(async (release) => {
      const [fromHash, toHash] = await Promise.all([fetchFromHash(release), fetchReleaseHash(release)]);
      return { release, fromHash, toHash };
    }),
  );

  const index = new Map<string, { release: GitHubRelease; toHash: string }>();
  for (const { release, fromHash, toHash } of entries) {
    if (fromHash && toHash) {
      index.set(fromHash, { release, toHash });
    }
  }
  return index;
}

/**
 * Try to build the new database via xdelta3 delta chain.
 * Returns true if successful (file written to tempDatabaseFilePath), false to fall back.
 */
async function tryBuildViaDelta(releases: GitHubRelease[], localHash: string, targetHash: string): Promise<boolean> {
  if (!checkXdelta3Available()) {
    console.log('[tcg-data-update] xdelta3 not available, falling back to full download');
    return false;
  }

  // Pre-fetch all release hashes in one pass (O(N) requests instead of O(N*M))
  const hashIndex = await buildReleaseHashIndex(releases);

  // Build delta chain: find sequential releases that patch from localHash → targetHash
  const chain: GitHubRelease[] = [];
  let currentHash = localHash;

  for (let i = 0; i < MAX_DELTA_CHAIN && currentHash !== targetHash; i++) {
    const next = hashIndex.get(currentHash);
    if (!next) break;
    chain.push(next.release);
    currentHash = next.toHash;
  }

  if (currentHash !== targetHash || chain.length === 0) {
    if (chain.length > 0) {
      console.log(`[tcg-data-update] Delta chain incomplete after ${chain.length} steps`);
    }
    return false;
  }

  console.log(`[tcg-data-update] Applying ${chain.length}-step delta chain`);

  const workingPath = `${sqliteDataDir}/tcg-data.sqlite.work`;
  copyFileSync(databaseFilePath, workingPath);

  try {
    for (const release of chain) {
      const deltaPath = await downloadDelta(release);
      if (!deltaPath) {
        console.error('[tcg-data-update] Failed to download delta');
        return false;
      }

      const outputPath = `${sqliteDataDir}/tcg-data.sqlite.out`;
      const ok = applyXdelta3(workingPath, deltaPath, outputPath);
      try {
        unlinkSync(deltaPath);
      } catch {
        /* ignore */
      }
      if (!ok) return false;

      try {
        unlinkSync(workingPath);
      } catch {
        /* ignore */
      }
      renameSync(outputPath, workingPath);
    }

    // Move to expected temp location for the existing verify+apply pipeline
    renameSync(workingPath, tempDatabaseFilePath);
    return true;
  } catch (err) {
    console.error('[tcg-data-update] Delta application error:', err);
    return false;
  } finally {
    try {
      unlinkSync(workingPath);
    } catch {
      /* ignore */
    }
    try {
      unlinkSync(`${sqliteDataDir}/tcg-data.sqlite.out`);
    } catch {
      /* ignore */
    }
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

// ---------------------------------------------------------------------------
// TTL cache for refreshUpdateStatus — avoids exhausting the unauthenticated
// GitHub API rate limit (60 req/hr) when the settings page is loaded frequently.
// ---------------------------------------------------------------------------
const REFRESH_STATUS_TTL_MS = 30_000; // 30 seconds
let _cachedCheckResult: { latestRelease: GitHubRelease | null } | null = null;
let _cachedCheckTimestamp = 0;

/** Clear the cached GitHub check result so the next call fetches fresh data. */
export function invalidateStatusCache(): void {
  _cachedCheckResult = null;
  _cachedCheckTimestamp = 0;
}

/**
 * Check for updates by querying GitHub and return the current status.
 * Results are cached for 30 seconds to avoid rate-limit exhaustion on rapid
 * page loads. The cache is invalidated automatically after a successful update.
 */
export async function refreshUpdateStatus(): Promise<{
  currentVersion: string | null;
  latestVersion: string | null;
  updateAvailable: boolean;
  isUpdating: boolean;
}> {
  const now = Date.now();
  let latestRelease: GitHubRelease | null = null;

  if (_cachedCheckResult && now - _cachedCheckTimestamp < REFRESH_STATUS_TTL_MS) {
    latestRelease = _cachedCheckResult.latestRelease;
  } else {
    try {
      const result = await checkForUpdate();
      latestRelease = result?.release ?? null;
    } catch (err) {
      console.error('[tcg-data-update] Failed to check for updates:', err);
    }
    _cachedCheckResult = { latestRelease };
    _cachedCheckTimestamp = now;
  }

  const createdAt = await getCreatedAt();
  return {
    currentVersion: createdAt,
    latestVersion: latestRelease?.tag_name ?? null,
    updateAvailable: latestRelease !== null,
    isUpdating: _isCheckRunning,
  };
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
    const result = await checkForUpdate();
    if (!result) {
      return { success: false, message: 'No update available', newVersion: null };
    }

    const { release, expectedHash } = result;

    // Try delta update first (smaller, faster)
    const localHash = await computeFileHash(databaseFilePath);
    const deltaOk = localHash ? await tryBuildViaDelta(result.allReleases, localHash, expectedHash) : false;

    if (!deltaOk) {
      await downloadUpdate(release);
    }
    const tempPath = tempDatabaseFilePath;

    if (!(await verifyDownloadHash(tempPath, expectedHash))) {
      cleanupTempFile();
      return { success: false, message: 'Downloaded file hash does not match release', newVersion: null };
    }

    const isValid = await validateDatabase(tempPath);
    if (!isValid) {
      cleanupTempFile();
      return { success: false, message: 'Downloaded database failed validation', newVersion: null };
    }

    await applyUpdate(release);
    invalidateStatusCache();
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

interface PerformUpdateCheckOptions {
  /**
   * When true, sets the database-updating flag (triggering the maintenance page)
   * before downloading, not just during the hot-swap. Use this on startup when
   * the local database may not exist or may be schema-incompatible with the
   * running code. For post-startup checks (cron, manual), leave false so users
   * can keep using the app during the download phase.
   */
  showMaintenanceDuringDownload?: boolean;
}

/**
 * Orchestrate a full update check: check -> download -> verify hash -> validate -> apply.
 * Guarded against concurrent execution — if a check is already in progress,
 * subsequent calls are silently skipped.
 */
export async function performUpdateCheck(options?: PerformUpdateCheckOptions): Promise<void> {
  if (_isCheckRunning) {
    console.log('[tcg-data-update] Update check already in progress, skipping');
    return;
  }
  _isCheckRunning = true;
  const blockDuringDownload = options?.showMaintenanceDuringDownload === true;
  try {
    console.log('[tcg-data-update] Checking for updates...');
    const result = await checkForUpdate();
    if (!result) return;

    const { release, expectedHash } = result;

    // On startup, show the maintenance page during download so users don't
    // hit a schema-incompatible database. applyUpdate will set it again
    // internally (harmless double-set) and clear it in its finally block.
    if (blockDuringDownload) {
      setDatabaseUpdating(true);
    }

    // Try delta update first (smaller, faster)
    const localHash = await computeFileHash(databaseFilePath);
    const deltaOk = localHash ? await tryBuildViaDelta(result.allReleases, localHash, expectedHash) : false;

    if (!deltaOk) {
      await downloadUpdate(release);
    }
    const tempPath = tempDatabaseFilePath;

    if (!(await verifyDownloadHash(tempPath, expectedHash))) {
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
    invalidateStatusCache();
  } catch (err) {
    console.error('[tcg-data-update] Update check failed:', err);
    cleanupTempFile();
  } finally {
    if (blockDuringDownload) {
      setDatabaseUpdating(false);
    }
    _isCheckRunning = false;
  }
}

// NOTE: The old setInterval-based scheduler (startUpdateScheduler / stopUpdateScheduler)
// has been removed. Scheduling is now managed by the cron system in cron-service.ts.
// The tcg-data-update-handler.ts wraps performUpdateCheck() as a cron job handler.
