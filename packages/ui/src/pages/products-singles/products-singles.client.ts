import { css, html, LitElement, nothing, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { when } from "lit/directives/when.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/select/select.js";
import "@awesome.me/webawesome/dist/components/option/option.js";
import "@awesome.me/webawesome/dist/components/badge/badge.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/checkbox/checkbox.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import nativeStyle from "@awesome.me/webawesome/dist/styles/native.css?inline";
import utilityStyles from "@awesome.me/webawesome/dist/styles/utilities.css?inline";
import "../../components/ogs-page.ts";
import { execute } from "../../lib/graphql.ts";
import type WaSelect from "@awesome.me/webawesome/dist/components/select/select.js";
import type WaInput from "@awesome.me/webawesome/dist/components/input/input.js";
import type WaCheckbox from "@awesome.me/webawesome/dist/components/checkbox/checkbox.js";
import { TypedDocumentString } from "../../graphql/graphql.ts";

// --- Types ---

interface ProductListing {
  id: string;
  name: string;
  setName: string;
  gameName: string;
  rarity: string | null;
  finishes: string[];
  images: { small: string | null; large: string | null } | null;
  totalQuantity: number;
  lowestPrice: string | null;
}

interface ProductListingPage {
  items: ProductListing[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// --- GraphQL Query ---

const GetProductListingsQuery = new TypedDocumentString(`
  query GetProductListings($filters: ProductListingFilters, $pagination: ProductListingPagination) {
    getProductListings(filters: $filters, pagination: $pagination) {
      items {
        id
        name
        setName
        gameName
        rarity
        finishes
        images {
          small
          large
        }
        totalQuantity
        lowestPrice
      }
      totalCount
      page
      pageSize
      totalPages
    }
  }
`) as unknown as TypedDocumentString<
  { getProductListings: ProductListingPage },
  {
    filters?: {
      searchTerm?: string | null;
      setCode?: string | null;
      gameName?: string | null;
      inStockOnly?: boolean | null;
      includeSingles?: boolean | null;
      includeSealed?: boolean | null;
    } | null;
    pagination?: { page?: number | null; pageSize?: number | null } | null;
  }
>;

const GetSetsQuery = new TypedDocumentString(`
  query GetSetsQuery($game: String!, $filters: SetFilters) {
    getSets(game: $game, filters: $filters) {
      code
      name
    }
  }
`) as unknown as TypedDocumentString<
  { getSets: { code: string; name: string }[] },
  { game: string; filters?: { searchTerm?: string | null } | null }
>;

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

@customElement("ogs-products-singles-page")
export class OgsProductsSinglesPage extends LitElement {
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

      .filter-group {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: flex-end;
      }

      .filter-bar wa-select {
        min-width: 150px;
      }

      .search-input {
        margin-left: auto;
        min-width: 200px;
        max-width: 400px;
        flex: 1;
      }

      .in-stock-checkbox {
        display: flex;
        align-items: center;
        padding-bottom: 0.25rem;
      }

      .table-container {
        overflow-x: auto;
      }

      .card-thumbnail {
        width: 60px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--wa-color-text-secondary);
        font-size: 24px;
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

      .card-name-link {
        color: var(--wa-color-text-link);
        text-decoration: none;
      }

      .card-name-link:hover {
        text-decoration: underline;
      }

      .cart-controls {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
        align-items: center;
        justify-content: flex-end;
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

      .out-of-stock {
        color: var(--wa-color-text-secondary);
        font-style: italic;
      }
    `,
  ];

  // --- Properties ---

  @property({ type: String }) userRole = "";
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = "";

  // Filter state
  @state() private gameFilter = "";
  @state() private setFilter = "";
  @state() private searchTerm = "";
  @state() private inStockOnly = true;

  // Sets data
  @state() private sets: { code: string; name: string }[] = [];
  @state() private setsLoading = false;

  // Pagination state
  @state() private currentPage = 1;
  @state() private pageSize = 25;
  @state() private totalCount = 0;
  @state() private totalPages = 0;

  // Data state
  @state() private products: ProductListing[] = [];
  @state() private loading = false;
  @state() private error = "";

  // --- Debounced handlers ---

  private debouncedSearch = debounce(() => {
    this.currentPage = 1;
    this.fetchProducts();
  }, 300);

  // --- Lifecycle ---

  connectedCallback() {
    super.connectedCallback();
    this.loadFiltersFromUrl();
    this.fetchProducts();
    this.fetchSets();
  }

  private loadFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    this.searchTerm = params.get("search") ?? "";
    this.gameFilter = params.get("game") ?? "";
    this.setFilter = params.get("set") ?? "";
    this.inStockOnly = params.get("inStock") !== "false"; // defaults to true
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
    // Only set inStock param when it's false (since true is the default)
    if (!this.inStockOnly) {
      url.searchParams.set("inStock", "false");
    } else {
      url.searchParams.delete("inStock");
    }
    if (this.currentPage > 1) {
      url.searchParams.set("page", String(this.currentPage));
    } else {
      url.searchParams.delete("page");
    }
    window.history.replaceState(null, "", url.toString());
  }

  // --- Data fetching ---

  private async fetchProducts() {
    this.loading = true;
    this.error = "";
    this.updateQueryParams();

    const filters: Record<string, unknown> = {
      includeSingles: true,
      includeSealed: false,
      inStockOnly: this.inStockOnly,
    };
    if (this.searchTerm) filters.searchTerm = this.searchTerm;
    if (this.gameFilter) filters.gameName = this.gameFilter;
    if (this.setFilter) filters.setCode = this.setFilter;

    try {
      const result = await execute(GetProductListingsQuery, {
        filters,
        pagination: { page: this.currentPage, pageSize: this.pageSize },
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(", ");
      } else {
        const data = result.data.getProductListings;
        this.products = data.items;
        this.totalCount = data.totalCount;
        this.totalPages = data.totalPages;
        this.currentPage = data.page;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to load products";
    } finally {
      this.loading = false;
    }
  }

  private async fetchSets() {
    // Only fetch sets if a game is selected
    if (!this.gameFilter) {
      this.sets = [];
      return;
    }

    this.setsLoading = true;
    try {
      const result = await execute(GetSetsQuery, { game: this.gameFilter, filters: {} });
      if (result?.errors?.length) {
        console.error("Failed to load sets:", result.errors);
      } else {
        this.sets = result.data.getSets;
      }
    } catch (e) {
      console.error("Failed to load sets:", e);
    } finally {
      this.setsLoading = false;
    }
  }

  // --- Filter handlers ---

  private handleSearchInput(event: Event) {
    const input = event.target as WaInput;
    this.searchTerm = input.value as string;
    this.debouncedSearch();
  }

  private handleGameFilterChange(event: Event) {
    const select = event.target as WaSelect;
    const value = Array.isArray(select.value) ? select.value.join(",") : (select.value as string);
    this.gameFilter = value;
    this.setFilter = ""; // Reset set filter when game changes
    this.currentPage = 1;
    this.fetchSets();
    this.fetchProducts();
  }

  private handleSetFilterChange(event: Event) {
    const select = event.target as WaSelect;
    const value = Array.isArray(select.value) ? select.value.join(",") : (select.value as string);
    this.setFilter = value;
    this.currentPage = 1;
    this.fetchProducts();
  }

  private handleInStockOnlyChange(event: Event) {
    const checkbox = event.target as WaCheckbox;
    this.inStockOnly = checkbox.checked;
    this.currentPage = 1;
    this.fetchProducts();
  }

  // --- Pagination handlers ---

  private goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.fetchProducts();
  }

  // --- Render ---

  render() {
    return html`
      <ogs-page
        activePage="products/singles"
        userRole="${this.userRole}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
      >
        ${this.renderFilterBar()}
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
          () => this.renderProductTable(),
        )}
        ${this.renderPagination()}
      </ogs-page>
    `;
  }

  // --- Filter Bar ---

  private renderFilterBar() {
    return html`
      <div class="filter-bar">
        <div class="filter-group">
          <wa-select placeholder="Game" value="${this.gameFilter}" @change="${this.handleGameFilterChange}" clearable>
            <wa-option value="">All Games</wa-option>
            <wa-option value="magic">Magic</wa-option>
            <wa-option value="pokemon">Pokemon</wa-option>
          </wa-select>
          ${when(
            this.gameFilter,
            () => html`
              <wa-select
                placeholder="Set"
                value="${this.setFilter}"
                @change="${this.handleSetFilterChange}"
                clearable
                ?disabled="${this.setsLoading}"
              >
                <wa-option value="">All Sets</wa-option>
                ${this.sets.map((set) => html`<wa-option value="${set.code}">${set.name}</wa-option>`)}
              </wa-select>
            `,
          )}
          <div class="in-stock-checkbox">
            <wa-checkbox ?checked="${this.inStockOnly}" @change="${this.handleInStockOnlyChange}">
              In Stock Only
            </wa-checkbox>
          </div>
        </div>
        <wa-input
          class="search-input"
          placeholder="Search products..."
          value="${this.searchTerm}"
          @input="${this.handleSearchInput}"
          clearable
        >
          <wa-icon slot="prefix" name="search"></wa-icon>
        </wa-input>
      </div>
    `;
  }

  // --- Product Table ---

  private renderProductTable() {
    if (this.products.length === 0 && !this.loading) {
      return html`
        <div class="empty-state">
          <wa-icon name="box-open" style="font-size: 3rem; margin-bottom: 1rem;"></wa-icon>
          <h3>No singles products found</h3>
          <p>Try adjusting your filters or uncheck "In Stock Only" to see all products.</p>
        </div>
      `;
    }

    return html`
      <wa-card appearance="outline">
        <div class="table-container">
          <table class="wa-table wa-zebra-rows wa-hover-rows">
            <thead>
              <tr>
                <th class="wa-visually-hidden">Thumbnail</th>
                <th>Name</th>
                <th>Game</th>
                <th>Set</th>
                <th>Rarity</th>
                <th class="quantity-cell">Qty</th>
                <th class="price-cell">Price</th>
                <th class="wa-visually-hidden">Add to Cart</th>
              </tr>
            </thead>
            <tbody>
              ${this.products.map(
                (product) => html`
                  <tr>
                    <td>
                      ${product.images?.small
                        ? html`<a href="${product.images.large}" target="_blank"
                            ><img src="${product.images.small}" alt="${product.name}" class="card-thumbnail"
                          /></a>`
                        : html`<wa-icon name="id-card" variant="regular" class="card-thumbnail"></wa-icon>`}
                    </td>
                    <td>
                      <a href="/products/${product.id}" class="card-name-link">
                        ${product.name.length > 31 ? `${product.name.substring(0, 31)}...` : product.name}
                      </a>
                    </td>
                    <td>${product.gameName}</td>
                    <td>${product.setName.length > 20 ? `${product.setName.substring(0, 20)}...` : product.setName}</td>
                    <td>${product.rarity ?? "—"}</td>
                    <td class="quantity-cell">
                      ${product.totalQuantity > 0 ? product.totalQuantity : html`<span class="out-of-stock">0</span>`}
                    </td>
                    <td class="price-cell">
                      ${product.lowestPrice != null
                        ? html`from $${product.lowestPrice}`
                        : html`<span class="out-of-stock">—</span>`}
                    </td>
                    <td>
                      ${product.totalQuantity > 0
                        ? html`
                            <div class="cart-controls">
                              <wa-input
                                type="number"
                                min="1"
                                max="${product.totalQuantity}"
                                value="1"
                                style="width: 80px;"
                              >
                                <span slot="label" class="wa-visually-hidden">Quantity</span>
                              </wa-input>
                              <wa-button appearance="filled" size="small">
                                <wa-icon name="cart-plus" label="Add to cart"></wa-icon>
                              </wa-button>
                            </div>
                          `
                        : nothing}
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
}
