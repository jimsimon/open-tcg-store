import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '../../components/ogs-page.ts';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql';
import { TypedDocumentString } from '../../graphql/graphql';

const GetDataUpdateStatusQuery = new TypedDocumentString(`
  query GetDataUpdateStatus {
    getDataUpdateStatus {
      currentVersion
      latestVersion
      updateAvailable
      isUpdating
    }
  }
`) as unknown as TypedDocumentString<
  {
    getDataUpdateStatus: {
      currentVersion: string | null;
      latestVersion: string | null;
      updateAvailable: boolean;
      isUpdating: boolean;
    };
  },
  Record<string, never>
>;

const TriggerDataUpdateMutation = new TypedDocumentString(`
  mutation TriggerDataUpdate {
    triggerDataUpdate {
      success
      message
      newVersion
    }
  }
`) as unknown as TypedDocumentString<
  {
    triggerDataUpdate: {
      success: boolean;
      message: string | null;
      newVersion: string | null;
    };
  },
  Record<string, never>
>;

@customElement('ogs-settings-data-updates-page')
export class OgsSettingsDataUpdatesPage extends LitElement {
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
  @property({ type: String }) activeOrganizationId = '';

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

      /* --- Section Cards --- */

      .settings-section {
        margin-bottom: 1.5rem;
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
        font-size: var(--wa-font-size-s);
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
        font-size: var(--wa-font-size-s);
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
    `,
  ];

  @state() currentVersion: string | null = null;
  @state() latestVersion: string | null = null;
  @state() updateAvailable = false;
  @state() isUpdating = false;
  @state() loading = true;
  @state() updating = false;
  @state() checking = false;
  @state() successMessage = '';
  @state() errorMessage = '';

  private initialLoad: Promise<void> | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.initialLoad = this.loadStatus();
  }

  async loadStatus() {
    try {
      await this.fetchStatus();
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
      this.currentVersion = s.currentVersion;
      this.latestVersion = s.latestVersion;
      this.updateAvailable = s.updateAvailable;
      this.isUpdating = s.isUpdating;
    }
  }

  async handleCheckForUpdates() {
    // Wait for the initial load to finish before checking again to avoid interleaved state updates
    if (this.initialLoad) {
      await this.initialLoad;
      this.initialLoad = null;
    }

    this.checking = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      await this.fetchStatus();
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
          // Refresh status after successful update
          await this.loadStatus();
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

  private formatVersion(version: string | null): string {
    if (!version) return 'Unknown';
    // Try parsing as an ISO timestamp first (e.g. "2026-04-10T21:30:00.000Z")
    const date = new Date(version);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    // Release tag like "tcg-data-<sha256>" — show truncated hash
    const hashMatch = version.match(/^tcg-data-([0-9a-f]+)$/i);
    if (hashMatch) {
      return hashMatch[1].substring(0, 12);
    }
    // Legacy tag like "initial-db-20260405" -> "2026-04-05"
    const legacyMatch = version.match(/initial-db-(\d{4})(\d{2})(\d{2})/);
    if (legacyMatch) {
      return `${legacyMatch[1]}-${legacyMatch[2]}-${legacyMatch[3]}`;
    }
    return version;
  }

  render() {
    return html`
      <ogs-page
        activePage="settings/data-updates"
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
        activeOrganizationId="${this.activeOrganizationId}"
      >
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
      </ogs-page>
    `;
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="database" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Card Data Updates</h2>
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

      <wa-card appearance="outline">
        <div class="settings-section">
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
        </div>

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
            appearance="outlined"
            ?loading="${this.checking}"
            ?disabled="${this.updating || this.checking}"
            @click="${this.handleCheckForUpdates}"
          >
            <wa-icon slot="start" name="magnifying-glass"></wa-icon>
            ${this.checking ? 'Checking...' : 'Check for Updates'}
          </wa-button>
          ${this.isUpdating && !this.updating
            ? html`<span style="color: var(--wa-color-text-muted); font-size: var(--wa-font-size-s);">
                An update is currently in progress...
              </span>`
            : nothing}
        </div>
      </wa-card>
    `;
  }
}
