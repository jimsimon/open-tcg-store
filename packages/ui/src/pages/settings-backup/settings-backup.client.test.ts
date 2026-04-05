import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the GraphQL execute function
vi.mock('../../lib/graphql.ts', () => ({
  execute: vi.fn().mockResolvedValue({
    data: {
      getBackupSettings: {
        provider: 'google_drive',
        frequency: 'daily',
        lastBackupAt: '2025-01-15T10:00:00.000Z',
        googleDriveConnected: true,
        dropboxConnected: false,
        onedriveConnected: false,
      },
    },
  }),
}));

import './settings-backup.client.ts';
import { OgsSettingsBackupPage } from './settings-backup.client.ts';
import { execute } from '../../lib/graphql.ts';

const mockExecute = execute as ReturnType<typeof vi.fn>;

// --- Tests ---

describe('ogs-settings-backup-page', () => {
  let element: OgsSettingsBackupPage;

  beforeEach(async () => {
    mockExecute.mockResolvedValue({
      data: {
        getBackupSettings: {
          provider: 'google_drive',
          frequency: 'daily',
          lastBackupAt: '2025-01-15T10:00:00.000Z',
          googleDriveConnected: true,
          dropboxConnected: false,
          onedriveConnected: false,
        },
      },
    });

    element = document.createElement('ogs-settings-backup-page') as OgsSettingsBackupPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    vi.clearAllMocks();
  });

  test('should render the component', () => {
    expect(element).toBeInstanceOf(OgsSettingsBackupPage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test('should display the page header', () => {
    const header = element.shadowRoot!.querySelector('.page-header h2');
    expect(header).toBeTruthy();
    expect(header?.textContent).toContain('Backup & Restore');
  });

  test('should display Cloud Providers section', () => {
    const sections = element.shadowRoot!.querySelectorAll('.section-header h3');
    const sectionTexts = Array.from(sections).map((s) => s.textContent?.trim());
    expect(sectionTexts).toContain('Cloud Providers');
  });

  test('should display Backup Configuration section', () => {
    const sections = element.shadowRoot!.querySelectorAll('.section-header h3');
    const sectionTexts = Array.from(sections).map((s) => s.textContent?.trim());
    expect(sectionTexts).toContain('Backup Configuration');
  });

  test('should display three provider cards', () => {
    const providerCards = element.shadowRoot!.querySelectorAll('.provider-card');
    expect(providerCards.length).toBe(3);
  });

  test('should show Google Drive as connected', () => {
    const providerCards = element.shadowRoot!.querySelectorAll('.provider-card');
    const googleCard = providerCards[0];
    const badge = googleCard.querySelector('wa-badge[variant="success"]');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('Connected');
  });

  test('should show Dropbox as not connected', () => {
    const providerCards = element.shadowRoot!.querySelectorAll('.provider-card');
    const dropboxCard = providerCards[1];
    const badge = dropboxCard.querySelector('wa-badge[variant="neutral"]');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('Not connected');
  });

  test('should display backup provider select with only connected providers', () => {
    const providerSelect = element.shadowRoot!.querySelector('wa-select[label="Backup Provider"]');
    expect(providerSelect).toBeTruthy();

    const options = providerSelect!.querySelectorAll('wa-option');
    // "Select provider" + 1 connected provider (Google Drive) = 2
    expect(options.length).toBe(2);

    const optionValues = Array.from(options).map((o) => o.getAttribute('value'));
    expect(optionValues).toContain('');
    expect(optionValues).toContain('google_drive');
    expect(optionValues).not.toContain('dropbox');
    expect(optionValues).not.toContain('onedrive');
  });

  test('should display backup frequency select', () => {
    const frequencySelect = element.shadowRoot!.querySelector('wa-select[label="Backup Frequency"]');
    expect(frequencySelect).toBeTruthy();

    const options = frequencySelect!.querySelectorAll('wa-option');
    // "Select frequency" + 4 options = 5
    expect(options.length).toBe(5);
  });

  test('should display last backup info', () => {
    const lastBackupInfo = element.shadowRoot!.querySelector('.last-backup-info');
    expect(lastBackupInfo).toBeTruthy();
    expect(lastBackupInfo?.textContent).toContain('Last backup:');
  });

  test('should display Save Settings button', () => {
    const saveBtn = element.shadowRoot!.querySelector('.save-bar wa-button[variant="brand"]');
    expect(saveBtn).toBeTruthy();
    expect(saveBtn?.textContent).toContain('Save Settings');
  });

  test('should display Backup Now button', () => {
    const buttons = element.shadowRoot!.querySelectorAll('.save-bar wa-button');
    const backupBtn = Array.from(buttons).find((b) => b.textContent?.includes('Backup Now'));
    expect(backupBtn).toBeTruthy();
  });

  test('should display Restore button', () => {
    const buttons = element.shadowRoot!.querySelectorAll('.save-bar wa-button');
    const restoreBtn = Array.from(buttons).find((b) => b.textContent?.includes('Restore'));
    expect(restoreBtn).toBeTruthy();
  });

  test('should disable provider select when no providers are connected', async () => {
    mockExecute.mockResolvedValue({
      data: {
        getBackupSettings: {
          provider: null,
          frequency: null,
          lastBackupAt: null,
          googleDriveConnected: false,
          dropboxConnected: false,
          onedriveConnected: false,
        },
      },
    });

    element.remove();
    element = document.createElement('ogs-settings-backup-page') as OgsSettingsBackupPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const providerSelect = element.shadowRoot!.querySelector('wa-select[label="Backup Provider"]');
    expect(providerSelect).toBeTruthy();
    expect(providerSelect!.hasAttribute('disabled')).toBe(true);

    const options = providerSelect!.querySelectorAll('wa-option');
    // Only the placeholder "Select provider" option
    expect(options.length).toBe(1);
  });

  test('should enable provider select and list all connected providers', async () => {
    mockExecute.mockResolvedValue({
      data: {
        getBackupSettings: {
          provider: null,
          frequency: null,
          lastBackupAt: null,
          googleDriveConnected: true,
          dropboxConnected: true,
          onedriveConnected: false,
        },
      },
    });

    element.remove();
    element = document.createElement('ogs-settings-backup-page') as OgsSettingsBackupPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const providerSelect = element.shadowRoot!.querySelector('wa-select[label="Backup Provider"]');
    expect(providerSelect).toBeTruthy();
    expect(providerSelect!.hasAttribute('disabled')).toBe(false);

    const options = providerSelect!.querySelectorAll('wa-option');
    // "Select provider" + Google Drive + Dropbox = 3
    expect(options.length).toBe(3);

    const optionValues = Array.from(options).map((o) => o.getAttribute('value'));
    expect(optionValues).toContain('google_drive');
    expect(optionValues).toContain('dropbox');
    expect(optionValues).not.toContain('onedrive');
  });

  test('should show "No backups" message when no backup has been made', async () => {
    mockExecute.mockResolvedValue({
      data: {
        getBackupSettings: {
          provider: null,
          frequency: null,
          lastBackupAt: null,
          googleDriveConnected: false,
          dropboxConnected: false,
          onedriveConnected: false,
        },
      },
    });

    element.remove();
    element = document.createElement('ogs-settings-backup-page') as OgsSettingsBackupPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const lastBackupInfo = element.shadowRoot!.querySelector('.last-backup-info');
    expect(lastBackupInfo?.textContent).toContain('No backups have been created yet');
  });

  test('should show loading spinner initially', async () => {
    mockExecute.mockReturnValue(new Promise(() => {}));

    element.remove();
    element = document.createElement('ogs-settings-backup-page') as OgsSettingsBackupPage;
    document.body.appendChild(element);
    await new Promise((r) => setTimeout(r, 50));

    const spinner = element.shadowRoot!.querySelector('wa-spinner');
    expect(spinner).toBeTruthy();
  });
});
