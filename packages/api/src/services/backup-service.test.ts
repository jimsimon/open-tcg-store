import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Use vi.hoisted so mock variables are available when vi.mock factories run.
// ---------------------------------------------------------------------------

const {
  mockStoreOAuthTokens,
  mockGetOAuthTokens,
  mockGetOAuthClientId,
  mockGetOAuthClientSecret,
  mockUpdateLastBackupAt,
  mockExistsSync,
  mockReadFileSync,
  mockWriteFileSync,
  mockCreateReadStream,
  mockUnlinkSync,
  mockRmSync,
  mockMkdtempSync,
  mockRenameSync,
  mockCopyFileSync,
  mockCalculatePKCECodeChallenge,
  mockAuthorizationCodeGrantRequest,
  mockProcessAuthorizationCodeResponse,
  mockRefreshTokenGrantRequest,
  mockProcessRefreshTokenResponse,
  mockDriveFilesList,
  mockDriveFilesCreate,
  mockDriveFilesGet,
  mockFilesUpload,
  mockFilesListFolder,
  mockFilesDownload,
  mockOneDriveCreateFolder,
  mockOneDriveListChildren,
  mockOneDriveUploadSimple,
  mockOneDriveDownload,
  mockDbRun,
  mockLibsqlExecute,
  mockLibsqlClose,
  MockResponseBodyError,
} = vi.hoisted(() => {
  class _MockResponseBodyError extends Error {
    error: string;
    error_description?: string;
    status: number;
    constructor(
      message: string,
      options: { cause: { error: string; error_description?: string }; response: { status: number } },
    ) {
      super(message, options);
      this.name = 'ResponseBodyError';
      this.error = options.cause.error;
      this.error_description = options.cause.error_description;
      this.status = options.response.status;
    }
  }

  return {
    mockStoreOAuthTokens: vi.fn(),
    mockGetOAuthTokens: vi.fn(),
    mockGetOAuthClientId: vi.fn(),
    mockGetOAuthClientSecret: vi.fn(),
    mockUpdateLastBackupAt: vi.fn(),
    mockExistsSync: vi.fn(),
    mockReadFileSync: vi.fn(),
    mockWriteFileSync: vi.fn(),
    mockCreateReadStream: vi.fn(),
    mockUnlinkSync: vi.fn(),
    mockRmSync: vi.fn(),
    mockMkdtempSync: vi.fn(() => '/tmp/otcgs-backup-xyz'),
    mockRenameSync: vi.fn(),
    mockCopyFileSync: vi.fn(),
    mockCalculatePKCECodeChallenge: vi.fn(),
    mockAuthorizationCodeGrantRequest: vi.fn(),
    mockProcessAuthorizationCodeResponse: vi.fn(),
    mockRefreshTokenGrantRequest: vi.fn(),
    mockProcessRefreshTokenResponse: vi.fn(),
    mockDriveFilesList: vi.fn(),
    mockDriveFilesCreate: vi.fn(),
    mockDriveFilesGet: vi.fn(),
    mockFilesUpload: vi.fn(),
    mockFilesListFolder: vi.fn(),
    mockFilesDownload: vi.fn(),
    mockOneDriveCreateFolder: vi.fn(),
    mockOneDriveListChildren: vi.fn(),
    mockOneDriveUploadSimple: vi.fn(),
    mockOneDriveDownload: vi.fn(),
    mockDbRun: vi.fn().mockResolvedValue(undefined),
    mockLibsqlExecute: vi.fn().mockResolvedValue({ rows: [['ok']] }),
    mockLibsqlClose: vi.fn(),
    MockResponseBodyError: _MockResponseBodyError,
  };
});

// Mock settings-service
vi.mock('./settings-service', () => ({
  storeOAuthTokens: mockStoreOAuthTokens,
  getOAuthTokens: mockGetOAuthTokens,
  getOAuthClientId: mockGetOAuthClientId,
  getOAuthClientSecret: mockGetOAuthClientSecret,
  updateLastBackupAt: mockUpdateLastBackupAt,
}));

// Mock drizzle config (provides databaseFilePath)
vi.mock('../db/otcgs/drizzle.config', () => ({
  databaseFile: 'file:/fake/workspace/sqlite-data/otcgs.sqlite',
  databaseFilePath: '/fake/workspace/sqlite-data/otcgs.sqlite',
}));

// Mock otcgs database instance
vi.mock('../db/otcgs/index', () => ({
  otcgs: { run: mockDbRun },
}));

// Mock drizzle-orm sql template tag (must be callable as a tagged template literal)
vi.mock('drizzle-orm', () => {
  const sqlFn = (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((result, str, i) => result + str + (values[i] ?? ''), '');
  sqlFn.raw = (s: string) => s;
  return { sql: sqlFn };
});

// Mock node:fs
vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  createReadStream: mockCreateReadStream,
  unlinkSync: mockUnlinkSync,
  rmSync: mockRmSync,
  mkdtempSync: mockMkdtempSync,
  renameSync: mockRenameSync,
  copyFileSync: mockCopyFileSync,
}));

// Mock node:os
vi.mock('node:os', () => ({
  tmpdir: vi.fn(() => '/tmp'),
}));

// Mock @libsql/client for safeRestore integrity check
vi.mock('@libsql/client', () => ({
  createClient: vi.fn(() => ({
    execute: mockLibsqlExecute,
    close: mockLibsqlClose,
  })),
}));

// Mock oauth4webapi — include ResponseBodyError so `instanceof` checks work
vi.mock('oauth4webapi', () => ({
  generateRandomState: vi.fn(() => 'mock-state-token'),
  generateRandomCodeVerifier: vi.fn(() => 'mock-code-verifier'),
  calculatePKCECodeChallenge: mockCalculatePKCECodeChallenge,
  validateAuthResponse: vi.fn(() => new URLSearchParams({ code: 'mock-code' })),
  authorizationCodeGrantRequest: mockAuthorizationCodeGrantRequest,
  processAuthorizationCodeResponse: mockProcessAuthorizationCodeResponse,
  refreshTokenGrantRequest: mockRefreshTokenGrantRequest,
  processRefreshTokenResponse: mockProcessRefreshTokenResponse,
  None: vi.fn(() => vi.fn()),
  ClientSecretPost: vi.fn(() => vi.fn()),
  ResponseBodyError: MockResponseBodyError,
}));

// Mock googleapis - use a class so `new google.auth.OAuth2(...)` works
vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: class {
        setCredentials = vi.fn();
      },
    },
    drive: vi.fn(() => ({
      files: {
        list: mockDriveFilesList,
        create: mockDriveFilesCreate,
        get: mockDriveFilesGet,
      },
    })),
  },
}));

// Mock dropbox - use a class so `new Dropbox(...)` works
vi.mock('dropbox', () => ({
  Dropbox: class {
    filesUpload = mockFilesUpload;
    filesListFolder = mockFilesListFolder;
    filesDownload = mockFilesDownload;
  },
}));

// Mock onedrive-api
vi.mock('onedrive-api', () => ({
  default: {
    items: {
      createFolder: mockOneDriveCreateFolder,
      listChildren: mockOneDriveListChildren,
      uploadSimple: mockOneDriveUploadSimple,
      download: mockOneDriveDownload,
    },
  },
}));

// ---------------------------------------------------------------------------
// Import the service under test *after* mocks are registered.
// ---------------------------------------------------------------------------
import {
  getAuthUrl,
  handleOAuthCallback,
  performBackup,
  performRestore,
  getGoogleDriveAuthUrl,
  getDropboxAuthUrl,
  getOneDriveAuthUrl,
  handleGoogleDriveCallback,
  handleDropboxCallback,
  handleOneDriveCallback,
} from './backup-service';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('backup-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default implementations cleared by clearAllMocks
    mockMkdtempSync.mockReturnValue('/tmp/otcgs-backup-xyz');
    mockLibsqlExecute.mockResolvedValue({ rows: [['ok']] });
    mockCalculatePKCECodeChallenge.mockResolvedValue('mock-code-challenge');
    // Return client IDs from DB (the only source)
    mockGetOAuthClientId.mockImplementation((provider: string) => {
      switch (provider) {
        case 'google_drive':
          return Promise.resolve('google-client-id');
        case 'dropbox':
          return Promise.resolve('dropbox-app-key');
        case 'onedrive':
          return Promise.resolve('onedrive-client-id');
        default:
          return Promise.resolve(null);
      }
    });
    mockGetOAuthClientSecret.mockImplementation((provider: string) => {
      switch (provider) {
        case 'google_drive':
          return Promise.resolve('google-client-secret');
        default:
          return Promise.resolve(null);
      }
    });
    process.env.APP_URL = 'http://localhost';
  });

  // -----------------------------------------------------------------------
  // getAuthUrl (PKCE flow via oauth4webapi)
  // -----------------------------------------------------------------------
  describe('getAuthUrl', () => {
    it('should generate Google Drive auth URL with PKCE parameters', async () => {
      const url = await getAuthUrl('google_drive');
      const parsed = new URL(url);

      expect(parsed.origin).toBe('https://accounts.google.com');
      expect(parsed.pathname).toBe('/o/oauth2/v2/auth');
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('client_id')).toBe('google-client-id');
      expect(parsed.searchParams.get('code_challenge')).toBe('mock-code-challenge');
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
      expect(parsed.searchParams.get('scope')).toBe('https://www.googleapis.com/auth/drive.file');
      expect(parsed.searchParams.get('access_type')).toBe('offline');
      expect(parsed.searchParams.get('prompt')).toBe('consent');
      expect(parsed.searchParams.get('state')).toBe('mock-state-token');
    });

    it('should generate Dropbox auth URL with PKCE parameters', async () => {
      const url = await getAuthUrl('dropbox');
      const parsed = new URL(url);

      expect(parsed.origin).toBe('https://www.dropbox.com');
      expect(parsed.pathname).toBe('/oauth2/authorize');
      expect(parsed.searchParams.get('client_id')).toBe('dropbox-app-key');
      expect(parsed.searchParams.get('code_challenge')).toBe('mock-code-challenge');
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
      expect(parsed.searchParams.get('token_access_type')).toBe('offline');
      expect(parsed.searchParams.has('scope')).toBe(false);
    });

    it('should generate OneDrive auth URL with PKCE parameters', async () => {
      const url = await getAuthUrl('onedrive');
      const parsed = new URL(url);

      expect(parsed.origin).toBe('https://login.microsoftonline.com');
      expect(parsed.searchParams.get('client_id')).toBe('onedrive-client-id');
      expect(parsed.searchParams.get('code_challenge')).toBe('mock-code-challenge');
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
      expect(parsed.searchParams.get('scope')).toBe('Files.ReadWrite offline_access');
    });

    it('should use client ID from the database', async () => {
      mockGetOAuthClientId.mockResolvedValue('db-google-client-id');

      const url = await getAuthUrl('google_drive');
      const parsed = new URL(url);

      expect(parsed.searchParams.get('client_id')).toBe('db-google-client-id');
      expect(mockGetOAuthClientId).toHaveBeenCalledWith('google_drive');
    });

    it('should use empty client ID when database has no value', async () => {
      mockGetOAuthClientId.mockResolvedValue(null);

      const url = await getAuthUrl('google_drive');
      const parsed = new URL(url);

      expect(parsed.searchParams.get('client_id')).toBe('');
    });
  });

  // -----------------------------------------------------------------------
  // Convenience auth URL functions
  // -----------------------------------------------------------------------
  describe('convenience auth URL functions', () => {
    it('getGoogleDriveAuthUrl should return a Google auth URL', async () => {
      const url = await getGoogleDriveAuthUrl();
      expect(url).toContain('accounts.google.com');
    });

    it('getDropboxAuthUrl should return a Dropbox auth URL', async () => {
      const url = await getDropboxAuthUrl();
      expect(url).toContain('dropbox.com');
    });

    it('getOneDriveAuthUrl should return a OneDrive auth URL', async () => {
      const url = await getOneDriveAuthUrl();
      expect(url).toContain('login.microsoftonline.com');
    });
  });

  // -----------------------------------------------------------------------
  // handleOAuthCallback (PKCE token exchange via oauth4webapi)
  // -----------------------------------------------------------------------
  describe('handleOAuthCallback', () => {
    it('should exchange code for tokens via PKCE and store them', async () => {
      mockAuthorizationCodeGrantRequest.mockResolvedValue(new Response());
      mockProcessAuthorizationCodeResponse.mockResolvedValue({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
      });

      await handleOAuthCallback('google_drive', 'auth-code-123', 'test-verifier');

      expect(mockAuthorizationCodeGrantRequest).toHaveBeenCalled();
      expect(mockStoreOAuthTokens).toHaveBeenCalledWith('google_drive', 'new-access', 'new-refresh');
    });

    it('should throw when no access token is returned', async () => {
      mockAuthorizationCodeGrantRequest.mockResolvedValue(new Response());
      mockProcessAuthorizationCodeResponse.mockResolvedValue({
        access_token: '',
      });

      await expect(handleOAuthCallback('dropbox', 'code', 'verifier')).rejects.toThrow(
        'Failed to obtain dropbox access token',
      );
    });

    it('should throw when token exchange fails', async () => {
      mockAuthorizationCodeGrantRequest.mockResolvedValue(new Response());
      mockProcessAuthorizationCodeResponse.mockRejectedValue(new Error('invalid_grant'));

      await expect(handleOAuthCallback('google_drive', 'code', 'verifier')).rejects.toThrow('invalid_grant');
    });

    it('should surface error_description from ResponseBodyError', async () => {
      mockAuthorizationCodeGrantRequest.mockResolvedValue(new Response());
      mockProcessAuthorizationCodeResponse.mockRejectedValue(
        new MockResponseBodyError('server responded with an error in the response body', {
          cause: { error: 'invalid_client', error_description: 'The OAuth client was not found.' },
          response: { status: 401 },
        }),
      );

      await expect(handleOAuthCallback('google_drive', 'code', 'verifier')).rejects.toThrow(
        'google_drive token exchange failed: The OAuth client was not found.',
      );
    });

    it('should surface error code from ResponseBodyError when no description', async () => {
      mockAuthorizationCodeGrantRequest.mockResolvedValue(new Response());
      mockProcessAuthorizationCodeResponse.mockRejectedValue(
        new MockResponseBodyError('server responded with an error in the response body', {
          cause: { error: 'invalid_grant' },
          response: { status: 400 },
        }),
      );

      await expect(handleOAuthCallback('dropbox', 'code', 'verifier')).rejects.toThrow(
        'dropbox token exchange failed: invalid_grant',
      );
    });
  });

  // -----------------------------------------------------------------------
  // Convenience callback functions
  // -----------------------------------------------------------------------
  describe('convenience callback functions', () => {
    beforeEach(() => {
      mockAuthorizationCodeGrantRequest.mockResolvedValue(new Response());
      mockProcessAuthorizationCodeResponse.mockResolvedValue({
        access_token: 'access',
        refresh_token: 'refresh',
      });
    });

    it('handleGoogleDriveCallback should handle google_drive callback', async () => {
      await handleGoogleDriveCallback('code', 'verifier');
      expect(mockStoreOAuthTokens).toHaveBeenCalledWith('google_drive', 'access', 'refresh');
    });

    it('handleDropboxCallback should handle dropbox callback', async () => {
      await handleDropboxCallback('code', 'verifier');
      expect(mockStoreOAuthTokens).toHaveBeenCalledWith('dropbox', 'access', 'refresh');
    });

    it('handleOneDriveCallback should handle onedrive callback', async () => {
      await handleOneDriveCallback('code', 'verifier');
      expect(mockStoreOAuthTokens).toHaveBeenCalledWith('onedrive', 'access', 'refresh');
    });
  });

  // -----------------------------------------------------------------------
  // performBackup
  // -----------------------------------------------------------------------
  describe('performBackup', () => {
    /** Helper to mock token refresh via oauth4webapi. */
    function mockTokenRefreshSuccess() {
      mockRefreshTokenGrantRequest.mockResolvedValue(new Response());
      mockProcessRefreshTokenResponse.mockResolvedValue({
        access_token: 'new-access',
        refresh_token: 'refresh',
      });
    }

    it('should return failure when database file does not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await performBackup('google_drive');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database file not found');
    });

    it('should backup to Google Drive successfully', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('db-content'));
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockTokenRefreshSuccess();
      // Folder search returns existing folder
      mockDriveFilesList.mockResolvedValue({
        data: { files: [{ id: 'folder-123' }] },
      });
      mockDriveFilesCreate.mockResolvedValue({});

      const result = await performBackup('google_drive');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Backup created successfully');
      expect(result.timestamp).toBeDefined();
      expect(mockUpdateLastBackupAt).toHaveBeenCalled();
    });

    it('should backup to Dropbox successfully', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('db-content'));
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockTokenRefreshSuccess();
      mockFilesUpload.mockResolvedValue({});

      const result = await performBackup('dropbox');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Backup created successfully');
      expect(mockUpdateLastBackupAt).toHaveBeenCalled();
    });

    it('should backup to OneDrive successfully', async () => {
      mockExistsSync.mockReturnValue(true);
      mockCreateReadStream.mockReturnValue('stream');
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockTokenRefreshSuccess();
      mockOneDriveCreateFolder.mockResolvedValue({});
      mockOneDriveListChildren.mockResolvedValue({
        value: [{ name: 'otcgs-backups', id: 'folder-id' }],
      });
      mockOneDriveUploadSimple.mockResolvedValue({});

      const result = await performBackup('onedrive');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Backup created successfully');
      expect(mockUpdateLastBackupAt).toHaveBeenCalled();
    });

    it('should backup to Google Drive creating folder when none exists', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('db-content'));
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockTokenRefreshSuccess();
      // Folder search returns empty — no existing folder
      mockDriveFilesList.mockResolvedValue({
        data: { files: [] },
      });
      // Create folder returns new folder ID
      mockDriveFilesCreate.mockResolvedValue({ data: { id: 'new-folder-id' } });

      const result = await performBackup('google_drive');

      expect(result.success).toBe(true);
      // Create should be called twice: once for folder, once for file
      expect(mockDriveFilesCreate).toHaveBeenCalled();
    });

    it('should fail OneDrive backup when folder not found after creation', async () => {
      mockExistsSync.mockReturnValue(true);
      mockCreateReadStream.mockReturnValue('stream');
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockTokenRefreshSuccess();
      mockOneDriveCreateFolder.mockResolvedValue({});
      // Folder not found in children list
      mockOneDriveListChildren.mockResolvedValue({ value: [] });

      const result = await performBackup('onedrive');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to find or create backup folder');
    });

    it('should return failure on backup error', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('db-content'));
      mockGetOAuthTokens.mockResolvedValue({ accessToken: null, refreshToken: null });

      const result = await performBackup('google_drive');

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should return failure for unknown provider', async () => {
      mockExistsSync.mockReturnValue(true);

      const result = await performBackup('unknown_provider' as 'google_drive');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown provider');
    });
  });

  // -----------------------------------------------------------------------
  // performRestore
  // -----------------------------------------------------------------------
  describe('performRestore', () => {
    /** Helper to mock token refresh via oauth4webapi. */
    function mockTokenRefreshSuccess() {
      mockRefreshTokenGrantRequest.mockResolvedValue(new Response());
      mockProcessRefreshTokenResponse.mockResolvedValue({
        access_token: 'new-access',
        refresh_token: 'refresh',
      });
    }

    it('should restore from Google Drive successfully', async () => {
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockTokenRefreshSuccess();
      // Folder search
      mockDriveFilesList
        .mockResolvedValueOnce({ data: { files: [{ id: 'folder-123' }] } })
        // File search
        .mockResolvedValueOnce({
          data: { files: [{ id: 'file-123', name: 'otcgs-backup-2025.sqlite' }] },
        });
      // File download
      mockDriveFilesGet.mockResolvedValue({ data: new ArrayBuffer(100) });

      const result = await performRestore('google_drive');

      expect(result.success).toBe(true);
      expect(result.message).toContain('restored successfully');
    });

    it('should restore from Dropbox successfully', async () => {
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockTokenRefreshSuccess();
      mockFilesListFolder.mockResolvedValue({
        result: {
          entries: [{ '.tag': 'file', name: 'otcgs-backup-2025.sqlite', path_lower: '/backups/file.sqlite' }],
        },
      });
      mockFilesDownload.mockResolvedValue({
        result: { fileBinary: Buffer.from('restored-data') },
      });

      const result = await performRestore('dropbox');

      expect(result.success).toBe(true);
      expect(result.message).toContain('restored successfully');
    });

    it('should restore from OneDrive successfully', async () => {
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockTokenRefreshSuccess();
      // Root children — find backup folder
      mockOneDriveListChildren
        .mockResolvedValueOnce({
          value: [{ name: 'otcgs-backups', id: 'folder-id' }],
        })
        // Folder children — find backup files
        .mockResolvedValueOnce({
          value: [
            { name: 'otcgs-backup-2025-01-01.sqlite', id: 'file-1' },
            { name: 'otcgs-backup-2025-01-02.sqlite', id: 'file-2' },
          ],
        });
      // Download latest backup (file-2, sorted descending)
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield Buffer.from('restored-data');
        },
      };
      mockOneDriveDownload.mockResolvedValue(mockStream);

      const result = await performRestore('onedrive');

      expect(result.success).toBe(true);
      expect(result.message).toContain('restored successfully');
      expect(mockRenameSync).toHaveBeenCalled();
    });

    it('should fail OneDrive restore when no backup folder found', async () => {
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockTokenRefreshSuccess();
      mockOneDriveListChildren.mockResolvedValue({ value: [] });

      const result = await performRestore('onedrive');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No backup folder found');
    });

    it('should fail OneDrive restore when no backup files found', async () => {
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockTokenRefreshSuccess();
      mockOneDriveListChildren
        .mockResolvedValueOnce({
          value: [{ name: 'otcgs-backups', id: 'folder-id' }],
        })
        .mockResolvedValueOnce({ value: [] });

      const result = await performRestore('onedrive');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No backup files found');
    });

    it('should fail Google Drive restore when no backup folder found', async () => {
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockTokenRefreshSuccess();
      mockDriveFilesList.mockResolvedValue({ data: { files: [] } });

      const result = await performRestore('google_drive');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No backup folder found');
    });

    it('should fail Google Drive restore when no backup files found', async () => {
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockTokenRefreshSuccess();
      mockDriveFilesList
        .mockResolvedValueOnce({ data: { files: [{ id: 'folder-123' }] } })
        .mockResolvedValueOnce({ data: { files: [] } });

      const result = await performRestore('google_drive');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No backup files found');
    });

    it('should fail Dropbox restore when no backup files found', async () => {
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockTokenRefreshSuccess();
      mockFilesListFolder.mockResolvedValue({
        result: { entries: [] },
      });

      const result = await performRestore('dropbox');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No backup files found');
    });

    it('should return failure on restore error', async () => {
      mockGetOAuthTokens.mockResolvedValue({ accessToken: null, refreshToken: null });

      const result = await performRestore('google_drive');

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should return failure for unknown provider', async () => {
      const result = await performRestore('unknown_provider' as 'google_drive');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown provider');
    });
  });
});
