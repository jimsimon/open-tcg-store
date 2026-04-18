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
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import '@awesome.me/webawesome/dist/components/tag/tag.js';
import '../../components/ogs-page.ts';
import { execute } from '../../lib/graphql.ts';
import { GetSupportedGamesQuery } from '../../lib/shared-queries.ts';
import type WaSelect from '@awesome.me/webawesome/dist/components/select/select.js';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
import { CardCondition } from '../../graphql/graphql.ts';
import {
  type AddForm,
  type InventoryItem,
  type ProductSearchResult,
  GetInventoryQuery,
  SearchProductsQuery,
  AddInventoryItemMutation,
  debounce,
  sharedInventoryStyles,
  renderConditionBadge,
  renderMarketPrices,
  renderProfitSummary,
  formatCurrency,
  computeInventoryListStats,
  getTodayDateString,
} from '../inventory/inventory-shared.ts';

// --- Component ---

@customElement('ogs-inventory-singles-page')
export class OgsInventorySinglesPage extends LitElement {
  static styles = sharedInventoryStyles;

  // --- Properties ---

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

  // Supported games
  @state() private supportedGames: Array<{ categoryId: number; name: string; displayName: string }> = [];

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
  @state() private inventoryItems: InventoryItem[] = [];
  @state() private loading = false;
  @state() private error = '';

  // Add dialog state
  @state() private showAddDialog = false;
  @state() private searchResults: ProductSearchResult[] = [];
  @state() private selectedProduct: ProductSearchResult | null = null;
  @state() private productSearchLoading = false;
  @state() private productSearchTerm = '';
  @state() private addForm: AddForm = {
    quantity: 1,
    condition: 'NM',
    price: 0,
    costBasis: 0,
    acquisitionDate: '',
    notes: '',
  };
  @state() private addValidationErrors: string[] = [];
  @state() private addFormBarcodes: string[] = [];
  @state() private addFormBarcodeInput = '';

  // Cost basis warning dialog
  @state() private showCostBasisWarning = false;
  @state() private pendingAction: (() => Promise<void>) | null = null;

  // --- Debounced handlers ---

  private debouncedSearch = debounce(() => {
    this.currentPage = 1;
    this.fetchInventory();
  }, 300);

  private debouncedProductSearch = debounce((term: string) => {
    this.searchProducts(term);
  }, 300);

  // --- Lifecycle ---

  connectedCallback() {
    super.connectedCallback();
    this.loadFiltersFromUrl();
    this.fetchInventory();
    this.fetchSupportedGames();
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

  private async fetchSupportedGames() {
    try {
      const result = await execute(GetSupportedGamesQuery);
      if (result?.data?.getSupportedGames) {
        this.supportedGames = result.data.getSupportedGames;
      }
    } catch {
      // Fall back to empty list — dropdown will just show "All Games"
    }
  }

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
        this.inventoryItems = data.items as InventoryItem[];
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

  // --- Product Search ---

  private async searchProducts(term: string) {
    if (!term || term.length < 2) {
      this.searchResults = [];
      return;
    }
    this.productSearchLoading = true;
    try {
      const result = await execute(SearchProductsQuery, { searchTerm: term });
      if (result?.errors?.length) {
        this.searchResults = [];
      } else {
        this.searchResults = result.data.searchProducts.filter((p) => p.isSingle);
      }
    } catch {
      this.searchResults = [];
    } finally {
      this.productSearchLoading = false;
    }
  }

  // --- Add Dialog Handlers ---

  private openAddDialog() {
    this.showAddDialog = true;
    this.searchResults = [];
    this.selectedProduct = null;
    this.productSearchTerm = '';
    this.addValidationErrors = [];
    this.addFormBarcodes = [];
    this.addFormBarcodeInput = '';
    this.addForm = {
      quantity: 1,
      condition: 'NM',
      price: 0,
      costBasis: 0,
      acquisitionDate: getTodayDateString(),
      notes: '',
    };
  }

  private closeAddDialog() {
    this.showAddDialog = false;
    this.searchResults = [];
    this.selectedProduct = null;
    this.productSearchTerm = '';
    this.addValidationErrors = [];
  }

  private handleProductSearchInput(event: Event) {
    const input = event.target as WaInput;
    this.productSearchTerm = input.value as string;
    this.debouncedProductSearch(this.productSearchTerm);
  }

  private selectProduct(product: ProductSearchResult) {
    this.selectedProduct = product;
    this.searchResults = [];
    const firstPrice = product.prices?.[0];
    if (firstPrice?.marketPrice) {
      this.addForm = { ...this.addForm, price: firstPrice.marketPrice };
    } else if (firstPrice?.midPrice) {
      this.addForm = { ...this.addForm, price: firstPrice.midPrice };
    }
  }

  // --- Barcode helpers ---

  private addBarcodeToForm() {
    const value = this.addFormBarcodeInput.trim();
    if (value && !this.addFormBarcodes.includes(value)) {
      this.addFormBarcodes = [...this.addFormBarcodes, value];
    }
    this.addFormBarcodeInput = '';
  }

  private removeBarcodeFromForm(index: number) {
    this.addFormBarcodes = this.addFormBarcodes.filter((_, i) => i !== index);
  }

  // --- Validation ---

  private validateAddForm(): string[] {
    const errors: string[] = [];
    if (!this.selectedProduct) errors.push('Please select a product');
    if (this.addForm.quantity < 1) errors.push('Quantity must be at least 1');
    if (this.addForm.price == null || this.addForm.price < 0) errors.push('Price is required');
    if (this.addForm.costBasis == null) errors.push('Cost basis is required');
    if (!this.addForm.acquisitionDate) errors.push('Acquisition date is required');
    if (!this.addForm.condition) errors.push('Condition is required');
    return errors;
  }

  // --- Cost Basis Warning ---

  private checkCostBasisAndExecute(costBasis: number, action: () => Promise<void>) {
    if (costBasis === 0) {
      this.pendingAction = action;
      this.showCostBasisWarning = true;
    } else {
      action();
    }
  }

  private confirmCostBasisWarning() {
    this.showCostBasisWarning = false;
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
  }

  private cancelCostBasisWarning() {
    this.showCostBasisWarning = false;
    this.pendingAction = null;
  }

  // --- Mutations ---

  private async submitAddItem() {
    const errors = this.validateAddForm();
    if (errors.length > 0) {
      this.addValidationErrors = errors;
      return;
    }

    const doAdd = async () => {
      try {
        const result = await execute(AddInventoryItemMutation, {
          input: {
            productId: this.selectedProduct!.id,
            condition: this.addForm.condition as CardCondition,
            quantity: this.addForm.quantity,
            price: this.addForm.price,
            costBasis: this.addForm.costBasis,
            acquisitionDate: this.addForm.acquisitionDate,
            notes: this.addForm.notes || null,
            barcodes: this.addFormBarcodes.length > 0 ? this.addFormBarcodes : undefined,
          },
        });
        if (result?.errors?.length) {
          this.error = result.errors.map((e) => e.message).join(', ');
        } else {
          this.closeAddDialog();
          this.fetchInventory();
        }
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to add item';
      }
    };

    this.checkCostBasisAndExecute(this.addForm.costBasis, doAdd);
  }

  // --- Navigation ---

  private navigateToDetail(item: InventoryItem) {
    const url = `/inventory/singles/${item.id}`;
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
        @store-changed="${() => this.fetchInventory()}"
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
        ${this.renderPagination()} ${this.renderAddDialog()} ${this.renderCostBasisWarningDialog()}
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
    const stats = computeInventoryListStats(this.inventoryItems);
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
          ${this.supportedGames.map((g) => html`<wa-option value="${g.name}">${g.displayName}</wa-option>`)}
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
        <wa-button variant="brand" @click="${this.openAddDialog}">
          <wa-icon slot="start" name="plus"></wa-icon>
          Add
        </wa-button>
        <wa-button variant="neutral" href="/lots/new">
          <wa-icon slot="start" name="layer-group"></wa-icon>
          Add Lot
        </wa-button>
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
          <wa-button variant="brand" @click="${this.openAddDialog}">
            <wa-icon slot="start" name="plus"></wa-icon>
            Add First Item
          </wa-button>
        </div>
      `;
    }

    return html`
      <wa-card appearance="outline">
        <div class="table-container">
          <table class="wa-table wa-zebra-rows wa-hover-rows">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Game</th>
                <th scope="col">Set</th>
                <th scope="col">Rarity</th>
                <th scope="col">Condition</th>
                <th scope="col" class="quantity-cell" style="width: 60px;">Qty</th>
                <th scope="col" class="price-cell" style="width: 120px;">Price</th>
                <th scope="col" class="quantity-cell" style="width: 80px;">Entries</th>
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
                      <strong>${formatCurrency(item.price)}</strong>
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
    if (this.totalPages <= 0 || this.totalCount <= 0) return nothing;

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

  // --- Add Dialog ---

  private renderAddDialog() {
    return html`
      <wa-dialog
        label="Add Inventory Entry"
        ?open="${this.showAddDialog}"
        @wa-after-hide="${(e: Event) => {
          if ((e.target as HTMLElement).tagName === 'WA-DIALOG') this.closeAddDialog();
        }}"
      >
        ${when(
          this.addValidationErrors.length > 0,
          () => html`
            <wa-callout variant="danger" style="margin-bottom: 0.75rem;">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              ${this.addValidationErrors.map((err) => html`<div>${err}</div>`)}
            </wa-callout>
          `,
        )}
        ${when(
          !this.selectedProduct,
          () => html`
            <wa-input
              label="Search Product"
              placeholder="Type to search singles..."
              .value="${this.productSearchTerm}"
              @input="${this.handleProductSearchInput}"
            >
              <wa-icon slot="prefix" name="magnifying-glass"></wa-icon>
              ${when(this.productSearchLoading, () => html`<wa-spinner slot="suffix"></wa-spinner>`)}
            </wa-input>

            ${when(
              this.searchResults.length > 0,
              () => html`
                <div class="search-results">
                  ${this.searchResults.map(
                    (p) => html`
                      <div class="search-result-item" @click="${() => this.selectProduct(p)}">
                        ${when(
                          p.imageUrl,
                          () => html`<img src="${p.imageUrl}" alt="${p.name}" />`,
                          () =>
                            html`<wa-icon
                              name="image"
                              style="font-size: 2rem; color: var(--wa-color-neutral-400);"
                            ></wa-icon>`,
                        )}
                        <div class="result-info">
                          <strong>${p.name}</strong>
                          <small>${p.gameName} — ${p.setName}</small>
                        </div>
                      </div>
                    `,
                  )}
                </div>
              `,
            )}
          `,
        )}
        ${when(
          this.selectedProduct,
          () => html`
            <div class="selected-product">
              ${when(
                this.selectedProduct!.imageUrl,
                () =>
                  html`<img
                    src="${this.selectedProduct!.imageUrl}"
                    alt="${this.selectedProduct!.name}"
                    class="product-image"
                  />`,
              )}
              <div class="selected-product-info">
                <h3>${this.selectedProduct!.name}</h3>
                <p>${this.selectedProduct!.gameName} — ${this.selectedProduct!.setName}</p>
                ${renderMarketPrices(this.selectedProduct!.prices)}
              </div>
              <wa-button
                size="small"
                variant="neutral"
                @click="${() => {
                  this.selectedProduct = null;
                  this.searchResults = [];
                  this.productSearchTerm = '';
                }}"
              >
                Change
              </wa-button>
            </div>

            <div class="form-fields">
              <div class="form-row">
                <wa-input
                  label="Quantity *"
                  type="number"
                  min="1"
                  required
                  .value="${String(this.addForm.quantity)}"
                  @input="${(e: Event) => {
                    this.addForm = { ...this.addForm, quantity: Number((e.target as WaInput).value) || 1 };
                  }}"
                ></wa-input>

                <wa-select
                  label="Condition *"
                  required
                  .value="${this.addForm.condition}"
                  @change="${(e: Event) => {
                    const val = (e.target as WaSelect).value;
                    this.addForm = {
                      ...this.addForm,
                      condition: (Array.isArray(val) ? val[0] : val) as string,
                    };
                  }}"
                >
                  <wa-option value="NM">Near Mint</wa-option>
                  <wa-option value="LP">Lightly Played</wa-option>
                  <wa-option value="MP">Moderately Played</wa-option>
                  <wa-option value="HP">Heavily Played</wa-option>
                  <wa-option value="D">Damaged</wa-option>
                </wa-select>
              </div>

              <div class="form-row">
                <wa-input
                  label="Price *"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  .value="${String(this.addForm.price)}"
                  @input="${(e: Event) => {
                    this.addForm = {
                      ...this.addForm,
                      price: Number.parseFloat((e.target as WaInput).value as string) || 0,
                    };
                  }}"
                ></wa-input>

                <wa-input
                  label="Cost Basis *"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  .value="${String(this.addForm.costBasis)}"
                  @input="${(e: Event) => {
                    this.addForm = {
                      ...this.addForm,
                      costBasis: Number.parseFloat((e.target as WaInput).value as string) || 0,
                    };
                  }}"
                ></wa-input>
              </div>

              <wa-input
                label="Acquisition Date *"
                type="date"
                required
                .value="${this.addForm.acquisitionDate}"
                @input="${(e: Event) => {
                  this.addForm = { ...this.addForm, acquisitionDate: (e.target as WaInput).value as string };
                }}"
              ></wa-input>

              <wa-textarea
                label="Notes"
                maxlength="1000"
                .value="${this.addForm.notes}"
                @input="${(e: Event) => {
                  this.addForm = { ...this.addForm, notes: (e.target as HTMLTextAreaElement).value };
                }}"
              >
                <span slot="help-text">${this.addForm.notes.length}/1000</span>
              </wa-textarea>

              <div>
                <label
                  style="font-size: var(--wa-font-size-s); font-weight: 500; display: block; margin-bottom: 0.25rem;"
                  >Barcodes (optional)</label
                >
                <div style="display: flex; gap: 0.5rem; align-items: flex-start;">
                  <wa-input
                    placeholder="Enter barcode..."
                    .value="${this.addFormBarcodeInput}"
                    @input="${(e: Event) => {
                      this.addFormBarcodeInput = (e.target as WaInput).value as string;
                    }}"
                    @keydown="${(e: KeyboardEvent) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        this.addBarcodeToForm();
                      }
                    }}"
                    style="flex: 1;"
                  ></wa-input>
                  <wa-button variant="neutral" @click="${this.addBarcodeToForm}">Add</wa-button>
                </div>
                ${when(
                  this.addFormBarcodes.length > 0,
                  () => html`
                    <div style="display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.5rem;">
                      ${this.addFormBarcodes.map(
                        (barcode, index) => html`
                          <wa-tag removable @wa-remove="${() => this.removeBarcodeFromForm(index)}">${barcode}</wa-tag>
                        `,
                      )}
                    </div>
                  `,
                )}
              </div>

              ${renderProfitSummary(this.addForm.price, this.addForm.costBasis, this.addForm.quantity)}
            </div>
          `,
        )}

        <wa-button slot="footer" variant="neutral" @click="${this.closeAddDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="brand" ?disabled="${!this.selectedProduct}" @click="${this.submitAddItem}">
          Add Entry
        </wa-button>
      </wa-dialog>
    `;
  }

  // --- Cost Basis Warning Dialog ---

  private renderCostBasisWarningDialog() {
    return html`
      <wa-dialog
        label="Cost Basis Warning"
        ?open="${this.showCostBasisWarning}"
        @wa-after-hide="${(e: Event) => {
          if ((e.target as HTMLElement).tagName === 'WA-DIALOG') this.cancelCostBasisWarning();
        }}"
      >
        <div class="cost-basis-warning">
          <wa-icon name="triangle-exclamation"></wa-icon>
          <div class="cost-basis-warning-text">
            <p>Cost basis is set to $0.00</p>
            <p>
              A $0 cost basis means the full sale price will be treated as profit for tax purposes. This could result in
              higher tax liability. Are you sure you want to keep the cost basis at $0?
            </p>
          </div>
        </div>

        <wa-button autofocus slot="footer" variant="neutral" @click="${this.cancelCostBasisWarning}">
          Go Back
        </wa-button>
        <wa-button slot="footer" variant="warning" @click="${this.confirmCostBasisWarning}">
          Keep $0 Cost Basis
        </wa-button>
      </wa-dialog>
    `;
  }
}
