import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '../../components/ogs-page.ts';
import { execute } from '../../lib/graphql.ts';
import type WaSelect from '@awesome.me/webawesome/dist/components/select/select.js';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
import {
  type GroupedInventoryItem,
  GetInventoryQuery,
  debounce,
  sharedInventoryStyles,
  renderConditionBadge,
  formatCurrency,
  computeGroupedInventoryStats,
} from '../inventory/inventory-shared.ts';

// --- Component ---

@customElement('ogs-inventory-singles-page')
export class OgsInventorySinglesPage extends LitElement {
  static styles = sharedInventoryStyles;

  // --- Properties ---

  @property({ type: String }) userRole = '';
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';

  // Filter state
  @state() private gameFilter = '';
  @state() private conditionFilter = '';
  @state() private searchTerm = '';

  // Pagination state
  @state() private currentPage = 1;
  @state() private pageSize = 25;
  @state() private totalCount = 0;
  @state() private totalPages = 0;

  // Data state
  @state() private inventoryItems: GroupedInventoryItem[] = [];
  @state() private loading = false;
  @state() private error = '';

  // --- Debounced handlers ---

  private debouncedSearch = debounce(() => {
    this.currentPage = 1;
    this.fetchInventory();
  }, 300);

  // --- Lifecycle ---

  connectedCallback() {
    super.connectedCallback();
    this.loadFiltersFromUrl();
    this.fetchInventory();
  }

  protected firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    this.focusFirstInput();
  }

  private focusFirstInput() {
    requestAnimationFrame(() => {
      const input = this.shadowRoot?.querySelector<HTMLElement>('.filter-bar wa-input');
      input?.focus();
    });
  }

  private loadFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    this.searchTerm = params.get('search') ?? '';
    this.gameFilter = params.get('game') ?? '';
    this.conditionFilter = params.get('condition') ?? '';
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
    setOrDelete('game', this.gameFilter);
    setOrDelete('condition', this.conditionFilter);
    if (this.currentPage > 1) {
      url.searchParams.set('page', String(this.currentPage));
    } else {
      url.searchParams.delete('page');
    }
    window.history.replaceState(null, '', url.toString());
  }

  // --- Data fetching ---

  private async fetchInventory() {
    this.loading = true;
    this.error = '';
    this.updateQueryParams();

    const filters: Record<string, unknown> = {
      includeSingles: true,
      includeSealed: false,
    };
    if (this.searchTerm) filters.searchTerm = this.searchTerm;
    if (this.gameFilter) filters.gameName = this.gameFilter;
    if (this.conditionFilter) filters.condition = this.conditionFilter;

    try {
      const result = await execute(GetInventoryQuery, {
        filters,
        pagination: { page: this.currentPage, pageSize: this.pageSize },
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e) => e.message).join(', ');
      } else {
        const data = result.data.getInventory;
        this.inventoryItems = data.items;
        this.totalCount = data.totalCount;
        this.totalPages = data.totalPages;
        this.currentPage = data.page;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load inventory';
    } finally {
      this.loading = false;
    }
  }

  // --- Filter handlers ---

  private handleSearchInput(event: Event) {
    const input = event.target as WaInput;
    this.searchTerm = input.value as string;
    this.debouncedSearch();
  }

  private handleFilterChange(field: string, event: Event) {
    const select = event.target as WaSelect;
    const value = Array.isArray(select.value) ? select.value.join(',') : (select.value as string);

    switch (field) {
      case 'game':
        this.gameFilter = value;
        break;
      case 'condition':
        this.conditionFilter = value;
        break;
    }

    this.currentPage = 1;
    this.fetchInventory();
  }

  // --- Navigation ---

  private navigateToDetail(item: GroupedInventoryItem) {
    const url = `/inventory/singles/${item.productId}/${encodeURIComponent(item.condition)}`;
    window.location.href = url;
  }

  // --- Pagination handlers ---

  private goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.fetchInventory();
  }

  // --- Render ---

  render() {
    return html`
      <ogs-page
        activePage="inventory/singles"
        ?showUserMenu="${true}"
        userRole="${this.userRole}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
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
              <span>Loading singles inventory...</span>
            </div>
          `,
          () => this.renderInventoryTable(),
        )}
        ${this.renderPagination()}
      </ogs-page>
    `;
  }

  // --- Page Header ---

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="id-card" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Singles Inventory</h2>
          <p>Manage your individual card inventory</p>
        </div>
      </div>
    `;
  }

  // --- Stats Bar ---

  private renderStatsBar() {
    const stats = computeGroupedInventoryStats(this.inventoryItems);
    return html`
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-icon neutral">
            <wa-icon name="id-card"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Products</span>
            <span class="stat-value">${this.totalCount}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <wa-icon name="cubes"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Qty</span>
            <span class="stat-value">${stats.totalQuantity}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success">
            <wa-icon name="layer-group"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Entries</span>
            <span class="stat-value">${stats.totalEntries}</span>
          </div>
        </div>
      </div>
    `;
  }

  // --- Filter Bar ---

  private renderFilterBar() {
    return html`
      <div class="filter-bar">
        <wa-input
          placeholder="Search by name..."
          .value="${this.searchTerm}"
          @input="${this.handleSearchInput}"
          clearable
        >
          <wa-icon slot="prefix" name="magnifying-glass"></wa-icon>
        </wa-input>
        <wa-select
          placeholder="Game"
          .value="${this.gameFilter}"
          @change="${(e: Event) => this.handleFilterChange('game', e)}"
          clearable
        >
          <wa-option value="">All Games</wa-option>
          <wa-option value="magic">Magic</wa-option>
          <wa-option value="pokemon">Pokemon</wa-option>
        </wa-select>
        <wa-select
          placeholder="Condition"
          .value="${this.conditionFilter}"
          @change="${(e: Event) => this.handleFilterChange('condition', e)}"
          clearable
        >
          <wa-option value="">All Conditions</wa-option>
          <wa-option value="NM">Near Mint</wa-option>
          <wa-option value="LP">Lightly Played</wa-option>
          <wa-option value="MP">Moderately Played</wa-option>
          <wa-option value="HP">Heavily Played</wa-option>
          <wa-option value="D">Damaged</wa-option>
        </wa-select>
      </div>
    `;
  }

  // --- Action Bar ---

  private renderActionBar() {
    return html`
      <div class="action-bar">
        <wa-button variant="neutral" href="/inventory/import">
          <wa-icon slot="start" name="upload"></wa-icon>
          Import
        </wa-button>
      </div>
    `;
  }

  // --- Inventory Table ---

  private renderInventoryTable() {
    if (this.inventoryItems.length === 0 && !this.loading) {
      return html`
        <div class="empty-state">
          <wa-icon name="box-open"></wa-icon>
          <h3>No singles found</h3>
          <p>Add singles to your inventory or adjust your search filters.</p>
        </div>
      `;
    }

    return html`
      <wa-card appearance="outline">
        <div class="table-container">
          <table class="wa-table wa-zebra-rows wa-hover-rows">
            <thead>
              <tr>
                <th>Product</th>
                <th>Game</th>
                <th>Set</th>
                <th>Rarity</th>
                <th>Condition</th>
                <th class="quantity-cell" style="width: 60px;">Qty</th>
                <th class="price-cell" style="width: 120px;">Price Range</th>
                <th class="quantity-cell" style="width: 80px;">Entries</th>
              </tr>
            </thead>
            <tbody>
              ${this.inventoryItems.map(
                (item) => html`
                  <tr class="clickable-row" @click="${() => this.navigateToDetail(item)}">
                    <td>
                      <div class="product-name">${item.productName}</div>
                    </td>
                    <td>${item.gameName}</td>
                    <td>${item.setName}</td>
                    <td>${item.rarity ?? '—'}</td>
                    <td>${renderConditionBadge(item.condition)}</td>
                    <td class="quantity-cell">
                      <strong>${item.totalQuantity}</strong>
                    </td>
                    <td class="price-cell">
                      ${item.lowestPrice != null && item.highestPrice != null && item.lowestPrice !== item.highestPrice
                        ? html`${formatCurrency(item.lowestPrice)} – ${formatCurrency(item.highestPrice)}`
                        : html`<strong>${formatCurrency(item.lowestPrice)}</strong>`}
                    </td>
                    <td class="quantity-cell">${item.entryCount}</td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
      </wa-card>
    `;
  }

  // --- Pagination ---

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
        <span class="pagination-info">Showing ${start}–${end} of ${this.totalCount} items</span>
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
}
