import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '../../components/ogs-page.ts';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql';
import { GetSupportedGamesQuery } from '../../lib/shared-queries';
import { TypedDocumentString } from '../../graphql/graphql';

const GetStoreSettingsQuery = new TypedDocumentString(`
  query GetStoreSettings {
    getStoreSettings {
      companyName
      ein
    }
  }
`) as unknown as TypedDocumentString<
  {
    getStoreSettings: {
      companyName: string | null;
      ein: string | null;
    };
  },
  Record<string, never>
>;

const UpdateStoreSettingsMutation = new TypedDocumentString(`
  mutation UpdateStoreSettings($input: UpdateStoreSettingsInput!) {
    updateStoreSettings(input: $input) {
      companyName
      ein
    }
  }
`) as unknown as TypedDocumentString<
  {
    updateStoreSettings: {
      companyName: string | null;
      ein: string | null;
    };
  },
  {
    input: {
      companyName?: string;
      ein?: string;
    };
  }
>;

const GetAvailableGamesQuery = new TypedDocumentString(`
  query GetAvailableGamesForSettings {
    getAvailableGames {
      categoryId
      name
      displayName
    }
  }
`) as unknown as TypedDocumentString<
  {
    getAvailableGames: Array<{
      categoryId: number;
      name: string;
      displayName: string;
    }>;
  },
  Record<string, never>
>;

const SetSupportedGamesMutation = new TypedDocumentString(`
  mutation SetSupportedGames($categoryIds: [Int!]!) {
    setSupportedGames(categoryIds: $categoryIds) {
      categoryId
      name
      displayName
    }
  }
`) as unknown as TypedDocumentString<
  {
    setSupportedGames: Array<{
      categoryId: number;
      name: string;
      displayName: string;
    }>;
  },
  {
    categoryIds: number[];
  }
>;

@customElement('ogs-settings-general-page')
export class OgsSettingsGeneralPage extends LitElement {
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

      /* --- Form Layout --- */

      .form-grid {
        display: grid;
        gap: 0.75rem;
      }

      .save-bar {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 0.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--wa-color-surface-border);
      }

      /* --- Games Picker --- */

      .games-toolbar {
        display: flex;
        align-items: center;
        gap: var(--wa-space-s);
        margin-bottom: var(--wa-space-s);
        flex-wrap: wrap;
      }

      .games-toolbar wa-input {
        flex: 1;
        min-width: 180px;
      }

      .games-toolbar .toolbar-actions {
        display: flex;
        align-items: center;
        gap: var(--wa-space-2xs);
        flex-shrink: 0;
      }

      .games-count {
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-muted);
        white-space: nowrap;
        flex-shrink: 0;
      }

      .games-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: var(--wa-space-2xs) var(--wa-space-m);
        max-height: 320px;
        overflow-y: auto;
        padding: var(--wa-space-s);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-m);
        background: var(--wa-color-surface-raised);
      }

      .games-grid wa-checkbox {
        padding: var(--wa-space-2xs) 0;
      }

      .games-empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: var(--wa-space-l);
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-s);
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

  @state() companyName = '';
  @state() ein = '';
  @state() availableGames: Array<{ categoryId: number; name: string; displayName: string }> = [];
  @state() selectedGameCategoryIds: number[] = [];
  @state() gameSearchTerm = '';
  @state() loading = true;
  @state() saving = false;
  @state() successMessage = '';
  @state() errorMessage = '';

  private cachedFilteredGames: Array<{ categoryId: number; name: string; displayName: string }> = [];
  private cachedAllFilteredSelected = false;
  private cachedAnyFilteredSelected = false;

  private get filteredGames() {
    return this.cachedFilteredGames;
  }

  private get allFilteredSelected() {
    return this.cachedAllFilteredSelected;
  }

  private get anyFilteredSelected() {
    return this.cachedAnyFilteredSelected;
  }

  protected override willUpdate(): void {
    const filtered = this.gameSearchTerm
      ? this.availableGames.filter((g) => g.displayName.toLowerCase().includes(this.gameSearchTerm.toLowerCase()))
      : this.availableGames;

    const selectedSet = new Set(this.selectedGameCategoryIds);
    const allSelected = filtered.length > 0 && filtered.every((g) => selectedSet.has(g.categoryId));
    const anySelected = filtered.some((g) => selectedSet.has(g.categoryId));

    this.cachedFilteredGames = filtered;
    this.cachedAllFilteredSelected = allSelected;
    this.cachedAnyFilteredSelected = anySelected;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const [settingsResult, availableResult, supportedResult] = await Promise.all([
        execute(GetStoreSettingsQuery),
        execute(GetAvailableGamesQuery),
        execute(GetSupportedGamesQuery),
      ]);

      if (settingsResult?.data?.getStoreSettings) {
        const s = settingsResult.data.getStoreSettings;
        this.companyName = s.companyName ?? '';
        this.ein = s.ein ?? '';
      }

      if (availableResult?.data?.getAvailableGames) {
        this.availableGames = availableResult.data.getAvailableGames;
      }

      if (supportedResult?.data?.getSupportedGames) {
        this.selectedGameCategoryIds = supportedResult.data.getSupportedGames.map((g) => g.categoryId);
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to load settings';
    } finally {
      this.loading = false;
    }
  }

  private handleGameToggle(categoryId: number, checked: boolean) {
    if (checked) {
      this.selectedGameCategoryIds = [...this.selectedGameCategoryIds, categoryId];
    } else {
      this.selectedGameCategoryIds = this.selectedGameCategoryIds.filter((id) => id !== categoryId);
    }
  }

  private handleSelectAllGames() {
    const filteredIds = this.filteredGames.map((g) => g.categoryId);
    const merged = new Set([...this.selectedGameCategoryIds, ...filteredIds]);
    this.selectedGameCategoryIds = [...merged];
  }

  private handleDeselectAllGames() {
    const filteredIds = new Set(this.filteredGames.map((g) => g.categoryId));
    this.selectedGameCategoryIds = this.selectedGameCategoryIds.filter((id) => !filteredIds.has(id));
  }

  async handleSave() {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const [settingsResult, gamesResult] = await Promise.all([
        execute(UpdateStoreSettingsMutation, {
          input: {
            companyName: this.companyName,
            ein: this.ein,
          },
        }),
        execute(SetSupportedGamesMutation, {
          categoryIds: this.selectedGameCategoryIds,
        }),
      ]);

      const errors = [...(settingsResult?.errors ?? []), ...(gamesResult?.errors ?? [])];

      if (errors.length) {
        this.errorMessage = errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.successMessage = 'Settings saved successfully';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to save settings';
    } finally {
      this.saving = false;
    }
  }

  render() {
    return html`
      <ogs-page
        activePage="settings/general"
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
              <span>Loading settings...</span>
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
          <wa-icon name="gear" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>General Settings</h2>
          <p>Configure your company information and supported games</p>
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
        <!-- Company Information -->
        <div class="settings-section">
          <div class="section-header">
            <wa-icon name="store"></wa-icon>
            <div>
              <h3>Company Information</h3>
              <p>Basic details about your company</p>
            </div>
          </div>
          <div class="form-grid">
            <wa-input
              label="Company Name"
              .value="${this.companyName}"
              @input="${(e: Event) => {
                this.companyName = (e.target as HTMLInputElement).value;
              }}"
            >
              <wa-icon slot="prefix" name="store"></wa-icon>
            </wa-input>

            <wa-input
              label="EIN (Employer Identification Number)"
              .value="${this.ein}"
              @input="${(e: Event) => {
                this.ein = (e.target as HTMLInputElement).value;
              }}"
            >
              <wa-icon slot="prefix" name="id-card"></wa-icon>
            </wa-input>
          </div>
        </div>

        <wa-divider></wa-divider>

        <!-- Supported Games -->
        <div class="settings-section">
          <div class="section-header">
            <wa-icon name="cards-blank"></wa-icon>
            <div>
              <h3>Supported Games</h3>
              <p>Select the trading card games your store buys and sells</p>
            </div>
          </div>
          ${this.availableGames.length === 0
            ? html`<p style="color: var(--wa-color-text-muted); font-size: var(--wa-font-size-s);">
                No game categories available. Please populate your TCG data catalog first.
              </p>`
            : html`
                <div class="games-toolbar">
                  <wa-input
                    placeholder="Search games..."
                    .value="${this.gameSearchTerm}"
                    @input="${(e: Event) => {
                      this.gameSearchTerm = (e.target as HTMLInputElement).value;
                    }}"
                    clearable
                  >
                    <wa-icon slot="prefix" name="magnifying-glass"></wa-icon>
                  </wa-input>
                  <div class="toolbar-actions">
                    <wa-button size="small" variant="default" @click="${this.handleSelectAllGames}" ?disabled="${this.allFilteredSelected}">
                      Select all
                    </wa-button>
                    <wa-button size="small" variant="default" @click="${this.handleDeselectAllGames}" ?disabled="${!this.anyFilteredSelected}">
                      Deselect all
                    </wa-button>
                  </div>
                  <span class="games-count">${this.selectedGameCategoryIds.length} of ${this.availableGames.length} selected</span>
                </div>
                <div class="games-grid">
                  ${this.filteredGames.length === 0
                    ? html`<div class="games-empty">No games match your search</div>`
                    : this.filteredGames.map(
                        (game) => html`
                          <wa-checkbox
                            ?checked="${this.selectedGameCategoryIds.includes(game.categoryId)}"
                            @change="${(e: Event) => {
                              this.handleGameToggle(game.categoryId, (e.target as HTMLInputElement).checked);
                            }}"
                          >
                            ${game.displayName}
                          </wa-checkbox>
                        `,
                      )}
                </div>
              `}
        </div>

        <!-- Save -->
        <div class="save-bar">
          <wa-button variant="brand" ?loading="${this.saving}" @click="${this.handleSave}">
            <wa-icon slot="start" name="floppy-disk"></wa-icon>
            Save Settings
          </wa-button>
        </div>
      </wa-card>
    `;
  }
}
