import { TemplateResult, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { OgsPageBase } from '../../components/ogs-page-base.ts';
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
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql';
import { graphql } from '../../graphql/index.ts';
import { BackupProvider } from '../../graphql/graphql.ts';

if (typeof globalThis.document !== 'undefined') {
  import('@awesome.me/webawesome/dist/components/dialog/dialog.js');
}

const GetBackupSettingsQuery = graphql(`
  query GetBackupSettings {
    getBackupSettings {
      provider
      frequency
      lastBackupAt
      googleDriveConnected
      dropboxConnected
      onedriveConnected
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

const TriggerBackupMutation = graphql(`
  mutation TriggerBackup {
    triggerBackup {
      success
      message
      timestamp
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
        font-size: var(--wa-font-size-s);
      }

      /* --- Section Headers --- */

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

      .settings-section {
        margin-bottom: 1.5rem;
      }

      .settings-section:last-child {
        margin-bottom: 0;
      }

      /* --- Provider Cards --- */

      .provider-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.875rem 1.25rem;
        background: var(--wa-color-surface-alt);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
        transition: border-color 0.15s ease;
      }

      .provider-card:hover {
        border-color: var(--wa-color-brand-text);
      }

      .provider-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .provider-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: var(--wa-border-radius-m);
        background: var(--wa-color-surface-raised);
        font-size: 1.125rem;
        flex-shrink: 0;
      }

      .provider-details {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .provider-name {
        font-weight: 600;
        font-size: var(--wa-font-size-m);
      }

      /* --- Provider Card Wrapper --- */

      .provider-card-wrapper {
        background: var(--wa-color-surface-alt);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
        transition: border-color 0.15s ease;
      }

      .provider-card-wrapper:hover {
        border-color: var(--wa-color-brand-text);
      }

      .provider-card-wrapper .provider-card {
        border: none;
        background: none;
        border-radius: 0;
      }

      .provider-card-wrapper .provider-card:hover {
        border-color: transparent;
      }

      .provider-setup {
        padding: 0 1.25rem 0.875rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .setup-steps {
        margin: 0.25rem 0 0.75rem;
        padding-left: 1.25rem;
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-muted);
        line-height: 1.6;
      }

      .setup-steps li {
        margin-bottom: 0.25rem;
      }

      .setup-link {
        color: var(--wa-color-text-link);
        font-weight: 500;
      }

      /* --- Form Layout --- */

      .form-grid {
        display: grid;
        gap: 0.75rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }

      .last-backup-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: var(--wa-color-surface-alt);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-m);
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-muted);
      }

      .last-backup-info wa-icon {
        color: var(--wa-color-brand-text);
        flex-shrink: 0;
      }

      .save-bar {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 0.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--wa-color-surface-border);
      }

      /* --- Action Buttons --- */

      .action-bar {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
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
        font-size: var(--wa-font-size-s);
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

  @state() provider = '';
  @state() frequency = '';
  @state() lastBackupAt: string | null = null;
  @state() connectedProviders: Record<ProviderKey, boolean> = {
    google_drive: false,
    dropbox: false,
    onedrive: false,
  };
  @state() selectedConfigProvider: ProviderKey = 'google_drive';
  @state() clientIds: Record<ProviderKey, string> = {
    google_drive: '',
    dropbox: '',
    onedrive: '',
  };
  @state() loading = true;
  @state() saving = false;
  @state() backingUp = false;
  @state() restoring = false;
  @state() showRestoreDialog = false;
  @state() successMessage = '';
  @state() errorMessage = '';

  get hasConnectedProvider(): boolean {
    return PROVIDER_KEYS.some((key) => this.connectedProviders[key]);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.loadSettings();

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

  async loadSettings() {
    try {
      const result = await execute(GetBackupSettingsQuery);
      if (result?.data?.getBackupSettings) {
        const s = result.data.getBackupSettings;
        this.provider = s.provider ?? '';
        this.frequency = s.frequency ?? '';
        this.lastBackupAt = s.lastBackupAt as string | null;
        this.connectedProviders = {
          ...this.connectedProviders,
          ...Object.fromEntries(PROVIDER_KEYS.map((key) => [key, s[PROVIDERS[key].connectedKey]])),
        };
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to load settings';
    } finally {
      this.loading = false;
    }
  }

  async handleSave() {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const result = await execute(UpdateBackupSettingsMutation, {
        input: { provider: this.provider as BackupProvider, frequency: this.frequency },
      });
      if (result?.errors?.length) {
        this.errorMessage = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.successMessage = 'Backup settings saved';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to save';
    } finally {
      this.saving = false;
    }
  }

  async handleBackup() {
    this.backingUp = true;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const result = await execute(TriggerBackupMutation);
      if (result?.data?.triggerBackup?.success) {
        this.successMessage = result.data.triggerBackup.message ?? 'Backup completed';
        this.lastBackupAt = result.data.triggerBackup.timestamp as string | null;
      } else {
        this.errorMessage = result?.data?.triggerBackup?.message ?? 'Backup failed';
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Backup failed';
    } finally {
      this.backingUp = false;
    }
  }

  async handleRestore() {
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
            html`Add your redirect URI (e.g.
              <code>${window.location.origin}/api/backup/oauth/google_drive/callback</code>).`,
            html`Copy the generated Client ID and paste it below.`,
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
            html`Under Settings, add your redirect URI (e.g.
              <code>${window.location.origin}/api/backup/oauth/dropbox/callback</code>).`,
            html`Copy the "App key" (this is your Client ID) and paste it below.`,
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
            html`Name your application.`,
            html`Set the redirect URI to "Web" with your callback URL (e.g.
              <code>${window.location.origin}/api/backup/oauth/onedrive/callback</code>).`,
            html`After registration, copy the "Application (client) ID" and paste it below.`,
          ],
        };
      default:
        return { steps: [] };
    }
  }

  connectProvider(providerKey: ProviderKey) {
    const params = new URLSearchParams({ client_id: this.clientIds[providerKey] });
    window.location.href = `/api/backup/oauth/${providerKey}/authorize?${params.toString()}`;
  }

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
          <p>Manage cloud backups and restore your data</p>
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
        <!-- Cloud Provider -->
        <div class="settings-section">
          <div class="section-header">
            <wa-icon name="cloud"></wa-icon>
            <div>
              <h3>Cloud Provider</h3>
              <p>Select and configure a cloud storage provider for backup</p>
            </div>
          </div>
          <wa-select
            label="Provider"
            .value="${this.selectedConfigProvider}"
            @change="${(e: Event) => {
              this.selectedConfigProvider = (e.target as HTMLSelectElement).value as ProviderKey;
            }}"
            style="margin-bottom: 0.75rem;"
          >
            ${PROVIDER_KEYS.map((key) => html`<wa-option value="${key}">${PROVIDERS[key].name}</wa-option>`)}
          </wa-select>
          ${this.renderSelectedProviderCard()}
        </div>

        <!-- Backup Configuration -->
        <div class="settings-section">
          <div class="section-header">
            <wa-icon name="sliders"></wa-icon>
            <div>
              <h3>Backup Configuration</h3>
              <p>Choose your backup provider and schedule</p>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-row">
              <wa-select
                label="Backup Provider"
                .value="${this.provider}"
                ?disabled="${!this.hasConnectedProvider}"
                @change="${(e: Event) => {
                  this.provider = (e.target as HTMLSelectElement).value;
                }}"
              >
                <wa-option value="">Select provider</wa-option>
                ${PROVIDER_KEYS.filter((key) => this.connectedProviders[key]).map(
                  (key) => html`<wa-option value="${key}">${PROVIDERS[key].name}</wa-option>`,
                )}
              </wa-select>

              <wa-select
                label="Backup Frequency"
                .value="${this.frequency}"
                @change="${(e: Event) => {
                  this.frequency = (e.target as HTMLSelectElement).value;
                }}"
              >
                <wa-option value="">Select frequency</wa-option>
                <wa-option value="daily">Daily</wa-option>
                <wa-option value="weekly">Weekly</wa-option>
                <wa-option value="monthly">Monthly</wa-option>
                <wa-option value="manual">Manual Only</wa-option>
              </wa-select>
            </div>

            ${this.lastBackupAt
              ? html`
                  <div class="last-backup-info">
                    <wa-icon name="clock-rotate-left"></wa-icon>
                    <span>Last backup: ${new Date(this.lastBackupAt).toLocaleString()}</span>
                  </div>
                `
              : html`
                  <div class="last-backup-info">
                    <wa-icon name="circle-info"></wa-icon>
                    <span>No backups have been created yet.</span>
                  </div>
                `}
          </div>
        </div>

        <!-- Save & Actions -->
        <div class="save-bar">
          <wa-button variant="brand" ?loading="${this.saving}" @click="${this.handleSave}">
            <wa-icon slot="start" name="floppy-disk"></wa-icon>
            Save Settings
          </wa-button>
          <wa-button
            variant="neutral"
            appearance="outlined"
            ?loading="${this.backingUp}"
            ?disabled="${!this.provider}"
            @click="${this.handleBackup}"
          >
            <wa-icon slot="start" name="cloud-arrow-up"></wa-icon>
            Backup Now
          </wa-button>
          <wa-button
            variant="danger"
            appearance="outlined"
            ?loading="${this.restoring}"
            ?disabled="${!this.provider}"
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

  private renderSelectedProviderCard() {
    const providerKey = this.selectedConfigProvider;
    const { name, icon } = PROVIDERS[providerKey];
    const connected = this.connectedProviders[providerKey];
    const clientId = this.clientIds[providerKey];
    const instructions = this.getOAuthInstructions(providerKey);

    return html`
      <div class="provider-card-wrapper">
        <div class="provider-card">
          <div class="provider-info">
            <div class="provider-icon">
              <wa-icon name="${icon}" variant="solid"></wa-icon>
            </div>
            <div class="provider-details">
              <span class="provider-name">${name}</span>
              ${connected
                ? html`<wa-badge variant="success">Connected</wa-badge>`
                : html`<wa-badge variant="neutral">Not connected</wa-badge>`}
            </div>
          </div>
          <wa-button
            size="small"
            variant="${connected ? 'neutral' : 'brand'}"
            appearance="outlined"
            ?disabled="${!connected && !clientId.trim()}"
            @click="${() => this.connectProvider(providerKey)}"
          >
            <wa-icon slot="start" name="${connected ? 'rotate' : 'link'}"></wa-icon>
            ${connected ? 'Reconnect' : 'Connect'}
          </wa-button>
        </div>
        <div class="provider-setup">
          <wa-details summary="How to get a ${name} OAuth Client ID">
            <ol class="setup-steps">
              ${instructions.steps.map((step) => html`<li>${step}</li>`)}
            </ol>
          </wa-details>
          <wa-input
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
      </div>
    `;
  }

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
              <strong>${this.provider?.replace('_', ' ')}</strong>. All changes since the last backup will be lost. This
              action cannot be undone.
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
