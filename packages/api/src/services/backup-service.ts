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
import * as oauth from 'oauth4webapi';
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

const pendingOAuthStates = new Map<string, { provider: BackupProvider; codeVerifier: string; expiresAt: number }>();

/** Generate a cryptographic state parameter for OAuth CSRF protection (includes PKCE verifier). */
export function generateOAuthState(provider: BackupProvider): { state: string; codeVerifier: string } {
  const state = oauth.generateRandomState();
  const codeVerifier = oauth.generateRandomCodeVerifier();
  pendingOAuthStates.set(state, {
    provider,
    codeVerifier,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minute expiry
  });
  return { state, codeVerifier };
}

/** Validate and consume an OAuth state parameter. Returns the provider and code_verifier if valid. */
export function validateOAuthState(state: string): { provider: BackupProvider; codeVerifier: string } | null {
  const entry = pendingOAuthStates.get(state);
  if (!entry) return null;
  pendingOAuthStates.delete(state);
  if (Date.now() > entry.expiresAt) return null;
  return { provider: entry.provider, codeVerifier: entry.codeVerifier };
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

    // 3. Create a timestamped pre-restore backup of the current DB (best-effort)
    if (existsSync(DB_FILE_PATH)) {
      try {
        const preRestoreBackupPath = `${DB_FILE_PATH}.pre-restore-${Date.now()}`;
        copyFileSync(DB_FILE_PATH, preRestoreBackupPath);
      } catch (err) {
        console.warn('Failed to create pre-restore backup:', err);
      }
    }

    // 4. Replace the live DB file. Use rename for atomicity; fall back to
    //    copy+unlink when the temp dir is on a different filesystem (EXDEV).
    try {
      renameSync(tempPath, DB_FILE_PATH);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
        copyFileSync(tempPath, DB_FILE_PATH);
        unlinkSync(tempPath);
      } else {
        throw err;
      }
    }

    // 5. Remove stale WAL/SHM files from the previous database. If the old DB
    //    was in WAL mode, these companion files could cause SQLite to replay
    //    the old WAL into the freshly restored database, corrupting it.
    try {
      unlinkSync(`${DB_FILE_PATH}-wal`);
    } catch {
      /* may not exist */
    }
    try {
      unlinkSync(`${DB_FILE_PATH}-shm`);
    } catch {
      /* may not exist */
    }
  } finally {
    // Clean up temp directory (the file may have been renamed out)
    rmSync(tempDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Shared OAuth Configuration (PKCE — no client secret required)
// ---------------------------------------------------------------------------

interface OAuthProviderConfig {
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scopes: string[];
  redirectUri: string;
  /** Extra params to include in the authorize URL */
  extraAuthorizeParams?: Record<string, string>;
}

export function getProviderConfig(provider: BackupProvider): OAuthProviderConfig {
  const baseUrl = process.env.APP_URL || 'http://localhost';

  switch (provider) {
    case 'google_drive':
      return {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        redirectUri: `${baseUrl}/api/backup/oauth/google_drive/callback`,
        extraAuthorizeParams: { access_type: 'offline', prompt: 'consent' },
      };
    case 'dropbox':
      return {
        clientId: process.env.DROPBOX_APP_KEY!,
        authorizationEndpoint: 'https://www.dropbox.com/oauth2/authorize',
        tokenEndpoint: 'https://api.dropboxapi.com/oauth2/token',
        scopes: [],
        redirectUri: `${baseUrl}/api/backup/oauth/dropbox/callback`,
        extraAuthorizeParams: { token_access_type: 'offline' },
      };
    case 'onedrive':
      return {
        clientId: process.env.ONEDRIVE_CLIENT_ID!,
        authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scopes: ['Files.ReadWrite', 'offline_access'],
        redirectUri: `${baseUrl}/api/backup/oauth/onedrive/callback`,
      };
  }
}

/** Build the oauth4webapi AuthorizationServer metadata for a provider. */
function getAuthorizationServer(config: OAuthProviderConfig): oauth.AuthorizationServer {
  return {
    // Fabricated issuer — these providers don't support OIDC discovery for
    // their file API scopes. The value is only used internally by oauth4webapi
    // for response validation and doesn't need to match a real issuer identifier.
    issuer: new URL(config.tokenEndpoint).origin as `https://${string}`,
    authorization_endpoint: config.authorizationEndpoint,
    token_endpoint: config.tokenEndpoint,
  };
}

/** Build the oauth4webapi Client for a provider. */
function getOAuthClient(config: OAuthProviderConfig): oauth.Client {
  return { client_id: config.clientId };
}

// ---------------------------------------------------------------------------
// Shared OAuth: Authorize URL + Callback (PKCE flow via oauth4webapi)
// ---------------------------------------------------------------------------

export async function getAuthUrl(provider: BackupProvider): Promise<string> {
  const config = getProviderConfig(provider);
  const { state, codeVerifier } = generateOAuthState(provider);
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);

  const authorizationUrl = new URL(config.authorizationEndpoint);
  authorizationUrl.searchParams.set('client_id', config.clientId);
  authorizationUrl.searchParams.set('redirect_uri', config.redirectUri);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('code_challenge', codeChallenge);
  authorizationUrl.searchParams.set('code_challenge_method', 'S256');
  authorizationUrl.searchParams.set('state', state);

  if (config.scopes.length > 0) {
    authorizationUrl.searchParams.set('scope', config.scopes.join(' '));
  }
  if (config.extraAuthorizeParams) {
    for (const [key, value] of Object.entries(config.extraAuthorizeParams)) {
      authorizationUrl.searchParams.set(key, value);
    }
  }

  return authorizationUrl.href;
}

export async function handleOAuthCallback(provider: BackupProvider, code: string, codeVerifier: string): Promise<void> {
  const config = getProviderConfig(provider);
  const as = getAuthorizationServer(config);
  const client = getOAuthClient(config);
  const clientAuth = oauth.None();

  // Build a fake callback URL so oauth4webapi can extract the code
  const callbackUrl = new URL(config.redirectUri);
  callbackUrl.searchParams.set('code', code);

  const params = oauth.validateAuthResponse(as, client, callbackUrl);
  const response = await oauth.authorizationCodeGrantRequest(
    as,
    client,
    clientAuth,
    params,
    config.redirectUri,
    codeVerifier,
  );

  const result = await oauth.processAuthorizationCodeResponse(as, client, response);

  const accessToken = result.access_token;
  const refreshToken = result.refresh_token ?? '';

  // Belt-and-suspenders: oauth4webapi guarantees access_token on success,
  // but guard against unexpected empty values defensively.
  if (!accessToken) {
    throw new Error(`Failed to obtain ${provider} access token`);
  }

  await storeOAuthTokens(provider, accessToken, refreshToken);
}

async function getRefreshedAccessToken(provider: BackupProvider): Promise<string> {
  const tokens = await getOAuthTokens(provider);
  if (!tokens.refreshToken) {
    throw new Error(`${provider} is not connected. Please authorize first.`);
  }

  const config = getProviderConfig(provider);
  const as = getAuthorizationServer(config);
  const client = getOAuthClient(config);
  const clientAuth = oauth.None();

  const response = await oauth.refreshTokenGrantRequest(as, client, clientAuth, tokens.refreshToken);
  const result = await oauth.processRefreshTokenResponse(as, client, response);

  // Belt-and-suspenders: oauth4webapi guarantees access_token on success,
  // but guard against unexpected empty values defensively.
  const newAccess = result.access_token;
  if (!newAccess) {
    throw new Error(`Token refresh for ${provider} returned no access token. Please reconnect.`);
  }

  const newRefresh = result.refresh_token ?? tokens.refreshToken;
  await storeOAuthTokens(provider, newAccess, newRefresh);

  return newAccess;
}

// Convenience exports for the API server routes
export async function getGoogleDriveAuthUrl(): Promise<string> {
  return getAuthUrl('google_drive');
}
export async function getDropboxAuthUrl(): Promise<string> {
  return getAuthUrl('dropbox');
}
export async function getOneDriveAuthUrl(): Promise<string> {
  return getAuthUrl('onedrive');
}
export async function handleGoogleDriveCallback(code: string, codeVerifier: string): Promise<void> {
  return handleOAuthCallback('google_drive', code, codeVerifier);
}
export async function handleDropboxCallback(code: string, codeVerifier: string): Promise<void> {
  return handleOAuthCallback('dropbox', code, codeVerifier);
}
export async function handleOneDriveCallback(code: string, codeVerifier: string): Promise<void> {
  return handleOAuthCallback('onedrive', code, codeVerifier);
}

// ---------------------------------------------------------------------------
// Google Drive File Operations
// ---------------------------------------------------------------------------

async function getGoogleDriveClient() {
  const accessToken = await getRefreshedAccessToken('google_drive');
  const config = getProviderConfig('google_drive');

  const oauth2Client = new google.auth.OAuth2(config.clientId, undefined, config.redirectUri);
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
