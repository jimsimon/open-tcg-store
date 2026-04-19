import { css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/input/input.js';

import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { OgsPageBase } from '../../components/ogs-page-base.ts';
import { execute } from '../../lib/graphql.ts';
import { graphql } from '../../graphql/index.ts';
import type WaSelect from '@awesome.me/webawesome/dist/components/select/select.js';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
import { debounce } from '../../lib/debounce';

// --- Types ---

interface TransactionLogEntry {
  id: number;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}

// --- GraphQL ---

const GetTransactionLogsQuery = graphql(`
  query GetTransactionLogs($pagination: PaginationInput, $filters: TransactionLogFilters) {
    getTransactionLogs(pagination: $pagination, filters: $filters) {
      items {
        id
        action
        resourceType
        resourceId
        details
        userName
        userEmail
        createdAt
      }
      totalCount
      page
      pageSize
      totalPages
    }
  }
`);

// --- Helpers ---

const ACTION_LABELS: Record<string, string> = {
  'order.created': 'Order Created',
  'order.cancelled': 'Order Cancelled',
  'order.status_updated': 'Order Status Updated',
  'inventory.item_created': 'Inventory Item Created',
  'inventory.item_updated': 'Inventory Item Updated',
  'inventory.item_deleted': 'Inventory Item Deleted',
  'inventory.stock_added': 'Stock Added',
  'inventory.stock_updated': 'Stock Updated',
  'inventory.stock_deleted': 'Stock Deleted',
  'inventory.stock_bulk_updated': 'Stock Bulk Updated',
  'inventory.stock_bulk_deleted': 'Stock Bulk Deleted',
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function formatDetails(detailsJson: string): string {
  try {
    const obj = JSON.parse(detailsJson);
    return Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  } catch {
    return detailsJson;
  }
}

@customElement('ogs-transaction-log-page')
export class OgsTransactionLogPage extends OgsPageBase {
  @property({ type: Boolean }) showStoreSelector = false;

  @state() logs: TransactionLogEntry[] = [];
  @state() loading = true;
  @state() error = '';
  @state() page = 1;
  @state() pageSize = 25;
  @state() totalCount = 0;
  @state() totalPages = 0;

  // Filter state
  @state() private monthFilter = '';
  @state() private yearFilter = '';
  @state() private searchTerm = '';
  @state() private resourceTypeFilter = '';

  private debouncedSearch = debounce(() => {
    this.page = 1;
    this.fetchLogs();
  }, 300);

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

      .filter-bar wa-select {
        flex: 0 0 auto;
        min-width: 140px;
        width: auto;
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

      .details-cell {
        max-width: 400px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .resource-type-badge {
        text-transform: capitalize;
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
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this.loadFiltersFromUrl();
    this.fetchLogs();
  }

  private loadFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    this.searchTerm = params.get('search') ?? '';
    this.monthFilter = params.get('month') ?? '';
    this.yearFilter = params.get('year') ?? '';
    this.resourceTypeFilter = params.get('resourceType') ?? '';
    const page = params.get('page');
    if (page) this.page = Number.parseInt(page, 10) || 1;
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
    setOrDelete('month', this.monthFilter);
    setOrDelete('year', this.yearFilter);
    setOrDelete('resourceType', this.resourceTypeFilter);
    if (this.page > 1) {
      url.searchParams.set('page', String(this.page));
    } else {
      url.searchParams.delete('page');
    }
    window.history.replaceState(null, '', url.toString());
  }

  async fetchLogs() {
    this.loading = true;
    this.error = '';
    this.updateQueryParams();

    try {
      const filters: Record<string, unknown> = {};
      if (this.monthFilter) filters.month = Number.parseInt(this.monthFilter, 10);
      if (this.yearFilter) filters.year = Number.parseInt(this.yearFilter, 10);
      if (this.searchTerm) filters.searchTerm = this.searchTerm;
      if (this.resourceTypeFilter) filters.resourceType = this.resourceTypeFilter;

      const result = await execute(GetTransactionLogsQuery, {
        pagination: { page: this.page, pageSize: this.pageSize },
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        const data = result.data.getTransactionLogs;
        this.logs = data.items as TransactionLogEntry[];
        this.totalCount = data.totalCount;
        this.totalPages = data.totalPages;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load transaction log';
    } finally {
      this.loading = false;
    }
  }

  private goToPage(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.page = newPage;
    this.fetchLogs();
  }

  private handleSearchInput(event: Event) {
    const input = event.target as WaInput;
    this.searchTerm = input.value as string;
    this.debouncedSearch();
  }

  private handleMonthFilterChange(event: Event) {
    const select = event.target as WaSelect;
    this.monthFilter = Array.isArray(select.value) ? select.value.join(',') : (select.value as string);
    this.page = 1;
    this.fetchLogs();
  }

  private handleYearFilterChange(event: Event) {
    const select = event.target as WaSelect;
    this.yearFilter = Array.isArray(select.value) ? select.value.join(',') : (select.value as string);
    this.page = 1;
    this.fetchLogs();
  }

  private handleResourceTypeFilterChange(event: Event) {
    const select = event.target as WaSelect;
    this.resourceTypeFilter = Array.isArray(select.value) ? select.value.join(',') : (select.value as string);
    this.page = 1;
    this.fetchLogs();
  }

  private formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  }

  private getYearOptions() {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      years.push(y);
    }
    return years;
  }

  render() {
    return this.renderPage(
      html`
        ${this.renderPageHeader()} ${this.renderFilterBar()}
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
              <span>Loading transaction log...</span>
            </div>
          `,
          () => this.renderContent(),
        )}
      `,
      {
        activePage: 'Transaction Log',
        showUserMenu: true,
        showStoreSelector: this.showStoreSelector,
        onStoreChanged: () => this.fetchLogs(),
      },
    );
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="clock-rotate-left" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Transaction Log</h2>
          <p>Audit trail of all inventory and order transactions</p>
        </div>
      </div>
    `;
  }

  private renderFilterBar() {
    return html`
      <div class="filter-bar">
        <wa-input
          placeholder="Search transactions..."
          .value="${this.searchTerm}"
          @input="${this.handleSearchInput}"
          clearable
        >
          <wa-icon slot="prefix" name="magnifying-glass"></wa-icon>
        </wa-input>
        <wa-select placeholder="Month" .value="${this.monthFilter}" @change="${this.handleMonthFilterChange}" clearable>
          <wa-option value="">All Months</wa-option>
          ${MONTH_NAMES.map((name, i) => html`<wa-option value="${i + 1}">${name}</wa-option>`)}
        </wa-select>
        <wa-select placeholder="Year" .value="${this.yearFilter}" @change="${this.handleYearFilterChange}" clearable>
          <wa-option value="">All Years</wa-option>
          ${this.getYearOptions().map((y) => html`<wa-option value="${y}">${y}</wa-option>`)}
        </wa-select>
        <wa-select
          placeholder="Resource Type"
          .value="${this.resourceTypeFilter}"
          @change="${this.handleResourceTypeFilterChange}"
          clearable
        >
          <wa-option value="">All Types</wa-option>
          <wa-option value="order">Orders</wa-option>
          <wa-option value="inventory">Inventory</wa-option>
        </wa-select>
      </div>
    `;
  }

  private renderContent() {
    if (this.logs.length === 0) {
      return html`
        <div class="empty-state">
          <wa-icon name="clock-rotate-left"></wa-icon>
          <h3>No Transactions Found</h3>
          <p>Transaction log entries will appear here as inventory and order actions are performed.</p>
        </div>
      `;
    }

    return html`
      <wa-card appearance="outline">
        <div class="table-container">
          <table class="wa-table">
            <thead>
              <tr>
                <th scope="col">Timestamp</th>
                <th scope="col">User</th>
                <th scope="col">Action</th>
                <th scope="col">Resource Type</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              ${this.logs.map(
                (entry) => html`
                  <tr>
                    <td>${this.formatDate(entry.createdAt)}</td>
                    <td title="${entry.userEmail}">${entry.userName || entry.userEmail}</td>
                    <td>${formatActionLabel(entry.action)}</td>
                    <td>
                      <wa-badge
                        class="resource-type-badge"
                        variant="${entry.resourceType === 'order' ? 'brand' : 'neutral'}"
                      >
                        ${entry.resourceType}
                      </wa-badge>
                    </td>
                    <td class="details-cell" title="${formatDetails(entry.details)}">
                      ${formatDetails(entry.details)}
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

    const start = (this.page - 1) * this.pageSize + 1;
    const end = Math.min(this.page * this.pageSize, this.totalCount);

    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.page - Math.floor(maxVisible / 2));
    const endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return html`
      <div class="pagination">
        <span class="pagination-info">Showing ${start}-${end} of ${this.totalCount} entries</span>
        <div class="pagination-controls">
          ${when(
            this.totalPages > 1,
            () => html`
              <div class="pagination-buttons">
                <wa-button
                  size="small"
                  variant="neutral"
                  ?disabled="${this.page === 1}"
                  @click="${() => this.goToPage(this.page - 1)}"
                >
                  <wa-icon name="chevron-left"></wa-icon>
                </wa-button>
                ${pages.map(
                  (p) => html`
                    <wa-button
                      size="small"
                      variant="${p === this.page ? 'brand' : 'neutral'}"
                      ?data-current="${p === this.page}"
                      @click="${() => this.goToPage(p)}"
                    >
                      ${p}
                    </wa-button>
                  `,
                )}
                <wa-button
                  size="small"
                  variant="neutral"
                  ?disabled="${this.page === this.totalPages}"
                  @click="${() => this.goToPage(this.page + 1)}"
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
}
