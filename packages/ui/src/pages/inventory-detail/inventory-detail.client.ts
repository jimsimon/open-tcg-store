import { html, nothing } from 'lit';
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
import '@awesome.me/webawesome/dist/components/tag/tag.js';
import { OgsPageBase } from '../../components/ogs-page-base.ts';
import { storeUrl } from '../../lib/store-url';
import { execute } from '../../lib/graphql.ts';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
import {
  type BulkEditForm,
  type InventoryItem,
  type InventoryItemStock,
  GetInventoryItemQuery,
  GetInventoryItemDetailsQuery,
  AddStockMutation,
  UpdateStockMutation,
  DeleteStockMutation,
  BulkUpdateStockMutation,
  BulkDeleteStockMutation,
  GetBarcodesQuery,
  AddBarcodeMutation,
  RemoveBarcodeMutation,
  sharedInventoryStyles,
  renderConditionBadge,
  formatCurrency,
  renderProfitSummary,
  computeStockStats,
  getTodayDateString,
} from '../inventory/inventory-shared.ts';

@customElement('ogs-inventory-detail-page')
export class OgsInventoryDetailPage extends OgsPageBase {
  static styles = sharedInventoryStyles;

  @property({ type: Boolean }) showStoreSelector = false;
  @property({ type: String }) inventoryItemId = '';
  @property({ type: String }) inventoryType = 'singles';

  // Pagination
  @state() private currentPage = 1;
  @state() private pageSize = 25;
  @state() private totalCount = 0;
  @state() private totalPages = 0;

  // Data
  @state() private parentItem: InventoryItem | null = null;
  @state() private stockEntries: InventoryItemStock[] = [];
  @state() private loading = false;
  @state() private error = '';

  // Selection
  @state() private selectedIds: Set<number> = new Set();
  @state() private selectAll = false;

  // Add stock dialog
  @state() private showAddDialog = false;
  @state() private addForm = {
    quantity: 1,
    costBasis: 0,
    acquisitionDate: '',
    notes: '',
  };
  @state() private addValidationErrors: string[] = [];

  // Edit stock dialog
  @state() private showEditDialog = false;
  @state() private editingStock: InventoryItemStock | null = null;
  @state() private editForm: Partial<{
    quantity: number;
    costBasis: number;
    acquisitionDate: string;
    notes: string;
  }> = {};
  @state() private editValidationErrors: string[] = [];

  // Delete dialog
  @state() private showDeleteDialog = false;
  @state() private deletingStock: InventoryItemStock | null = null;

  // Bulk edit/delete dialogs
  @state() private showBulkEditDialog = false;
  @state() private showBulkDeleteDialog = false;
  @state() private bulkEditForm: BulkEditForm = {
    quantity: null,
    costBasis: null,
    acquisitionDate: '',
    notes: '',
  };

  // Barcodes
  @state() private barcodes: Array<{ id: number; code: string; createdAt: string }> = [];
  @state() private newBarcodeInput = '';
  @state() private barcodeLoading = false;

  // Cost basis warning dialog
  @state() private showCostBasisWarning = false;
  @state() private pendingAction: (() => Promise<void>) | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.fetchDetails();
    this.fetchBarcodes();
  }

  private get numericInventoryItemId(): number {
    return Number.parseInt(this.inventoryItemId, 10);
  }

  private get backUrl(): string {
    return storeUrl(this.inventoryType === 'sealed' ? '/inventory/sealed' : '/inventory/singles');
  }

  // --- Data Fetching ---

  private async fetchDetails() {
    this.loading = true;
    this.error = '';
    try {
      // Fetch parent item info and stock entries in parallel
      const [parentResult, stockResult] = await Promise.all([
        execute(GetInventoryItemQuery, { id: this.numericInventoryItemId }),
        execute(GetInventoryItemDetailsQuery, {
          inventoryItemId: this.numericInventoryItemId,
          pagination: { page: this.currentPage, pageSize: this.pageSize },
        }),
      ]);

      if (parentResult?.errors?.length) {
        this.error = parentResult.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.parentItem = parentResult.data.getInventoryItem as InventoryItem | null;
      }

      if (stockResult?.errors?.length) {
        this.error = stockResult.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        const data = stockResult.data.getInventoryItemDetails;
        this.stockEntries = data.items;
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

  // --- Barcode fetching & mutations ---

  private async fetchBarcodes() {
    this.barcodeLoading = true;
    try {
      const result = await execute(GetBarcodesQuery, {
        inventoryItemId: this.numericInventoryItemId,
      });
      if (result?.data?.getBarcodesForInventoryItem) {
        this.barcodes = result.data.getBarcodesForInventoryItem as Array<{
          id: number;
          code: string;
          createdAt: string;
        }>;
      }
    } catch {
      // silently fail — barcodes are non-critical
    } finally {
      this.barcodeLoading = false;
    }
  }

  private async handleAddBarcode() {
    const code = this.newBarcodeInput.trim();
    if (!code) return;
    try {
      const result = await execute(AddBarcodeMutation, {
        input: {
          inventoryItemId: this.numericInventoryItemId,
          code,
        },
      });
      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.newBarcodeInput = '';
        this.fetchBarcodes();
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to add barcode';
    }
  }

  private async handleRemoveBarcode(id: number) {
    try {
      const result = await execute(RemoveBarcodeMutation, {
        input: { id },
      });
      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.fetchBarcodes();
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to remove barcode';
    }
  }

  // --- Validation ---

  private validateAddForm(): string[] {
    const errors: string[] = [];
    if (this.addForm.quantity < 1) errors.push('Quantity must be at least 1');
    if (this.addForm.costBasis == null) errors.push('Cost basis is required');
    if (!this.addForm.acquisitionDate) errors.push('Acquisition date is required');
    return errors;
  }

  private validateEditForm(): string[] {
    const errors: string[] = [];
    if (this.editForm.quantity == null || this.editForm.quantity < 0) errors.push('Quantity must be non-negative');
    if (this.editForm.costBasis == null) errors.push('Cost basis is required');
    if (!this.editForm.acquisitionDate) errors.push('Acquisition date is required');
    return errors;
  }

  // --- Selection ---

  private toggleSelectAll() {
    if (this.selectAll) {
      this.selectedIds = new Set();
      this.selectAll = false;
    } else {
      this.selectedIds = new Set(this.stockEntries.map((item) => item.id));
      this.selectAll = true;
    }
    this.requestUpdate();
  }

  private toggleItemSelection(id: number) {
    const newSet = new Set(this.selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    this.selectedIds = newSet;
    this.selectAll = newSet.size === this.stockEntries.length && this.stockEntries.length > 0;
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
    this.showAddDialog = true;
    this.addValidationErrors = [];
    this.addForm = {
      quantity: 1,
      costBasis: 0,
      acquisitionDate: getTodayDateString(),
      notes: '',
    };
  }

  private closeAddDialog() {
    this.showAddDialog = false;
    this.addValidationErrors = [];
  }

  private openEditDialog(stock: InventoryItemStock) {
    this.editingStock = stock;
    this.editValidationErrors = [];
    this.editForm = {
      quantity: stock.quantity,
      costBasis: stock.costBasis ?? 0,
      acquisitionDate: stock.acquisitionDate ? stock.acquisitionDate.slice(0, 10) : '',
      notes: stock.notes ?? '',
    };
    this.showEditDialog = true;
  }

  private closeEditDialog() {
    this.showEditDialog = false;
    this.editingStock = null;
    this.editValidationErrors = [];
  }

  private openDeleteDialog(stock: InventoryItemStock) {
    this.deletingStock = stock;
    this.showDeleteDialog = true;
  }

  private closeDeleteDialog() {
    this.showDeleteDialog = false;
    this.deletingStock = null;
  }

  private openBulkEditDialog() {
    this.bulkEditForm = { quantity: null, costBasis: null, acquisitionDate: '', notes: '' };
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

  private async submitAddStock() {
    const errors = this.validateAddForm();
    if (errors.length > 0) {
      this.addValidationErrors = errors;
      return;
    }

    const doAdd = async () => {
      try {
        const result = await execute(AddStockMutation, {
          input: {
            inventoryItemId: this.numericInventoryItemId,
            quantity: this.addForm.quantity,
            costBasis: this.addForm.costBasis,
            acquisitionDate: this.addForm.acquisitionDate,
            notes: this.addForm.notes || null,
          },
        });
        if (result?.errors?.length) {
          this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
        } else {
          this.closeAddDialog();
          this.fetchDetails();
        }
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to add stock entry';
      }
    };

    this.checkCostBasisAndExecute(this.addForm.costBasis, doAdd);
  }

  private async submitEditStock() {
    if (!this.editingStock) return;
    const errors = this.validateEditForm();
    if (errors.length > 0) {
      this.editValidationErrors = errors;
      return;
    }

    const doEdit = async () => {
      try {
        const result = await execute(UpdateStockMutation, {
          input: {
            id: this.editingStock!.id,
            quantity: this.editForm.quantity ?? null,
            costBasis: this.editForm.costBasis ?? null,
            acquisitionDate: this.editForm.acquisitionDate || null,
            notes: this.editForm.notes ?? null,
          },
        });
        if (result?.errors?.length) {
          this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
        } else {
          this.closeEditDialog();
          this.fetchDetails();
        }
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to update stock entry';
      }
    };

    this.checkCostBasisAndExecute(this.editForm.costBasis ?? -1, doEdit);
  }

  private async submitDeleteStock() {
    if (!this.deletingStock) return;
    try {
      const result = await execute(DeleteStockMutation, { id: this.deletingStock.id });
      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.closeDeleteDialog();
        this.fetchDetails();
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete stock entry';
    }
  }

  private async submitBulkEdit() {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    const input: Record<string, unknown> = { ids };
    if (this.bulkEditForm.quantity != null) input.quantity = this.bulkEditForm.quantity;
    if (this.bulkEditForm.costBasis != null) input.costBasis = this.bulkEditForm.costBasis;
    if (this.bulkEditForm.acquisitionDate) input.acquisitionDate = this.bulkEditForm.acquisitionDate;
    if (this.bulkEditForm.notes) input.notes = this.bulkEditForm.notes;

    try {
      // biome-ignore lint/suspicious/noExplicitAny: GraphQL input flexibility
      const result = await execute(BulkUpdateStockMutation, { input: input as any });
      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
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
      const result = await execute(BulkDeleteStockMutation, { input: { ids } });
      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
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
    const productName = this.parentItem?.productName ?? 'Inventory Item';
    const activePage = this.inventoryType === 'sealed' ? 'inventory/sealed' : 'inventory/singles';

    return this.renderPage(
      html`
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
              <span>Loading stock entries...</span>
            </div>
          `,
          () => this.renderTable(),
        )}
        ${this.renderPagination()} ${this.renderBarcodesSection()} ${this.renderAddDialog()} ${this.renderEditDialog()}
        ${this.renderDeleteDialog()} ${this.renderBulkEditDialog()} ${this.renderBulkDeleteDialog()}
        ${this.renderCostBasisWarningDialog()}
      `,
      {
        activePage,
        showUserMenu: true,
        showStoreSelector: this.showStoreSelector,
        onStoreChanged: () => this.fetchDetails(),
      },
    );
  }

  private renderBreadcrumb() {
    const label = this.inventoryType === 'sealed' ? 'Sealed Inventory' : 'Singles Inventory';
    return html`
      <div class="breadcrumb">
        <a href="${this.backUrl}">${label}</a>
        <wa-icon name="chevron-right"></wa-icon>
        <span>Stock Entries</span>
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
            ${this.parentItem
              ? html`
                  Condition: ${renderConditionBadge(this.parentItem.condition)} — Price:
                  <strong>${formatCurrency(this.parentItem.price)}</strong>
                  — ${this.parentItem.gameName} / ${this.parentItem.setName}
                `
              : ''}
          </p>
        </div>
      </div>
    `;
  }

  private renderStatsBar() {
    const stats = computeStockStats(this.stockEntries);
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
          Add Stock Entry
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
    if (this.stockEntries.length === 0 && !this.loading) {
      return html`
        <div class="empty-state">
          <wa-icon name="box-open"></wa-icon>
          <h3>No stock entries</h3>
          <p>Add stock entries to track inventory lots for this item.</p>
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
                <th scope="col">Acquisition Date</th>
                <th scope="col" class="quantity-cell" style="width: 60px;">Qty</th>
                <th scope="col" class="price-cell" style="width: 90px;">Cost Basis</th>
                <th scope="col">Notes</th>
                <th style="width: 100px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.stockEntries.map(
                (stock) => html`
                  <tr>
                    <td>
                      <wa-checkbox
                        .checked="${this.selectedIds.has(stock.id)}"
                        @change="${() => this.toggleItemSelection(stock.id)}"
                      ></wa-checkbox>
                    </td>
                    <td>
                      ${stock.acquisitionDate
                        ? new Date(`${stock.acquisitionDate.slice(0, 10)}T00:00:00`).toLocaleDateString()
                        : '—'}
                    </td>
                    <td class="quantity-cell"><strong>${stock.quantity}</strong></td>
                    <td class="price-cell">${formatCurrency(stock.costBasis)}</td>
                    <td>${stock.notes || '—'}</td>
                    <td class="actions-cell">
                      <wa-button
                        size="small"
                        variant="neutral"
                        title="Edit"
                        @click="${() => this.openEditDialog(stock)}"
                      >
                        <wa-icon name="pencil"></wa-icon>
                      </wa-button>
                      <wa-button
                        size="small"
                        variant="danger"
                        title="Delete"
                        @click="${() => this.openDeleteDialog(stock)}"
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
    if (this.totalPages <= 0 || this.totalCount <= 0) return nothing;
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
                  appearance="plain"
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
                  appearance="plain"
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

  // --- Barcodes Section ---

  private renderBarcodesSection() {
    return html`
      <div style="margin-top: 1.5rem;">
        <h3 style="margin: 0 0 0.75rem 0; font-size: var(--wa-font-size-l); font-weight: 600;">Barcodes</h3>
        ${when(
          this.barcodeLoading,
          () => html`
            <div
              style="display: flex; align-items: center; gap: 0.5rem; color: var(--wa-color-text-muted); font-size: var(--wa-font-size-m);"
            >
              <wa-spinner></wa-spinner> Loading barcodes...
            </div>
          `,
          () => html`
            ${when(
              this.barcodes.length > 0,
              () => html`
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
                  ${this.barcodes.map(
                    (barcode) => html`
                      <wa-tag size="medium">
                        ${barcode.code}
                        <wa-button
                          size="small"
                          variant="neutral"
                          appearance="plain"
                          style="margin-inline-start: 0.25rem; font-size: 0.75rem;"
                          @click="${() => this.handleRemoveBarcode(barcode.id)}"
                        >
                          <wa-icon name="xmark"></wa-icon>
                        </wa-button>
                      </wa-tag>
                    `,
                  )}
                </div>
              `,
              () => html`
                <p style="color: var(--wa-color-text-muted); font-size: var(--wa-font-size-m); margin: 0 0 0.75rem 0;">
                  No barcodes assigned to this item.
                </p>
              `,
            )}
            <div style="display: flex; gap: 0.5rem; align-items: flex-start; max-width: 400px;">
              <wa-input
                placeholder="Enter barcode..."
                .value="${this.newBarcodeInput}"
                @input="${(e: Event) => {
                  this.newBarcodeInput = (e.target as WaInput).value as string;
                }}"
                @keydown="${(e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleAddBarcode();
                  }
                }}"
                style="flex: 1;"
              ></wa-input>
              <wa-button variant="neutral" @click="${this.handleAddBarcode}">
                <wa-icon slot="start" name="plus"></wa-icon>
                Add
              </wa-button>
            </div>
          `,
        )}
      </div>
    `;
  }

  // --- Add Stock Dialog ---

  private renderAddDialog() {
    return html`
      <wa-dialog
        label="Add Stock Entry"
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

          ${this.parentItem
            ? renderProfitSummary(this.parentItem.price, this.addForm.costBasis, this.addForm.quantity)
            : nothing}
        </div>

        <wa-button slot="footer" variant="neutral" @click="${this.closeAddDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="brand" @click="${this.submitAddStock}"> Add Stock Entry </wa-button>
      </wa-dialog>
    `;
  }

  // --- Edit Stock Dialog ---

  private renderEditDialog() {
    if (!this.editingStock) return nothing;
    return html`
      <wa-dialog
        with-footer
        label="Edit Stock Entry"
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

        <div class="form-fields">
          <div class="form-row">
            <wa-input
              autofocus
              label="Quantity *"
              type="number"
              min="0"
              required
              .value="${String(this.editForm.quantity ?? 1)}"
              @input="${(e: Event) => {
                this.editForm = { ...this.editForm, quantity: Number((e.target as WaInput).value) || 0 };
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

          ${this.parentItem
            ? renderProfitSummary(this.parentItem.price, this.editForm.costBasis ?? 0, this.editForm.quantity ?? 1)
            : nothing}
        </div>

        <wa-button slot="footer" variant="neutral" @click="${this.closeEditDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="brand" @click="${this.submitEditStock}">Save Changes</wa-button>
      </wa-dialog>
    `;
  }

  // --- Delete Dialog ---

  private renderDeleteDialog() {
    if (!this.deletingStock) return nothing;
    return html`
      <wa-dialog
        with-footer
        label="Delete Stock Entry"
        ?open="${this.showDeleteDialog}"
        @wa-after-hide="${(e: Event) => {
          if ((e.target as HTMLElement).tagName === 'WA-DIALOG') this.closeDeleteDialog();
        }}"
      >
        <div class="delete-warning">
          <wa-icon name="triangle-exclamation"></wa-icon>
          <div class="delete-warning-text">
            <p>Delete this stock entry?</p>
            <p>
              Qty: ${this.deletingStock.quantity}, Cost: ${formatCurrency(this.deletingStock.costBasis)}, Date:
              ${this.deletingStock.acquisitionDate}
            </p>
          </div>
        </div>
        <wa-button autofocus slot="footer" variant="neutral" @click="${this.closeDeleteDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="danger" @click="${this.submitDeleteStock}">
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
        label="Bulk Edit Stock Entries"
        ?open="${this.showBulkEditDialog}"
        @wa-after-hide="${(e: Event) => {
          if ((e.target as HTMLElement).tagName === 'WA-DIALOG') this.closeBulkEditDialog();
        }}"
      >
        <p>Editing <strong>${this.selectedIds.size}</strong> selected entries. Only filled fields will be updated.</p>
        <div class="form-fields">
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
          </div>

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
            <p>Delete <strong>${this.selectedIds.size}</strong> selected stock entries?</p>
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
