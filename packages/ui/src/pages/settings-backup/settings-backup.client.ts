import { TemplateResult, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { OgsPageBase } from '../../components/ogs-page-base.ts';
import { describeCron } from '../../components/ogs-cron-generator.ts';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/details/details.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql';
import { graphql } from '../../graphql/index.ts';
import { BackupProvider } from '../../graphql/graphql.ts';

if (typeof globalThis.document !== 'undefined') {
  import('@awesome.me/webawesome/dist/components/dialog/dialog.js');
}

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const GetBackupSettingsQuery = graphql(`
  query GetBackupSettings {
    getBackupSettings {
      provider
      frequency
      lastBackupAt
      googleDriveConnected
      dropboxConnected
      onedriveConnected
      googleDriveClientId
      dropboxClientId
      onedriveClientId
      googleDriveHasClientSecret
    }
  }
`);

const GetCronJobsQuery = graphql(`
  query GetBackupCronJobs {
    getCronJobs {
      id
      name
      displayName
      description
      cronExpression
      enabled
      lastRunAt
      lastRunStatus
      lastRunDurationMs
      lastRunError
      nextRunAt
      config
    }
  }
`);

const TriggerCronJobMutation = graphql(`
  mutation TriggerBackupCronJob($id: Int!) {
    triggerCronJob(id: $id) {
      id
      status
      summary
      error
      durationMs
    }
  }
`);

const EnableCronJobMutation = graphql(`
  mutation EnableBackupCronJob($id: Int!) {
    enableCronJob(id: $id) {
      id
      enabled
    }
  }
`);

const DisableCronJobMutation = graphql(`
  mutation DisableBackupCronJob($id: Int!) {
    disableCronJob(id: $id) {
      id
      enabled
    }
  }
`);

const UpdateCronJobScheduleMutation = graphql(`
  mutation UpdateBackupCronJobSchedule($id: Int!, $cronExpression: String!) {
    updateCronJobSchedule(id: $id, cronExpression: $cronExpression) {
      id
      cronExpression
      nextRunAt
    }
  }
`);

const UpdateBackupSettingsMutation = graphql(`
  mutation UpdateBackupSettings($input: UpdateBackupSettingsInput!) {
    updateBackupSettings(input: $input) {
      provider
      frequency
      lastBackupAt
      googleDriveConnected
      dropboxConnected
      onedriveConnected
    }
  }
`);

const TriggerRestoreMutation = graphql(`
  mutation TriggerRestore($provider: BackupProvider!) {
    triggerRestore(provider: $provider) {
      success
      message
    }
  }
`);

const DisconnectBackupProviderMutation = graphql(`
  mutation DisconnectBackupProvider($provider: BackupProvider!) {
    disconnectBackupProvider(provider: $provider) {
      provider
      frequency
      lastBackupAt
      googleDriveConnected
      dropboxConnected
      onedriveConnected
      googleDriveClientId
      dropboxClientId
      onedriveClientId
      googleDriveHasClientSecret
    }
  }
`);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CronJob {
  id: number;
  name: string;
  displayName: string;
  description: string;
  cronExpression: string;
  enabled: boolean;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastRunDurationMs: number | null;
  lastRunError: string | null;
  nextRunAt: string | null;
  config: string | null;
}

interface ProviderConfig {
  name: string;
  icon: string;
  connectedKey: 'googleDriveConnected' | 'dropboxConnected' | 'onedriveConnected';
}

const PROVIDER_KEYS = ['google_drive', 'dropbox', 'onedrive'] as const;
type ProviderKey = (typeof PROVIDER_KEYS)[number];

const PROVIDERS: Record<ProviderKey, ProviderConfig> = {
  google_drive: { name: 'Google Drive', icon: 'database', connectedKey: 'googleDriveConnected' },
  dropbox: { name: 'Dropbox', icon: 'box-open', connectedKey: 'dropboxConnected' },
  onedrive: { name: 'OneDrive', icon: 'cloud', connectedKey: 'onedriveConnected' },
};

/** Polling interval (ms) when a job is running */
const RUNNING_POLL_INTERVAL = 3000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@customElement('ogs-settings-backup-page')
export class OgsSettingsBackupPage extends OgsPageBase {
  static styles = [
    css`
      ${unsafeCSS(nativeStyle)}
    `,
    css`
      ${unsafeCSS(utilityStyles)}
    `,
    css`
      :host {
        box-sizing: border-box;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      /* --- Page Header --- */

      .page-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }

      .page-header-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: var(--wa-border-radius-l);
        background: var(--wa-color-brand-fill-normal);
        color: var(--wa-color-brand-on-normal);
        flex-shrink: 0;
      }

      .page-header-content {
        flex: 1;
      }

      .page-header h2 {
        margin: 0;
        font-size: var(--wa-font-size-2xl);
        font-weight: 700;
        letter-spacing: -0.01em;
      }

      .page-header p {
        margin: 0.25rem 0 0 0;
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-m);
      }

      /* --- Job Cards --- */

      .job-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .job-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .job-title-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .job-title {
        font-size: var(--wa-font-size-l);
        font-weight: 600;
        margin: 0;
      }

      .job-description {
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-m);
        margin: 0.25rem 0 0 0;
      }

      .job-status-row {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-top: 0.75rem;
        flex-wrap: wrap;
      }

      .status-item {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .status-label {
        font-size: var(--wa-font-size-xs);
        color: var(--wa-color-text-muted);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .status-value {
        font-size: var(--wa-font-size-m);
        font-weight: 500;
      }

      .running-indicator {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
      }

      .running-indicator wa-spinner {
        font-size: 0.875rem;
      }

      /* --- Schedule --- */

      .schedule-section {
        margin-top: 0.75rem;
      }

      .schedule-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .schedule-display {
        font-family: var(--wa-font-family-mono, monospace);
        font-size: var(--wa-font-size-m);
        padding: 0.25rem 0.5rem;
        background: var(--wa-color-surface-alt);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-m);
      }

      .schedule-description {
        font-size: var(--wa-font-size-m);
        color: var(--wa-color-text-muted);
        font-style: italic;
      }

      .schedule-edit-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        background: var(--wa-color-surface-alt);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-m);
      }

      .schedule-edit-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      /* --- Actions --- */

      .job-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--wa-color-surface-border);
        flex-wrap: wrap;
      }

      /* --- Cloud Provider Setup (inline in card) --- */

      .cloud-provider-section {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--wa-color-surface-border);
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .section-header wa-icon {
        color: var(--wa-color-brand-text);
        font-size: 1.125rem;
      }

      .section-header h3 {
        margin: 0;
        font-size: var(--wa-font-size-l);
        font-weight: 600;
      }

      .section-header p {
        margin: 0;
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-m);
      }

      .provider-setup {
        margin-top: 0.75rem;
        padding: 0.75rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        background: var(--wa-color-surface-alt);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
      }

      .client-id-row {
        display: flex;
        align-items: flex-end;
        gap: 0.5rem;
      }

      .client-id-row .client-id-input {
        flex: 1;
      }

      .client-id-row wa-button {
        flex-shrink: 0;
      }

      .setup-steps {
        margin: 0.25rem 0 0.5rem;
        padding-left: 1.25rem;
        font-size: var(--wa-font-size-m);
        color: var(--wa-color-text-muted);
        line-height: 1.6;
      }

      .setup-steps li {
        margin-bottom: 0.125rem;
      }

      .setup-link {
        color: var(--wa-color-text-link);
        font-weight: 500;
      }

      .provider-connected-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      /* --- Loading & Messages --- */

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        gap: 1rem;
      }

      .loading-container span {
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-m);
      }

      /* --- Dialog --- */

      .delete-warning {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        padding: 1rem;
        background: var(--wa-color-danger-container);
        border-radius: var(--wa-border-radius-l);
        margin-bottom: 1rem;
      }

      .delete-warning wa-icon {
        font-size: 1.5rem;
        color: var(--wa-color-danger-text);
        flex-shrink: 0;
        margin-top: 0.125rem;
      }

      .delete-warning-text p {
        margin: 0;
      }

      .delete-warning-text p:first-child {
        font-weight: 500;
        margin-bottom: 0.25rem;
      }

      .delete-warning-text p:last-child {
        font-size: var(--wa-font-size-m);
        color: var(--wa-color-text-muted);
      }

      wa-dialog::part(body) {
        max-height: 70vh;
        overflow-y: auto;
      }

      wa-dialog::part(title) {
        font-size: var(--wa-font-size-xl);
        font-weight: 700;
      }
    `,
  ];

  // --- State ---

  @state() loading = true;
  @state() jobs: CronJob[] = [];
  @state() provider: ProviderKey | '' = '';
  @state() connectedProviders: Record<ProviderKey, boolean> = {
    google_drive: false,
    dropbox: false,
    onedrive: false,
  };
  @state() clientIds: Record<ProviderKey, string> = {
    google_drive: '',
    dropbox: '',
    onedrive: '',
  };
  @state() googleDriveClientSecret = '';
  @state() googleDriveHasClientSecret = false;
  @state() restoring = false;
  @state() showRestoreDialog = false;
  @state() successMessage = '';
  @state() errorMessage = '';

  // Schedule editing
  @state() editingScheduleJobId: number | null = null;
  @state() editScheduleValue = '';
  @state() saveScheduleError = '';

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  get localBackupJob(): CronJob | undefined {
    return this.jobs.find((j) => j.name === 'local-backup');
  }

  get cloudBackupJob(): CronJob | undefined {
    return this.jobs.find((j) => j.name === 'backup');
  }

  get hasRunningJob(): boolean {
    return this.jobs.some((j) => j.lastRunStatus === 'running');
  }

  /** The provider currently shown in the cloud backup card's dropdown */
  get selectedProvider(): ProviderKey {
    return (this.provider as ProviderKey) || 'google_drive';
  }

  get isSelectedProviderConnected(): boolean {
    return this.provider !== '' && this.connectedProviders[this.provider as ProviderKey];
  }

  // --- Lifecycle ---

  connectedCallback(): void {
    super.connectedCallback();
    this.loadData();

    // Check for OAuth callback params
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected')) {
      this.successMessage = `Successfully connected ${params.get('connected')?.replace('_', ' ')}`;
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('error')) {
      this.errorMessage = params.get('error')!;
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopPolling();
  }

  // --- Data Loading ---

  private async loadData() {
    try {
      const [settingsResult, jobsResult] = await Promise.all([
        execute(GetBackupSettingsQuery),
        execute(GetCronJobsQuery),
      ]);

      if (settingsResult?.data?.getBackupSettings) {
        const s = settingsResult.data.getBackupSettings;
        this.provider = (s.provider as ProviderKey | '') ?? '';
        this.connectedProviders = {
          ...this.connectedProviders,
          ...Object.fromEntries(PROVIDER_KEYS.map((key) => [key, s[PROVIDERS[key].connectedKey]])),
        };
        this.clientIds = {
          google_drive: s.googleDriveClientId ?? '',
          dropbox: s.dropboxClientId ?? '',
          onedrive: s.onedriveClientId ?? '',
        };
        this.googleDriveHasClientSecret = s.googleDriveHasClientSecret;
      }

      if (jobsResult?.data?.getCronJobs) {
        const allJobs = jobsResult.data.getCronJobs as CronJob[];
        this.jobs = allJobs.filter((j) => j.name === 'local-backup' || j.name === 'backup');
      }

      this.updatePolling();
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to load settings';
    } finally {
      this.loading = false;
    }
  }

  private async refreshJobs() {
    try {
      const result = await execute(GetCronJobsQuery);
      if (result?.data?.getCronJobs) {
        const allJobs = result.data.getCronJobs as CronJob[];
        this.jobs = allJobs.filter((j) => j.name === 'local-backup' || j.name === 'backup');
      }
      this.updatePolling();
    } catch {
      // silently fail polling
    }
  }

  private updatePolling() {
    if (this.hasRunningJob && !this.pollTimer) {
      this.pollTimer = setInterval(() => this.refreshJobs(), RUNNING_POLL_INTERVAL);
    } else if (!this.hasRunningJob && this.pollTimer) {
      this.stopPolling();
    }
  }

  private stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  // --- Actions ---

  private async triggerJob(jobId: number) {
    this.successMessage = '';
    this.errorMessage = '';
    try {
      await execute(TriggerCronJobMutation, { id: jobId });
      await this.refreshJobs();
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to trigger job';
    }
  }

  private async toggleJob(job: CronJob) {
    // For cloud backup, require a connected provider to enable
    if (!job.enabled && job.name === 'backup' && !this.isSelectedProviderConnected) {
      this.errorMessage = 'Connect a cloud provider before enabling cloud backup.';
      return;
    }
    try {
      if (job.enabled) {
        const result = await execute(DisableCronJobMutation, { id: job.id });
        const enabled = result?.data?.disableCronJob?.enabled ?? false;
        this.jobs = this.jobs.map((j) => (j.id === job.id ? { ...j, enabled } : j));
      } else {
        const result = await execute(EnableCronJobMutation, { id: job.id });
        const enabled = result?.data?.enableCronJob?.enabled ?? true;
        this.jobs = this.jobs.map((j) => (j.id === job.id ? { ...j, enabled } : j));
      }
      // Refresh to get updated nextRunAt
      await this.refreshJobs();
    } catch (e) {
      console.error('Failed to toggle job:', e);
    }
  }

  // --- Schedule Editing ---

  private startEditSchedule(job: CronJob) {
    this.editingScheduleJobId = job.id;
    this.editScheduleValue = job.cronExpression;
    this.saveScheduleError = '';
  }

  private cancelEditSchedule() {
    this.editingScheduleJobId = null;
    this.editScheduleValue = '';
    this.saveScheduleError = '';
  }

  private async saveSchedule(jobId: number) {
    this.saveScheduleError = '';
    try {
      const result = await execute(UpdateCronJobScheduleMutation, {
        id: jobId,
        cronExpression: this.editScheduleValue,
      });
      if (result?.data?.updateCronJobSchedule) {
        const updated = result.data.updateCronJobSchedule;
        this.jobs = this.jobs.map((j) =>
          j.id === jobId
            ? { ...j, cronExpression: updated.cronExpression, nextRunAt: updated.nextRunAt as string | null }
            : j,
        );
        this.editingScheduleJobId = null;
        this.editScheduleValue = '';
      }
    } catch (e) {
      console.error('Failed to update schedule:', e);
      this.saveScheduleError = e instanceof Error ? e.message : 'Failed to save schedule. Please try again.';
    }
  }

  // --- Restore ---

  private async handleRestore() {
    this.showRestoreDialog = false;
    this.restoring = true;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const result = await execute(TriggerRestoreMutation, { provider: this.provider as BackupProvider });
      if (result?.data?.triggerRestore?.success) {
        this.successMessage =
          result.data.triggerRestore.message ?? 'Restore completed. Please restart the application.';
      } else {
        this.errorMessage = result?.data?.triggerRestore?.message ?? 'Restore failed';
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Restore failed';
    } finally {
      this.restoring = false;
    }
  }

  // --- Provider Management ---

  private async handleProviderChange(e: Event) {
    const newProvider = (e.target as HTMLSelectElement).value as ProviderKey;
    this.provider = newProvider;

    // Save the provider selection to the backend
    await this.saveBackupProvider();

    // If the newly selected provider is not connected, disable cloud backup cron
    if (!this.connectedProviders[newProvider]) {
      const cloudJob = this.cloudBackupJob;
      if (cloudJob?.enabled) {
        try {
          const result = await execute(DisableCronJobMutation, { id: cloudJob.id });
          const enabled = result?.data?.disableCronJob?.enabled ?? false;
          this.jobs = this.jobs.map((j) => (j.id === cloudJob.id ? { ...j, enabled } : j));
        } catch (err) {
          console.error('Failed to disable cloud backup:', err);
        }
      }
    }
  }

  private async saveBackupProvider() {
    try {
      await execute(UpdateBackupSettingsMutation, {
        input: { provider: (this.provider as BackupProvider) || null },
      });
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to save provider';
    }
  }

  private async connectProvider(providerKey: ProviderKey) {
    const body: Record<string, string> = { client_id: this.clientIds[providerKey] };
    if (providerKey === 'google_drive' && this.googleDriveClientSecret) {
      body.client_secret = this.googleDriveClientSecret;
    }
    try {
      const response = await fetch(`/api/backup/oauth/${providerKey}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        this.errorMessage = `Failed to initiate ${PROVIDERS[providerKey].name} authorization`;
        return;
      }
      const { url } = await response.json();
      window.location.href = url;
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to start OAuth flow';
    }
  }

  private async disconnectProvider(providerKey: ProviderKey) {
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const result = await execute(DisconnectBackupProviderMutation, {
        provider: providerKey as BackupProvider,
      });
      if (result?.data?.disconnectBackupProvider) {
        const s = result.data.disconnectBackupProvider;
        this.connectedProviders = {
          ...this.connectedProviders,
          ...Object.fromEntries(PROVIDER_KEYS.map((key) => [key, s[PROVIDERS[key].connectedKey]])),
        };
        this.clientIds = {
          google_drive: s.googleDriveClientId ?? '',
          dropbox: s.dropboxClientId ?? '',
          onedrive: s.onedriveClientId ?? '',
        };
        this.googleDriveHasClientSecret = s.googleDriveHasClientSecret;
        this.googleDriveClientSecret = '';
        this.successMessage = `Disconnected ${PROVIDERS[providerKey].name}`;

        // If we just disconnected the active provider, disable cloud backup
        if (this.provider === providerKey) {
          const cloudJob = this.cloudBackupJob;
          if (cloudJob?.enabled) {
            try {
              const disableResult = await execute(DisableCronJobMutation, { id: cloudJob.id });
              const enabled = disableResult?.data?.disableCronJob?.enabled ?? false;
              this.jobs = this.jobs.map((j) => (j.id === cloudJob.id ? { ...j, enabled } : j));
            } catch (err) {
              console.error('Failed to disable cloud backup after disconnect:', err);
            }
          }
        }
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to disconnect provider';
    }
  }

  // --- Helpers ---

  private formatDateTime(iso: string | null): string {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString();
  }

  private formatDuration(ms: number | null): string {
    if (ms == null) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  private getStatusVariant(status: string | null): string {
    switch (status) {
      case 'success':
        return 'success';
      case 'failure':
      case 'error':
        return 'danger';
      case 'running':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  private getOAuthInstructions(providerKey: string): { steps: TemplateResult[] } {
    switch (providerKey) {
      case 'google_drive':
        return {
          steps: [
            html`Go to the
              <a class="setup-link" href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer"
                >Google Cloud Console</a
              >
              and create or select a project.`,
            html`Navigate to
              <a
                class="setup-link"
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                >APIs &amp; Services &gt; Credentials</a
              >.`,
            html`Click "Create Credentials" and select "OAuth client ID".`,
            html`Set the application type to "Web application".`,
            html`Add your redirect URI: <code>${window.location.origin}/api/backup/oauth/google_drive/callback</code>.`,
            html`Copy the generated <strong>Client ID</strong> and <strong>Client Secret</strong> and paste them below.`,
          ],
        };
      case 'dropbox':
        return {
          steps: [
            html`Go to the
              <a
                class="setup-link"
                href="https://www.dropbox.com/developers/apps"
                target="_blank"
                rel="noopener noreferrer"
                >Dropbox App Console</a
              >
              and click "Create app".`,
            html`Choose "Scoped access" and "Full Dropbox" access type.`,
            html`Name your app and click "Create app".`,
            html`Under the Settings tab, find the "Allow public clients (Implicit Grant & PKCE)" setting and enable it.`,
            html`Add your redirect URI: <code>${window.location.origin}/api/backup/oauth/dropbox/callback</code>.`,
            html`Copy the <strong>App key</strong> (this is your Client ID) and paste it below. No app secret is needed
              — this app uses PKCE for secure authorization.`,
          ],
        };
      case 'onedrive':
        return {
          steps: [
            html`Go to the
              <a
                class="setup-link"
                href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                target="_blank"
                rel="noopener noreferrer"
                >Azure Portal App Registrations</a
              >
              and click "New registration".`,
            html`Name your application and under "Supported account types" select the appropriate option.`,
            html`Set the redirect URI platform to "Single-page application" (SPA) with your callback URL:
              <code>${window.location.origin}/api/backup/oauth/onedrive/callback</code>. This enables PKCE support
              without a client secret.`,
            html`After registration, copy the <strong>Application (client) ID</strong> and paste it below.`,
          ],
        };
      default:
        return { steps: [] };
    }
  }

  // --- Render ---

  render() {
    return this.renderPage(
      html`
        ${this.renderPageHeader()}
        ${when(
          this.loading,
          () => html`
            <div class="loading-container">
              <wa-spinner style="font-size: 2rem;"></wa-spinner>
              <span>Loading backup settings...</span>
            </div>
          `,
          () => this.renderContent(),
        )}
        ${this.renderRestoreDialog()}
      `,
      { activePage: 'settings/backup', showUserMenu: true },
    );
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="cloud-arrow-up" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Backup & Restore</h2>
          <p>Manage local and cloud backups</p>
        </div>
      </div>
    `;
  }

  private renderContent() {
    return html`
      ${this.successMessage
        ? html`
            <wa-callout variant="success" style="margin-bottom: 1rem;">
              <wa-icon slot="icon" name="circle-check"></wa-icon>
              ${this.successMessage}
            </wa-callout>
          `
        : nothing}
      ${this.errorMessage
        ? html`
            <wa-callout variant="danger" style="margin-bottom: 1rem;">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              ${this.errorMessage}
            </wa-callout>
          `
        : nothing}

      <div class="job-list">
        ${this.localBackupJob ? this.renderLocalBackupCard(this.localBackupJob) : nothing}
        ${this.cloudBackupJob ? this.renderCloudBackupCard(this.cloudBackupJob) : nothing}
      </div>
    `;
  }

  // --- Local Backup Card ---

  private renderLocalBackupCard(job: CronJob) {
    const isRunning = job.lastRunStatus === 'running';
    const isEditingSchedule = this.editingScheduleJobId === job.id;

    return html`
      <wa-card appearance="outline">
        <div class="job-header">
          <div>
            <div class="job-title-row">
              <h3 class="job-title">${job.displayName}</h3>
              ${this.renderStatusBadge(job)}
            </div>
            <p class="job-description">${job.description}</p>
          </div>
          <wa-switch ?checked="${job.enabled}" @change="${() => this.toggleJob(job)}"></wa-switch>
        </div>

        <div class="job-status-row">
          <div class="status-item">
            <span class="status-label">Last Run</span>
            <span class="status-value">${this.formatDateTime(job.lastRunAt)}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Duration</span>
            <span class="status-value">${this.formatDuration(job.lastRunDurationMs)}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Next Run</span>
            <span class="status-value">${this.formatDateTime(job.nextRunAt)}</span>
          </div>
        </div>

        ${job.lastRunError
          ? html`
              <wa-callout variant="danger" style="margin-top: 0.75rem;">
                <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                ${job.lastRunError}
              </wa-callout>
            `
          : nothing}

        <!-- Schedule -->
        <div class="schedule-section">
          ${isEditingSchedule ? this.renderScheduleEditor(job.id) : this.renderScheduleDisplay(job)}
        </div>

        <div class="job-actions">
          <wa-button
            size="small"
            variant="brand"
            appearance="outlined"
            ?disabled="${!job.enabled || isRunning}"
            ?loading="${isRunning}"
            @click="${() => this.triggerJob(job.id)}"
          >
            <wa-icon slot="start" name="play"></wa-icon>
            Run Now
          </wa-button>
        </div>
      </wa-card>
    `;
  }

  // --- Cloud Backup Card ---

  private renderCloudBackupCard(job: CronJob) {
    const isRunning = job.lastRunStatus === 'running';
    const isEditingSchedule = this.editingScheduleJobId === job.id;
    const providerKey = this.provider as ProviderKey;
    const canEnable = this.provider !== '' && this.connectedProviders[providerKey];

    return html`
      <wa-card appearance="outline">
        <div class="job-header">
          <div>
            <div class="job-title-row">
              <h3 class="job-title">${job.displayName}</h3>
              ${this.renderStatusBadge(job)}
            </div>
            <p class="job-description">${job.description}</p>
          </div>
          <wa-switch
            ?checked="${job.enabled}"
            ?disabled="${!canEnable && !job.enabled}"
            @change="${() => this.toggleJob(job)}"
          ></wa-switch>
        </div>

        ${!canEnable && !job.enabled
          ? html`
              <wa-callout variant="neutral" style="margin-top: 0.75rem;">
                <wa-icon slot="icon" name="circle-info"></wa-icon>
                Connect a cloud provider below to enable automatic cloud backups.
              </wa-callout>
            `
          : nothing}

        <div class="job-status-row">
          <div class="status-item">
            <span class="status-label">Last Run</span>
            <span class="status-value">${this.formatDateTime(job.lastRunAt)}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Duration</span>
            <span class="status-value">${this.formatDuration(job.lastRunDurationMs)}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Next Run</span>
            <span class="status-value">${this.formatDateTime(job.nextRunAt)}</span>
          </div>
        </div>

        ${job.lastRunError
          ? html`
              <wa-callout variant="danger" style="margin-top: 0.75rem;">
                <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                ${job.lastRunError}
              </wa-callout>
            `
          : nothing}

        <!-- Schedule -->
        <div class="schedule-section">
          ${isEditingSchedule ? this.renderScheduleEditor(job.id) : this.renderScheduleDisplay(job)}
        </div>

        <!-- Cloud Provider -->
        <div class="cloud-provider-section">
          <wa-select
            label="Backup Provider"
            .value="${this.provider || 'google_drive'}"
            size="small"
            @change="${this.handleProviderChange}"
          >
            ${PROVIDER_KEYS.map((key) => html`<wa-option value="${key}">${PROVIDERS[key].name}</wa-option>`)}
          </wa-select>

          ${this.renderProviderSetup()}
        </div>

        <div class="job-actions">
          <wa-button
            size="small"
            variant="brand"
            appearance="outlined"
            ?disabled="${!job.enabled || isRunning || !this.isSelectedProviderConnected}"
            ?loading="${isRunning}"
            @click="${() => this.triggerJob(job.id)}"
          >
            <wa-icon slot="start" name="play"></wa-icon>
            Run Now
          </wa-button>
          <wa-button
            size="small"
            variant="danger"
            appearance="outlined"
            ?loading="${this.restoring}"
            ?disabled="${!this.isSelectedProviderConnected || isRunning}"
            @click="${() => {
              this.showRestoreDialog = true;
            }}"
          >
            <wa-icon slot="start" name="cloud-arrow-down"></wa-icon>
            Restore
          </wa-button>
        </div>
      </wa-card>
    `;
  }

  // --- Shared Schedule Rendering ---

  private renderStatusBadge(job: CronJob) {
    const isRunning = job.lastRunStatus === 'running';
    return isRunning
      ? html`
          <wa-badge variant="warning">
            <span class="running-indicator">
              <wa-spinner></wa-spinner>
              Running
            </span>
          </wa-badge>
        `
      : html`
          <wa-badge variant="${this.getStatusVariant(job.lastRunStatus)}"> ${job.lastRunStatus ?? 'idle'} </wa-badge>
        `;
  }

  private renderScheduleDisplay(job: CronJob) {
    return html`
      <div class="schedule-row">
        <span class="schedule-display">${job.cronExpression}</span>
        <span class="schedule-description">${describeCron(job.cronExpression) ?? ''}</span>
        <wa-button size="small" variant="neutral" appearance="outlined" @click="${() => this.startEditSchedule(job)}">
          <wa-icon slot="start" name="pen-to-square"></wa-icon>
          Edit
        </wa-button>
      </div>
    `;
  }

  private renderScheduleEditor(jobId: number) {
    return html`
      <div class="schedule-edit-section">
        <ogs-cron-generator
          value="${this.editScheduleValue}"
          @ogs-cron-change="${(e: CustomEvent<{ value: string }>) => {
            this.editScheduleValue = e.detail.value;
            this.saveScheduleError = '';
          }}"
        ></ogs-cron-generator>
        ${this.saveScheduleError
          ? html`
              <wa-callout variant="danger">
                <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                ${this.saveScheduleError}
              </wa-callout>
            `
          : nothing}
        <div class="schedule-edit-actions">
          <wa-button size="small" variant="brand" @click="${() => this.saveSchedule(jobId)}"> Save Schedule </wa-button>
          <wa-button size="small" variant="neutral" appearance="outlined" @click="${this.cancelEditSchedule}">
            Cancel
          </wa-button>
        </div>
      </div>
    `;
  }

  // --- Provider Setup (inline in cloud card) ---

  private renderProviderSetup() {
    const providerKey = this.selectedProvider;
    const connected = this.connectedProviders[providerKey];
    const clientId = this.clientIds[providerKey];
    const { name } = PROVIDERS[providerKey];
    const instructions = this.getOAuthInstructions(providerKey);

    if (connected) {
      return html`
        <div class="provider-setup">
          <div class="provider-connected-row">
            <wa-badge variant="success">Connected</wa-badge>
            <wa-button
              size="small"
              variant="danger"
              appearance="outlined"
              @click="${() => this.disconnectProvider(providerKey)}"
            >
              <wa-icon slot="start" name="link-slash"></wa-icon>
              Disconnect
            </wa-button>
          </div>
        </div>
      `;
    }

    return html`
      <div class="provider-setup">
        <wa-details summary="How to get a ${name} OAuth Client ID">
          <ol class="setup-steps">
            ${instructions.steps.map((step) => html`<li>${step}</li>`)}
          </ol>
        </wa-details>
        <div class="client-id-row">
          <wa-input
            class="client-id-input"
            label="OAuth Client ID"
            placeholder="Paste your ${name} OAuth Client ID"
            size="small"
            .value="${clientId}"
            @input="${(e: Event) => {
              this.clientIds = { ...this.clientIds, [providerKey]: (e.target as HTMLInputElement).value };
            }}"
          >
            <wa-icon slot="prefix" name="key"></wa-icon>
          </wa-input>
        </div>
        ${providerKey === 'google_drive'
          ? html`
              <div class="client-id-row">
                <wa-input
                  class="client-id-input"
                  label="OAuth Client Secret"
                  placeholder="Paste your ${name} OAuth Client Secret"
                  type="password"
                  size="small"
                  .value="${this.googleDriveClientSecret}"
                  @input="${(e: Event) => {
                    this.googleDriveClientSecret = (e.target as HTMLInputElement).value;
                  }}"
                >
                  <wa-icon slot="prefix" name="lock"></wa-icon>
                </wa-input>
              </div>
            `
          : nothing}
        <div class="client-id-row" style="margin-top: 0.25rem;">
          <wa-button
            size="small"
            variant="brand"
            appearance="outlined"
            ?disabled="${!clientId.trim() || (providerKey === 'google_drive' && !this.googleDriveClientSecret.trim())}"
            @click="${() => this.connectProvider(providerKey)}"
          >
            <wa-icon slot="start" name="link"></wa-icon>
            Connect
          </wa-button>
        </div>
      </div>
    `;
  }

  // --- Restore Dialog ---

  private renderRestoreDialog() {
    return html`
      <wa-dialog
        label="Confirm Restore"
        ?open="${this.showRestoreDialog}"
        @wa-after-hide="${() => {
          this.showRestoreDialog = false;
        }}"
      >
        <div class="delete-warning">
          <wa-icon name="triangle-exclamation"></wa-icon>
          <div class="delete-warning-text">
            <p>This action will overwrite your current database</p>
            <p>
              Restoring from a backup will replace all current data with the backup data from
              <strong>${this.provider ? PROVIDERS[this.provider as ProviderKey]?.name : ''}</strong>. All changes since
              the last backup will be lost. This action cannot be undone.
            </p>
          </div>
        </div>
        <wa-button
          autofocus
          slot="footer"
          variant="neutral"
          @click="${() => {
            this.showRestoreDialog = false;
          }}"
          >Cancel</wa-button
        >
        <wa-button slot="footer" variant="danger" @click="${this.handleRestore}">
          <wa-icon slot="start" name="cloud-arrow-down"></wa-icon>
          Restore Database
        </wa-button>
      </wa-dialog>
    `;
  }
}
