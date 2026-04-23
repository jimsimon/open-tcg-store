import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Use vi.hoisted so mock variables are available when vi.mock factories run.
// ---------------------------------------------------------------------------

const {
  mockExistsSync,
  mockCreateReadStream,
  mockRenameSync,
  mockUnlinkSync,
  mockRmSync,
  mockCreateWriteStream,
  mockExecFileSync,
  mockSetDatabaseUpdating,
  mockReconnectTcgData,
  mockCreateClient,
  mockOtcgsExecute,
  mockValidationExecute,
  mockClientClose,
  mockFetch,
  mockPipeline,
  mockCreateHash,
} = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockCreateReadStream: vi.fn(),
  mockRenameSync: vi.fn(),
  mockUnlinkSync: vi.fn(),
  mockRmSync: vi.fn(),
  mockCreateWriteStream: vi.fn(),
  mockExecFileSync: vi.fn(),
  mockSetDatabaseUpdating: vi.fn(),
  mockReconnectTcgData: vi.fn(),
  mockCreateClient: vi.fn(),
  mockOtcgsExecute: vi.fn(),
  mockValidationExecute: vi.fn(),
  mockClientClose: vi.fn(),
  mockFetch: vi.fn(),
  mockPipeline: vi.fn(),
  mockCreateHash: vi.fn(),
}));

// Mock node:fs
vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
  createReadStream: mockCreateReadStream,
  renameSync: mockRenameSync,
  unlinkSync: mockUnlinkSync,
  rmSync: mockRmSync,
  createWriteStream: mockCreateWriteStream,
}));

// Mock node:child_process
vi.mock('node:child_process', () => ({
  execFileSync: mockExecFileSync,
}));

// Mock node:stream/promises
vi.mock('node:stream/promises', () => ({
  pipeline: mockPipeline,
}));

// Mock node:stream (Readable.fromWeb)
vi.mock('node:stream', () => ({
  Readable: {
    fromWeb: vi.fn((body: unknown) => body),
  },
}));

// Mock node:crypto
vi.mock('node:crypto', () => ({
  createHash: mockCreateHash,
}));

// Mock the db modules
vi.mock('../db/otcgs/index', () => ({
  client: { execute: mockOtcgsExecute },
  setDatabaseUpdating: mockSetDatabaseUpdating,
}));

vi.mock('../db/tcg-data/drizzle.config', () => ({
  databaseFilePath: '/fake/workspace/sqlite-data/tcg-data.sqlite',
}));

vi.mock('../db/tcg-data/index', () => ({
  reconnectTcgData: mockReconnectTcgData,
}));

// Mock @libsql/client
vi.mock('@libsql/client', () => ({
  createClient: mockCreateClient,
}));

// ---------------------------------------------------------------------------
// Import the service under test *after* mocks are registered.
// ---------------------------------------------------------------------------
import {
  computeFileHash,
  fetchReleaseHash,
  checkForUpdate,
  downloadUpdate,
  validateDatabase,
  verifyDownloadHash,
  applyUpdate,
  performUpdateCheck,
  getCreatedAt,
  refreshUpdateStatus,
  triggerManualUpdate,
  invalidateStatusCache,
} from './tcg-data-update-service';
import type { GitHubRelease } from './tcg-data-update-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_HASH = 'abc123def456abc123def456abc123def456abc123def456abc123def456abcd';
const DIFFERENT_HASH = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

function makeRelease(tag: string, hasAsset = true, hasHashAsset = true): GitHubRelease {
  const assets: GitHubRelease['assets'] = [];
  if (hasAsset) {
    assets.push({
      name: 'tcg-data.sqlite',
      browser_download_url: `https://github.com/download/${tag}/tcg-data.sqlite`,
      size: 1024 * 1024,
    });
  }
  if (hasHashAsset) {
    assets.push({
      name: 'tcg-data.sqlite.sha256',
      browser_download_url: `https://github.com/download/${tag}/tcg-data.sqlite.sha256`,
      size: 64,
    });
  }
  return {
    tag_name: tag,
    name: `Release ${tag}`,
    assets,
  };
}

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Not Found',
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(''),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
  };
}

/** Return a fetch response mock for a hash asset download. */
function mockHashFetchResponse(hash: string) {
  return {
    ok: true,
    text: vi.fn().mockResolvedValue(`${hash}  tcg-data.sqlite\n`),
  };
}

/** Set up the createHash mock to return a given hex digest. */
function setupHashMock(digest: string) {
  mockCreateHash.mockReturnValue({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue(digest),
  });
}

/** Create a fake readable stream that emits data then end (or an error). */
function fakeReadStream(error?: Error) {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  let fired = false;
  const stream = {
    on(event: string, cb: (...args: unknown[]) => void) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
      // Fire events once all three listeners (data, end, error) are registered.
      // computeFileHash registers them in order: data → end → error.
      if (!fired && listeners.data && listeners.end && listeners.error) {
        fired = true;
        if (error) {
          for (const fn of listeners.error) fn(error);
        } else {
          for (const fn of listeners.data) fn(Buffer.from('chunk'));
          for (const fn of listeners.end) fn();
        }
      }
      return stream;
    },
  };
  return stream;
}

/**
 * Set up mocks so that computeFileHash returns the given digest when the file exists.
 * Configures both createReadStream (to produce a fresh fake stream on each call)
 * and createHash (to return the digest).
 */
function setupFileHashMock(digest: string) {
  setupHashMock(digest);
  mockCreateReadStream.mockImplementation(() => fakeReadStream());
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('tcg-data-update-service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();

    // Reset the TTL cache between tests so each starts fresh
    invalidateStatusCache();

    // Default: global fetch is our mock
    vi.stubGlobal('fetch', mockFetch);

    // Default mock for the otcgs client (separate from validation client)
    mockOtcgsExecute.mockResolvedValue(undefined);

    // Default mock for libsql createClient (used in validateDatabase)
    mockValidationExecute.mockResolvedValue({
      rows: [
        { name: 'category' },
        { name: 'group' },
        { name: 'product' },
        { name: 'price' },
        { name: 'product_presale_info' },
        { name: 'metadata' },
        { name: 'manapool_price' },
        { name: 'sku' },
        { name: 'cardtrader_blueprint' },
        { name: 'price_history' },
        { name: 'sku_history' },
        { name: 'price_history_log' },
      ],
    });
    mockCreateClient.mockReturnValue({
      execute: mockValidationExecute,
      close: mockClientClose,
    });

    // Default mocks for streaming download
    mockPipeline.mockResolvedValue(undefined);
    mockCreateWriteStream.mockReturnValue({});

    // Default hash mock (configures both createReadStream and createHash)
    setupFileHashMock(FAKE_HASH);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  // -----------------------------------------------------------------------
  // computeFileHash
  // -----------------------------------------------------------------------
  describe('computeFileHash', () => {
    it('should return null when file does not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      expect(await computeFileHash('/some/path.sqlite')).toBeNull();
    });

    it('should return hex hash when file exists', async () => {
      mockExistsSync.mockReturnValue(true);
      setupFileHashMock(FAKE_HASH);

      expect(await computeFileHash('/some/path.sqlite')).toBe(FAKE_HASH);
      expect(mockCreateHash).toHaveBeenCalledWith('sha256');
    });

    it('should return null when stream errors', async () => {
      mockExistsSync.mockReturnValue(true);
      mockCreateReadStream.mockReturnValue(fakeReadStream(new Error('permission denied')));

      expect(await computeFileHash('/some/path.sqlite')).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // fetchReleaseHash
  // -----------------------------------------------------------------------
  describe('fetchReleaseHash', () => {
    it('should return null when release has no hash asset', async () => {
      const release = makeRelease('tcg-data-20260405', true, false);

      const result = await fetchReleaseHash(release);

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return the hash from the asset', async () => {
      const release = makeRelease('tcg-data-20260405');
      mockFetch.mockResolvedValue(mockHashFetchResponse(FAKE_HASH));

      const result = await fetchReleaseHash(release);

      expect(result).toBe(FAKE_HASH);
    });

    it('should return null when fetch fails', async () => {
      const release = makeRelease('tcg-data-20260405');
      mockFetch.mockResolvedValue({ ok: false });

      const result = await fetchReleaseHash(release);

      expect(result).toBeNull();
    });

    it('should parse sha256sum output format correctly', async () => {
      const release = makeRelease('tcg-data-20260405');
      // sha256sum format: "hash  filename\n"
      mockFetch.mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(`${FAKE_HASH}  tcg-data.sqlite\n`),
      });

      const result = await fetchReleaseHash(release);

      expect(result).toBe(FAKE_HASH);
    });

    it('should return null when hash is not valid hex', async () => {
      const release = makeRelease('tcg-data-20260405');
      mockFetch.mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue('not-a-valid-hash  tcg-data.sqlite\n'),
      });

      const result = await fetchReleaseHash(release);

      expect(result).toBeNull();
    });

    it('should return null when hash is wrong length', async () => {
      const release = makeRelease('tcg-data-20260405');
      mockFetch.mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue('abcdef123456  tcg-data.sqlite\n'),
      });

      const result = await fetchReleaseHash(release);

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // verifyDownloadHash
  // -----------------------------------------------------------------------
  describe('verifyDownloadHash', () => {
    it('should return true when hash matches', async () => {
      mockExistsSync.mockReturnValue(true);
      setupFileHashMock(FAKE_HASH);

      expect(await verifyDownloadHash('/some/file', FAKE_HASH)).toBe(true);
    });

    it('should return false when hash does not match', async () => {
      mockExistsSync.mockReturnValue(true);
      setupFileHashMock(DIFFERENT_HASH);

      expect(await verifyDownloadHash('/some/file', FAKE_HASH)).toBe(false);
    });

    it('should return false when file does not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      expect(await verifyDownloadHash('/some/file', FAKE_HASH)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // checkForUpdate
  // -----------------------------------------------------------------------
  describe('checkForUpdate', () => {
    it('should return the release and hash when local hash differs', async () => {
      mockExistsSync.mockReturnValue(true);
      setupFileHashMock(DIFFERENT_HASH); // local hash differs

      const releases = [makeRelease('tcg-data-20260405')];
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(releases)) // GitHub API
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH)); // hash asset

      const result = await checkForUpdate();

      expect(result).not.toBeNull();
      expect(result!.release.tag_name).toBe('tcg-data-20260405');
      expect(result!.expectedHash).toBe(FAKE_HASH);
    });

    it('should return null when hashes match (already up to date)', async () => {
      mockExistsSync.mockReturnValue(true);
      setupFileHashMock(FAKE_HASH); // local hash matches

      const releases = [makeRelease('tcg-data-20260405')];
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(releases))
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH));

      const result = await checkForUpdate();

      expect(result).toBeNull();
    });

    it('should return the release when local file does not exist', async () => {
      mockExistsSync.mockReturnValue(false); // no local DB file

      const releases = [makeRelease('tcg-data-20260405')];
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(releases))
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH));

      const result = await checkForUpdate();

      expect(result).not.toBeNull();
      expect(result!.expectedHash).toBe(FAKE_HASH);
    });

    it('should return null when release has no hash asset', async () => {
      const releases = [makeRelease('tcg-data-20260405', true, false)]; // no hash asset
      mockFetch.mockResolvedValueOnce(mockFetchResponse(releases));

      const result = await checkForUpdate();

      expect(result).toBeNull();
    });

    it('should return null when no matching releases exist', async () => {
      const releases = [{ tag_name: 'v1.0.0', name: 'v1.0.0', assets: [] }];
      mockFetch.mockResolvedValue(mockFetchResponse(releases));

      const result = await checkForUpdate();

      expect(result).toBeNull();
    });

    it('should throw when GitHub API returns non-OK response', async () => {
      mockFetch.mockResolvedValue(mockFetchResponse(null, false, 403));

      await expect(checkForUpdate()).rejects.toThrow('GitHub API responded with 403');
    });
  });

  // -----------------------------------------------------------------------
  // downloadUpdate
  // -----------------------------------------------------------------------
  describe('downloadUpdate', () => {
    it('should download the asset and stream to temp file', async () => {
      const release = makeRelease('tcg-data-20260405');
      const fakeBody = { readable: true };
      mockFetch.mockResolvedValue({
        ok: true,
        body: fakeBody,
      });
      mockPipeline.mockResolvedValue(undefined);
      mockCreateWriteStream.mockReturnValue({});

      const result = await downloadUpdate(release);

      expect(result).toBe('/fake/workspace/sqlite-data/tcg-data.sqlite.new');
      expect(mockCreateWriteStream).toHaveBeenCalledWith('/fake/workspace/sqlite-data/tcg-data.sqlite.new');
      expect(mockPipeline).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        release.assets[0].browser_download_url,
        expect.objectContaining({ headers: { 'User-Agent': 'open-tcg-store' } }),
      );
    });

    it('should throw when release has no matching asset', async () => {
      const release = makeRelease('tcg-data-20260405', false);

      await expect(downloadUpdate(release)).rejects.toThrow('does not contain a database asset');
    });

    it('should throw when download fetch fails', async () => {
      const release = makeRelease('tcg-data-20260405');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(downloadUpdate(release)).rejects.toThrow('Failed to download asset: 404');
    });

    it('should throw when response body is null', async () => {
      const release = makeRelease('tcg-data-20260405');
      mockFetch.mockResolvedValue({
        ok: true,
        body: null,
      });

      await expect(downloadUpdate(release)).rejects.toThrow('Response body is null');
    });

    it('should prefer compressed .7z asset and decompress', async () => {
      const release = makeRelease('tcg-data-20260405');
      release.assets.push({
        name: 'tcg-data.sqlite.7z',
        browser_download_url: 'https://github.com/download/tcg-data-20260405/tcg-data.sqlite.7z',
        size: 512 * 1024,
      });
      const fakeBody = { readable: true };
      mockFetch.mockResolvedValue({ ok: true, body: fakeBody });
      mockPipeline.mockResolvedValue(undefined);
      mockCreateWriteStream.mockReturnValue({});
      mockExecFileSync.mockReturnValue(undefined);
      mockRenameSync.mockReturnValue(undefined);

      const result = await downloadUpdate(release);

      expect(result).toBe('/fake/workspace/sqlite-data/tcg-data.sqlite.new');
      // Should download the .7z URL
      expect(mockFetch).toHaveBeenCalledWith(
        'https://github.com/download/tcg-data-20260405/tcg-data.sqlite.7z',
        expect.objectContaining({ headers: { 'User-Agent': 'open-tcg-store' } }),
      );
      // Should stream to .7z temp file
      expect(mockCreateWriteStream).toHaveBeenCalledWith('/fake/workspace/sqlite-data/tcg-data.sqlite.new.7z');
      // Should call 7z to extract
      expect(mockExecFileSync).toHaveBeenCalledWith(
        '7z',
        [
          'x',
          '/fake/workspace/sqlite-data/tcg-data.sqlite.new.7z',
          '-o/fake/workspace/sqlite-data/tcg-data-extract',
          '-y',
        ],
        expect.objectContaining({ stdio: 'pipe', timeout: 300_000 }),
      );
      // Should rename extracted file to temp path
      expect(mockRenameSync).toHaveBeenCalledWith(
        '/fake/workspace/sqlite-data/tcg-data-extract/tcg-data.sqlite',
        '/fake/workspace/sqlite-data/tcg-data.sqlite.new',
      );
    });

    it('should fall back to uncompressed asset when .7z is absent', async () => {
      const release = makeRelease('tcg-data-20260405');
      // No .7z asset — only the default tcg-data.sqlite from makeRelease
      const fakeBody = { readable: true };
      mockFetch.mockResolvedValue({ ok: true, body: fakeBody });
      mockPipeline.mockResolvedValue(undefined);
      mockCreateWriteStream.mockReturnValue({});

      const result = await downloadUpdate(release);

      expect(result).toBe('/fake/workspace/sqlite-data/tcg-data.sqlite.new');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://github.com/download/tcg-data-20260405/tcg-data.sqlite',
        expect.objectContaining({ headers: { 'User-Agent': 'open-tcg-store' } }),
      );
      // Should NOT call 7z
      expect(mockExecFileSync).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // validateDatabase
  // -----------------------------------------------------------------------
  describe('validateDatabase', () => {
    it('should return true when all required tables exist', async () => {
      mockValidationExecute.mockResolvedValue({
        rows: [
          { name: 'category' },
          { name: 'group' },
          { name: 'product' },
          { name: 'price' },
          { name: 'product_presale_info' },
          { name: 'metadata' },
          { name: 'manapool_price' },
          { name: 'sku' },
          { name: 'cardtrader_blueprint' },
          { name: 'price_history' },
          { name: 'sku_history' },
          { name: 'price_history_log' },
        ],
      });

      const result = await validateDatabase('/fake/path/db.sqlite');

      expect(result).toBe(true);
      expect(mockCreateClient).toHaveBeenCalledWith({ url: 'file:/fake/path/db.sqlite' });
      expect(mockClientClose).toHaveBeenCalled();
    });

    it('should return false when some required tables are missing', async () => {
      mockValidationExecute.mockResolvedValue({
        rows: [{ name: 'category' }],
      });

      const result = await validateDatabase('/fake/path/db.sqlite');

      expect(result).toBe(false);
      expect(mockClientClose).toHaveBeenCalled();
    });

    it('should return false when no tables are found', async () => {
      mockValidationExecute.mockResolvedValue({ rows: [] });

      const result = await validateDatabase('/fake/path/db.sqlite');

      expect(result).toBe(false);
      expect(mockClientClose).toHaveBeenCalled();
    });

    it('should return false when query throws', async () => {
      mockValidationExecute.mockRejectedValue(new Error('not a database'));

      const result = await validateDatabase('/fake/path/db.sqlite');

      expect(result).toBe(false);
      expect(mockClientClose).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // applyUpdate
  // -----------------------------------------------------------------------
  describe('applyUpdate', () => {
    it('should perform the full DETACH/rename/ATTACH swap', async () => {
      const release = makeRelease('tcg-data-20260405');

      // Start the async operation and advance the 1000ms drain timer
      const promise = applyUpdate(release);
      await vi.advanceTimersByTimeAsync(1000);
      await promise;

      // Should set updating flag
      expect(mockSetDatabaseUpdating).toHaveBeenCalledWith(true);

      // Should DETACH then ATTACH
      expect(mockOtcgsExecute).toHaveBeenCalledWith('DETACH DATABASE tcg_data;');
      expect(mockOtcgsExecute).toHaveBeenCalledWith(expect.stringContaining('ATTACH DATABASE'));

      // Should rename temp file
      expect(mockRenameSync).toHaveBeenCalledWith(
        '/fake/workspace/sqlite-data/tcg-data.sqlite.new',
        '/fake/workspace/sqlite-data/tcg-data.sqlite',
      );

      // Should reconnect standalone connection
      expect(mockReconnectTcgData).toHaveBeenCalled();

      // Should clear updating flag
      expect(mockSetDatabaseUpdating).toHaveBeenCalledWith(false);
    });

    it('should clear updating flag even on error', async () => {
      const release = makeRelease('tcg-data-20260405');
      // Make the otcgs client fail on DETACH
      mockOtcgsExecute.mockRejectedValueOnce(new Error('DETACH failed'));
      // Recovery ATTACH also needs to work
      mockOtcgsExecute.mockResolvedValueOnce(undefined);

      const promise = applyUpdate(release).catch(() => {});
      await vi.advanceTimersByTimeAsync(1000);
      await promise;

      expect(mockSetDatabaseUpdating).toHaveBeenCalledWith(true);
      expect(mockSetDatabaseUpdating).toHaveBeenCalledWith(false);
    });

    it('should attempt recovery ATTACH on error after DETACH', async () => {
      const release = makeRelease('tcg-data-20260405');
      // DETACH succeeds
      mockOtcgsExecute.mockResolvedValueOnce(undefined);
      // renameSync will throw (use mockImplementationOnce to avoid leaking)
      mockRenameSync.mockImplementationOnce(() => {
        throw new Error('rename failed');
      });
      // Recovery ATTACH should be attempted
      mockOtcgsExecute.mockResolvedValueOnce(undefined);

      const promise = applyUpdate(release).catch(() => {});
      await vi.advanceTimersByTimeAsync(1000);
      await promise;

      // Verify recovery was attempted (second execute call is the recovery ATTACH)
      const executeCalls = mockOtcgsExecute.mock.calls;
      expect(executeCalls.length).toBeGreaterThanOrEqual(2);
      expect(executeCalls[executeCalls.length - 1][0]).toContain('ATTACH DATABASE');
    });
  });

  // -----------------------------------------------------------------------
  // getCreatedAt
  // -----------------------------------------------------------------------
  describe('getCreatedAt', () => {
    it('should return the created_at value from the database', async () => {
      mockOtcgsExecute.mockResolvedValueOnce({ rows: [{ value: '2026-04-10T21:30:00.000Z' }] });

      const result = await getCreatedAt();

      expect(result).toBe('2026-04-10T21:30:00.000Z');
    });

    it('should return null when no metadata row exists', async () => {
      mockOtcgsExecute.mockResolvedValueOnce({ rows: [] });

      const result = await getCreatedAt();

      expect(result).toBeNull();
    });

    it('should return null when query throws', async () => {
      mockOtcgsExecute.mockRejectedValueOnce(new Error('db error'));

      const result = await getCreatedAt();

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // performUpdateCheck
  // -----------------------------------------------------------------------
  describe('performUpdateCheck', () => {
    it('should do nothing when no update is available (hashes match)', async () => {
      mockExistsSync.mockReturnValue(true);
      setupFileHashMock(FAKE_HASH);

      mockFetch
        .mockResolvedValueOnce(mockFetchResponse([makeRelease('tcg-data-20260405')])) // releases
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH)); // hash matches

      await performUpdateCheck();

      // Should not attempt download or apply
      expect(mockRenameSync).not.toHaveBeenCalled();
      expect(mockSetDatabaseUpdating).not.toHaveBeenCalled();
    });

    it('should complete full update when all checks pass', async () => {
      // computeFileHash is called twice: once for local DB (should not exist) and
      // once for the downloaded temp file (should exist and match). Use sequential
      // returns: first call → false (no local DB), subsequent calls → true (temp file).
      mockExistsSync.mockReturnValueOnce(false).mockReturnValue(true);
      setupFileHashMock(FAKE_HASH); // hash matches
      mockRenameSync.mockImplementation(() => {});
      const releases = [makeRelease('tcg-data-20260405')];

      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(releases)) // releases
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH)) // hash asset
        .mockResolvedValueOnce({ ok: true, body: { readable: true } }); // download

      // Start the update check and advance the 1000ms drain timer
      const promise = performUpdateCheck();
      await vi.advanceTimersByTimeAsync(1000);
      await promise;

      // Should have performed the swap
      expect(mockSetDatabaseUpdating).toHaveBeenCalledWith(true);
      expect(mockSetDatabaseUpdating).toHaveBeenCalledWith(false);
      expect(mockRenameSync).toHaveBeenCalled();
      expect(mockReconnectTcgData).toHaveBeenCalled();
    });

    it('should clean up temp file on fetch error', async () => {
      mockExistsSync.mockReturnValue(false);
      mockFetch.mockRejectedValue(new Error('network error'));

      await performUpdateCheck();

      // Should not crash, and should attempt cleanup
      expect(mockSetDatabaseUpdating).not.toHaveBeenCalled();
    });

    it('should skip if another check is already running', async () => {
      mockExistsSync.mockReturnValue(false);

      // First call: will block on the checkForUpdate fetch (never resolves)
      let resolveFirstFetch!: (value: unknown) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirstFetch = resolve;
        }),
      );

      const firstCheck = performUpdateCheck();

      // Second call should short-circuit since first is still running
      mockFetch.mockResolvedValueOnce(mockFetchResponse([makeRelease('tcg-data-20260405')]));
      await performUpdateCheck();

      // Only one fetch should have been made (the first one)
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clean up: resolve the first fetch so the promise settles
      resolveFirstFetch(mockFetchResponse([]));
      await firstCheck;
    });
  });

  // NOTE: startUpdateScheduler / stopUpdateScheduler tests removed —
  // scheduling is now managed by the cron system (cron-service.ts).

  // -----------------------------------------------------------------------
  // refreshUpdateStatus
  // -----------------------------------------------------------------------
  describe('refreshUpdateStatus', () => {
    it('should query GitHub and return update available status', async () => {
      mockExistsSync.mockReturnValue(true);
      setupFileHashMock(DIFFERENT_HASH); // local hash differs

      const releases = [makeRelease('tcg-data-20260405')];
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(releases))
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH));

      mockOtcgsExecute.mockResolvedValueOnce({ rows: [{ value: '2026-04-04T12:00:00.000Z' }] });

      const status = await refreshUpdateStatus();

      expect(status.updateAvailable).toBe(true);
      expect(status.latestVersion).toBe('tcg-data-20260405');
      expect(status.currentVersion).toBe('2026-04-04T12:00:00.000Z');
    });

    it('should not throw when GitHub API fails', async () => {
      mockFetch.mockRejectedValue(new Error('network error'));
      mockOtcgsExecute.mockResolvedValueOnce({ rows: [{ value: '2026-04-05T12:00:00.000Z' }] });

      const status = await refreshUpdateStatus();

      // Should not crash, returns current status
      expect(status.currentVersion).toBe('2026-04-05T12:00:00.000Z');
    });

    it('should return cached result within 30s TTL without hitting GitHub', async () => {
      mockExistsSync.mockReturnValue(true);
      setupFileHashMock(DIFFERENT_HASH);

      const releases = [makeRelease('tcg-data-20260405')];
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(releases))
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH));

      mockOtcgsExecute.mockResolvedValue({ rows: [{ value: '2026-04-04T12:00:00.000Z' }] });

      // First call — hits GitHub
      const status1 = await refreshUpdateStatus();
      expect(status1.updateAvailable).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2); // releases + hash asset

      // Advance 10 seconds (within 30s TTL)
      await vi.advanceTimersByTimeAsync(10_000);

      // Second call — should use cache, no new fetch calls
      const status2 = await refreshUpdateStatus();
      expect(status2.updateAvailable).toBe(true);
      expect(status2.latestVersion).toBe('tcg-data-20260405');
      expect(mockFetch).toHaveBeenCalledTimes(2); // still only 2
    });

    it('should re-fetch from GitHub after TTL expires', async () => {
      mockExistsSync.mockReturnValue(true);
      setupFileHashMock(DIFFERENT_HASH);

      const releases = [makeRelease('tcg-data-20260405')];
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(releases))
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH));

      mockOtcgsExecute.mockResolvedValue({ rows: [{ value: '2026-04-04T12:00:00.000Z' }] });

      // First call
      await refreshUpdateStatus();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Advance past the 30s TTL
      await vi.advanceTimersByTimeAsync(31_000);

      // Set up new fetch mocks for the re-fetch
      const newReleases = [makeRelease('tcg-data-20260406')];
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(newReleases))
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH));

      // Second call — should hit GitHub again
      const status = await refreshUpdateStatus();
      expect(status.latestVersion).toBe('tcg-data-20260406');
      expect(mockFetch).toHaveBeenCalledTimes(4); // 2 original + 2 re-fetch
    });

    it('should return fresh data after invalidateStatusCache()', async () => {
      mockExistsSync.mockReturnValue(true);
      setupFileHashMock(DIFFERENT_HASH);

      const releases = [makeRelease('tcg-data-20260405')];
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(releases))
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH));

      mockOtcgsExecute.mockResolvedValue({ rows: [{ value: '2026-04-04T12:00:00.000Z' }] });

      // First call — populates cache
      await refreshUpdateStatus();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Invalidate without advancing time
      invalidateStatusCache();

      // Set up new fetch mocks
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse([makeRelease('tcg-data-20260406')]))
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH));

      // Should hit GitHub again despite being within original TTL window
      const status = await refreshUpdateStatus();
      expect(status.latestVersion).toBe('tcg-data-20260406');
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  // -----------------------------------------------------------------------
  // triggerManualUpdate
  // -----------------------------------------------------------------------
  describe('triggerManualUpdate', () => {
    it('should return success after a full update', async () => {
      // First existsSync call → false (no local DB), subsequent → true (temp file)
      mockExistsSync.mockReturnValueOnce(false).mockReturnValue(true);
      setupFileHashMock(FAKE_HASH);
      mockRenameSync.mockImplementation(() => {});
      const releases = [makeRelease('tcg-data-20260405')];
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(releases))
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH))
        .mockResolvedValueOnce({ ok: true, body: { readable: true } }); // download

      mockValidationExecute.mockResolvedValue({
        rows: [
          { name: 'category' },
          { name: 'group' },
          { name: 'product' },
          { name: 'price' },
          { name: 'product_presale_info' },
          { name: 'metadata' },
          { name: 'manapool_price' },
          { name: 'sku' },
          { name: 'cardtrader_blueprint' },
          { name: 'price_history' },
          { name: 'sku_history' },
          { name: 'price_history_log' },
        ],
      });

      const promise = triggerManualUpdate();
      await vi.advanceTimersByTimeAsync(1000);
      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.newVersion).toBe('tcg-data-20260405');
      expect(result.message).toContain('tcg-data-20260405');
    });

    it('should return failure when no update is available', async () => {
      mockExistsSync.mockReturnValue(true);
      setupFileHashMock(FAKE_HASH); // local hash matches release hash

      const releases = [makeRelease('tcg-data-20260405')];
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(releases)) // releases
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH)); // hash matches

      const result = await triggerManualUpdate();

      expect(result.success).toBe(false);
      expect(result.message).toBe('No update available');
    });

    it('should return failure when hash verification fails', async () => {
      // First existsSync → false (no local DB), then true (temp file exists for hash check)
      mockExistsSync.mockReturnValueOnce(false).mockReturnValue(true);
      setupFileHashMock(DIFFERENT_HASH); // hash won't match the expected
      const releases = [makeRelease('tcg-data-20260405')];
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(releases))
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH))
        .mockResolvedValueOnce({ ok: true, body: { readable: true } }); // download

      const result = await triggerManualUpdate();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Downloaded file hash does not match release');
    });

    it('should return failure when validation fails', async () => {
      // First existsSync → false (no local DB), then true (temp file)
      mockExistsSync.mockReturnValueOnce(false).mockReturnValue(true);
      setupFileHashMock(FAKE_HASH);
      const releases = [makeRelease('tcg-data-20260405')];
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(releases))
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH))
        .mockResolvedValueOnce({ ok: true, body: { readable: true } });

      mockValidationExecute.mockResolvedValue({ rows: [] });

      const result = await triggerManualUpdate();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Downloaded database failed validation');
    });

    it('should return failure when download fails', async () => {
      mockExistsSync.mockReturnValue(false); // no local file
      const releases = [makeRelease('tcg-data-20260405')];
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(releases)) // releases API
        .mockResolvedValueOnce(mockHashFetchResponse(FAKE_HASH)) // hash asset
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' }); // download fails

      const result = await triggerManualUpdate();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to download asset');
    });

    it('should return failure when already in progress', async () => {
      // Start a slow update that blocks
      mockExistsSync.mockReturnValue(false);
      let resolveFirstFetch!: (value: unknown) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirstFetch = resolve;
        }),
      );

      const firstUpdate = triggerManualUpdate();

      // Second call should fail immediately
      const secondResult = await triggerManualUpdate();
      expect(secondResult.success).toBe(false);
      expect(secondResult.message).toBe('An update is already in progress');

      // Clean up: resolve the first fetch
      resolveFirstFetch(mockFetchResponse([]));
      await firstUpdate;
    });
  });
});
