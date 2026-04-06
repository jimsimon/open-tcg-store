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
import '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
import '@awesome.me/webawesome/dist/components/tab/tab.js';
import '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql';
import { TypedDocumentString } from '../../graphql/graphql';

// ---------------------------------------------------------------------------
// GraphQL Operations
// ---------------------------------------------------------------------------

const GetSupportedGamesQuery = new TypedDocumentString(`
  query GetSupportedGamesForBuyRates {
    getSupportedGames {
      categoryId
      name
      displayName
    }
  }
`) as unknown as TypedDocumentString<
  {
    getSupportedGames: Array<{
      categoryId: number;
      name: string;
      displayName: string;
    }>;
  },
  Record<string, never>
>;

const GetBuyRatesQuery = new TypedDocumentString(`
  query GetBuyRates($categoryId: Int!) {
    getBuyRates(categoryId: $categoryId) {
      id
      description
      rate
      sortOrder
    }
  }
`) as unknown as TypedDocumentString<
  {
    getBuyRates: Array<{
      id: number;
      description: string;
      rate: number;
      sortOrder: number;
    }>;
  },
  { categoryId: number }
>;

const SaveBuyRatesMutation = new TypedDocumentString(`
  mutation SaveBuyRates($input: SaveBuyRatesInput!) {
    saveBuyRates(input: $input) {
      id
      description
      rate
      sortOrder
    }
  }
`) as unknown as TypedDocumentString<
  {
    saveBuyRates: Array<{
      id: number;
      description: string;
      rate: number;
      sortOrder: number;
    }>;
  },
  {
    input: {
      categoryId: number;
      entries: Array<{
        description: string;
        rate: number;
        sortOrder: number;
      }>;
    };
  }
>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SupportedGame {
  categoryId: number;
  name: string;
  displayName: string;
}

interface BuyRateRow {
  description: string;
  rate: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@customElement('ogs-settings-buyrates-page')
export class OgsSettingsBuyRatesPage extends LitElement {
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';
  @property({ type: Boolean }) canManageInventory = false;
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

      /* --- Loading --- */

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

      /* --- Rate Table --- */

      .rate-table {
        width: 100%;
        border-collapse: collapse;
      }

      .rate-table th {
        text-align: left;
        padding: 0.5rem 0.75rem;
        font-size: var(--wa-font-size-s);
        font-weight: 600;
        color: var(--wa-color-text-muted);
        border-bottom: 2px solid var(--wa-color-surface-border);
      }

      .rate-table td {
        padding: 0.375rem 0.75rem;
        vertical-align: middle;
      }

      .rate-table tr:not(:last-child) td {
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .rate-table wa-input {
        --wa-input-height-m: 2.25rem;
      }

      .rate-actions {
        display: flex;
        gap: 0.25rem;
        justify-content: center;
      }

      /* --- Tab Content --- */

      .tab-content {
        padding: 1rem 0;
      }

      .tab-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--wa-color-surface-border);
      }
    `,
  ];

  @state() supportedGames: SupportedGame[] = [];
  @state() buyRatesByGame: Map<number, BuyRateRow[]> = new Map();
  @state() activeTab = '';
  @state() loading = true;
  @state() savingGame: number | null = null;
  @state() successMessage = '';
  @state() errorMessage = '';

  connectedCallback(): void {
    super.connectedCallback();
    this.loadData();
  }

  private async loadData() {
    try {
      const result = await execute(GetSupportedGamesQuery);
      if (result?.data?.getSupportedGames) {
        this.supportedGames = result.data.getSupportedGames;

        // Load buy rates for each game in parallel
        const ratePromises = this.supportedGames.map(async (game) => {
          const ratesResult = await execute(GetBuyRatesQuery, { categoryId: game.categoryId });
          const entries = ratesResult?.data?.getBuyRates ?? [];
          return {
            categoryId: game.categoryId,
            rows: entries.map((e) => ({ description: e.description, rate: e.rate })),
          };
        });

        const results = await Promise.all(ratePromises);
        const map = new Map<number, BuyRateRow[]>();
        for (const r of results) {
          map.set(r.categoryId, r.rows);
        }
        this.buyRatesByGame = map;

        // Default to first tab
        if (this.supportedGames.length > 0) {
          this.activeTab = `game-${this.supportedGames[0].categoryId}`;
        }
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to load data';
    } finally {
      this.loading = false;
    }
  }

  private getRows(categoryId: number): BuyRateRow[] {
    return this.buyRatesByGame.get(categoryId) ?? [];
  }

  private setRows(categoryId: number, rows: BuyRateRow[]) {
    const newMap = new Map(this.buyRatesByGame);
    newMap.set(categoryId, rows);
    this.buyRatesByGame = newMap;
  }

  private handleAddRow(categoryId: number) {
    const rows = [...this.getRows(categoryId), { description: '', rate: 0 }];
    this.setRows(categoryId, rows);
  }

  private handleRemoveRow(categoryId: number, index: number) {
    const rows = this.getRows(categoryId).filter((_, i) => i !== index);
    this.setRows(categoryId, rows);
  }

  private handleRowDescriptionChange(categoryId: number, index: number, value: string) {
    const rows = [...this.getRows(categoryId)];
    rows[index] = { ...rows[index], description: value };
    this.setRows(categoryId, rows);
  }

  private handleRowRateChange(categoryId: number, index: number, value: string) {
    const rows = [...this.getRows(categoryId)];
    rows[index] = { ...rows[index], rate: parseFloat(value) || 0 };
    this.setRows(categoryId, rows);
  }

  private async handleSaveGame(categoryId: number) {
    this.savingGame = categoryId;
    this.successMessage = '';
    this.errorMessage = '';

    const rows = this.getRows(categoryId);
    // Filter out empty rows
    const validRows = rows.filter((r) => r.description.trim() !== '');

    try {
      const result = await execute(SaveBuyRatesMutation, {
        input: {
          categoryId,
          entries: validRows.map((r, i) => ({
            description: r.description.trim(),
            rate: r.rate,
            sortOrder: i,
          })),
        },
      });

      if (result?.errors?.length) {
        this.errorMessage = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else if (result?.data?.saveBuyRates) {
        // Update local state with saved data
        this.setRows(
          categoryId,
          result.data.saveBuyRates.map((e) => ({ description: e.description, rate: e.rate })),
        );
        this.successMessage = 'Buy rates saved successfully';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to save buy rates';
    } finally {
      this.savingGame = null;
    }
  }

  render() {
    return html`
      <ogs-page
        activePage="settings/buyrates"
        ?showUserMenu="${true}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
        ?canManageInventory="${this.canManageInventory}"
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
              <span>Loading buy rates...</span>
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
          <wa-icon name="hand-holding-dollar" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Buy Rates</h2>
          <p>Configure buy rate tables for each game your store supports</p>
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
      ${this.supportedGames.length === 0
        ? html`
            <wa-callout variant="neutral">
              <wa-icon slot="icon" name="circle-info"></wa-icon>
              No supported games configured. Go to
              <a href="/settings/general">General Settings</a> to select which games your store supports.
            </wa-callout>
          `
        : this.renderGameTabs()}
    `;
  }

  private renderGameTabs() {
    return html`
      <wa-card appearance="outline">
        <wa-tab-group
          @wa-tab-show="${(e: CustomEvent) => {
            this.activeTab = (e.target as HTMLElement).querySelector('wa-tab[active]')?.getAttribute('panel') ?? '';
          }}"
        >
          ${this.supportedGames.map(
            (game) => html` <wa-tab slot="nav" panel="game-${game.categoryId}">${game.displayName}</wa-tab> `,
          )}
          ${this.supportedGames.map(
            (game) => html`
              <wa-tab-panel name="game-${game.categoryId}"> ${this.renderGamePanel(game)} </wa-tab-panel>
            `,
          )}
        </wa-tab-group>
      </wa-card>
    `;
  }

  private renderGamePanel(game: SupportedGame) {
    const rows = this.getRows(game.categoryId);
    const isSaving = this.savingGame === game.categoryId;

    return html`
      <div class="tab-content">
        ${rows.length === 0
          ? html`
              <p style="color: var(--wa-color-text-muted); font-size: var(--wa-font-size-s); margin: 0 0 1rem 0;">
                No buy rate entries yet. Click "Add Row" to start building your buy rate table.
              </p>
            `
          : html`
              <table class="rate-table">
                <thead>
                  <tr>
                    <th style="width: 60%;">Description</th>
                    <th style="width: 30%;">Rate</th>
                    <th style="width: 10%;"></th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.map(
                    (row, index) => html`
                      <tr>
                        <td>
                          <wa-input
                            size="small"
                            placeholder="e.g. Commons & Uncommons"
                            .value="${row.description}"
                            @input="${(e: Event) => {
                              this.handleRowDescriptionChange(
                                game.categoryId,
                                index,
                                (e.target as HTMLInputElement).value,
                              );
                            }}"
                          ></wa-input>
                        </td>
                        <td>
                          <wa-input
                            size="small"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            .value="${String(row.rate)}"
                            @input="${(e: Event) => {
                              this.handleRowRateChange(game.categoryId, index, (e.target as HTMLInputElement).value);
                            }}"
                          ></wa-input>
                        </td>
                        <td>
                          <div class="rate-actions">
                            <wa-button
                              variant="text"
                              size="small"
                              @click="${() => this.handleRemoveRow(game.categoryId, index)}"
                            >
                              <wa-icon name="trash"></wa-icon>
                            </wa-button>
                          </div>
                        </td>
                      </tr>
                    `,
                  )}
                </tbody>
              </table>
            `}

        <div class="tab-actions">
          <wa-button variant="neutral" size="small" @click="${() => this.handleAddRow(game.categoryId)}">
            <wa-icon slot="start" name="plus"></wa-icon>
            Add Row
          </wa-button>
          <wa-button
            variant="brand"
            size="small"
            ?loading="${isSaving}"
            @click="${() => this.handleSaveGame(game.categoryId)}"
          >
            <wa-icon slot="start" name="floppy-disk"></wa-icon>
            Save Buy Rates
          </wa-button>
        </div>
      </div>
    `;
  }
}
