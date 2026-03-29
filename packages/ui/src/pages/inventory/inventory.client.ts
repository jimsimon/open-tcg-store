import { css, html, LitElement, nothing, unsafeCSS } from "lit";
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
import nativeStyle from "@awesome.me/webawesome/dist/styles/native.css?inline";
import utilityStyles from "@awesome.me/webawesome/dist/styles/utilities.css?inline";
import "../../components/ogs-page.ts";
import { execute } from "../../lib/graphql.ts";
import {
  type InventoryItem,
  type ProductSearchResult,
  type ProductPrice,
  TypedDocumentString,
} from "../../graphql/graphql.ts";
import type WaSelect from "@awesome.me/webawesome/dist/components/select/select.js";
import type WaInput from "@awesome.me/webawesome/dist/components/input/input.js";

// --- GraphQL Operations ---

const GetInventoryQuery = new TypedDocumentString(`
  query GetInventory($filters: InventoryFilters, $pagination: PaginationInput) {
    getInventory(filters: $filters, pagination: $pagination) {
      items {
        id
        productId
        productName
        gameName
        setName
        rarity
        isSingle
        isSealed
        condition
        quantity
        price
        costBasis
        acquisitionDate
        notes
        createdAt
        updatedAt
      }
      totalCount
      page
      pageSize
      totalPages
    }
  }
`) as unknown as TypedDocumentString<
  {
    getInventory: {
      items: InventoryItem[];
      totalCount: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  },
  {
    filters?: {
      gameName?: string | null;
      setName?: string | null;
      rarity?: string | null;
      condition?: string | null;
      searchTerm?: string | null;
      includeSingles?: boolean | null;
      includeSealed?: boolean | null;
    } | null;
    pagination?: { page?: number | null; pageSize?: number | null } | null;
  }
>;

const SearchProductsQuery = new TypedDocumentString(`
  query SearchProducts($searchTerm: String!, $game: String) {
    searchProducts(searchTerm: $searchTerm, game: $game) {
      id
      name
      gameName
      setName
      rarity
      imageUrl
      isSingle
      isSealed
      prices {
        subTypeName
        lowPrice
        midPrice
        highPrice
        marketPrice
        directLowPrice
      }
    }
  }
`) as unknown as TypedDocumentString<
  { searchProducts: ProductSearchResult[] },
  { searchTerm: string; game?: string | null }
>;

const AddInventoryItemMutation = new TypedDocumentString(`
  mutation AddInventoryItem($input: AddInventoryItemInput!) {
    addInventoryItem(input: $input) {
      id
      productId
      productName
      gameName
      setName
      rarity
      condition
      quantity
      price
      costBasis
      acquisitionDate
      notes
    }
  }
`) as unknown as TypedDocumentString<
  { addInventoryItem: InventoryItem },
  {
    input: {
      productId: number;
      condition: string;
      quantity: number;
      price: number;
      costBasis?: number | null;
      acquisitionDate?: string | null;
      notes?: string | null;
    };
  }
>;

const UpdateInventoryItemMutation = new TypedDocumentString(`
  mutation UpdateInventoryItem($input: UpdateInventoryItemInput!) {
    updateInventoryItem(input: $input) {
      id
      productId
      productName
      gameName
      setName
      rarity
      condition
      quantity
      price
      costBasis
      acquisitionDate
      notes
    }
  }
`) as unknown as TypedDocumentString<
  { updateInventoryItem: InventoryItem },
  {
    input: {
      id: number;
      condition?: string | null;
      quantity?: number | null;
      price?: number | null;
      costBasis?: number | null;
      acquisitionDate?: string | null;
      notes?: string | null;
    };
  }
>;

const DeleteInventoryItemMutation = new TypedDocumentString(`
  mutation DeleteInventoryItem($id: Int!) {
    deleteInventoryItem(id: $id)
  }
`) as unknown as TypedDocumentString<{ deleteInventoryItem: boolean }, { id: number }>;

const BulkUpdateInventoryMutation = new TypedDocumentString(`
  mutation BulkUpdateInventory($input: BulkUpdateInventoryInput!) {
    bulkUpdateInventory(input: $input) {
      id
    }
  }
`) as unknown as TypedDocumentString<
  { bulkUpdateInventory: { id: number }[] },
  {
    input: {
      ids: number[];
      condition?: string | null;
      quantity?: number | null;
      price?: number | null;
      costBasis?: number | null;
      acquisitionDate?: string | null;
      notes?: string | null;
    };
  }
>;

const BulkDeleteInventoryMutation = new TypedDocumentString(`
  mutation BulkDeleteInventory($input: BulkDeleteInventoryInput!) {
    bulkDeleteInventory(input: $input)
  }
`) as unknown as TypedDocumentString<{ bulkDeleteInventory: boolean }, { input: { ids: number[] } }>;

// --- Interfaces ---

interface AddForm {
  quantity: number;
  condition: string;
  price: number;
  costBasis: number;
  acquisitionDate: string;
  notes: string;
}

interface BulkEditForm {
  condition: string;
  quantity: number | null;
  price: number | null;
  costBasis: number | null;
  acquisitionDate: string;
  notes: string;
}

// --- Debounce utility ---

// biome-ignore lint/suspicious/noExplicitAny: debounce needs flexible typing
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  // biome-ignore lint/suspicious/noExplicitAny: debounce needs flexible typing
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as unknown as T;
}

// --- Component ---

@customElement("ogs-inventory-page")
export class OgsInventoryPage extends LitElement {
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

      .filter-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1rem;
        align-items: flex-end;
      }

      .filter-bar wa-input {
        flex: 1;
        min-width: 200px;
      }

      .filter-bar wa-select {
        min-width: 150px;
      }

      .action-bar {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        align-items: center;
      }

      .table-container {
        overflow-x: auto;
      }

      .wa-table th,
      .wa-table td {
        vertical-align: middle;
      }

      .price-cell {
        text-align: right;
        white-space: nowrap;
      }

      .quantity-cell {
        text-align: center;
      }

      .actions-cell {
        white-space: nowrap;
      }

      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .pagination-info {
        color: var(--wa-color-text-secondary);
        font-size: var(--wa-font-size-s);
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

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 3rem;
      }

      .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--wa-color-text-secondary);
      }

      /* Add Dialog Styles */
      .search-results {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-m);
        margin-top: 0.5rem;
      }

      .search-result-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        transition: background-color 0.15s;
      }

      .search-result-item:hover {
        background-color: var(--wa-color-surface-alt);
      }

      .search-result-item img {
        width: 40px;
        height: 56px;
        object-fit: contain;
        border-radius: var(--wa-border-radius-s);
      }

      .search-result-item .result-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .search-result-item .result-info strong {
        font-size: var(--wa-font-size-s);
      }

      .search-result-item .result-info small {
        color: var(--wa-color-text-secondary);
        font-size: var(--wa-font-size-xs);
      }

      .selected-product {
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-m);
        padding: 1rem;
        margin-top: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .selected-product h3 {
        margin: 0 0 0.25rem 0;
      }

      .selected-product p {
        margin: 0 0 0.5rem 0;
        color: var(--wa-color-text-secondary);
        font-size: var(--wa-font-size-s);
      }

      .product-image {
        max-width: 200px;
        border-radius: var(--wa-border-radius-m);
        margin-bottom: 0.5rem;
      }

      .market-prices {
        margin-top: 0.75rem;
      }

      .market-prices h4 {
        margin: 0 0 0.5rem 0;
        font-size: var(--wa-font-size-s);
      }

      .price-row {
        display: grid;
        grid-template-columns: 1fr repeat(3, auto);
        gap: 0.75rem;
        font-size: var(--wa-font-size-xs);
        padding: 0.25rem 0;
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .price-row:last-child {
        border-bottom: none;
      }

      .profit-summary {
        display: flex;
        gap: 1.5rem;
        padding: 0.75rem;
        margin-top: 0.75rem;
        background: var(--wa-color-surface-alt);
        border-radius: var(--wa-border-radius-m);
        font-size: var(--wa-font-size-s);
        font-weight: 500;
      }

      .form-fields {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 0.75rem;
      }

      .delete-confirm-name {
        font-weight: bold;
      }

      wa-dialog::part(body) {
        max-height: 70vh;
        overflow-y: auto;
      }
    `,
  ];

  // --- Properties ---

  @property({ type: String }) userRole = "";

  // Filter state
  @state() private gameFilter = "";
  @state() private setFilter = "";
  @state() private rarityFilter = "";
  @state() private conditionFilter = "";
  @state() private productTypeFilter = "all";
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
    this.productTypeFilter = params.get("type") ?? "all";
    const page = params.get("page");
    if (page) this.currentPage = Number.parseInt(page, 10) || 1;
  }

  private updateQueryParams() {
    const url = new URL(window.location.href);
    const setOrDelete = (key: string, value: string) => {
      if (value && value !== "all") {
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
    setOrDelete("type", this.productTypeFilter);
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

    const filters: Record<string, unknown> = {};
    if (this.searchTerm) filters.searchTerm = this.searchTerm;
    if (this.gameFilter) filters.gameName = this.gameFilter;
    if (this.setFilter) filters.setName = this.setFilter;
    if (this.rarityFilter) filters.rarity = this.rarityFilter;
    if (this.conditionFilter) filters.condition = this.conditionFilter;

    if (this.productTypeFilter === "singles") {
      filters.includeSingles = true;
      filters.includeSealed = false;
    } else if (this.productTypeFilter === "sealed") {
      filters.includeSingles = false;
      filters.includeSealed = true;
    }

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
      case "productType":
        this.productTypeFilter = value || "all";
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

    // Default condition based on product type
    if (!product.isSingle) {
      this.addForm = { ...this.addForm, condition: "NM" };
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
      <ogs-page activePage="Inventory" userRole="${this.userRole}">
        ${this.renderFilterBar()} ${this.renderActionBar()}
        ${when(
          this.error,
          () => html`
            <wa-alert variant="danger" open closable @wa-after-hide=${() => (this.error = "")}>
              <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
              ${this.error}
            </wa-alert>
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
          @wa-input="${this.handleSearchInput}"
          clearable
        >
          <wa-icon slot="prefix" name="search"></wa-icon>
        </wa-input>
        <wa-select
          placeholder="Game"
          .value="${this.gameFilter}"
          @wa-change="${(e: Event) => this.handleFilterChange("game", e)}"
          clearable
        >
          <wa-option value="">All Games</wa-option>
          <wa-option value="magic">Magic</wa-option>
          <wa-option value="pokemon">Pokemon</wa-option>
        </wa-select>
        <wa-select
          placeholder="Condition"
          .value="${this.conditionFilter}"
          @wa-change="${(e: Event) => this.handleFilterChange("condition", e)}"
          clearable
        >
          <wa-option value="">All Conditions</wa-option>
          <wa-option value="NM">Near Mint</wa-option>
          <wa-option value="LP">Lightly Played</wa-option>
          <wa-option value="MP">Moderately Played</wa-option>
          <wa-option value="HP">Heavily Played</wa-option>
          <wa-option value="D">Damaged</wa-option>
        </wa-select>
        <wa-select
          placeholder="Product Type"
          .value="${this.productTypeFilter}"
          @wa-change="${(e: Event) => this.handleFilterChange("productType", e)}"
        >
          <wa-option value="all">All Types</wa-option>
          <wa-option value="singles">Singles</wa-option>
          <wa-option value="sealed">Sealed</wa-option>
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
          Add Item
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
          <h3>No inventory items found</h3>
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
                  <wa-checkbox ?checked="${this.selectAll}" @wa-change="${this.toggleSelectAll}"></wa-checkbox>
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
                        ?checked="${this.selectedIds.has(item.id)}"
                        @wa-change="${() => this.toggleItemSelection(item.id)}"
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

    // Generate page numbers to show
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
      <wa-dialog label="Add Inventory Item" ?open="${this.showAddDialog}" @wa-after-hide="${this.closeAddDialog}">
        <wa-input
          label="Search Product"
          placeholder="Type to search products..."
          @wa-input="${this.handleProductSearchInput}"
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

              ${when(
                this.selectedProduct!.prices?.length > 0,
                () => html`
                  <div class="market-prices">
                    <h4>Market Prices</h4>
                    ${this.selectedProduct!.prices.map(
                      (p: ProductPrice) => html`
                        <div class="price-row">
                          <span>${p.subTypeName}</span>
                          <span>Low: ${p.lowPrice != null ? `$${p.lowPrice.toFixed(2)}` : "—"}</span>
                          <span>Mid: ${p.midPrice != null ? `$${p.midPrice.toFixed(2)}` : "—"}</span>
                          <span>Market: ${p.marketPrice != null ? `$${p.marketPrice.toFixed(2)}` : "—"}</span>
                        </div>
                      `,
                    )}
                  </div>
                `,
              )}
            </div>

            <div class="form-fields">
              <wa-input
                label="Quantity"
                type="number"
                min="1"
                .value="${String(this.addForm.quantity)}"
                @wa-input="${(e: Event) => {
                  this.addForm = { ...this.addForm, quantity: Number((e.target as WaInput).value) || 1 };
                }}"
              ></wa-input>

              ${when(
                this.selectedProduct!.isSingle,
                () => html`
                  <wa-select
                    label="Condition"
                    .value="${this.addForm.condition}"
                    @wa-change="${(e: Event) => {
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
                `,
              )}

              <wa-input
                label="Price"
                type="number"
                step="0.01"
                min="0"
                .value="${String(this.addForm.price)}"
                @wa-input="${(e: Event) => {
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
                @wa-input="${(e: Event) => {
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
                @wa-input="${(e: Event) => {
                  this.addForm = { ...this.addForm, acquisitionDate: (e.target as WaInput).value as string };
                }}"
              ></wa-input>

              <wa-textarea
                label="Notes"
                maxlength="1000"
                .value="${this.addForm.notes}"
                @wa-input="${(e: Event) => {
                  this.addForm = { ...this.addForm, notes: (e.target as HTMLTextAreaElement).value };
                }}"
              >
                <span slot="help-text">${this.addForm.notes.length}/1000</span>
              </wa-textarea>

              ${this.renderProfitSummary(this.addForm.price, this.addForm.costBasis, this.addForm.quantity)}
            </div>
          `,
        )}

        <wa-button slot="footer" variant="neutral" @click="${this.closeAddDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="brand" ?disabled="${!this.selectedProduct}" @click="${this.submitAddItem}">
          Add Item
        </wa-button>
      </wa-dialog>
    `;
  }

  // --- Edit Item Dialog ---

  private renderEditDialog() {
    if (!this.editingItem) return nothing;

    return html`
      <wa-dialog label="Edit Inventory Item" ?open="${this.showEditDialog}" @wa-after-hide="${this.closeEditDialog}">
        <div class="selected-product">
          <h3>${this.editingItem.productName}</h3>
          <p>${this.editingItem.gameName} — ${this.editingItem.setName}</p>
        </div>

        <div class="form-fields">
          ${when(
            this.editingItem.isSingle,
            () => html`
              <wa-select
                label="Condition"
                .value="${this.editForm.condition ?? ""}"
                @wa-change="${(e: Event) => {
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
            `,
          )}

          <wa-input
            label="Quantity"
            type="number"
            min="1"
            .value="${String(this.editForm.quantity ?? 1)}"
            @wa-input="${(e: Event) => {
              this.editForm = { ...this.editForm, quantity: Number((e.target as WaInput).value) || 1 };
            }}"
          ></wa-input>

          <wa-input
            label="Price"
            type="number"
            step="0.01"
            min="0"
            .value="${String(this.editForm.price ?? 0)}"
            @wa-input="${(e: Event) => {
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
            @wa-input="${(e: Event) => {
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
            @wa-input="${(e: Event) => {
              this.editForm = { ...this.editForm, acquisitionDate: (e.target as WaInput).value as string };
            }}"
          ></wa-input>

          <wa-textarea
            label="Notes"
            maxlength="1000"
            .value="${this.editForm.notes ?? ""}"
            @wa-input="${(e: Event) => {
              this.editForm = { ...this.editForm, notes: (e.target as HTMLTextAreaElement).value };
            }}"
          >
            <span slot="help-text">${(this.editForm.notes ?? "").length}/1000</span>
          </wa-textarea>

          ${this.renderProfitSummary(
            this.editForm.price ?? 0,
            this.editForm.costBasis ?? 0,
            this.editForm.quantity ?? 1,
          )}
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
        @wa-after-hide="${this.closeDeleteDialog}"
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
        label="Bulk Edit Inventory"
        ?open="${this.showBulkEditDialog}"
        @wa-after-hide="${this.closeBulkEditDialog}"
      >
        <p>Editing <strong>${this.selectedIds.size}</strong> selected items. Only filled fields will be updated.</p>

        <div class="form-fields">
          <wa-select
            label="Condition"
            placeholder="Leave unchanged"
            .value="${this.bulkEditForm.condition}"
            clearable
            @wa-change="${(e: Event) => {
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
            @wa-input="${(e: Event) => {
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
            @wa-input="${(e: Event) => {
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
            @wa-input="${(e: Event) => {
              const val = (e.target as WaInput).value;
              this.bulkEditForm = { ...this.bulkEditForm, costBasis: val ? Number.parseFloat(val as string) : null };
            }}"
          ></wa-input>

          <wa-input
            label="Acquisition Date"
            type="date"
            @wa-input="${(e: Event) => {
              this.bulkEditForm = { ...this.bulkEditForm, acquisitionDate: (e.target as WaInput).value as string };
            }}"
          ></wa-input>

          <wa-textarea
            label="Notes"
            maxlength="1000"
            placeholder="Leave unchanged"
            @wa-input="${(e: Event) => {
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
        @wa-after-hide="${this.closeBulkDeleteDialog}"
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

  // --- Profit/Loss Summary ---

  private renderProfitSummary(price: number, costBasis: number, quantity: number) {
    if (!costBasis || costBasis <= 0) return nothing;

    const profitPerUnit = price - costBasis;
    const margin = price > 0 ? (profitPerUnit / price) * 100 : 0;
    const totalPL = profitPerUnit * quantity;

    return html`
      <div class="profit-summary">
        <div style="color: ${profitPerUnit >= 0 ? "var(--wa-color-success-text)" : "var(--wa-color-danger-text)"}">
          P/L per unit: $${profitPerUnit.toFixed(2)}
        </div>
        <div>Margin: ${margin.toFixed(1)}%</div>
        <div style="color: ${totalPL >= 0 ? "var(--wa-color-success-text)" : "var(--wa-color-danger-text)"}">
          Total P/L: $${totalPL.toFixed(2)}
        </div>
      </div>
    `;
  }
}
