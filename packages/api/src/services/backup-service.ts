import {
  readFileSync,
  writeFileSync,
  existsSync,
  createReadStream,
  unlinkSync,
  rmSync,
  renameSync,
  copyFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { AuthorizationCode } from 'simple-oauth2';
import { google } from 'googleapis';
import { Dropbox } from 'dropbox';
import oneDriveAPI from 'onedrive-api';
import { sql } from 'drizzle-orm';
import { createClient } from '@libsql/client';
import { databaseFilePath } from '../db/otcgs/drizzle.config';
import { otcgs } from '../db/otcgs/index';
import { storeOAuthTokens, getOAuthTokens, updateLastBackupAt } from './settings-service';

const DB_FILE_PATH = databaseFilePath;
const BACKUP_FOLDER = 'otcgs-backups';

// ---------------------------------------------------------------------------
// OAuth CSRF state management
// ---------------------------------------------------------------------------

const pendingOAuthStates = new Map<string, { provider: BackupProvider; expiresAt: number }>();

/** Generate a cryptographic state parameter for OAuth CSRF protection. */
export function generateOAuthState(provider: BackupProvider): string {
  const state = randomBytes(32).toString('hex');
  pendingOAuthStates.set(state, {
    provider,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minute expiry
  });
  return state;
}

/** Validate and consume an OAuth state parameter. Returns the provider if valid. */
export function validateOAuthState(state: string): BackupProvider | null {
  const entry = pendingOAuthStates.get(state);
  if (!entry) return null;
  pendingOAuthStates.delete(state);
  if (Date.now() > entry.expiresAt) return null;
  return entry.provider;
}

// Periodically clean up expired state entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of pendingOAuthStates) {
    if (now > entry.expiresAt) pendingOAuthStates.delete(key);
  }
}, 60_000).unref();

export type BackupProvider = 'google_drive' | 'dropbox' | 'onedrive';

// ---------------------------------------------------------------------------
// Safe Backup via VACUUM INTO
// ---------------------------------------------------------------------------

/**
 * Create a safe, consistent backup of the database using VACUUM INTO.
 * Returns the path to the temporary backup file. The caller is responsible
 * for cleaning up the file when done.
 */
export async function createSafeBackupFile(): Promise<string> {
  const tempDir = mkdtempSync(join(tmpdir(), 'otcgs-backup-'));
  const tempPath = join(tempDir, 'otcgs-backup.sqlite');
  await otcgs.run(sql`VACUUM INTO ${tempPath}`);
  return tempPath;
}

/**
 * Clean up a temporary backup file and its parent temp directory.
 */
function cleanupTempBackup(tempPath: string): void {
  try {
    unlinkSync(tempPath);
    // Remove the temp directory too
    const tempDir = join(tempPath, '..');
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Safely restore a database from downloaded data:
 * 1. Write to a temp file
 * 2. Validate SQLite integrity
 * 3. Create a pre-restore backup of the current DB
 * 4. Atomically replace the live DB via rename
 */
async function safeRestore(data: Buffer): Promise<void> {
  const tempDir = mkdtempSync(join(tmpdir(), 'otcgs-restore-'));
  const tempPath = join(tempDir, 'restore.sqlite');
  const preRestoreBackupPath = `${DB_FILE_PATH}.pre-restore`;

  try {
    // 1. Write downloaded data to temp file
    writeFileSync(tempPath, data);

    // 2. Validate the downloaded file is a valid SQLite database
    const tempClient = createClient({ url: `file:${tempPath}` });
    try {
      const result = await tempClient.execute('PRAGMA integrity_check');
      const checkResult = result.rows[0]?.[0];
      if (checkResult !== 'ok') {
        throw new Error(`Backup integrity check failed: ${checkResult}`);
      }
    } finally {
      tempClient.close();
    }

    // 3. Create a pre-restore backup of the current DB (best-effort)
    if (existsSync(DB_FILE_PATH)) {
      try {
        copyFileSync(DB_FILE_PATH, preRestoreBackupPath);
      } catch (err) {
        console.warn('Failed to create pre-restore backup:', err);
      }
    }

    // 4. Atomically replace the live DB file
    renameSync(tempPath, DB_FILE_PATH);
  } finally {
    // Clean up temp directory (the file may have been renamed out)
    rmSync(tempDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Shared OAuth Configuration
// ---------------------------------------------------------------------------

interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

function getProviderConfig(provider: BackupProvider): OAuthProviderConfig {
  const baseUrl = process.env.APP_URL || 'http://localhost';

  switch (provider) {
    case 'google_drive':
      return {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        redirectUri: `${baseUrl}/api/backup/oauth/google_drive/callback`,
      };
    case 'dropbox':
      return {
        clientId: process.env.DROPBOX_APP_KEY!,
        clientSecret: process.env.DROPBOX_APP_SECRET!,
        authorizeUrl: 'https://www.dropbox.com/oauth2/authorize',
        tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
        scopes: [],
        redirectUri: `${baseUrl}/api/backup/oauth/dropbox/callback`,
      };
    case 'onedrive':
      return {
        clientId: process.env.ONEDRIVE_CLIENT_ID!,
        clientSecret: process.env.ONEDRIVE_CLIENT_SECRET!,
        authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scopes: ['Files.ReadWrite', 'offline_access'],
        redirectUri: `${baseUrl}/api/backup/oauth/onedrive/callback`,
      };
  }
}

function createOAuthClient(provider: BackupProvider): AuthorizationCode {
  const config = getProviderConfig(provider);
  const tokenUrlParsed = new URL(config.tokenUrl);
  const authorizeUrlParsed = new URL(config.authorizeUrl);

  return new AuthorizationCode({
    client: {
      id: config.clientId,
      secret: config.clientSecret,
    },
    auth: {
      tokenHost: tokenUrlParsed.origin,
      tokenPath: tokenUrlParsed.pathname,
      authorizeHost: authorizeUrlParsed.origin,
      authorizePath: authorizeUrlParsed.pathname,
    },
  });
}

// ---------------------------------------------------------------------------
// Shared OAuth: Authorize URL + Callback
// ---------------------------------------------------------------------------

export function getAuthUrl(provider: BackupProvider): string {
  const config = getProviderConfig(provider);
  const client = createOAuthClient(provider);

  const state = generateOAuthState(provider);

  const params: Record<string, string> = {
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state,
  };

  // Provider-specific params
  if (provider === 'google_drive') {
    params.access_type = 'offline';
    params.prompt = 'consent';
  }
  if (provider === 'dropbox') {
    params.token_access_type = 'offline';
  }

  return client.authorizeURL(params);
}

export async function handleOAuthCallback(provider: BackupProvider, code: string): Promise<void> {
  const config = getProviderConfig(provider);
  const client = createOAuthClient(provider);

  const tokenParams = {
    code,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
  };

  const accessToken = await client.getToken(tokenParams);
  const token = accessToken.token;

  const access = (token.access_token as string) || '';
  const refresh = (token.refresh_token as string) || '';

  if (!access) {
    throw new Error(`Failed to obtain ${provider} access token`);
  }

  await storeOAuthTokens(provider, access, refresh);
}

async function getRefreshedAccessToken(provider: BackupProvider): Promise<string> {
  const tokens = await getOAuthTokens(provider);
  if (!tokens.refreshToken) {
    throw new Error(`${provider} is not connected. Please authorize first.`);
  }

  const client = createOAuthClient(provider);

  // Create an access token object from stored tokens
  let accessToken = client.createToken({
    access_token: tokens.accessToken || '',
    refresh_token: tokens.refreshToken,
  });

  // Refresh if expired (or always refresh to be safe)
  if (accessToken.expired()) {
    accessToken = await accessToken.refresh();
  } else {
    // Force refresh to ensure we have a valid token
    try {
      accessToken = await accessToken.refresh();
    } catch {
      // If refresh fails but token isn't expired, use existing
    }
  }

  const newAccess = accessToken.token.access_token as string;
  const newRefresh = (accessToken.token.refresh_token as string) || tokens.refreshToken;

  await storeOAuthTokens(provider, newAccess, newRefresh);

  return newAccess;
}

// Convenience exports for the API server routes
export function getGoogleDriveAuthUrl(): string {
  return getAuthUrl('google_drive');
}
export function getDropboxAuthUrl(): string {
  return getAuthUrl('dropbox');
}
export function getOneDriveAuthUrl(): string {
  return getAuthUrl('onedrive');
}
export async function handleGoogleDriveCallback(code: string): Promise<void> {
  return handleOAuthCallback('google_drive', code);
}
export async function handleDropboxCallback(code: string): Promise<void> {
  return handleOAuthCallback('dropbox', code);
}
export async function handleOneDriveCallback(code: string): Promise<void> {
  return handleOAuthCallback('onedrive', code);
}

// ---------------------------------------------------------------------------
// Google Drive File Operations
// ---------------------------------------------------------------------------

async function getGoogleDriveClient() {
  const accessToken = await getRefreshedAccessToken('google_drive');
  const config = getProviderConfig('google_drive');

  const oauth2Client = new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
  oauth2Client.setCredentials({ access_token: accessToken });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

async function backupToGoogleDrive(): Promise<string> {
  const drive = await getGoogleDriveClient();
  const tempPath = await createSafeBackupFile();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `otcgs-backup-${timestamp}.sqlite`;

  try {
    // Find or create the backup folder
    let folderId: string | undefined;
    const folderSearch = await drive.files.list({
      q: `name='${BACKUP_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
    });

    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id!;
    } else {
      const folder = await drive.files.create({
        requestBody: { name: BACKUP_FOLDER, mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id',
      });
      folderId = folder.data.id!;
    }

    const { Readable } = await import('node:stream');
    const fileContent = readFileSync(tempPath);
    await drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media: { mimeType: 'application/x-sqlite3', body: Readable.from(fileContent) },
    });

    return fileName;
  } finally {
    cleanupTempBackup(tempPath);
  }
}

async function restoreFromGoogleDrive(): Promise<void> {
  const drive = await getGoogleDriveClient();

  const folderSearch = await drive.files.list({
    q: `name='${BACKUP_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
  });

  if (!folderSearch.data.files || folderSearch.data.files.length === 0) {
    throw new Error('No backup folder found on Google Drive');
  }

  const folderId = folderSearch.data.files[0].id!;
  const fileSearch = await drive.files.list({
    q: `'${folderId}' in parents and name contains 'otcgs-backup-' and trashed=false`,
    orderBy: 'createdTime desc',
    pageSize: 1,
    fields: 'files(id, name)',
  });

  if (!fileSearch.data.files || fileSearch.data.files.length === 0) {
    throw new Error('No backup files found on Google Drive');
  }

  const fileId = fileSearch.data.files[0].id!;
  const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
  await safeRestore(Buffer.from(response.data as ArrayBuffer));
}

// ---------------------------------------------------------------------------
// Dropbox File Operations
// ---------------------------------------------------------------------------

async function getDropboxClient(): Promise<Dropbox> {
  const accessToken = await getRefreshedAccessToken('dropbox');
  return new Dropbox({ accessToken });
}

async function backupToDropbox(): Promise<string> {
  const dbx = await getDropboxClient();
  const tempPath = await createSafeBackupFile();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `otcgs-backup-${timestamp}.sqlite`;
  const path = `/${BACKUP_FOLDER}/${fileName}`;

  try {
    const fileContent = readFileSync(tempPath);
    await dbx.filesUpload({ path, contents: fileContent, mode: { '.tag': 'overwrite' } });
    return fileName;
  } finally {
    cleanupTempBackup(tempPath);
  }
}

async function restoreFromDropbox(): Promise<void> {
  const dbx = await getDropboxClient();
  const listResult = await dbx.filesListFolder({ path: `/${BACKUP_FOLDER}` });

  const backupFiles = listResult.result.entries
    .filter((entry) => entry['.tag'] === 'file' && entry.name.startsWith('otcgs-backup-'))
    .sort((a, b) => b.name.localeCompare(a.name));

  if (backupFiles.length === 0) {
    throw new Error('No backup files found on Dropbox');
  }

  const downloadResult = await dbx.filesDownload({ path: backupFiles[0].path_lower! });
  const fileData = (downloadResult.result as unknown as { fileBinary: Buffer }).fileBinary;
  await safeRestore(fileData);
}

// ---------------------------------------------------------------------------
// OneDrive File Operations (using onedrive-api)
// ---------------------------------------------------------------------------

async function backupToOneDrive(): Promise<string> {
  const accessToken = await getRefreshedAccessToken('onedrive');
  const tempPath = await createSafeBackupFile();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `otcgs-backup-${timestamp}.sqlite`;

  try {
    // Create the backup folder (ignore error if it already exists)
    try {
      await oneDriveAPI.items.createFolder({ accessToken, itemId: 'root', name: BACKUP_FOLDER });
    } catch {
      // Folder may already exist
    }

    // Get the folder ID
    const children = await oneDriveAPI.items.listChildren({ accessToken, itemId: 'root' });
    const folder = (children.value as Array<{ name: string; id: string }>).find((item) => item.name === BACKUP_FOLDER);
    if (!folder) {
      throw new Error('Failed to find or create backup folder on OneDrive');
    }

    const readableStream = createReadStream(tempPath);
    await oneDriveAPI.items.uploadSimple({ accessToken, filename: fileName, parentId: folder.id, readableStream });
    return fileName;
  } finally {
    cleanupTempBackup(tempPath);
  }
}

async function restoreFromOneDrive(): Promise<void> {
  const accessToken = await getRefreshedAccessToken('onedrive');

  // Find the backup folder
  const rootChildren = await oneDriveAPI.items.listChildren({ accessToken, itemId: 'root' });
  const folder = (rootChildren.value as Array<{ name: string; id: string }>).find(
    (item) => item.name === BACKUP_FOLDER,
  );
  if (!folder) {
    throw new Error('No backup folder found on OneDrive');
  }

  // List and find latest backup
  const folderChildren = await oneDriveAPI.items.listChildren({ accessToken, itemId: folder.id });
  const backupFiles = (folderChildren.value as Array<{ name: string; id: string }>)
    .filter((item) => item.name.startsWith('otcgs-backup-'))
    .sort((a, b) => b.name.localeCompare(a.name));

  if (backupFiles.length === 0) {
    throw new Error('No backup files found on OneDrive');
  }

  const fileStream = await oneDriveAPI.items.download({ accessToken, itemId: backupFiles[0].id });
  const chunks: Buffer[] = [];
  for await (const chunk of fileStream) {
    chunks.push(Buffer.from(chunk));
  }
  await safeRestore(Buffer.concat(chunks));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function performBackup(
  provider: BackupProvider,
): Promise<{ success: boolean; message: string; timestamp: string }> {
  if (!existsSync(DB_FILE_PATH)) {
    return { success: false, message: 'Database file not found', timestamp: new Date().toISOString() };
  }

  try {
    let fileName: string;

    switch (provider) {
      case 'google_drive':
        fileName = await backupToGoogleDrive();
        break;
      case 'dropbox':
        fileName = await backupToDropbox();
        break;
      case 'onedrive':
        fileName = await backupToOneDrive();
        break;
      default:
        return { success: false, message: `Unknown provider: ${provider}`, timestamp: new Date().toISOString() };
    }

    await updateLastBackupAt();

    return { success: true, message: `Backup created successfully: ${fileName}`, timestamp: new Date().toISOString() };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Backup failed';
    return { success: false, message, timestamp: new Date().toISOString() };
  }
}

export async function performRestore(provider: BackupProvider): Promise<{ success: boolean; message: string }> {
  try {
    switch (provider) {
      case 'google_drive':
        await restoreFromGoogleDrive();
        break;
      case 'dropbox':
        await restoreFromDropbox();
        break;
      case 'onedrive':
        await restoreFromOneDrive();
        break;
      default:
        return { success: false, message: `Unknown provider: ${provider}` };
    }

    return {
      success: true,
      message: 'Database restored successfully. The application should be restarted to reload the database.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Restore failed';
    return { success: false, message };
  }
}
