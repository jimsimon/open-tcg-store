import { css, html, nothing, unsafeCSS, type PropertyValues } from 'lit';
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
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { OgsPageBase } from '../../components/ogs-page-base.ts';
import { execute } from '../../lib/graphql.ts';
import { GetSupportedGamesQuery } from '../../lib/shared-queries.ts';
import type WaSelect from '@awesome.me/webawesome/dist/components/select/select.js';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
import { graphql } from '../../graphql/index.ts';
import { storeUrl } from '../../lib/store-url';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import { cartState } from '../../lib/cart-state.ts';
import {
  productPageStyles,
  filterBarStyles,
  productGridStyles,
  productBadgeStyles,
  paginationStyles,
  emptyStateStyles,
  loadingStateStyles,
  getQuantityBadgeClass,
  formatCurrency,
} from '../products/products-shared.ts';
import { AddToCartMutation } from '../../lib/shared-queries';
import { debounce } from '../../lib/debounce';

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
  lowestPriceInventoryItemId: number | null;
}

interface SetOption {
  code: string;
  name: string;
}

// --- GraphQL ---

const GetProductListingsQuery = graphql(`
  query GetSealedProductListings($filters: ProductListingFilters, $pagination: ProductListingPagination) {
    getProductListings(filters: $filters, pagination: $pagination) {
      items {
        id
        name
        setName
        gameName
        finishes
        images {
          small
          large
        }
        totalQuantity
        lowestPrice
        lowestPriceInventoryItemId
      }
      totalCount
      page
      pageSize
      totalPages
    }
  }
`);

const GetSetsQuery = graphql(`
  query GetSealedSets($game: String!, $filters: SetFilters) {
    getSets(game: $game, filters: $filters) {
      code
      name
    }
  }
`);

// --- Component ---

@customElement('ogs-products-sealed-page')
export class OgsProductsSealedPage extends OgsPageBase {
  static styles = [
    css`
      ${unsafeCSS(nativeStyle)}
    `,
    css`
      ${unsafeCSS(utilityStyles)}
    `,
    productPageStyles,
    filterBarStyles,
    productGridStyles,
    productBadgeStyles,
    paginationStyles,
    emptyStateStyles,
    loadingStateStyles,
  ];

  // --- Properties ---

  @property({ type: Boolean }) showStoreSelector = false;

  // Supported games
  @state() private supportedGames: Array<{ categoryId: number; name: string; displayName: string }> = [];

  // Filter state
  @state() private gameFilter = '';
  @state() private setFilter = '';
  @state() private searchTerm = '';
  @state() private inStockOnly = true;

  // Sets data
  @state() private sets: SetOption[] = [];
  @state() private setsLoading = false;

  // Pagination state
  @state() private currentPage = 1;
  @state() private pageSize = 25;
  @state() private totalCount = 0;
  @state() private totalPages = 0;

  // Data state
  @state() private products: ProductListing[] = [];
  @state() private loading = false;
  @state() private error = '';
  @state() private cartMessage = '';
  @state() private cartError = '';
  @state() private addingToCart = false;

  // Request counter to prevent stale responses from overwriting newer data
  private fetchRequestId = 0;

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
    this.setFilter = params.get('set') ?? '';
    this.inStockOnly = params.get('inStock') !== 'false'; // defaults to true
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
    setOrDelete('set', this.setFilter);
    if (!this.inStockOnly) {
      url.searchParams.set('inStock', 'false');
    } else {
      url.searchParams.delete('inStock');
    }
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

  private async fetchSets() {
    if (!this.gameFilter) {
      this.sets = [];
      return;
    }
    this.setsLoading = true;
    try {
      const result = await execute(GetSetsQuery, { game: this.gameFilter });
      if (result?.data?.getSets) {
        this.sets = result.data.getSets;
      }
    } catch {
      this.sets = [];
    } finally {
      this.setsLoading = false;
    }
  }

  private async fetchProducts() {
    const requestId = ++this.fetchRequestId;
    this.loading = true;
    this.error = '';
    this.updateQueryParams();

    const filters: Record<string, unknown> = {
      includeSingles: false,
      includeSealed: true,
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

      // Discard stale response if a newer request was fired
      if (requestId !== this.fetchRequestId) return;

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        const data = result.data.getProductListings;
        this.products = data.items as ProductListing[];
        this.totalCount = data.totalCount;
        this.totalPages = data.totalPages;
        this.currentPage = data.page;
      }
    } catch (e) {
      // Discard stale error if a newer request was fired
      if (requestId !== this.fetchRequestId) return;
      this.error = e instanceof Error ? e.message : 'Failed to load products';
    } finally {
      if (requestId === this.fetchRequestId) {
        this.loading = false;
      }
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
    const value = Array.isArray(select.value) ? select.value.join(',') : (select.value as string);
    this.gameFilter = value;
    this.setFilter = ''; // reset set when game changes
    this.currentPage = 1;
    this.fetchSets();
    this.fetchProducts();
  }

  private handleSetFilterChange(event: Event) {
    const select = event.target as WaSelect;
    const value = Array.isArray(select.value) ? select.value.join(',') : (select.value as string);
    this.setFilter = value;
    this.currentPage = 1;
    this.fetchProducts();
  }

  // --- Image error handler ---

  private handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.hidden = true;
    const placeholder = img.parentElement?.querySelector('.card-placeholder') as HTMLElement | null;
    if (placeholder) placeholder.hidden = false;
  }

  // --- Pagination handlers ---

  private goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.fetchProducts();
  }

  // --- Add to Cart ---

  private async handleAddToCart(inventoryItemId: number, event: Event) {
    if (this.addingToCart) return;
    this.addingToCart = true;
    this.cartMessage = '';
    this.cartError = '';

    const btn = event.currentTarget as HTMLElement;
    const container = btn?.closest('.product-card-cart');
    const input = container?.querySelector('wa-input') as WaInput | null;
    const quantity = input ? Number.parseInt(input.value as string, 10) || 1 : 1;

    try {
      const result = await execute(AddToCartMutation, {
        cartItem: { inventoryItemId, quantity },
      });

      if (result?.errors?.length) {
        this.cartError = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.cartMessage = `Added ${quantity} item${quantity > 1 ? 's' : ''} to cart`;
        cartState.set(result.data.addToCart);
        setTimeout(() => {
          this.cartMessage = '';
        }, 3000);
      }
    } catch (e) {
      this.cartError = e instanceof Error ? e.message : 'Failed to add to cart';
    } finally {
      this.addingToCart = false;
    }
  }

  // --- Render ---

  render() {
    return this.renderPage(
      html`
        ${this.renderPageHeader()} ${this.renderFilterBar()}
        ${this.cartMessage
          ? html`<wa-callout variant="success" style="margin-bottom: 1rem;">
              <wa-icon slot="icon" name="circle-check"></wa-icon>
              ${this.cartMessage}
            </wa-callout>`
          : nothing}
        ${this.cartError
          ? html`<wa-callout variant="danger" style="margin-bottom: 1rem;">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              ${this.cartError}
            </wa-callout>`
          : nothing}
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
          () => this.renderLoadingState(),
          () => this.renderProductGrid(),
        )}
        ${this.renderPagination()}
      `,
      {
        activePage: 'products/sealed',
        showUserMenu: true,
        showCartButton: true,
        showStoreSelector: this.showStoreSelector,
        onStoreChanged: () => this.fetchProducts(),
        onOrderSubmitted: () => this.fetchProducts(),
      },
    );
  }

  // --- Page Header ---

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="box" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Sealed Products</h2>
          <p>Browse booster boxes, bundles, and other sealed products</p>
        </div>
      </div>
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
          <wa-icon slot="prefix" name="magnifying-glass"></wa-icon>
        </wa-input>
        <wa-select placeholder="Game" .value="${this.gameFilter}" @change="${this.handleGameFilterChange}" clearable>
          <wa-option value="">All Games</wa-option>
          ${this.supportedGames.map((g) => html`<wa-option value="${g.name}">${g.displayName}</wa-option>`)}
        </wa-select>
        <wa-select
          placeholder="Set"
          .value="${this.setFilter}"
          @change="${this.handleSetFilterChange}"
          clearable
          ?disabled="${!this.gameFilter || this.setsLoading}"
        >
          <wa-option value="">All Sets</wa-option>
          ${this.sets.map((s) => html`<wa-option value="${s.code}">${s.name}</wa-option>`)}
        </wa-select>
        <label
          class="in-stock-toggle ${this.inStockOnly ? 'active' : ''}"
          @click="${(e: Event) => {
            e.preventDefault();
            this.inStockOnly = !this.inStockOnly;
            this.currentPage = 1;
            this.fetchProducts();
          }}"
          @keydown="${(e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.inStockOnly = !this.inStockOnly;
              this.currentPage = 1;
              this.fetchProducts();
            }
          }}"
          tabindex="0"
          role="checkbox"
          aria-checked="${this.inStockOnly}"
        >
          <wa-checkbox ?checked="${this.inStockOnly}" tabindex="-1"></wa-checkbox>
          <span>In Stock Only</span>
        </label>
      </div>
    `;
  }

  // --- Loading State ---

  private renderLoadingState() {
    return html`
      <div class="loading-container">
        <wa-spinner></wa-spinner>
        <span class="loading-text">Loading products...</span>
      </div>
    `;
  }

  // --- Product Grid ---

  private renderProductGrid() {
    if (this.products.length === 0 && !this.loading) {
      return html`
        <div class="empty-state">
          <wa-icon name="box"></wa-icon>
          <h3>No sealed products found</h3>
          <p>Try adjusting your filters or uncheck "In Stock Only" to see all products.</p>
        </div>
      `;
    }

    return html`
      <div class="products-grid">
        ${this.products.map(
          (product) => html`
            <wa-card appearance="outlined">
              <a class="product-card-link" href="${storeUrl(`/products/${product.id}`)}">
                <div class="product-card-image">
                  ${product.images?.small
                    ? html`<img
                        src="${product.images.small}"
                        alt="${product.name}"
                        @error="${this.handleImageError}"
                      />`
                    : nothing}
                  <div class="card-placeholder" ?hidden="${!!product.images?.small}">
                    <wa-icon name="box" variant="regular"></wa-icon>
                  </div>
                </div>
                <div class="product-card-content">
                  <div class="product-card-name">${product.name}</div>
                  <div class="product-card-meta">
                    <span class="game-badge ${product.gameName.toLowerCase()}">${product.gameName}</span>
                    <span>${product.setName}</span>
                  </div>
                  <div class="product-card-badges">
                    <span class="quantity-badge ${getQuantityBadgeClass(product.totalQuantity)}">
                      ${product.totalQuantity > 0 ? `${product.totalQuantity} avail` : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </a>
              <div slot="footer">
                <div class="product-card-price-row">
                  <span class="product-price">
                    ${product.lowestPrice != null
                      ? formatCurrency(Number(product.lowestPrice))
                      : html`<span class="out-of-stock-text">—</span>`}
                  </span>
                </div>
                ${product.totalQuantity > 0
                  ? html`
                      <div class="product-card-cart">
                        <wa-input type="number" min="1" max="${product.totalQuantity}" value="1">
                          <span slot="label" class="wa-visually-hidden">Quantity</span>
                        </wa-input>
                        <wa-button
                          appearance="filled"
                          size="small"
                          ?disabled="${this.addingToCart}"
                          @click="${(e: Event) => this.handleAddToCart(product.lowestPriceInventoryItemId!, e)}"
                        >
                          <wa-icon name="cart-plus" slot="prefix"></wa-icon>
                          Add
                        </wa-button>
                      </div>
                    `
                  : nothing}
              </div>
            </wa-card>
          `,
        )}
      </div>
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
        <span class="pagination-info">
          <wa-icon name="list" style="font-size: 1rem;"></wa-icon>
          Showing ${start}–${end} of ${this.totalCount}
        </span>
        <div class="pagination-buttons">
          <wa-button
            size="small"
            variant="neutral"
            ?disabled="${this.currentPage === 1}"
            @click="${() => this.goToPage(this.currentPage - 1)}"
          >
            <wa-icon name="chevron-left" style="font-size: 0.875rem;"></wa-icon>
          </wa-button>
          ${pages.map(
            (p) => html`
              <wa-button
                size="small"
                variant="${p === this.currentPage ? 'neutral' : 'ghost'}"
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
            <wa-icon name="chevron-right" style="font-size: 0.875rem;"></wa-icon>
          </wa-button>
        </div>
      </div>
    `;
  }
}
