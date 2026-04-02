import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import '../../components/ogs-page.ts';
import { execute } from '../../lib/graphql.ts';
import type WaSelect from '@awesome.me/webawesome/dist/components/select/select.js';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
import {
  type AddForm,
  type BulkEditForm,
  type InventoryItem,
  type ProductSearchResult,
  GetInventoryItemDetailsQuery,
  SearchProductsQuery,
  AddInventoryItemMutation,
  UpdateInventoryItemMutation,
  DeleteInventoryItemMutation,
  BulkUpdateInventoryMutation,
  BulkDeleteInventoryMutation,
  debounce,
  sharedInventoryStyles,
  renderProfitSummary,
  renderMarketPrices,
  renderConditionBadge,
  formatCurrency,
  computeInventoryStats,
  getTodayDateString,
} from '../inventory/inventory-shared.ts';

@customElement('ogs-inventory-detail-page')
export class OgsInventoryDetailPage extends LitElement {
  static styles = sharedInventoryStyles;

  @property({ type: String }) userRole = '';
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';
  @property({ type: String }) productId = '';
  @property({ type: String }) condition = '';
  @property({ type: String }) inventoryType = 'singles';

  // Pagination
  @state() private currentPage = 1;
  @state() private pageSize = 25;
  @state() private totalCount = 0;
  @state() private totalPages = 0;

  // Data
  @state() private inventoryItems: InventoryItem[] = [];
  @state() private loading = false;
  @state() private error = '';

  // Selection
  @state() private selectedIds: Set<number> = new Set();
  @state() private selectAll = false;

  // Add dialog
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

  // Edit dialog
  @state() private showEditDialog = false;
  @state() private editingItem: InventoryItem | null = null;
  @state() private editForm: Partial<{
    condition: string;
    quantity: number;
    price: number;
    costBasis: number;
    acquisitionDate: string;
    notes: string;
  }> = {};
  @state() private editValidationErrors: string[] = [];

  // Delete dialog
  @state() private showDeleteDialog = false;
  @state() private deletingItem: InventoryItem | null = null;

  // Bulk edit/delete dialogs
  @state() private showBulkEditDialog = false;
  @state() private showBulkDeleteDialog = false;
  @state() private bulkEditForm: BulkEditForm = {
    condition: '',
    quantity: null,
    price: null,
    costBasis: null,
    acquisitionDate: '',
    notes: '',
  };

  // Cost basis warning dialog
  @state() private showCostBasisWarning = false;
  @state() private pendingAction: (() => Promise<void>) | null = null;

  private debouncedProductSearch = debounce((term: string) => {
    this.searchProducts(term);
  }, 300);

  connectedCallback() {
    super.connectedCallback();
    this.fetchDetails();
  }

  private get numericProductId(): number {
    return Number.parseInt(this.productId, 10);
  }

  private get backUrl(): string {
    return this.inventoryType === 'sealed' ? '/inventory/sealed' : '/inventory/singles';
  }

  private get isSingles(): boolean {
    return this.inventoryType === 'singles';
  }

  // --- Data Fetching ---

  private async fetchDetails() {
    this.loading = true;
    this.error = '';
    try {
      const result = await execute(GetInventoryItemDetailsQuery, {
        productId: this.numericProductId,
        condition: this.condition,
        pagination: { page: this.currentPage, pageSize: this.pageSize },
      });
      if (result?.errors?.length) {
        this.error = result.errors.map((e) => e.message).join(', ');
      } else {
        const data = result.data.getInventoryItemDetails;
        this.inventoryItems = data.items;
        this.totalCount = data.totalCount;
        this.totalPages = data.totalPages;
        this.currentPage = data.page;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load details';
    } finally {
      this.loading = false;
    }
  }

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
        this.searchResults = this.isSingles
          ? result.data.searchProducts.filter((p) => p.isSingle)
          : result.data.searchProducts.filter((p) => p.isSealed);
      }
    } catch {
      this.searchResults = [];
    } finally {
      this.productSearchLoading = false;
    }
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

  private validateEditForm(): string[] {
    const errors: string[] = [];
    if (this.editForm.quantity == null || this.editForm.quantity < 0) errors.push('Quantity is required and must be non-negative');
    if (this.editForm.price == null || this.editForm.price < 0) errors.push('Price is required and must be non-negative');
    if (this.editForm.costBasis == null) errors.push('Cost basis is required');
    if (!this.editForm.acquisitionDate) errors.push('Acquisition date is required');
    if (!this.editForm.condition) errors.push('Condition is required');
    if (this.editForm.condition != null && !['NM', 'LP', 'MP', 'HP', 'D'].includes(this.editForm.condition))
      errors.push('Invalid condition');
    return errors;
  }

  // --- Selection ---

  private toggleSelectAll() {
    if (this.selectAll) {
      this.selectedIds = new Set();
      this.selectAll = false;
    } else {
      this.selectedIds = new Set(this.inventoryItems.map((item) => item.id));
      this.selectAll = true;
    }
    this.requestUpdate();
  }

  private toggleItemSelection(id: number) {
    const newSet = new Set(this.selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    this.selectedIds = newSet;
    this.selectAll = newSet.size === this.inventoryItems.length && this.inventoryItems.length > 0;
  }

  // --- Pagination ---

  private goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.selectedIds = new Set();
    this.selectAll = false;
    this.fetchDetails();
  }

  // --- Dialog handlers ---

  private openAddDialog() {
    const firstItem = this.inventoryItems[0];
    this.showAddDialog = true;
    this.searchResults = [];
    this.selectedProduct = null;
    this.productSearchTerm = '';
    this.addValidationErrors = [];
    this.addForm = {
      quantity: 1,
      condition: this.condition || firstItem?.condition || 'NM',
      price: firstItem?.price ?? 0,
      costBasis: 0,
      acquisitionDate: getTodayDateString(),
      notes: '',
    };

    // Auto-select the current product if we have items
    if (firstItem) {
      this.selectedProduct = {
        id: firstItem.productId,
        name: firstItem.productName,
        gameName: firstItem.gameName,
        setName: firstItem.setName,
        rarity: firstItem.rarity ?? null,
        imageUrl: null,
        isSingle: firstItem.isSingle,
        isSealed: firstItem.isSealed,
        prices: [],
      };
    }
  }

  private closeAddDialog() {
    this.showAddDialog = false;
    this.searchResults = [];
    this.selectedProduct = null;
    this.productSearchTerm = '';
    this.addValidationErrors = [];
  }

  private openEditDialog(item: InventoryItem) {
    this.editingItem = item;
    this.editValidationErrors = [];
    this.editForm = {
      condition: item.condition ?? 'NM',
      quantity: item.quantity,
      price: item.price,
      costBasis: item.costBasis ?? 0,
      acquisitionDate: item.acquisitionDate ? item.acquisitionDate.slice(0, 10) : '',
      notes: item.notes ?? '',
    };
    this.showEditDialog = true;
  }

  private closeEditDialog() {
    this.showEditDialog = false;
    this.editingItem = null;
    this.editValidationErrors = [];
  }

  private openDeleteDialog(item: InventoryItem) {
    this.deletingItem = item;
    this.showDeleteDialog = true;
  }

  private closeDeleteDialog() {
    this.showDeleteDialog = false;
    this.deletingItem = null;
  }

  private openBulkEditDialog() {
    this.bulkEditForm = { condition: '', quantity: null, price: null, costBasis: null, acquisitionDate: '', notes: '' };
    this.showBulkEditDialog = true;
  }

  private closeBulkEditDialog() {
    this.showBulkEditDialog = false;
  }

  private openBulkDeleteDialog() {
    this.showBulkDeleteDialog = true;
  }

  private closeBulkDeleteDialog() {
    this.showBulkDeleteDialog = false;
  }

  // --- Product search ---

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

  // --- Cost basis warning flow ---

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
            condition: this.addForm.condition,
            quantity: this.addForm.quantity,
            price: this.addForm.price,
            costBasis: this.addForm.costBasis,
            acquisitionDate: this.addForm.acquisitionDate,
            notes: this.addForm.notes || null,
          },
        });
        if (result?.errors?.length) {
          this.error = result.errors.map((e) => e.message).join(', ');
        } else {
          this.closeAddDialog();
          this.fetchDetails();
        }
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to add item';
      }
    };

    this.checkCostBasisAndExecute(this.addForm.costBasis, doAdd);
  }

  private async submitEditItem() {
    if (!this.editingItem) return;
    const errors = this.validateEditForm();
    if (errors.length > 0) {
      this.editValidationErrors = errors;
      return;
    }

    const doEdit = async () => {
      try {
        const result = await execute(UpdateInventoryItemMutation, {
          input: {
            id: this.editingItem!.id,
            condition: this.editForm.condition ?? null,
            quantity: this.editForm.quantity ?? null,
            price: this.editForm.price ?? null,
            costBasis: this.editForm.costBasis ?? null,
            acquisitionDate: this.editForm.acquisitionDate || null,
            notes: this.editForm.notes ?? null,
          },
        });
        if (result?.errors?.length) {
          this.error = result.errors.map((e) => e.message).join(', ');
        } else {
          this.closeEditDialog();
          this.fetchDetails();
        }
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to update item';
      }
    };

    this.checkCostBasisAndExecute(this.editForm.costBasis ?? -1, doEdit);
  }

  private async submitDeleteItem() {
    if (!this.deletingItem) return;
    try {
      const result = await execute(DeleteInventoryItemMutation, { id: this.deletingItem.id });
      if (result?.errors?.length) {
        this.error = result.errors.map((e) => e.message).join(', ');
      } else {
        this.closeDeleteDialog();
        this.fetchDetails();
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete item';
    }
  }

  private async submitBulkEdit() {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    const input: Record<string, unknown> = { ids };
    if (this.bulkEditForm.condition) input.condition = this.bulkEditForm.condition;
    if (this.bulkEditForm.quantity != null) input.quantity = this.bulkEditForm.quantity;
    if (this.bulkEditForm.price != null) input.price = this.bulkEditForm.price;
    if (this.bulkEditForm.costBasis != null) input.costBasis = this.bulkEditForm.costBasis;
    if (this.bulkEditForm.acquisitionDate) input.acquisitionDate = this.bulkEditForm.acquisitionDate;
    if (this.bulkEditForm.notes) input.notes = this.bulkEditForm.notes;

    try {
      // biome-ignore lint/suspicious/noExplicitAny: GraphQL input flexibility
      const result = await execute(BulkUpdateInventoryMutation, { input: input as any });
      if (result?.errors?.length) {
        this.error = result.errors.map((e) => e.message).join(', ');
      } else {
        this.closeBulkEditDialog();
        this.selectedIds = new Set();
        this.selectAll = false;
        this.fetchDetails();
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to bulk update';
    }
  }

  private async submitBulkDelete() {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;
    try {
      const result = await execute(BulkDeleteInventoryMutation, { input: { ids } });
      if (result?.errors?.length) {
        this.error = result.errors.map((e) => e.message).join(', ');
      } else {
        this.closeBulkDeleteDialog();
        this.selectedIds = new Set();
        this.selectAll = false;
        this.fetchDetails();
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to bulk delete';
    }
  }

  // --- Render ---

  render() {
    const firstItem = this.inventoryItems[0];
    const productName = firstItem?.productName ?? 'Inventory Item';
    const activePage = this.inventoryType === 'sealed' ? 'inventory/sealed' : 'inventory/singles';

    return html`
      <ogs-page
        activePage="${activePage}"
        ?showUserMenu="${true}"
        userRole="${this.userRole}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
      >
        ${this.renderBreadcrumb()} ${this.renderPageHeader(productName)} ${this.renderStatsBar()}
        ${this.renderActionBar()}
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
              <span>Loading inventory entries...</span>
            </div>
          `,
          () => this.renderTable(),
        )}
        ${this.renderPagination()} ${this.renderAddDialog()} ${this.renderEditDialog()} ${this.renderDeleteDialog()}
        ${this.renderBulkEditDialog()} ${this.renderBulkDeleteDialog()} ${this.renderCostBasisWarningDialog()}
      </ogs-page>
    `;
  }

  private renderBreadcrumb() {
    const label = this.inventoryType === 'sealed' ? 'Sealed Inventory' : 'Singles Inventory';
    return html`
      <div class="breadcrumb">
        <a href="${this.backUrl}">${label}</a>
        <wa-icon name="chevron-right"></wa-icon>
        <span>Item Details</span>
      </div>
    `;
  }

  private renderPageHeader(productName: string) {
    const icon = this.inventoryType === 'sealed' ? 'box' : 'id-card';
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="${icon}" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>${productName}</h2>
          <p>
            Condition: ${renderConditionBadge(this.condition)}
            ${this.inventoryItems[0] ? html` — ${this.inventoryItems[0].gameName} / ${this.inventoryItems[0].setName}` : ''}
          </p>
        </div>
      </div>
    `;
  }

  private renderStatsBar() {
    const stats = computeInventoryStats(this.inventoryItems);
    return html`
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-icon neutral">
            <wa-icon name="layer-group"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Entries</span>
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
            <wa-icon name="tag"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Value</span>
            <span class="stat-value">${formatCurrency(stats.totalValue)}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning">
            <wa-icon name="chart-line"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Cost</span>
            <span class="stat-value">${formatCurrency(stats.totalCost)}</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderActionBar() {
    const selectionCount = this.selectedIds.size;
    return html`
      <div class="action-bar">
        <wa-button variant="brand" @click="${this.openAddDialog}">
          <wa-icon slot="start" name="plus"></wa-icon>
          Add Entry
        </wa-button>
        ${when(
          selectionCount > 0,
          () =>
            html`<span class="selection-indicator"><wa-icon name="check"></wa-icon> ${selectionCount} selected</span>`,
        )}
        <div class="action-bar-spacer"></div>
        <wa-button variant="neutral" ?disabled="${selectionCount === 0}" @click="${this.openBulkEditDialog}">
          <wa-icon slot="start" name="pencil"></wa-icon>
          Bulk Edit
        </wa-button>
        <wa-button variant="danger" ?disabled="${selectionCount === 0}" @click="${this.openBulkDeleteDialog}">
          <wa-icon slot="start" name="trash"></wa-icon>
          Bulk Delete
        </wa-button>
      </div>
    `;
  }

  private renderTable() {
    if (this.inventoryItems.length === 0 && !this.loading) {
      return html`
        <div class="empty-state">
          <wa-icon name="box-open"></wa-icon>
          <h3>No entries found</h3>
          <p>Add inventory entries or go back to the inventory list.</p>
          <wa-button variant="brand" @click="${this.openAddDialog}">
            <wa-icon slot="start" name="plus"></wa-icon>
            Add First Entry
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
                <th style="width: 40px;">
                  <wa-checkbox .checked="${this.selectAll}" @change="${this.toggleSelectAll}"></wa-checkbox>
                </th>
                <th>Acquisition Date</th>
                ${this.isSingles ? html`<th>Condition</th>` : nothing}
                <th class="quantity-cell" style="width: 60px;">Qty</th>
                <th class="price-cell" style="width: 90px;">Price</th>
                <th class="price-cell" style="width: 90px;">Cost Basis</th>
                <th style="width: 100px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.inventoryItems.map(
                (item) => html`
                  <tr>
                    <td>
                      <wa-checkbox
                        .checked="${this.selectedIds.has(item.id)}"
                        @change="${() => this.toggleItemSelection(item.id)}"
                      ></wa-checkbox>
                    </td>
                    <td>${item.acquisitionDate ? new Date(item.acquisitionDate).toLocaleDateString() : '—'}</td>
                    ${this.isSingles ? html`<td>${renderConditionBadge(item.condition)}</td>` : nothing}
                    <td class="quantity-cell"><strong>${item.quantity}</strong></td>
                    <td class="price-cell"><strong>${formatCurrency(item.price)}</strong></td>
                    <td class="price-cell">${formatCurrency(item.costBasis)}</td>
                    <td class="actions-cell">
                      <wa-button size="small" variant="neutral" title="Edit" @click="${() => this.openEditDialog(item)}">
                        <wa-icon name="pencil"></wa-icon>
                      </wa-button>
                      <wa-button
                        size="small"
                        variant="neutral"
                        title="Delete"
                        @click="${() => this.openDeleteDialog(item)}"
                      >
                        <wa-icon name="trash"></wa-icon>
                      </wa-button>
                    </td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
      </wa-card>
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
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return html`
      <div class="pagination">
        <span class="pagination-info">Showing ${start}–${end} of ${this.totalCount} entries</span>
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

        <wa-input
          label="Search Product"
          placeholder="Type to search products..."
          .value="${this.productSearchTerm}"
          @input="${this.handleProductSearchInput}"
        >
          <wa-icon slot="prefix" name="magnifying-glass"></wa-icon>
          ${when(this.productSearchLoading, () => html`<wa-spinner slot="suffix"></wa-spinner>`)}
        </wa-input>

        ${when(
          this.searchResults.length > 0 && !this.selectedProduct,
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

                ${this.isSingles
                  ? html`
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
                    `
                  : nothing}
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

  // --- Edit Dialog ---

  private renderEditDialog() {
    if (!this.editingItem) return nothing;
    return html`
      <wa-dialog
        label="Edit Entry"
        ?open="${this.showEditDialog}"
        @wa-after-hide="${(e: Event) => {
          if ((e.target as HTMLElement).tagName === 'WA-DIALOG') this.closeEditDialog();
        }}"
      >
        ${when(
          this.editValidationErrors.length > 0,
          () => html`
            <wa-callout variant="danger" style="margin-bottom: 0.75rem;">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              ${this.editValidationErrors.map((err) => html`<div>${err}</div>`)}
            </wa-callout>
          `,
        )}

        <div class="edit-item-header">
          <wa-icon name="${this.isSingles ? 'id-card' : 'box'}"></wa-icon>
          <div class="edit-item-header-info">
            <h3>${this.editingItem.productName}</h3>
            <p>${this.editingItem.gameName} — ${this.editingItem.setName}</p>
          </div>
        </div>

        <div class="form-fields">
          <div class="form-row">
            ${this.isSingles
              ? html`
                  <wa-select
                    autofocus
                    label="Condition *"
                    required
                    .value="${this.editForm.condition ?? ''}"
                    @change="${(e: Event) => {
                      const val = (e.target as WaSelect).value;
                      this.editForm = { ...this.editForm, condition: (Array.isArray(val) ? val[0] : val) as string };
                    }}"
                  >
                    <wa-option value="NM">Near Mint</wa-option>
                    <wa-option value="LP">Lightly Played</wa-option>
                    <wa-option value="MP">Moderately Played</wa-option>
                    <wa-option value="HP">Heavily Played</wa-option>
                    <wa-option value="D">Damaged</wa-option>
                  </wa-select>
                `
              : nothing}

            <wa-input
              label="Quantity *"
              type="number"
              min="0"
              required
              .value="${String(this.editForm.quantity ?? 1)}"
              @input="${(e: Event) => {
                this.editForm = { ...this.editForm, quantity: Number((e.target as WaInput).value) || 0 };
              }}"
            ></wa-input>
          </div>

          <div class="form-row">
            <wa-input
              label="Price *"
              type="number"
              step="0.01"
              min="0"
              required
              .value="${String(this.editForm.price ?? 0)}"
              @input="${(e: Event) => {
                this.editForm = {
                  ...this.editForm,
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
              .value="${String(this.editForm.costBasis ?? 0)}"
              @input="${(e: Event) => {
                this.editForm = {
                  ...this.editForm,
                  costBasis: Number.parseFloat((e.target as WaInput).value as string) || 0,
                };
              }}"
            ></wa-input>
          </div>

          <wa-input
            label="Acquisition Date *"
            type="date"
            required
            .value="${this.editForm.acquisitionDate ?? ''}"
            @input="${(e: Event) => {
              this.editForm = { ...this.editForm, acquisitionDate: (e.target as WaInput).value as string };
            }}"
          ></wa-input>

          <wa-textarea
            label="Notes"
            maxlength="1000"
            .value="${this.editForm.notes ?? ''}"
            @input="${(e: Event) => {
              this.editForm = { ...this.editForm, notes: (e.target as HTMLTextAreaElement).value };
            }}"
          >
            <span slot="help-text">${(this.editForm.notes ?? '').length}/1000</span>
          </wa-textarea>

          ${renderProfitSummary(this.editForm.price ?? 0, this.editForm.costBasis ?? 0, this.editForm.quantity ?? 1)}
        </div>

        <wa-button slot="footer" variant="neutral" @click="${this.closeEditDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="brand" @click="${this.submitEditItem}">Save Changes</wa-button>
      </wa-dialog>
    `;
  }

  // --- Delete Dialog ---

  private renderDeleteDialog() {
    if (!this.deletingItem) return nothing;
    return html`
      <wa-dialog
        label="Delete Entry"
        ?open="${this.showDeleteDialog}"
        @wa-after-hide="${(e: Event) => {
          if ((e.target as HTMLElement).tagName === 'WA-DIALOG') this.closeDeleteDialog();
        }}"
      >
        <div class="delete-warning">
          <wa-icon name="triangle-exclamation"></wa-icon>
          <div class="delete-warning-text">
            <p>Delete this entry for <span class="delete-confirm-name">${this.deletingItem.productName}</span>?</p>
            <p>Qty: ${this.deletingItem.quantity}, Price: ${formatCurrency(this.deletingItem.price)}, Cost: ${formatCurrency(this.deletingItem.costBasis)}</p>
          </div>
        </div>
        <wa-button autofocus slot="footer" variant="neutral" @click="${this.closeDeleteDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="danger" @click="${this.submitDeleteItem}">
          <wa-icon slot="start" name="trash"></wa-icon>
          Delete
        </wa-button>
      </wa-dialog>
    `;
  }

  // --- Bulk Edit Dialog ---

  private renderBulkEditDialog() {
    return html`
      <wa-dialog
        label="Bulk Edit Entries"
        ?open="${this.showBulkEditDialog}"
        @wa-after-hide="${(e: Event) => {
          if ((e.target as HTMLElement).tagName === 'WA-DIALOG') this.closeBulkEditDialog();
        }}"
      >
        <p>Editing <strong>${this.selectedIds.size}</strong> selected entries. Only filled fields will be updated.</p>
        <div class="form-fields">
          ${this.isSingles
            ? html`
                <wa-select
                  label="Condition"
                  placeholder="Leave unchanged"
                  .value="${this.bulkEditForm.condition}"
                  clearable
                  @change="${(e: Event) => {
                    const val = (e.target as WaSelect).value;
                    this.bulkEditForm = {
                      ...this.bulkEditForm,
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
              `
            : nothing}

          <div class="form-row">
            <wa-input
              label="Quantity"
              type="number"
              min="0"
              placeholder="Leave unchanged"
              @input="${(e: Event) => {
                const val = (e.target as WaInput).value;
                this.bulkEditForm = { ...this.bulkEditForm, quantity: val ? Number(val) : null };
              }}"
            ></wa-input>
            <wa-input
              label="Price"
              type="number"
              step="0.01"
              min="0"
              placeholder="Leave unchanged"
              @input="${(e: Event) => {
                const val = (e.target as WaInput).value;
                this.bulkEditForm = { ...this.bulkEditForm, price: val ? Number.parseFloat(val as string) : null };
              }}"
            ></wa-input>
          </div>

          <wa-input
            label="Cost Basis"
            type="number"
            step="0.01"
            min="0"
            placeholder="Leave unchanged"
            @input="${(e: Event) => {
              const val = (e.target as WaInput).value;
              this.bulkEditForm = { ...this.bulkEditForm, costBasis: val ? Number.parseFloat(val as string) : null };
            }}"
          ></wa-input>

          <wa-input
            label="Acquisition Date"
            type="date"
            @input="${(e: Event) => {
              this.bulkEditForm = { ...this.bulkEditForm, acquisitionDate: (e.target as WaInput).value as string };
            }}"
          ></wa-input>

          <wa-textarea
            label="Notes"
            maxlength="1000"
            placeholder="Leave unchanged"
            @input="${(e: Event) => {
              this.bulkEditForm = { ...this.bulkEditForm, notes: (e.target as HTMLTextAreaElement).value };
            }}"
          ></wa-textarea>
        </div>
        <wa-button slot="footer" variant="neutral" @click="${this.closeBulkEditDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="brand" @click="${this.submitBulkEdit}">
          Update ${this.selectedIds.size} Entries
        </wa-button>
      </wa-dialog>
    `;
  }

  // --- Bulk Delete Dialog ---

  private renderBulkDeleteDialog() {
    return html`
      <wa-dialog
        label="Bulk Delete"
        ?open="${this.showBulkDeleteDialog}"
        @wa-after-hide="${(e: Event) => {
          if ((e.target as HTMLElement).tagName === 'WA-DIALOG') this.closeBulkDeleteDialog();
        }}"
      >
        <div class="delete-warning">
          <wa-icon name="triangle-exclamation"></wa-icon>
          <div class="delete-warning-text">
            <p>Delete <strong>${this.selectedIds.size}</strong> selected entries?</p>
            <p>This will mark the entries as deleted.</p>
          </div>
        </div>
        <wa-button autofocus slot="footer" variant="neutral" @click="${this.closeBulkDeleteDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="danger" @click="${this.submitBulkDelete}">
          <wa-icon slot="start" name="trash"></wa-icon>
          Delete ${this.selectedIds.size} Entries
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
