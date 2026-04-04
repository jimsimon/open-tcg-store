import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Use vi.hoisted so mock variables are available when vi.mock factories run.
// ---------------------------------------------------------------------------

const {
  mockStoreOAuthTokens,
  mockGetOAuthTokens,
  mockUpdateLastBackupAt,
  mockExistsSync,
  mockReadFileSync,
  mockWriteFileSync,
  mockCreateReadStream,
  mockAuthorizeURL,
  mockGetToken,
  mockCreateToken,
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
} = vi.hoisted(() => ({
  mockStoreOAuthTokens: vi.fn(),
  mockGetOAuthTokens: vi.fn(),
  mockUpdateLastBackupAt: vi.fn(),
  mockExistsSync: vi.fn(),
  mockReadFileSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
  mockCreateReadStream: vi.fn(),
  mockAuthorizeURL: vi.fn(),
  mockGetToken: vi.fn(),
  mockCreateToken: vi.fn(),
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
}));

// Mock settings-service
vi.mock('./settings-service', () => ({
  storeOAuthTokens: mockStoreOAuthTokens,
  getOAuthTokens: mockGetOAuthTokens,
  updateLastBackupAt: mockUpdateLastBackupAt,
}));

// Mock workspace-root
vi.mock('workspace-root', () => ({
  workspaceRootSync: vi.fn(() => '/fake/workspace'),
}));

// Mock node:fs
vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  createReadStream: mockCreateReadStream,
}));

// Mock simple-oauth2 - use a class so `new AuthorizationCode(...)` works
vi.mock('simple-oauth2', () => ({
  AuthorizationCode: class {
    authorizeURL = mockAuthorizeURL;
    getToken = mockGetToken;
    createToken = mockCreateToken;
  },
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
    // Set env vars for OAuth configs
    process.env.API_BASE_URL = 'http://localhost:5174';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
    process.env.DROPBOX_APP_KEY = 'dropbox-app-key';
    process.env.DROPBOX_APP_SECRET = 'dropbox-app-secret';
    process.env.ONEDRIVE_CLIENT_ID = 'onedrive-client-id';
    process.env.ONEDRIVE_CLIENT_SECRET = 'onedrive-client-secret';
  });

  // -----------------------------------------------------------------------
  // getAuthUrl
  // -----------------------------------------------------------------------
  describe('getAuthUrl', () => {
    it('should generate Google Drive auth URL', () => {
      mockAuthorizeURL.mockReturnValue('https://accounts.google.com/auth?...');

      const url = getAuthUrl('google_drive');

      expect(url).toBe('https://accounts.google.com/auth?...');
      expect(mockAuthorizeURL).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'https://www.googleapis.com/auth/drive.file',
          access_type: 'offline',
          prompt: 'consent',
        }),
      );
    });

    it('should generate Dropbox auth URL', () => {
      mockAuthorizeURL.mockReturnValue('https://www.dropbox.com/oauth2/authorize?...');

      const url = getAuthUrl('dropbox');

      expect(url).toBe('https://www.dropbox.com/oauth2/authorize?...');
      expect(mockAuthorizeURL).toHaveBeenCalledWith(
        expect.objectContaining({
          token_access_type: 'offline',
        }),
      );
    });

    it('should generate OneDrive auth URL', () => {
      mockAuthorizeURL.mockReturnValue('https://login.microsoftonline.com/auth?...');

      const url = getAuthUrl('onedrive');

      expect(url).toBe('https://login.microsoftonline.com/auth?...');
      expect(mockAuthorizeURL).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'Files.ReadWrite offline_access',
        }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // Convenience auth URL functions
  // -----------------------------------------------------------------------
  describe('convenience auth URL functions', () => {
    it('getGoogleDriveAuthUrl should call getAuthUrl with google_drive', () => {
      mockAuthorizeURL.mockReturnValue('https://google.com/auth');
      const url = getGoogleDriveAuthUrl();
      expect(url).toBe('https://google.com/auth');
    });

    it('getDropboxAuthUrl should call getAuthUrl with dropbox', () => {
      mockAuthorizeURL.mockReturnValue('https://dropbox.com/auth');
      const url = getDropboxAuthUrl();
      expect(url).toBe('https://dropbox.com/auth');
    });

    it('getOneDriveAuthUrl should call getAuthUrl with onedrive', () => {
      mockAuthorizeURL.mockReturnValue('https://onedrive.com/auth');
      const url = getOneDriveAuthUrl();
      expect(url).toBe('https://onedrive.com/auth');
    });
  });

  // -----------------------------------------------------------------------
  // handleOAuthCallback
  // -----------------------------------------------------------------------
  describe('handleOAuthCallback', () => {
    it('should exchange code for tokens and store them', async () => {
      mockGetToken.mockResolvedValue({
        token: { access_token: 'new-access', refresh_token: 'new-refresh' },
      });

      await handleOAuthCallback('google_drive', 'auth-code-123');

      expect(mockGetToken).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'auth-code-123',
        }),
      );
      expect(mockStoreOAuthTokens).toHaveBeenCalledWith('google_drive', 'new-access', 'new-refresh');
    });

    it('should throw when no access token is returned', async () => {
      mockGetToken.mockResolvedValue({
        token: { access_token: '', refresh_token: '' },
      });

      await expect(handleOAuthCallback('dropbox', 'code')).rejects.toThrow('Failed to obtain dropbox access token');
    });
  });

  // -----------------------------------------------------------------------
  // Convenience callback functions
  // -----------------------------------------------------------------------
  describe('convenience callback functions', () => {
    beforeEach(() => {
      mockGetToken.mockResolvedValue({
        token: { access_token: 'access', refresh_token: 'refresh' },
      });
    });

    it('handleGoogleDriveCallback should handle google_drive callback', async () => {
      await handleGoogleDriveCallback('code');
      expect(mockStoreOAuthTokens).toHaveBeenCalledWith('google_drive', 'access', 'refresh');
    });

    it('handleDropboxCallback should handle dropbox callback', async () => {
      await handleDropboxCallback('code');
      expect(mockStoreOAuthTokens).toHaveBeenCalledWith('dropbox', 'access', 'refresh');
    });

    it('handleOneDriveCallback should handle onedrive callback', async () => {
      await handleOneDriveCallback('code');
      expect(mockStoreOAuthTokens).toHaveBeenCalledWith('onedrive', 'access', 'refresh');
    });
  });

  // -----------------------------------------------------------------------
  // performBackup
  // -----------------------------------------------------------------------
  describe('performBackup', () => {
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
      mockCreateToken.mockReturnValue({
        expired: () => false,
        refresh: vi.fn().mockResolvedValue({
          token: { access_token: 'new-access', refresh_token: 'refresh' },
        }),
        token: { access_token: 'new-access', refresh_token: 'refresh' },
      });
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
      mockCreateToken.mockReturnValue({
        expired: () => false,
        refresh: vi.fn().mockResolvedValue({
          token: { access_token: 'new-access', refresh_token: 'refresh' },
        }),
        token: { access_token: 'new-access', refresh_token: 'refresh' },
      });
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
      mockCreateToken.mockReturnValue({
        expired: () => false,
        refresh: vi.fn().mockResolvedValue({
          token: { access_token: 'new-access', refresh_token: 'refresh' },
        }),
        token: { access_token: 'new-access', refresh_token: 'refresh' },
      });
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
      mockCreateToken.mockReturnValue({
        expired: () => false,
        refresh: vi.fn().mockResolvedValue({
          token: { access_token: 'new-access', refresh_token: 'refresh' },
        }),
        token: { access_token: 'new-access', refresh_token: 'refresh' },
      });
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
      mockCreateToken.mockReturnValue({
        expired: () => false,
        refresh: vi.fn().mockResolvedValue({
          token: { access_token: 'new-access', refresh_token: 'refresh' },
        }),
        token: { access_token: 'new-access', refresh_token: 'refresh' },
      });
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
    it('should restore from Google Drive successfully', async () => {
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockCreateToken.mockReturnValue({
        expired: () => false,
        refresh: vi.fn().mockResolvedValue({
          token: { access_token: 'new-access', refresh_token: 'refresh' },
        }),
        token: { access_token: 'new-access', refresh_token: 'refresh' },
      });
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
      mockCreateToken.mockReturnValue({
        expired: () => false,
        refresh: vi.fn().mockResolvedValue({
          token: { access_token: 'new-access', refresh_token: 'refresh' },
        }),
        token: { access_token: 'new-access', refresh_token: 'refresh' },
      });
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
      mockCreateToken.mockReturnValue({
        expired: () => false,
        refresh: vi.fn().mockResolvedValue({
          token: { access_token: 'new-access', refresh_token: 'refresh' },
        }),
        token: { access_token: 'new-access', refresh_token: 'refresh' },
      });
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
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it('should fail OneDrive restore when no backup folder found', async () => {
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockCreateToken.mockReturnValue({
        expired: () => false,
        refresh: vi.fn().mockResolvedValue({
          token: { access_token: 'new-access', refresh_token: 'refresh' },
        }),
        token: { access_token: 'new-access', refresh_token: 'refresh' },
      });
      mockOneDriveListChildren.mockResolvedValue({ value: [] });

      const result = await performRestore('onedrive');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No backup folder found');
    });

    it('should fail OneDrive restore when no backup files found', async () => {
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockCreateToken.mockReturnValue({
        expired: () => false,
        refresh: vi.fn().mockResolvedValue({
          token: { access_token: 'new-access', refresh_token: 'refresh' },
        }),
        token: { access_token: 'new-access', refresh_token: 'refresh' },
      });
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
      mockCreateToken.mockReturnValue({
        expired: () => false,
        refresh: vi.fn().mockResolvedValue({
          token: { access_token: 'new-access', refresh_token: 'refresh' },
        }),
        token: { access_token: 'new-access', refresh_token: 'refresh' },
      });
      mockDriveFilesList.mockResolvedValue({ data: { files: [] } });

      const result = await performRestore('google_drive');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No backup folder found');
    });

    it('should fail Google Drive restore when no backup files found', async () => {
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockCreateToken.mockReturnValue({
        expired: () => false,
        refresh: vi.fn().mockResolvedValue({
          token: { access_token: 'new-access', refresh_token: 'refresh' },
        }),
        token: { access_token: 'new-access', refresh_token: 'refresh' },
      });
      mockDriveFilesList
        .mockResolvedValueOnce({ data: { files: [{ id: 'folder-123' }] } })
        .mockResolvedValueOnce({ data: { files: [] } });

      const result = await performRestore('google_drive');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No backup files found');
    });

    it('should fail Dropbox restore when no backup files found', async () => {
      mockGetOAuthTokens.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
      mockCreateToken.mockReturnValue({
        expired: () => false,
        refresh: vi.fn().mockResolvedValue({
          token: { access_token: 'new-access', refresh_token: 'refresh' },
        }),
        token: { access_token: 'new-access', refresh_token: 'refresh' },
      });
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
