import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { when } from "lit/directives/when.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/select/select.js";
import "@awesome.me/webawesome/dist/components/option/option.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/checkbox/checkbox.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/dialog/dialog.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/textarea/textarea.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";
import "../../components/ogs-page.ts";
import { execute } from "../../lib/graphql.ts";
import type WaSelect from "@awesome.me/webawesome/dist/components/select/select.js";
import type WaInput from "@awesome.me/webawesome/dist/components/input/input.js";
import {
  type AddForm,
  type BulkEditForm,
  type InventoryItem,
  type ProductSearchResult,
  GetInventoryQuery,
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
} from "../inventory/inventory-shared.ts";

// --- Component ---

@customElement("ogs-inventory-singles-page")
export class OgsInventorySinglesPage extends LitElement {
  static styles = sharedInventoryStyles;

  // --- Properties ---

  @property({ type: String }) userRole = "";
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = "";

  // Filter state
  @state() private gameFilter = "";
  @state() private setFilter = "";
  @state() private rarityFilter = "";
  @state() private conditionFilter = "";
  @state() private searchTerm = "";

  // Pagination state
  @state() private currentPage = 1;
  @state() private pageSize = 25;
  @state() private totalCount = 0;
  @state() private totalPages = 0;

  // Data state
  @state() private inventoryItems: InventoryItem[] = [];
  @state() private loading = false;
  @state() private error = "";

  // Selection state
  @state() private selectedIds: Set<number> = new Set();
  @state() private selectAll = false;

  // Dialog state
  @state() private showAddDialog = false;
  @state() private showEditDialog = false;
  @state() private showBulkEditDialog = false;
  @state() private showDeleteDialog = false;
  @state() private showBulkDeleteDialog = false;
  @state() private editingItem: InventoryItem | null = null;
  @state() private deletingItem: InventoryItem | null = null;

  // Add dialog state
  @state() private searchResults: ProductSearchResult[] = [];
  @state() private selectedProduct: ProductSearchResult | null = null;
  @state() private productSearchLoading = false;
  @state() private productSearchTerm = "";
  @state() private addForm: AddForm = {
    quantity: 1,
    condition: "NM",
    price: 0,
    costBasis: 0,
    acquisitionDate: "",
    notes: "",
  };

  // Edit form state
  @state() private editForm: Partial<{
    condition: string;
    quantity: number;
    price: number;
    costBasis: number;
    acquisitionDate: string;
    notes: string;
  }> = {};

  // Bulk edit form state
  @state() private bulkEditForm: BulkEditForm = {
    condition: "",
    quantity: null,
    price: null,
    costBasis: null,
    acquisitionDate: "",
    notes: "",
  };

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
  }

  private loadFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    this.searchTerm = params.get("search") ?? "";
    this.gameFilter = params.get("game") ?? "";
    this.setFilter = params.get("set") ?? "";
    this.rarityFilter = params.get("rarity") ?? "";
    this.conditionFilter = params.get("condition") ?? "";
    const page = params.get("page");
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
    setOrDelete("search", this.searchTerm);
    setOrDelete("game", this.gameFilter);
    setOrDelete("set", this.setFilter);
    setOrDelete("rarity", this.rarityFilter);
    setOrDelete("condition", this.conditionFilter);
    if (this.currentPage > 1) {
      url.searchParams.set("page", String(this.currentPage));
    } else {
      url.searchParams.delete("page");
    }
    window.history.replaceState(null, "", url.toString());
  }

  // --- Data fetching ---

  private async fetchInventory() {
    this.loading = true;
    this.error = "";
    this.updateQueryParams();

    const filters: Record<string, unknown> = {
      includeSingles: true,
      includeSealed: false,
    };
    if (this.searchTerm) filters.searchTerm = this.searchTerm;
    if (this.gameFilter) filters.gameName = this.gameFilter;
    if (this.setFilter) filters.setName = this.setFilter;
    if (this.rarityFilter) filters.rarity = this.rarityFilter;
    if (this.conditionFilter) filters.condition = this.conditionFilter;

    try {
      const result = await execute(GetInventoryQuery, {
        filters,
        pagination: { page: this.currentPage, pageSize: this.pageSize },
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e) => e.message).join(", ");
      } else {
        const data = result.data.getInventory;
        this.inventoryItems = data.items;
        this.totalCount = data.totalCount;
        this.totalPages = data.totalPages;
        this.currentPage = data.page;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to load inventory";
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
        console.error("Search error:", result.errors);
        this.searchResults = [];
      } else {
        this.searchResults = result.data.searchProducts;
      }
    } catch (e) {
      console.error("Search failed:", e);
      this.searchResults = [];
    } finally {
      this.productSearchLoading = false;
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
    const value = Array.isArray(select.value) ? select.value.join(",") : (select.value as string);

    switch (field) {
      case "game":
        this.gameFilter = value;
        break;
      case "set":
        this.setFilter = value;
        break;
      case "rarity":
        this.rarityFilter = value;
        break;
      case "condition":
        this.conditionFilter = value;
        break;
    }

    this.currentPage = 1;
    this.fetchInventory();
  }

  // --- Selection handlers ---

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
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    this.selectedIds = newSet;
    this.selectAll = newSet.size === this.inventoryItems.length && this.inventoryItems.length > 0;
  }

  // --- Pagination handlers ---

  private goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.selectedIds = new Set();
    this.selectAll = false;
    this.fetchInventory();
  }

  // --- Dialog handlers ---

  private openAddDialog() {
    this.showAddDialog = true;
    this.searchResults = [];
    this.selectedProduct = null;
    this.addForm = {
      quantity: 1,
      condition: "NM",
      price: 0,
      costBasis: 0,
      acquisitionDate: "",
      notes: "",
    };
  }

  private closeAddDialog() {
    this.showAddDialog = false;
    this.searchResults = [];
    this.selectedProduct = null;
    this.productSearchTerm = "";
  }

  private openEditDialog(item: InventoryItem) {
    this.editingItem = item;
    this.editForm = {
      condition: item.condition ?? "NM",
      quantity: item.quantity,
      price: item.price,
      costBasis: item.costBasis ?? 0,
      acquisitionDate: item.acquisitionDate ?? "",
      notes: item.notes ?? "",
    };
    this.showEditDialog = true;
  }

  private closeEditDialog() {
    this.showEditDialog = false;
    this.editingItem = null;
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
    this.bulkEditForm = {
      condition: "",
      quantity: null,
      price: null,
      costBasis: null,
      acquisitionDate: "",
      notes: "",
    };
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

  // --- Product search for Add dialog ---

  private handleProductSearchInput(event: Event) {
    const input = event.target as WaInput;
    const term = input.value as string;
    this.productSearchTerm = term;
    this.debouncedProductSearch(term);
  }

  private selectProduct(product: ProductSearchResult) {
    this.selectedProduct = product;
    this.searchResults = [];

    // Auto-fill price from market price if available
    const firstPrice = product.prices?.[0];
    if (firstPrice?.marketPrice) {
      this.addForm = { ...this.addForm, price: firstPrice.marketPrice };
    } else if (firstPrice?.midPrice) {
      this.addForm = { ...this.addForm, price: firstPrice.midPrice };
    }
  }

  // --- Mutation handlers ---

  private async submitAddItem() {
    if (!this.selectedProduct) return;

    try {
      const result = await execute(AddInventoryItemMutation, {
        input: {
          productId: this.selectedProduct.id,
          condition: this.addForm.condition,
          quantity: this.addForm.quantity,
          price: this.addForm.price,
          costBasis: this.addForm.costBasis || null,
          acquisitionDate: this.addForm.acquisitionDate || null,
          notes: this.addForm.notes || null,
        },
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e) => e.message).join(", ");
      } else {
        this.closeAddDialog();
        this.fetchInventory();
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to add item";
    }
  }

  private async submitEditItem() {
    if (!this.editingItem) return;

    try {
      const result = await execute(UpdateInventoryItemMutation, {
        input: {
          id: this.editingItem.id,
          condition: this.editForm.condition ?? null,
          quantity: this.editForm.quantity ?? null,
          price: this.editForm.price ?? null,
          costBasis: this.editForm.costBasis ?? null,
          acquisitionDate: this.editForm.acquisitionDate || null,
          notes: this.editForm.notes ?? null,
        },
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e) => e.message).join(", ");
      } else {
        this.closeEditDialog();
        this.fetchInventory();
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to update item";
    }
  }

  private async submitDeleteItem() {
    if (!this.deletingItem) return;

    try {
      const result = await execute(DeleteInventoryItemMutation, {
        id: this.deletingItem.id,
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e) => e.message).join(", ");
      } else {
        this.closeDeleteDialog();
        this.fetchInventory();
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to delete item";
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
      // biome-ignore lint/suspicious/noExplicitAny: GraphQL input type flexibility
      const result = await execute(BulkUpdateInventoryMutation, { input: input as any });

      if (result?.errors?.length) {
        this.error = result.errors.map((e) => e.message).join(", ");
      } else {
        this.closeBulkEditDialog();
        this.selectedIds = new Set();
        this.selectAll = false;
        this.fetchInventory();
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to bulk update";
    }
  }

  private async submitBulkDelete() {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) return;

    try {
      const result = await execute(BulkDeleteInventoryMutation, {
        input: { ids },
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e) => e.message).join(", ");
      } else {
        this.closeBulkDeleteDialog();
        this.selectedIds = new Set();
        this.selectAll = false;
        this.fetchInventory();
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to bulk delete";
    }
  }

  // --- Render ---

  render() {
    return html`
      <ogs-page
        activePage="inventory/singles"
        userRole="${this.userRole}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
      >
        ${this.renderFilterBar()} ${this.renderActionBar()}
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
          () => html`<div class="loading-container"><wa-spinner style="font-size: 2rem;"></wa-spinner></div>`,
          () => this.renderInventoryTable(),
        )}
        ${this.renderPagination()} ${this.renderAddDialog()} ${this.renderEditDialog()} ${this.renderDeleteDialog()}
        ${this.renderBulkEditDialog()} ${this.renderBulkDeleteDialog()}
      </ogs-page>
    `;
  }

  // --- Filter Bar ---

  private renderFilterBar() {
    return html`
      <div class="filter-bar">
        <wa-input
          placeholder="Search products..."
          .value="${this.searchTerm}"
          @input="${this.handleSearchInput}"
          clearable
        >
          <wa-icon slot="prefix" name="search"></wa-icon>
        </wa-input>
        <wa-select
          placeholder="Game"
          .value="${this.gameFilter}"
          @change="${(e: Event) => this.handleFilterChange("game", e)}"
          clearable
        >
          <wa-option value="">All Games</wa-option>
          <wa-option value="magic">Magic</wa-option>
          <wa-option value="pokemon">Pokemon</wa-option>
        </wa-select>
        <wa-select
          placeholder="Condition"
          .value="${this.conditionFilter}"
          @change="${(e: Event) => this.handleFilterChange("condition", e)}"
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
    const selectionCount = this.selectedIds.size;
    return html`
      <div class="action-bar">
        <wa-button variant="brand" @click="${this.openAddDialog}">
          <wa-icon slot="prefix" name="plus"></wa-icon>
          Add Single
        </wa-button>
        <wa-button variant="neutral" href="/inventory/import">
          <wa-icon slot="prefix" name="upload"></wa-icon>
          Import
        </wa-button>
        <wa-button variant="neutral" ?disabled="${selectionCount === 0}" @click="${this.openBulkEditDialog}">
          <wa-icon slot="prefix" name="pencil"></wa-icon>
          Bulk Edit${selectionCount > 0 ? ` (${selectionCount})` : ""}
        </wa-button>
        <wa-button variant="danger" ?disabled="${selectionCount === 0}" @click="${this.openBulkDeleteDialog}">
          <wa-icon slot="prefix" name="trash"></wa-icon>
          Bulk Delete${selectionCount > 0 ? ` (${selectionCount})` : ""}
        </wa-button>
      </div>
    `;
  }

  // --- Inventory Table ---

  private renderInventoryTable() {
    if (this.inventoryItems.length === 0 && !this.loading) {
      return html`
        <div class="empty-state">
          <wa-icon name="box-open" style="font-size: 3rem; margin-bottom: 1rem;"></wa-icon>
          <h3>No singles inventory items found</h3>
          <p>Add items to your inventory or adjust your filters.</p>
        </div>
      `;
    }

    return html`
      <wa-card appearance="outline">
        <div class="table-container">
          <table class="wa-table wa-zebra-rows wa-hover-rows">
            <thead>
              <tr>
                <th>
                  <wa-checkbox .checked="${this.selectAll}" @change="${this.toggleSelectAll}"></wa-checkbox>
                </th>
                <th>Product</th>
                <th>Game</th>
                <th>Set</th>
                <th>Rarity</th>
                <th>Condition</th>
                <th class="quantity-cell">Qty</th>
                <th class="price-cell">Price</th>
                <th class="price-cell">Cost Basis</th>
                <th>Actions</th>
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
                    <td>${item.productName}</td>
                    <td>${item.gameName}</td>
                    <td>${item.setName}</td>
                    <td>${item.rarity ?? "—"}</td>
                    <td>${item.condition ?? "—"}</td>
                    <td class="quantity-cell">${item.quantity}</td>
                    <td class="price-cell">$${item.price.toFixed(2)}</td>
                    <td class="price-cell">${item.costBasis != null ? `$${item.costBasis.toFixed(2)}` : "—"}</td>
                    <td class="actions-cell">
                      <wa-button size="small" variant="neutral" @click="${() => this.openEditDialog(item)}">
                        <wa-icon name="pencil"></wa-icon>
                      </wa-button>
                      <wa-button size="small" variant="neutral" @click="${() => this.openDeleteDialog(item)}">
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

  // --- Pagination ---

  private renderPagination() {
    if (this.totalPages <= 1) return nothing;

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
        <span class="pagination-info">Showing ${start}–${end} of ${this.totalCount}</span>
        <div class="pagination-buttons">
          <wa-button
            size="small"
            variant="neutral"
            ?disabled="${this.currentPage === 1}"
            @click="${() => this.goToPage(this.currentPage - 1)}"
          >
            Previous
          </wa-button>
          ${pages.map(
            (p) => html`
              <wa-button
                size="small"
                variant="${p === this.currentPage ? "brand" : "neutral"}"
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
            Next
          </wa-button>
        </div>
      </div>
    `;
  }

  // --- Add Item Dialog ---

  private renderAddDialog() {
    return html`
      <wa-dialog
        label="Add Singles Inventory Item"
        ?open="${this.showAddDialog}"
        @wa-after-hide="${(e: Event) => {
          if ((e.target as HTMLElement).tagName === "WA-DIALOG") this.closeAddDialog();
        }}"
      >
        <wa-input
          label="Search Product"
          placeholder="Type to search products..."
          .value="${this.productSearchTerm}"
          @input="${this.handleProductSearchInput}"
        >
          <wa-icon slot="prefix" name="search"></wa-icon>
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
              <h3>${this.selectedProduct!.name}</h3>
              <p>${this.selectedProduct!.gameName} — ${this.selectedProduct!.setName}</p>

              ${renderMarketPrices(this.selectedProduct!.prices)}
            </div>

            <div class="form-fields">
              <wa-input
                label="Quantity"
                type="number"
                min="1"
                .value="${String(this.addForm.quantity)}"
                @input="${(e: Event) => {
                  this.addForm = { ...this.addForm, quantity: Number((e.target as WaInput).value) || 1 };
                }}"
              ></wa-input>

              <wa-select
                label="Condition"
                .value="${this.addForm.condition}"
                @change="${(e: Event) => {
                  const val = (e.target as WaSelect).value;
                  this.addForm = { ...this.addForm, condition: (Array.isArray(val) ? val[0] : val) as string };
                }}"
              >
                <wa-option value="NM">Near Mint</wa-option>
                <wa-option value="LP">Lightly Played</wa-option>
                <wa-option value="MP">Moderately Played</wa-option>
                <wa-option value="HP">Heavily Played</wa-option>
                <wa-option value="D">Damaged</wa-option>
              </wa-select>

              <wa-input
                label="Price"
                type="number"
                step="0.01"
                min="0"
                .value="${String(this.addForm.price)}"
                @input="${(e: Event) => {
                  this.addForm = {
                    ...this.addForm,
                    price: Number.parseFloat((e.target as WaInput).value as string) || 0,
                  };
                }}"
              ></wa-input>

              <wa-input
                label="Cost Basis"
                type="number"
                step="0.01"
                min="0"
                .value="${String(this.addForm.costBasis)}"
                @input="${(e: Event) => {
                  this.addForm = {
                    ...this.addForm,
                    costBasis: Number.parseFloat((e.target as WaInput).value as string) || 0,
                  };
                }}"
              ></wa-input>

              <wa-input
                label="Acquisition Date"
                type="date"
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
          Add Single
        </wa-button>
      </wa-dialog>
    `;
  }

  // --- Edit Item Dialog ---

  private renderEditDialog() {
    if (!this.editingItem) return nothing;

    return html`
      <wa-dialog
        label="Edit Inventory Item"
        ?open="${this.showEditDialog}"
        @wa-after-hide="${(e: Event) => {
          if ((e.target as HTMLElement).tagName === "WA-DIALOG") this.closeEditDialog();
        }}"
      >
        <div class="selected-product">
          <h3>${this.editingItem.productName}</h3>
          <p>${this.editingItem.gameName} — ${this.editingItem.setName}</p>
        </div>

        <div class="form-fields">
          <wa-select
            label="Condition"
            .value="${this.editForm.condition ?? ""}"
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

          <wa-input
            label="Quantity"
            type="number"
            min="1"
            .value="${String(this.editForm.quantity ?? 1)}"
            @input="${(e: Event) => {
              this.editForm = { ...this.editForm, quantity: Number((e.target as WaInput).value) || 1 };
            }}"
          ></wa-input>

          <wa-input
            label="Price"
            type="number"
            step="0.01"
            min="0"
            .value="${String(this.editForm.price ?? 0)}"
            @input="${(e: Event) => {
              this.editForm = {
                ...this.editForm,
                price: Number.parseFloat((e.target as WaInput).value as string) || 0,
              };
            }}"
          ></wa-input>

          <wa-input
            label="Cost Basis"
            type="number"
            step="0.01"
            min="0"
            .value="${String(this.editForm.costBasis ?? 0)}"
            @input="${(e: Event) => {
              this.editForm = {
                ...this.editForm,
                costBasis: Number.parseFloat((e.target as WaInput).value as string) || 0,
              };
            }}"
          ></wa-input>

          <wa-input
            label="Acquisition Date"
            type="date"
            .value="${this.editForm.acquisitionDate ?? ""}"
            @input="${(e: Event) => {
              this.editForm = { ...this.editForm, acquisitionDate: (e.target as WaInput).value as string };
            }}"
          ></wa-input>

          <wa-textarea
            label="Notes"
            maxlength="1000"
            .value="${this.editForm.notes ?? ""}"
            @input="${(e: Event) => {
              this.editForm = { ...this.editForm, notes: (e.target as HTMLTextAreaElement).value };
            }}"
          >
            <span slot="help-text">${(this.editForm.notes ?? "").length}/1000</span>
          </wa-textarea>

          ${renderProfitSummary(this.editForm.price ?? 0, this.editForm.costBasis ?? 0, this.editForm.quantity ?? 1)}
        </div>

        <wa-button slot="footer" variant="neutral" @click="${this.closeEditDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="brand" @click="${this.submitEditItem}">Save Changes</wa-button>
      </wa-dialog>
    `;
  }

  // --- Delete Confirmation Dialog ---

  private renderDeleteDialog() {
    if (!this.deletingItem) return nothing;

    return html`
      <wa-dialog
        label="Delete Inventory Item"
        ?open="${this.showDeleteDialog}"
        @wa-after-hide="${(e: Event) => {
          if ((e.target as HTMLElement).tagName === "WA-DIALOG") this.closeDeleteDialog();
        }}"
      >
        <p>
          Are you sure you want to delete
          <span class="delete-confirm-name">${this.deletingItem.productName}</span>?
        </p>
        <p>This action cannot be undone.</p>

        <wa-button slot="footer" variant="neutral" @click="${this.closeDeleteDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="danger" @click="${this.submitDeleteItem}">Delete</wa-button>
      </wa-dialog>
    `;
  }

  // --- Bulk Edit Dialog ---

  private renderBulkEditDialog() {
    return html`
      <wa-dialog
        label="Bulk Edit Singles Inventory"
        ?open="${this.showBulkEditDialog}"
        @wa-after-hide="${(e: Event) => {
          if ((e.target as HTMLElement).tagName === "WA-DIALOG") this.closeBulkEditDialog();
        }}"
      >
        <p>Editing <strong>${this.selectedIds.size}</strong> selected items. Only filled fields will be updated.</p>

        <div class="form-fields">
          <wa-select
            label="Condition"
            placeholder="Leave unchanged"
            .value="${this.bulkEditForm.condition}"
            clearable
            @change="${(e: Event) => {
              const val = (e.target as WaSelect).value;
              this.bulkEditForm = { ...this.bulkEditForm, condition: (Array.isArray(val) ? val[0] : val) as string };
            }}"
          >
            <wa-option value="NM">Near Mint</wa-option>
            <wa-option value="LP">Lightly Played</wa-option>
            <wa-option value="MP">Moderately Played</wa-option>
            <wa-option value="HP">Heavily Played</wa-option>
            <wa-option value="D">Damaged</wa-option>
          </wa-select>

          <wa-input
            label="Quantity"
            type="number"
            min="1"
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
          Update ${this.selectedIds.size} Items
        </wa-button>
      </wa-dialog>
    `;
  }

  // --- Bulk Delete Dialog ---

  private renderBulkDeleteDialog() {
    return html`
      <wa-dialog
        label="Bulk Delete Inventory"
        ?open="${this.showBulkDeleteDialog}"
        @wa-after-hide="${(e: Event) => {
          if ((e.target as HTMLElement).tagName === "WA-DIALOG") this.closeBulkDeleteDialog();
        }}"
      >
        <p>Are you sure you want to delete <strong>${this.selectedIds.size}</strong> selected items?</p>
        <p>This action cannot be undone.</p>

        <wa-button slot="footer" variant="neutral" @click="${this.closeBulkDeleteDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="danger" @click="${this.submitBulkDelete}">
          Delete ${this.selectedIds.size} Items
        </wa-button>
      </wa-dialog>
    `;
  }
}
