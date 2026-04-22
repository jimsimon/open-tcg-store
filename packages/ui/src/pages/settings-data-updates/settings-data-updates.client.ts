import { css, html, nothing, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { OgsPageBase } from '../../components/ogs-page-base.ts';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql';
import { graphql } from '../../graphql/index.ts';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const GetDataUpdateStatusQuery = graphql(`
  query GetDataUpdateStatus {
    getDataUpdateStatus {
      currentVersion
      latestVersion
      updateAvailable
      isUpdating
    }
  }
`);

const CheckForDataUpdatesQuery = graphql(`
  query CheckForDataUpdates {
    checkForDataUpdates {
      currentVersion
      latestVersion
      updateAvailable
      isUpdating
    }
  }
`);

const TriggerDataUpdateMutation = graphql(`
  mutation TriggerDataUpdate {
    triggerDataUpdate {
      success
      message
      newVersion
    }
  }
`);

const GetDataUpdateCronJobsQuery = graphql(`
  query GetDataUpdateCronJobs {
    getCronJobs {
      id
      name
      cronExpression
      enabled
      lastRunAt
      lastRunStatus
      lastRunDurationMs
      lastRunError
      nextRunAt
    }
  }
`);

const EnableDataUpdateCronJobMutation = graphql(`
  mutation EnableDataUpdateCronJob($id: Int!) {
    enableCronJob(id: $id) {
      id
      enabled
    }
  }
`);

const DisableDataUpdateCronJobMutation = graphql(`
  mutation DisableDataUpdateCronJob($id: Int!) {
    disableCronJob(id: $id) {
      id
      enabled
    }
  }
`);

const UpdateDataUpdateScheduleMutation = graphql(`
  mutation UpdateDataUpdateSchedule($id: Int!, $cronExpression: String!) {
    updateCronJobSchedule(id: $id, cronExpression: $cronExpression) {
      id
      cronExpression
      nextRunAt
    }
  }
`);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CronJob {
  id: number;
  name: string;
  cronExpression: string;
  enabled: boolean;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastRunDurationMs: number | null;
  lastRunError: string | null;
  nextRunAt: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HOUR_LABELS = [
  '12:00 AM',
  '1:00 AM',
  '2:00 AM',
  '3:00 AM',
  '4:00 AM',
  '5:00 AM',
  '6:00 AM',
  '7:00 AM',
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
  '7:00 PM',
  '8:00 PM',
  '9:00 PM',
  '10:00 PM',
  '11:00 PM',
];

/** Extract hour from a daily cron like "0 3 * * *". Returns null if not a simple daily cron. */
function parseDailyHour(cron: string): number | null {
  const match = cron.match(/^0\s+(\d{1,2})\s+\*\s+\*\s+\*$/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  return hour >= 0 && hour <= 23 ? hour : null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@customElement('ogs-settings-data-updates-page')
export class OgsSettingsDataUpdatesPage extends OgsPageBase {
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

      /* --- Cards --- */

      .cards {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
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

      /* --- Status Info --- */

      .status-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .status-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .status-label {
        font-size: var(--wa-font-size-m);
        color: var(--wa-color-text-muted);
        font-weight: 500;
      }

      .status-value {
        font-size: var(--wa-font-size-m);
        font-weight: 600;
      }

      .action-bar {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 0.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--wa-color-surface-border);
      }

      /* --- Auto-Update Section --- */

      .auto-update-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .auto-update-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 0.75rem;
      }

      .auto-update-status {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-top: 0.75rem;
        flex-wrap: wrap;
      }

      .auto-update-status .status-item .status-label {
        font-size: var(--wa-font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.05em;
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
    `,
  ];

  // --- State ---

  @state() currentVersion: string | null = null;
  @state() latestVersion: string | null = null;
  @state() updateAvailable = false;
  @state() isUpdating = false;
  @state() loading = true;
  @state() updating = false;
  @state() checking = false;
  @state() successMessage = '';
  @state() errorMessage = '';

  @state() cronJob: CronJob | null = null;
  @state() selectedHour = 3; // default 3 AM

  private initialLoad: Promise<void> | null = null;

  // --- Lifecycle ---

  connectedCallback(): void {
    super.connectedCallback();
    this.initialLoad = this.loadAll();
  }

  // --- Data Loading ---

  private async loadAll() {
    try {
      await Promise.all([this.fetchStatus(), this.fetchCronJob()]);
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to load update status';
    } finally {
      this.loading = false;
    }
  }

  private async fetchStatus() {
    const result = await execute(GetDataUpdateStatusQuery);
    if (result?.data?.getDataUpdateStatus) {
      const s = result.data.getDataUpdateStatus;
      this.currentVersion = s.currentVersion as string | null;
      this.latestVersion = s.latestVersion as string | null;
      this.updateAvailable = s.updateAvailable;
      this.isUpdating = s.isUpdating;
    }
  }

  private async fetchCronJob() {
    const result = await execute(GetDataUpdateCronJobsQuery);
    if (result?.data?.getCronJobs) {
      const job = (result.data.getCronJobs as CronJob[]).find((j) => j.name === 'tcg-data-update') ?? null;
      this.cronJob = job;
      if (job) {
        const hour = parseDailyHour(job.cronExpression);
        if (hour !== null) {
          this.selectedHour = hour;
        }
      }
    }
  }

  // --- Actions ---

  async handleCheckForUpdates() {
    if (this.initialLoad) {
      await this.initialLoad;
      this.initialLoad = null;
    }

    this.checking = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      // Use checkForDataUpdates which actually queries GitHub for the latest release,
      // unlike getDataUpdateStatus which only reads from cache.
      const result = await execute(CheckForDataUpdatesQuery);
      if (result?.data?.checkForDataUpdates) {
        const s = result.data.checkForDataUpdates;
        this.currentVersion = s.currentVersion as string | null;
        this.latestVersion = s.latestVersion as string | null;
        this.updateAvailable = s.updateAvailable;
        this.isUpdating = s.isUpdating;
      }

      if (this.updateAvailable) {
        this.successMessage = 'A new update is available!';
      } else {
        this.successMessage = 'Your card data is already up to date.';
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to check for updates';
    } finally {
      this.checking = false;
    }
  }

  async handleUpdate() {
    this.updating = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const result = await execute(TriggerDataUpdateMutation);

      if (result?.errors?.length) {
        this.errorMessage = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else if (result?.data?.triggerDataUpdate) {
        const r = result.data.triggerDataUpdate;
        if (r.success) {
          this.successMessage = r.message ?? 'Update completed successfully';
          await this.fetchStatus();
        } else {
          this.errorMessage = r.message ?? 'Update failed';
        }
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to trigger update';
    } finally {
      this.updating = false;
    }
  }

  private async toggleAutoUpdate() {
    if (!this.cronJob) return;
    try {
      if (this.cronJob.enabled) {
        const result = await execute(DisableDataUpdateCronJobMutation, { id: this.cronJob.id });
        const enabled = result?.data?.disableCronJob?.enabled ?? false;
        this.cronJob = { ...this.cronJob, enabled };
      } else {
        const result = await execute(EnableDataUpdateCronJobMutation, { id: this.cronJob.id });
        const enabled = result?.data?.enableCronJob?.enabled ?? true;
        this.cronJob = { ...this.cronJob, enabled };
      }
      // Refresh to get updated nextRunAt
      await this.fetchCronJob();
    } catch (e) {
      console.error('Failed to toggle auto-update:', e);
    }
  }

  private async handleHourChange(e: Event) {
    if (!this.cronJob) return;
    const hour = parseInt((e.target as HTMLSelectElement).value, 10);
    const previousHour = this.selectedHour;
    this.selectedHour = hour;
    const cronExpression = `0 ${hour} * * *`;
    try {
      const result = await execute(UpdateDataUpdateScheduleMutation, {
        id: this.cronJob.id,
        cronExpression,
      });
      if (result?.data?.updateCronJobSchedule) {
        const updated = result.data.updateCronJobSchedule;
        this.cronJob = {
          ...this.cronJob,
          cronExpression: updated.cronExpression,
          nextRunAt: updated.nextRunAt as string | null,
        };
      }
    } catch (e) {
      // Revert the UI selection to prevent desync with backend
      this.selectedHour = previousHour;
      console.error('Failed to update schedule:', e);
    }
  }

  // --- Helpers ---

  private formatVersion(version: string | null): string {
    if (!version) return 'Unknown';
    const date = new Date(version);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    const hashMatch = version.match(/^tcg-data-([0-9a-f]+)$/i);
    if (hashMatch) {
      return hashMatch[1].substring(0, 12);
    }
    const legacyMatch = version.match(/initial-db-(\d{4})(\d{2})(\d{2})/);
    if (legacyMatch) {
      return `${legacyMatch[1]}-${legacyMatch[2]}-${legacyMatch[3]}`;
    }
    return version;
  }

  private formatDateTime(iso: string | null): string {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString();
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
              <span>Loading update status...</span>
            </div>
          `,
          () => this.renderContent(),
        )}
      `,
      { activePage: 'settings/data-updates', showUserMenu: true },
    );
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="database" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Card Data</h2>
          <p>Manage your TCG product database and check for updates</p>
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

      <div class="cards">
        ${this.renderDatabaseStatusCard()} ${this.cronJob ? this.renderAutoUpdateCard() : nothing}
      </div>
    `;
  }

  private renderDatabaseStatusCard() {
    return html`
      <wa-card appearance="outline">
        <div class="section-header">
          <wa-icon name="circle-info"></wa-icon>
          <div>
            <h3>Database Status</h3>
            <p>Current state of the TCG product data</p>
          </div>
        </div>

        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">Last Updated</span>
            <span class="status-value">${this.formatVersion(this.currentVersion)}</span>
          </div>
          ${this.updateAvailable
            ? html`
                <div class="status-item">
                  <span class="status-label">Update Available</span>
                  <span class="status-value">${this.formatVersion(this.latestVersion)}</span>
                </div>
              `
            : nothing}
        </div>

        ${this.updateAvailable
          ? html`
              <wa-callout variant="warning" style="margin-bottom: 1rem;">
                <wa-icon slot="icon" name="circle-arrow-up"></wa-icon>
                A new card data update is available. Click the button below to update.
              </wa-callout>
            `
          : html`
              <wa-callout variant="success" style="margin-bottom: 1rem;">
                <wa-icon slot="icon" name="circle-check"></wa-icon>
                Your card data is up to date.
              </wa-callout>
            `}

        <div class="action-bar">
          <wa-button
            variant="brand"
            ?loading="${this.updating}"
            ?disabled="${!this.updateAvailable || this.isUpdating}"
            @click="${this.handleUpdate}"
          >
            <wa-icon slot="start" name="arrows-rotate"></wa-icon>
            ${this.updating ? 'Updating...' : 'Update Now'}
          </wa-button>
          <wa-button
            variant="neutral"
            ?loading="${this.checking}"
            ?disabled="${this.updating || this.checking}"
            @click="${this.handleCheckForUpdates}"
          >
            <wa-icon slot="start" name="magnifying-glass"></wa-icon>
            ${this.checking ? 'Checking...' : 'Check for Updates'}
          </wa-button>
          ${this.isUpdating && !this.updating
            ? html`<span style="color: var(--wa-color-text-muted); font-size: var(--wa-font-size-m);">
                An update is currently in progress...
              </span>`
            : nothing}
        </div>
      </wa-card>
    `;
  }

  private renderAutoUpdateCard() {
    const job = this.cronJob!;

    return html`
      <wa-card appearance="outline">
        <div class="auto-update-header">
          <div class="section-header" style="margin-bottom: 0;">
            <wa-icon name="clock"></wa-icon>
            <div>
              <h3>Automatic Updates</h3>
              <p>Automatically check for and apply data updates daily</p>
            </div>
          </div>
          <wa-switch ?checked="${job.enabled}" @change="${() => this.toggleAutoUpdate()}"></wa-switch>
        </div>

        <div class="auto-update-controls">
          <wa-select
            label="Check for updates daily at"
            .value="${String(this.selectedHour)}"
            size="small"
            ?disabled="${!job.enabled}"
            @change="${this.handleHourChange}"
          >
            ${HOUR_LABELS.map((label, i) => html`<wa-option value="${String(i)}">${label}</wa-option>`)}
          </wa-select>
        </div>

        <div class="auto-update-status">
          <div class="status-item">
            <span class="status-label">Last Check</span>
            <span class="status-value">${this.formatDateTime(job.lastRunAt)}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Status</span>
            <span class="status-value">
              <wa-badge variant="${this.getStatusVariant(job.lastRunStatus)}">
                ${job.lastRunStatus ?? 'idle'}
              </wa-badge>
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">Next Check</span>
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
      </wa-card>
    `;
  }
}
