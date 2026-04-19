import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the GraphQL execute function
vi.mock('../../lib/graphql.ts', () => ({
  execute: vi.fn().mockResolvedValue({ data: {} }),
}));

import './settings-backup.client.ts';
import { OgsSettingsBackupPage } from './settings-backup.client.ts';
import { execute } from '../../lib/graphql.ts';

const mockExecute = execute as ReturnType<typeof vi.fn>;

const defaultSettings = {
  provider: null as string | null,
  frequency: '',
  lastBackupAt: null,
  googleDriveConnected: false,
  dropboxConnected: false,
  onedriveConnected: false,
};

const defaultLocalJob = {
  id: 1,
  name: 'local-backup',
  displayName: 'Local Backup',
  description: 'Creates a local database backup snapshot with automatic rotation.',
  cronExpression: '0 4 * * *',
  enabled: true,
  lastRunAt: null as string | null,
  lastRunStatus: null as string | null,
  lastRunDurationMs: null as number | null,
  lastRunError: null as string | null,
  nextRunAt: '2025-01-16T04:00:00.000Z',
  config: '{"maxBackups": 10}',
};

const defaultCloudJob = {
  id: 2,
  name: 'backup',
  displayName: 'Cloud Backup',
  description: 'Runs an automated backup to the configured cloud storage provider.',
  cronExpression: '0 5 * * *',
  enabled: false,
  lastRunAt: null as string | null,
  lastRunStatus: null as string | null,
  lastRunDurationMs: null as number | null,
  lastRunError: null as string | null,
  nextRunAt: null as string | null,
  config: '{}',
};

/**
 * Sets up the mock to return settings first, then cron jobs.
 * loadData() calls Promise.all([execute(settings), execute(cronJobs)])
 * so the first call returns settings data and the second returns jobs.
 */
function setupMock(opts?: {
  settings?: Partial<typeof defaultSettings>;
  localJob?: Partial<typeof defaultLocalJob> | null;
  cloudJob?: Partial<typeof defaultCloudJob> | null;
}): void {
  const settings = { ...defaultSettings, ...opts?.settings };

  const jobs = [];
  if (opts?.localJob !== null) {
    jobs.push({ ...defaultLocalJob, ...opts?.localJob });
  }
  if (opts?.cloudJob !== null) {
    jobs.push({ ...defaultCloudJob, ...opts?.cloudJob });
  }

  // First call: GetBackupSettings. Second call: GetBackupCronJobs.
  mockExecute
    .mockResolvedValueOnce({ data: { getBackupSettings: settings } })
    .mockResolvedValueOnce({ data: { getCronJobs: jobs } });
}

describe('ogs-settings-backup-page', () => {
  let element: OgsSettingsBackupPage;

  async function createElement(): Promise<OgsSettingsBackupPage> {
    const el = document.createElement('ogs-settings-backup-page') as OgsSettingsBackupPage;
    document.body.appendChild(el);
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await el.updateComplete;
    return el;
  }

  beforeEach(async () => {
    setupMock({
      settings: { googleDriveConnected: true, provider: 'google_drive' },
    });
    element = await createElement();
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
    expect(header?.textContent).toContain('Backup Jobs');
  });

  test('should display local backup job card', () => {
    const titles = element.shadowRoot!.querySelectorAll('.job-title');
    const titleTexts = Array.from(titles).map((t) => t.textContent?.trim());
    expect(titleTexts).toContain('Local Backup');
  });

  test('should display cloud backup card when a provider is connected', () => {
    const titles = element.shadowRoot!.querySelectorAll('.job-title');
    const titleTexts = Array.from(titles).map((t) => t.textContent?.trim());
    expect(titleTexts).toContain('Cloud Backup');
  });

  test('should hide cloud backup card when no provider is connected', async () => {
    element.remove();
    setupMock({
      settings: { googleDriveConnected: false, dropboxConnected: false, onedriveConnected: false },
    });
    element = await createElement();

    const titles = element.shadowRoot!.querySelectorAll('.job-title');
    const titleTexts = Array.from(titles).map((t) => t.textContent?.trim());
    expect(titleTexts).not.toContain('Cloud Backup');
    expect(titleTexts).toContain('Local Backup');
  });

  test('should display Run Now buttons', () => {
    const buttons = element.shadowRoot!.querySelectorAll('wa-button');
    const runBtns = Array.from(buttons).filter((b) => b.textContent?.includes('Run Now'));
    expect(runBtns.length).toBeGreaterThan(0);
  });

  test('should display View History buttons', () => {
    const buttons = element.shadowRoot!.querySelectorAll('wa-button');
    const historyBtns = Array.from(buttons).filter((b) => b.textContent?.includes('View History'));
    expect(historyBtns.length).toBeGreaterThan(0);
  });

  test('should display Cloud Provider Setup section', () => {
    const sections = element.shadowRoot!.querySelectorAll('.section-header h3');
    const sectionTexts = Array.from(sections).map((s) => s.textContent?.trim());
    expect(sectionTexts).toContain('Cloud Provider Setup');
  });

  test('should show provider card with connection status', () => {
    // The provider card wrapper contains the selected config provider card
    const providerCards = element.shadowRoot!.querySelectorAll('.provider-card-wrapper .provider-card');
    expect(providerCards.length).toBe(1);
  });

  test('should show running indicator when a job is running', async () => {
    element.remove();
    setupMock({
      settings: { googleDriveConnected: true, provider: 'google_drive' },
      localJob: {
        lastRunAt: new Date().toISOString(),
        lastRunStatus: 'running',
      },
    });
    element = await createElement();

    const runningIndicator = element.shadowRoot!.querySelector('.running-indicator');
    expect(runningIndicator).toBeTruthy();
    expect(runningIndicator?.textContent).toContain('Running');
  });

  test('should disable Run Now when job is running', async () => {
    element.remove();
    setupMock({
      settings: { googleDriveConnected: true, provider: 'google_drive' },
      localJob: {
        lastRunAt: new Date().toISOString(),
        lastRunStatus: 'running',
      },
    });
    element = await createElement();

    const buttons = element.shadowRoot!.querySelectorAll('wa-button');
    const runNowBtn = Array.from(buttons).find((b) => b.textContent?.includes('Run Now'));
    expect(runNowBtn).toBeTruthy();
    expect(runNowBtn!.hasAttribute('disabled')).toBe(true);
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
