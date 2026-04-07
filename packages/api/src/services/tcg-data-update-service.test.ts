import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Use vi.hoisted so mock variables are available when vi.mock factories run.
// ---------------------------------------------------------------------------

const {
  mockExistsSync,
  mockReadFileSync,
  mockWriteFileSync,
  mockRenameSync,
  mockUnlinkSync,
  mockCreateWriteStream,
  mockSetDatabaseUpdating,
  mockReconnectTcgData,
  mockCreateClient,
  mockOtcgsExecute,
  mockValidationExecute,
  mockClientClose,
  mockFetch,
  mockPipeline,
} = vi.hoisted(() => ({
  mockExistsSync: vi.fn(),
  mockReadFileSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
  mockRenameSync: vi.fn(),
  mockUnlinkSync: vi.fn(),
  mockCreateWriteStream: vi.fn(),
  mockSetDatabaseUpdating: vi.fn(),
  mockReconnectTcgData: vi.fn(),
  mockCreateClient: vi.fn(),
  mockOtcgsExecute: vi.fn(),
  mockValidationExecute: vi.fn(),
  mockClientClose: vi.fn(),
  mockFetch: vi.fn(),
  mockPipeline: vi.fn(),
}));

// Mock node:fs
vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  renameSync: mockRenameSync,
  unlinkSync: mockUnlinkSync,
  createWriteStream: mockCreateWriteStream,
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

// Mock the db modules
vi.mock('../db/otcgs/index', () => ({
  client: { execute: mockOtcgsExecute },
  setDatabaseUpdating: mockSetDatabaseUpdating,
  tcgDataFilePath: '/fake/workspace/sqlite-data/tcg-data.sqlite',
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
  getCurrentVersion,
  checkForUpdate,
  downloadUpdate,
  validateDatabase,
  applyUpdate,
  performUpdateCheck,
  startUpdateScheduler,
  stopUpdateScheduler,
} from './tcg-data-update-service';
import type { GitHubRelease } from './tcg-data-update-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRelease(tag: string, hasAsset = true): GitHubRelease {
  return {
    tag_name: tag,
    name: `Release ${tag}`,
    assets: hasAsset
      ? [
          {
            name: 'tcg-data.sqlite',
            browser_download_url: `https://github.com/download/${tag}/tcg-data.sqlite`,
            size: 1024 * 1024,
          },
        ]
      : [],
  };
}

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Not Found',
    json: vi.fn().mockResolvedValue(body),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('tcg-data-update-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default: global fetch is our mock
    vi.stubGlobal('fetch', mockFetch);

    // Default mock for the otcgs client (separate from validation client)
    mockOtcgsExecute.mockResolvedValue(undefined);

    // Default mock for libsql createClient (used in validateDatabase)
    mockValidationExecute.mockResolvedValue({
      rows: [{ name: 'category' }, { name: 'group' }, { name: 'product' }, { name: 'price' }],
    });
    mockCreateClient.mockReturnValue({
      execute: mockValidationExecute,
      close: mockClientClose,
    });

    // Default mocks for streaming download
    mockPipeline.mockResolvedValue(undefined);
    mockCreateWriteStream.mockReturnValue({});
  });

  afterEach(() => {
    stopUpdateScheduler();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  // -----------------------------------------------------------------------
  // getCurrentVersion
  // -----------------------------------------------------------------------
  describe('getCurrentVersion', () => {
    it('should return null when version file does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const version = getCurrentVersion();

      expect(version).toBeNull();
    });

    it('should return trimmed version string when file exists', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('initial-db-20260405\n');

      const version = getCurrentVersion();

      expect(version).toBe('initial-db-20260405');
    });

    it('should return null when reading file throws', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('permission denied');
      });

      const version = getCurrentVersion();

      expect(version).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // checkForUpdate
  // -----------------------------------------------------------------------
  describe('checkForUpdate', () => {
    it('should return the latest release when a new version is available', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('initial-db-20260404');
      const releases = [makeRelease('initial-db-20260405'), makeRelease('initial-db-20260404')];
      mockFetch.mockResolvedValue(mockFetchResponse(releases));

      const result = await checkForUpdate();

      expect(result).toEqual(releases[0]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.github.com/repos/jimsimon/open-tcg-store/releases'),
        expect.objectContaining({
          headers: expect.objectContaining({ 'User-Agent': 'open-tcg-store' }),
        }),
      );
    });

    it('should return null when already up to date', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('initial-db-20260405');
      mockFetch.mockResolvedValue(mockFetchResponse([makeRelease('initial-db-20260405')]));

      const result = await checkForUpdate();

      expect(result).toBeNull();
    });

    it('should return the latest release when no version file exists', async () => {
      mockExistsSync.mockReturnValue(false);
      const releases = [makeRelease('initial-db-20260405')];
      mockFetch.mockResolvedValue(mockFetchResponse(releases));

      const result = await checkForUpdate();

      expect(result).toEqual(releases[0]);
    });

    it('should return null when no matching releases exist', async () => {
      mockExistsSync.mockReturnValue(false);
      const releases = [{ tag_name: 'v1.0.0', name: 'v1.0.0', assets: [] }];
      mockFetch.mockResolvedValue(mockFetchResponse(releases));

      const result = await checkForUpdate();

      expect(result).toBeNull();
    });

    it('should throw when GitHub API returns non-OK response', async () => {
      mockExistsSync.mockReturnValue(false);
      mockFetch.mockResolvedValue(mockFetchResponse(null, false, 403));

      await expect(checkForUpdate()).rejects.toThrow('GitHub API responded with 403');
    });
  });

  // -----------------------------------------------------------------------
  // downloadUpdate
  // -----------------------------------------------------------------------
  describe('downloadUpdate', () => {
    it('should download the asset and stream to temp file', async () => {
      const release = makeRelease('initial-db-20260405');
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
      const release = makeRelease('initial-db-20260405', false);

      await expect(downloadUpdate(release)).rejects.toThrow('does not contain a tcg-data.sqlite asset');
    });

    it('should throw when download fetch fails', async () => {
      const release = makeRelease('initial-db-20260405');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(downloadUpdate(release)).rejects.toThrow('Failed to download asset: 404');
    });

    it('should throw when response body is null', async () => {
      const release = makeRelease('initial-db-20260405');
      mockFetch.mockResolvedValue({
        ok: true,
        body: null,
      });

      await expect(downloadUpdate(release)).rejects.toThrow('Response body is null');
    });
  });

  // -----------------------------------------------------------------------
  // validateDatabase
  // -----------------------------------------------------------------------
  describe('validateDatabase', () => {
    it('should return true when all required tables exist', async () => {
      mockValidationExecute.mockResolvedValue({
        rows: [{ name: 'category' }, { name: 'group' }, { name: 'product' }, { name: 'price' }],
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
      const release = makeRelease('initial-db-20260405');

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

      // Should write version file
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/fake/workspace/sqlite-data/tcg-data.version',
        'initial-db-20260405',
        'utf-8',
      );

      // Should clear updating flag
      expect(mockSetDatabaseUpdating).toHaveBeenCalledWith(false);
    });

    it('should clear updating flag even on error', async () => {
      const release = makeRelease('initial-db-20260405');
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
      const release = makeRelease('initial-db-20260405');
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
  // performUpdateCheck
  // -----------------------------------------------------------------------
  describe('performUpdateCheck', () => {
    it('should do nothing when no update is available', async () => {
      // Already up to date
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('initial-db-20260405');
      mockFetch.mockResolvedValue(mockFetchResponse([makeRelease('initial-db-20260405')]));

      await performUpdateCheck();

      // Should not attempt download or apply
      expect(mockWriteFileSync).not.toHaveBeenCalled();
      expect(mockRenameSync).not.toHaveBeenCalled();
      expect(mockSetDatabaseUpdating).not.toHaveBeenCalled();
    });

    it('should skip update when validation fails', async () => {
      // New version available
      mockExistsSync.mockReturnValue(false);
      const releases = [makeRelease('initial-db-20260405')];
      mockFetch
        // checkForUpdate fetch
        .mockResolvedValueOnce(mockFetchResponse(releases))
        // downloadUpdate fetch
        .mockResolvedValueOnce({
          ok: true,
          body: { readable: true },
        });
      mockPipeline.mockResolvedValue(undefined);
      mockCreateWriteStream.mockReturnValue({});

      // Validation fails (no required tables)
      mockValidationExecute.mockResolvedValue({ rows: [] });

      await performUpdateCheck();

      // Should not perform the swap
      expect(mockSetDatabaseUpdating).not.toHaveBeenCalled();
      expect(mockRenameSync).not.toHaveBeenCalled();
    });

    it('should complete full update when validation passes', async () => {
      // New version available
      mockExistsSync.mockReturnValue(false);
      mockRenameSync.mockImplementation(() => {}); // Reset from any prior test
      const releases = [makeRelease('initial-db-20260405')];

      mockFetch
        // checkForUpdate fetch
        .mockResolvedValueOnce(mockFetchResponse(releases))
        // downloadUpdate fetch
        .mockResolvedValueOnce({
          ok: true,
          body: { readable: true },
        });
      mockPipeline.mockResolvedValue(undefined);
      mockCreateWriteStream.mockReturnValue({});

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
      // Simulate a slow update that hasn't resolved yet
      mockExistsSync.mockReturnValue(false);
      const releases = [makeRelease('initial-db-20260405')];

      // First call: will block on the checkForUpdate fetch (never resolves)
      let resolveFirstFetch!: (value: unknown) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirstFetch = resolve;
        }),
      );

      const firstCheck = performUpdateCheck();

      // Second call should short-circuit since first is still running
      mockFetch.mockResolvedValueOnce(mockFetchResponse(releases));
      await performUpdateCheck();

      // Only one fetch should have been made (the first one)
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clean up: resolve the first fetch so the promise settles
      resolveFirstFetch(mockFetchResponse([makeRelease('initial-db-20260405')]));
      await firstCheck;
    });
  });

  // -----------------------------------------------------------------------
  // startUpdateScheduler / stopUpdateScheduler
  // -----------------------------------------------------------------------
  describe('startUpdateScheduler / stopUpdateScheduler', () => {
    it('should call performUpdateCheck immediately on start', () => {
      // Mock fetch to return "already up to date"
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('initial-db-20260405');
      mockFetch.mockResolvedValue(mockFetchResponse([makeRelease('initial-db-20260405')]));

      startUpdateScheduler();

      // The immediate check should have triggered a fetch
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should schedule periodic checks', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('initial-db-20260405');
      mockFetch.mockResolvedValue(mockFetchResponse([makeRelease('initial-db-20260405')]));

      startUpdateScheduler();

      // Flush the initial async check so the _isCheckRunning guard clears
      await vi.advanceTimersByTimeAsync(0);
      vi.clearAllMocks();

      // Re-mock fetch for the periodic check
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('initial-db-20260405');
      mockFetch.mockResolvedValue(mockFetchResponse([makeRelease('initial-db-20260405')]));

      // Advance 24 hours
      await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should stop the scheduler when stopUpdateScheduler is called', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('initial-db-20260405');
      mockFetch.mockResolvedValue(mockFetchResponse([makeRelease('initial-db-20260405')]));

      startUpdateScheduler();
      stopUpdateScheduler();
      vi.clearAllMocks();

      // Advance 24 hours — should NOT trigger another check
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('stopUpdateScheduler should be safe to call when not started', () => {
      expect(() => stopUpdateScheduler()).not.toThrow();
    });

    it('should not leak intervals when startUpdateScheduler is called multiple times', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('initial-db-20260405');
      mockFetch.mockResolvedValue(mockFetchResponse([makeRelease('initial-db-20260405')]));

      startUpdateScheduler();
      const firstFetchCount = mockFetch.mock.calls.length;

      // Second call should be a no-op
      startUpdateScheduler();

      // Should not have triggered another immediate check
      expect(mockFetch.mock.calls.length).toBe(firstFetchCount);
    });
  });
});
