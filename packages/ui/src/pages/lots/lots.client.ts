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
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql.ts';
import { TypedDocumentString } from '../../graphql/graphql.ts';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';

// ---------------------------------------------------------------------------
// GraphQL Operations
// ---------------------------------------------------------------------------

const GetLotsQuery = new TypedDocumentString(`
  query GetLots($filters: LotFilters, $pagination: PaginationInput) {
    getLots(filters: $filters, pagination: $pagination) {
      lots {
        id
        name
        description
        amountPaid
        acquisitionDate
        totalMarketValue
        totalCost
        projectedProfitLoss
        projectedProfitMargin
        createdAt
        items { id }
      }
      totalCount
      page
      pageSize
      totalPages
    }
  }
`) as unknown as TypedDocumentString<
  {
    getLots: {
      lots: Array<{
        id: number;
        name: string;
        description: string | null;
        amountPaid: number;
        acquisitionDate: string;
        totalMarketValue: number;
        totalCost: number;
        projectedProfitLoss: number;
        projectedProfitMargin: number;
        createdAt: string;
        items: Array<{ id: number }>;
      }>;
      totalCount: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  },
  { filters?: { searchTerm?: string } | null; pagination?: { page?: number; pageSize?: number } | null }
>;

const DeleteLotMutation = new TypedDocumentString(`
  mutation DeleteLot($id: Int!) {
    deleteLot(id: $id)
  }
`) as unknown as TypedDocumentString<{ deleteLot: boolean }, { id: number }>;

const GetLotStatsQuery = new TypedDocumentString(`
  query GetLotStats {
    getLotStats {
      totalLots
      totalInvested
      totalMarketValue
      totalProfitLoss
    }
  }
`) as unknown as TypedDocumentString<
  {
    getLotStats: {
      totalLots: number;
      totalInvested: number;
      totalMarketValue: number;
      totalProfitLoss: number;
    };
  },
  Record<string, never>
>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LotSummary {
  id: number;
  name: string;
  description: string | null;
  amountPaid: number;
  acquisitionDate: string;
  totalMarketValue: number;
  totalCost: number;
  projectedProfitLoss: number;
  projectedProfitMargin: number;
  createdAt: string;
  itemCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as unknown as T;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@customElement('ogs-lots-page')
export class OgsLotsPage extends LitElement {
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';
  @property({ type: Boolean }) canManageInventory = false;
  @property({ type: Boolean }) canManageLots = false;
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

      /* --- Summary Stats --- */

      .stats-bar {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1.25rem;
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
        min-width: 160px;
        flex: 1;
      }

      .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: var(--wa-border-radius-m);
        background: var(--wa-color-brand-container);
        color: var(--wa-color-brand-text);
        font-size: 1.125rem;
        flex-shrink: 0;
      }

      .stat-icon.success {
        background: var(--wa-color-success-container);
        color: var(--wa-color-success-text);
      }

      .stat-icon.warning {
        background: var(--wa-color-warning-container);
        color: var(--wa-color-warning-text);
      }

      .stat-icon.neutral {
        background: var(--wa-color-neutral-container);
        color: var(--wa-color-text-muted);
      }

      .stat-icon.danger {
        background: var(--wa-color-danger-container);
        color: var(--wa-color-danger-text);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .stat-label {
        font-size: var(--wa-font-size-xs);
        color: var(--wa-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: 600;
      }

      .stat-value {
        font-size: var(--wa-font-size-xl);
        font-weight: 700;
        line-height: 1;
      }

      /* --- Action Bar --- */

      .action-bar {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        align-items: center;
      }

      /* --- Filter Bar --- */

      .filter-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1rem;
        align-items: flex-end;
        padding: 1rem;
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
      }

      .filter-bar wa-input {
        flex: 1 1 0%;
        min-width: 200px;
      }

      /* --- Table --- */

      .table-container {
        overflow-x: auto;
      }

      .wa-table {
        width: 100%;
        border-collapse: collapse;
      }

      .wa-table th,
      .wa-table td {
        vertical-align: middle;
      }

      .wa-table th {
        font-size: var(--wa-font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--wa-color-text-muted);
        font-weight: 600;
        padding: 0.875rem 1rem;
        text-align: left;
        border-bottom: 2px solid var(--wa-color-surface-border);
        white-space: nowrap;
      }

      .wa-table td {
        padding: 0.875rem 1rem;
        font-size: var(--wa-font-size-s);
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .wa-table tr:last-child td {
        border-bottom: none;
      }

      .wa-table tbody tr {
        transition: background 0.15s ease;
      }

      .wa-table tbody tr:hover td {
        background: var(--wa-color-surface-sunken);
      }

      .clickable-row {
        cursor: pointer;
      }

      .price-cell {
        text-align: right;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }

      .profit-positive {
        color: var(--wa-color-success-text);
      }

      .profit-negative {
        color: var(--wa-color-danger-text);
      }

      .actions-cell {
        white-space: nowrap;
      }

      /* --- Pagination --- */

      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .pagination-info {
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-s);
      }

      .pagination-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .pagination-buttons {
        display: flex;
        gap: 0.25rem;
        align-items: center;
      }

      .pagination-buttons wa-button[data-current] {
        font-weight: bold;
        text-decoration: underline;
      }

      /* --- Loading & Empty States --- */

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
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 4rem 2rem;
        color: var(--wa-color-text-muted);
        background: var(--wa-color-surface-raised);
        border: 2px dashed var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
        margin: 0.5rem 0;
      }

      .empty-state > wa-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .empty-state h3 {
        margin: 0 0 0.5rem 0;
        font-size: var(--wa-font-size-xl);
        color: var(--wa-color-text-normal);
      }

      .empty-state p {
        margin: 0 0 1.5rem 0;
        max-width: 400px;
        margin-inline: auto;
      }

      /* --- Delete Dialog --- */

      .delete-warning {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        padding: 1rem;
        background: var(--wa-color-danger-container);
        border-radius: var(--wa-border-radius-l);
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

  @state() private lots: LotSummary[] = [];
  @state() private loading = true;
  @state() private error = '';
  @state() private searchTerm = '';
  @state() private currentPage = 1;
  @state() private pageSize = 25;
  @state() private totalPages = 1;
  @state() private totalCount = 0;
  @state() private deleteConfirmLotId: number | null = null;
  @state() private deleting = false;
  @state() private stats = { totalLots: 0, totalInvested: 0, totalMarketValue: 0, totalProfitLoss: 0 };

  private debouncedSearch = debounce(() => {
    this.currentPage = 1;
    this.fetchLots();
  }, 300);

  connectedCallback(): void {
    super.connectedCallback();
    this.loadFiltersFromUrl();
    this.fetchLots();
    this.fetchStats();
  }

  private loadFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    this.searchTerm = params.get('search') ?? '';
    const page = params.get('page');
    if (page) this.currentPage = Number.parseInt(page, 10) || 1;
  }

  private updateQueryParams() {
    const url = new URL(window.location.href);
    const setOrDelete = (key: string, value: string) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    };
    setOrDelete('search', this.searchTerm);
    if (this.currentPage > 1) {
      url.searchParams.set('page', String(this.currentPage));
    } else {
      url.searchParams.delete('page');
    }
    window.history.replaceState(null, '', url.toString());
  }

  private async fetchLots() {
    this.loading = true;
    this.error = '';
    this.updateQueryParams();
    try {
      const result = await execute(GetLotsQuery, {
        filters: this.searchTerm ? { searchTerm: this.searchTerm } : null,
        pagination: { page: this.currentPage, pageSize: this.pageSize },
      });
      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else if (result?.data?.getLots) {
        const data = result.data.getLots;
        this.lots = data.lots.map((l) => ({ ...l, itemCount: l.items.length }));
        this.totalPages = data.totalPages;
        this.totalCount = data.totalCount;
        this.currentPage = data.page;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load lots';
    } finally {
      this.loading = false;
    }
  }

  private handleSearchInput(event: Event) {
    const input = event.target as WaInput;
    this.searchTerm = input.value as string;
    this.debouncedSearch();
  }

  private async handleDelete() {
    if (!this.deleteConfirmLotId) return;
    this.deleting = true;
    try {
      await execute(DeleteLotMutation, { id: this.deleteConfirmLotId });
      this.fetchLots();
      this.fetchStats();
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete lot';
    } finally {
      this.deleteConfirmLotId = null;
      this.deleting = false;
    }
  }

  private goToPage(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.currentPage = newPage;
    this.fetchLots();
  }

  // --- Stats ---

  private async fetchStats() {
    try {
      const result = await execute(GetLotStatsQuery);
      if (result?.data?.getLotStats) {
        this.stats = result.data.getLotStats;
      }
    } catch {
      // Stats are non-critical — silently ignore errors
    }
  }

  // --- Render ---

  render() {
    return html`
      <ogs-page
        activePage="lots"
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
        @store-changed="${() => {
          this.fetchLots();
          this.fetchStats();
        }}"
      >
        ${this.renderPageHeader()} ${this.renderStatsBar()} ${this.renderFilterBar()} ${this.renderActionBar()}
        ${when(
          this.error,
          () => html`
            <wa-callout variant="danger">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              ${this.error}
            </wa-callout>
          `,
        )}
        ${when(
          this.loading,
          () => html`
            <div class="loading-container">
              <wa-spinner style="font-size: 2rem;"></wa-spinner>
              <span>Loading lots...</span>
            </div>
          `,
          () => this.renderContent(),
        )}
        ${this.renderDeleteDialog()}
      </ogs-page>
    `;
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="layer-group" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Lots</h2>
          <p>Manage card lots and batch inventory purchases</p>
        </div>
      </div>
    `;
  }

  private renderStatsBar() {
    return html`
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-icon neutral">
            <wa-icon name="layer-group"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total</span>
            <span class="stat-value">${this.stats.totalLots}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <wa-icon name="money-bill"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Invested</span>
            <span class="stat-value">${formatCurrency(this.stats.totalInvested)}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success">
            <wa-icon name="chart-line"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Market Value</span>
            <span class="stat-value">${formatCurrency(this.stats.totalMarketValue)}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon ${this.stats.totalProfitLoss >= 0 ? 'success' : 'danger'}">
            <wa-icon name="${this.stats.totalProfitLoss >= 0 ? 'arrow-trend-up' : 'arrow-trend-down'}"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Profit/Loss</span>
            <span class="stat-value">${formatCurrency(this.stats.totalProfitLoss)}</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderFilterBar() {
    return html`
      <div class="filter-bar">
        <wa-input placeholder="Search lots..." .value="${this.searchTerm}" @input="${this.handleSearchInput}" clearable>
          <wa-icon slot="prefix" name="magnifying-glass"></wa-icon>
        </wa-input>
      </div>
    `;
  }

  private renderActionBar() {
    return html`
      <div class="action-bar">
        <wa-button variant="brand" href="/lots/new">
          <wa-icon slot="start" name="plus"></wa-icon>
          Add Lot
        </wa-button>
      </div>
    `;
  }

  private renderContent() {
    if (this.lots.length === 0) {
      return html`
        <div class="empty-state">
          <wa-icon name="layer-group"></wa-icon>
          <h3>No Lots Found</h3>
          <p>Create your first lot to start tracking batch inventory purchases and their profitability.</p>
          <wa-button variant="brand" href="/lots/new">
            <wa-icon slot="start" name="plus"></wa-icon>
            Add Lot
          </wa-button>
        </div>
      `;
    }

    return html`
      <wa-card appearance="outline">
        <div class="table-container">
          <table class="wa-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Items</th>
                <th class="price-cell">Amount Paid</th>
                <th class="price-cell">Market Value</th>
                <th class="price-cell">Profit/Loss</th>
                <th class="price-cell">Margin</th>
                <th>Date</th>
                <th style="width: 100px;"></th>
              </tr>
            </thead>
            <tbody>
              ${this.lots.map(
                (lot) => html`
                  <tr
                    class="clickable-row"
                    @click="${() => {
                      window.location.href = `/lots/${lot.id}`;
                    }}"
                  >
                    <td><strong>${lot.name}</strong></td>
                    <td>${lot.itemCount}</td>
                    <td class="price-cell">${formatCurrency(lot.amountPaid)}</td>
                    <td class="price-cell">${formatCurrency(lot.totalMarketValue)}</td>
                    <td class="price-cell ${lot.projectedProfitLoss >= 0 ? 'profit-positive' : 'profit-negative'}">
                      ${formatCurrency(lot.projectedProfitLoss)}
                    </td>
                    <td class="price-cell ${lot.projectedProfitMargin >= 0 ? 'profit-positive' : 'profit-negative'}">
                      ${lot.projectedProfitMargin.toFixed(1)}%
                    </td>
                    <td>${lot.acquisitionDate}</td>
                    <td>
                      <div class="actions-cell" @click="${(e: Event) => e.stopPropagation()}">
                        <wa-button variant="text" size="small" href="/lots/${lot.id}">
                          <wa-icon name="pen-to-square"></wa-icon>
                        </wa-button>
                        <wa-button
                          variant="text"
                          size="small"
                          @click="${() => {
                            this.deleteConfirmLotId = lot.id;
                          }}"
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
        </div>
      </wa-card>
      ${this.renderPagination()}
    `;
  }

  private renderPagination() {
    if (this.totalPages <= 0) return nothing;

    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalCount);

    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return html`
      <div class="pagination">
        <span class="pagination-info">Showing ${start}-${end} of ${this.totalCount} lots</span>
        <div class="pagination-controls">
          ${when(
            this.totalPages > 1,
            () => html`
              <div class="pagination-buttons">
                <wa-button
                  size="small"
                  variant="neutral"
                  ?disabled="${this.currentPage === 1}"
                  @click="${() => this.goToPage(this.currentPage - 1)}"
                >
                  <wa-icon name="chevron-left"></wa-icon>
                </wa-button>
                ${pages.map(
                  (p) => html`
                    <wa-button
                      size="small"
                      variant="${p === this.currentPage ? 'brand' : 'neutral'}"
                      ?data-current="${p === this.currentPage}"
                      @click="${() => this.goToPage(p)}"
                    >
                      ${p}
                    </wa-button>
                  `,
                )}
                <wa-button
                  size="small"
                  variant="neutral"
                  ?disabled="${this.currentPage === this.totalPages}"
                  @click="${() => this.goToPage(this.currentPage + 1)}"
                >
                  <wa-icon name="chevron-right"></wa-icon>
                </wa-button>
              </div>
            `,
          )}
        </div>
      </div>
    `;
  }

  private renderDeleteDialog() {
    const lot = this.deleteConfirmLotId != null ? this.lots.find((l) => l.id === this.deleteConfirmLotId) : null;

    return html`
      <wa-dialog
        ?open="${this.deleteConfirmLotId != null}"
        label="Delete Lot"
        @wa-after-hide="${() => {
          this.deleteConfirmLotId = null;
        }}"
      >
        <div class="delete-warning">
          <wa-icon name="triangle-exclamation"></wa-icon>
          <div class="delete-warning-text">
            <p>Delete lot${lot ? html` <strong>${lot.name}</strong>` : nothing}?</p>
            <p>This will also remove the associated inventory stock entries. This action cannot be undone.</p>
          </div>
        </div>
        <wa-button
          autofocus
          slot="footer"
          variant="neutral"
          @click="${() => {
            this.deleteConfirmLotId = null;
          }}"
        >
          Cancel
        </wa-button>
        <wa-button slot="footer" variant="danger" ?loading="${this.deleting}" @click="${this.handleDelete}">
          <wa-icon slot="start" name="trash"></wa-icon>
          Delete
        </wa-button>
      </wa-dialog>
    `;
  }
}
