import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '../../components/ogs-page.ts';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/details/details.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql';
import { graphql } from '../../graphql/index.ts';

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

interface CronJobRun {
  id: number;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  status: string;
  error: string | null;
  summary: string | null;
}

const GetCronJobsQuery = graphql(`
  query GetCronJobs {
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

const GetCronJobRunsQuery = graphql(`
  query GetCronJobRuns($cronJobId: Int!, $pagination: PaginationInput) {
    getCronJobRuns(cronJobId: $cronJobId, pagination: $pagination) {
      items {
        id
        startedAt
        completedAt
        durationMs
        status
        error
        summary
      }
      totalCount
      page
      pageSize
      totalPages
    }
  }
`);

const TriggerCronJobMutation = graphql(`
  mutation TriggerCronJob($id: Int!) {
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
  mutation EnableCronJob($id: Int!) {
    enableCronJob(id: $id) {
      id
      enabled
    }
  }
`);

const DisableCronJobMutation = graphql(`
  mutation DisableCronJob($id: Int!) {
    disableCronJob(id: $id) {
      id
      enabled
    }
  }
`);

const UpdateCronJobScheduleMutation = graphql(`
  mutation UpdateCronJobSchedule($id: Int!, $cronExpression: String!) {
    updateCronJobSchedule(id: $id, cronExpression: $cronExpression) {
      id
      cronExpression
      nextRunAt
    }
  }
`);

const _UpdateCronJobConfigMutation = graphql(`
  mutation UpdateCronJobConfig($id: Int!, $config: String!) {
    updateCronJobConfig(id: $id, config: $config) {
      id
      config
    }
  }
`);

@customElement('ogs-settings-scheduled-tasks-page')
export class OgsSettingsScheduledTasksPage extends LitElement {
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';
  @property({ type: Boolean }) canManageInventory = false;
  @property({ type: Boolean })
  canManageLots = false;
  @property({ type: Boolean }) canViewDashboard = false;
  @property({ type: Boolean }) canAccessSettings = false;
  @property({ type: Boolean }) canManageStoreLocations = false;
  @property({ type: Boolean }) canManageUsers = false;
  @property({ type: Boolean }) canViewTransactionLog = false;
  @property({ type: Boolean }) canManageEvents = false;
  @property({ type: String }) activeOrganizationId = '';
  @property({ type: Boolean }) showUserMenu = false;

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
        font-size: var(--wa-font-size-s);
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
        font-size: var(--wa-font-size-s);
        margin: 0.25rem 0 0 0;
      }

      /* --- Status Row --- */

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
        font-size: var(--wa-font-size-s);
        font-weight: 500;
      }

      /* --- Schedule Row --- */

      .schedule-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.75rem;
      }

      .schedule-display {
        font-family: var(--wa-font-family-mono, monospace);
        font-size: var(--wa-font-size-s);
        padding: 0.25rem 0.5rem;
        background: var(--wa-color-surface-alt);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-m);
      }

      .schedule-edit {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      /* --- Action Row --- */

      .job-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--wa-color-surface-border);
      }

      /* --- Run History --- */

      .run-history {
        margin-top: 0.75rem;
      }

      .run-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--wa-font-size-s);
      }

      .run-table th {
        text-align: left;
        padding: 0.5rem 0.75rem;
        font-weight: 600;
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .run-table td {
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .run-table tr:last-child td {
        border-bottom: none;
      }

      .run-error {
        color: var(--wa-color-danger-text);
        font-size: var(--wa-font-size-xs);
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
        font-size: var(--wa-font-size-s);
      }

      .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--wa-color-text-muted);
      }

      .runs-loading {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-s);
      }
    `,
  ];

  @state() jobs: CronJob[] = [];
  @state() loading = true;
  @state() expandedJobId: number | null = null;
  @state() jobRuns: CronJobRun[] = [];
  @state() runsLoading = false;
  @state() editingScheduleJobId: number | null = null;
  @state() editScheduleValue = '';

  connectedCallback(): void {
    super.connectedCallback();
    this.loadJobs();
  }

  private async loadJobs() {
    this.loading = true;
    try {
      const result = await execute(GetCronJobsQuery);
      if (result?.data?.getCronJobs) {
        this.jobs = result.data.getCronJobs as CronJob[];
      }
    } catch (e) {
      console.error('Failed to load cron jobs:', e);
    } finally {
      this.loading = false;
    }
  }

  private async toggleJob(job: CronJob) {
    try {
      let enabled: boolean;
      if (job.enabled) {
        const result = await execute(DisableCronJobMutation, { id: job.id });
        enabled = result?.data?.disableCronJob?.enabled ?? false;
      } else {
        const result = await execute(EnableCronJobMutation, { id: job.id });
        enabled = result?.data?.enableCronJob?.enabled ?? true;
      }
      this.jobs = this.jobs.map((j) => (j.id === job.id ? { ...j, enabled } : j));
    } catch (e) {
      console.error('Failed to toggle job:', e);
    }
  }

  private async triggerJob(jobId: number) {
    try {
      await execute(TriggerCronJobMutation, { id: jobId });
      // Refresh jobs to get updated status
      await this.loadJobs();
    } catch (e) {
      console.error('Failed to trigger job:', e);
    }
  }

  private async toggleRunHistory(jobId: number) {
    if (this.expandedJobId === jobId) {
      this.expandedJobId = null;
      this.jobRuns = [];
      return;
    }

    this.expandedJobId = jobId;
    this.runsLoading = true;
    try {
      const result = await execute(GetCronJobRunsQuery, {
        cronJobId: jobId,
        pagination: { page: 1, pageSize: 10 },
      });
      if (result?.data?.getCronJobRuns?.items) {
        this.jobRuns = result.data.getCronJobRuns.items as CronJobRun[];
      }
    } catch (e) {
      console.error('Failed to load job runs:', e);
    } finally {
      this.runsLoading = false;
    }
  }

  private startEditSchedule(job: CronJob) {
    this.editingScheduleJobId = job.id;
    this.editScheduleValue = job.cronExpression;
  }

  private cancelEditSchedule() {
    this.editingScheduleJobId = null;
    this.editScheduleValue = '';
  }

  private async saveSchedule(jobId: number) {
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
      }
    } catch (e) {
      console.error('Failed to update schedule:', e);
    } finally {
      this.editingScheduleJobId = null;
      this.editScheduleValue = '';
    }
  }

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

  render() {
    return html`
      <ogs-page
        activePage="settings/scheduled-tasks"
        ?showUserMenu="${true}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
        ?canManageInventory="${this.canManageInventory}"
        ?canManageLots="${this.canManageLots}"
        ?canViewDashboard="${this.canViewDashboard}"
        ?canAccessSettings="${this.canAccessSettings}"
        ?canManageStoreLocations="${this.canManageStoreLocations}"
        ?canManageUsers="${this.canManageUsers}"
        ?canViewTransactionLog="${this.canViewTransactionLog}"
        ?canManageEvents="${this.canManageEvents}"
        activeOrganizationId="${this.activeOrganizationId}"
      >
        ${this.renderPageHeader()}
        ${when(
          this.loading,
          () => html`
            <div class="loading-container">
              <wa-spinner style="font-size: 2rem;"></wa-spinner>
              <span>Loading scheduled tasks...</span>
            </div>
          `,
          () => this.renderContent(),
        )}
      </ogs-page>
    `;
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="clock" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Scheduled Tasks</h2>
          <p>View and manage automated background tasks</p>
        </div>
      </div>
    `;
  }

  private renderContent() {
    if (this.jobs.length === 0) {
      return html`
        <div class="empty-state">
          <wa-icon name="clock" style="font-size: 3rem; margin-bottom: 1rem;"></wa-icon>
          <p>No scheduled tasks configured.</p>
        </div>
      `;
    }

    return html` <div class="job-list">${this.jobs.map((job) => this.renderJobCard(job))}</div> `;
  }

  private renderJobCard(job: CronJob) {
    const isExpanded = this.expandedJobId === job.id;
    const isEditingSchedule = this.editingScheduleJobId === job.id;

    return html`
      <wa-card appearance="outline">
        <!-- Header: name + toggle -->
        <div class="job-header">
          <div>
            <div class="job-title-row">
              <h3 class="job-title">${job.displayName}</h3>
              <wa-badge variant="${this.getStatusVariant(job.lastRunStatus)}">
                ${job.lastRunStatus ?? 'idle'}
              </wa-badge>
            </div>
            <p class="job-description">${job.description}</p>
          </div>
          <wa-switch ?checked="${job.enabled}" @wa-change="${() => this.toggleJob(job)}"></wa-switch>
        </div>

        <!-- Status info -->
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
        <div class="schedule-row">
          ${isEditingSchedule
            ? html`
                <div class="schedule-edit">
                  <wa-input
                    size="small"
                    value="${this.editScheduleValue}"
                    @input="${(e: Event) => {
                      this.editScheduleValue = (e.target as HTMLInputElement).value;
                    }}"
                    placeholder="* * * * *"
                    style="width: 200px;"
                  ></wa-input>
                  <wa-button size="small" variant="brand" @click="${() => this.saveSchedule(job.id)}"> Save </wa-button>
                  <wa-button size="small" variant="neutral" appearance="outlined" @click="${this.cancelEditSchedule}">
                    Cancel
                  </wa-button>
                </div>
              `
            : html`
                <span class="schedule-display">${job.cronExpression}</span>
                <wa-button
                  size="small"
                  variant="neutral"
                  appearance="outlined"
                  @click="${() => this.startEditSchedule(job)}"
                >
                  <wa-icon slot="start" name="pen-to-square"></wa-icon>
                  Edit
                </wa-button>
              `}
        </div>

        <!-- Actions -->
        <div class="job-actions">
          <wa-button
            size="small"
            variant="brand"
            appearance="outlined"
            ?disabled="${!job.enabled}"
            @click="${() => this.triggerJob(job.id)}"
          >
            <wa-icon slot="start" name="play"></wa-icon>
            Run Now
          </wa-button>
          <wa-button
            size="small"
            variant="neutral"
            appearance="outlined"
            @click="${() => this.toggleRunHistory(job.id)}"
          >
            <wa-icon slot="start" name="${isExpanded ? 'chevron-up' : 'chevron-down'}"></wa-icon>
            ${isExpanded ? 'Hide History' : 'View History'}
          </wa-button>
        </div>

        <!-- Run History -->
        ${isExpanded ? this.renderRunHistory() : nothing}
      </wa-card>
    `;
  }

  private renderRunHistory() {
    if (this.runsLoading) {
      return html`
        <div class="runs-loading">
          <wa-spinner></wa-spinner>
          <span>Loading run history...</span>
        </div>
      `;
    }

    if (this.jobRuns.length === 0) {
      return html`
        <div class="run-history">
          <p style="color: var(--wa-color-text-muted); font-size: var(--wa-font-size-s); padding: 1rem 0;">
            No runs recorded yet.
          </p>
        </div>
      `;
    }

    return html`
      <div class="run-history">
        <table class="run-table">
          <thead>
            <tr>
              <th>Started</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Summary</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            ${this.jobRuns.map(
              (run) => html`
                <tr>
                  <td>${this.formatDateTime(run.startedAt)}</td>
                  <td>
                    <wa-badge variant="${this.getStatusVariant(run.status)}">${run.status}</wa-badge>
                  </td>
                  <td>${this.formatDuration(run.durationMs)}</td>
                  <td>${run.summary ?? '-'}</td>
                  <td>${run.error ? html`<span class="run-error" title="${run.error}">${run.error}</span>` : '-'}</td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
    `;
  }
}
