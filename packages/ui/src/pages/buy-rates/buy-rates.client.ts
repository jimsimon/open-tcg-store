import { LitElement, css, html, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '../../components/ogs-page.ts';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
import '@awesome.me/webawesome/dist/components/tab/tab.js';
import '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql';
import { graphql } from '../../graphql/index.ts';
import { formatCurrency } from '../../lib/currency';

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const GetPublicBuyRatesQuery = graphql(`
  query GetPublicBuyRates {
    getPublicBuyRates {
      games {
        categoryId
        gameName
        gameDisplayName
        entries {
          id
          description
          fixedRateCents
          percentageRate
          type
          sortOrder
        }
      }
    }
  }
`);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BuyRateGame {
  categoryId: number;
  gameName: string;
  gameDisplayName: string;
  entries: Array<{
    id: number;
    description: string;
    fixedRateCents: number | null;
    percentageRate: number | null;
    type: string;
    sortOrder: number;
  }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@customElement('ogs-buy-rates-page')
export class OgsBuyRatesPage extends LitElement {
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
  @property({ type: Boolean }) showStoreSelector = false;

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

      /* --- Buy Rate Table --- */

      .rate-table {
        width: 100%;
        border-collapse: collapse;
      }

      .rate-table th {
        text-align: left;
        padding: 0.75rem 1rem;
        font-size: var(--wa-font-size-s);
        font-weight: 600;
        color: var(--wa-color-text-muted);
        border-bottom: 2px solid var(--wa-color-surface-border);
      }

      .rate-table th:last-child {
        text-align: right;
      }

      .rate-table td {
        padding: 0.625rem 1rem;
        font-size: var(--wa-font-size-m);
      }

      .rate-table td:last-child {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      .rate-table tr:not(:last-child) td {
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      /* --- Empty State --- */

      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
      }

      .empty-state wa-icon {
        font-size: 3rem;
        color: var(--wa-color-text-muted);
        margin-bottom: 1rem;
      }

      .empty-state h3 {
        margin: 0 0 0.5rem 0;
        font-size: var(--wa-font-size-l);
        color: var(--wa-color-text-default);
      }

      .empty-state p {
        margin: 0;
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-s);
      }
    `,
  ];

  @state() games: BuyRateGame[] = [];
  @state() loading = true;
  @state() errorMessage = '';

  connectedCallback(): void {
    super.connectedCallback();
    this.fetchBuyRates();
  }

  private async fetchBuyRates() {
    this.loading = true;
    this.errorMessage = '';

    try {
      const result = await execute(GetPublicBuyRatesQuery);

      if (result?.data?.getPublicBuyRates) {
        this.games = result.data.getPublicBuyRates.games as BuyRateGame[];
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to load buy rates';
    } finally {
      this.loading = false;
    }
  }

  private formatRate(entry: { fixedRateCents: number | null; percentageRate: number | null; type: string }): string {
    if (entry.type === 'percentage') {
      const pct = (entry.percentageRate ?? 0) * 100;
      return `${pct.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
    }
    return formatCurrency(entry.fixedRateCents);
  }

  render() {
    return html`
      <ogs-page
        activePage="buy-rates"
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
        ?showStoreSelector="${this.showStoreSelector}"
        @store-changed="${() => this.fetchBuyRates()}"
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
          <p>What we pay for your cards</p>
        </div>
      </div>
    `;
  }

  private renderContent() {
    if (this.errorMessage) {
      return html`
        <wa-callout variant="danger">
          <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
          ${this.errorMessage}
        </wa-callout>
      `;
    }

    if (this.games.length === 0) {
      return html`
        <wa-card appearance="outline">
          <div class="empty-state">
            <wa-icon name="hand-holding-dollar"></wa-icon>
            <h3>No Buy Rates Available</h3>
            <p>Sorry! We're not currently buying any cards. Check back soon!</p>
          </div>
        </wa-card>
      `;
    }

    // Single game — no need for tabs
    if (this.games.length === 1) {
      return html` <wa-card appearance="outline"> ${this.renderRateTable(this.games[0])} </wa-card> `;
    }

    // Multiple games — show tabs
    return html`
      <wa-card appearance="outline">
        <wa-tab-group>
          ${this.games.map(
            (game) => html` <wa-tab slot="nav" panel="game-${game.categoryId}">${game.gameDisplayName}</wa-tab> `,
          )}
          ${this.games.map(
            (game) => html`
              <wa-tab-panel name="game-${game.categoryId}"> ${this.renderRateTable(game)} </wa-tab-panel>
            `,
          )}
        </wa-tab-group>
      </wa-card>
    `;
  }

  private renderRateTable(game: BuyRateGame) {
    if (game.entries.length === 0) {
      return html`
        <div class="empty-state">
          <p>No buy rates have been set for ${game.gameDisplayName} yet.</p>
        </div>
      `;
    }

    return html`
      <table class="rate-table">
        <thead>
          <tr>
            <th scope="col">Card Type</th>
            <th scope="col">Cost/Unit</th>
          </tr>
        </thead>
        <tbody>
          ${game.entries.map(
            (entry) => html`
              <tr>
                <td>${entry.description}</td>
                <td>${this.formatRate(entry)}</td>
              </tr>
            `,
          )}
        </tbody>
      </table>
    `;
  }
}
