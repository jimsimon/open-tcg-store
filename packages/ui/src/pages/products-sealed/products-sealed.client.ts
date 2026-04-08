import { css, html, LitElement, nothing, unsafeCSS, type PropertyValues } from 'lit';
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
import '../../components/ogs-page.ts';
import { execute } from '../../lib/graphql.ts';
import type WaSelect from '@awesome.me/webawesome/dist/components/select/select.js';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
import { TypedDocumentString } from '../../graphql/graphql.ts';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import { cartState } from '../../lib/cart-state.ts';
import {
  productPageStyles,
  filterBarStyles,
  productTableStyles,
  cartControlsStyles,
  paginationStyles,
  emptyStateStyles,
  loadingStateStyles,
  getQuantityBadgeClass,
} from '../products/products-shared.ts';

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

interface ProductListingPage {
  items: ProductListing[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// --- GraphQL ---

const AddToCartMutation = new TypedDocumentString(`
  mutation AddToCart($cartItem: CartItemInput!) {
    addToCart(cartItem: $cartItem) {
      items {
        inventoryItemId
        productId
        productName
        condition
        quantity
        unitPrice
        maxAvailable
      }
    }
  }
`) as unknown as TypedDocumentString<
  {
    addToCart: {
      items: {
        inventoryItemId: number;
        productId: number;
        productName: string;
        condition: string;
        quantity: number;
        unitPrice: number;
        maxAvailable: number;
      }[];
    };
  },
  { cartItem: { inventoryItemId: number; quantity: number } }
>;

const GetProductListingsQuery = new TypedDocumentString(`
  query GetProductListings($filters: ProductListingFilters, $pagination: ProductListingPagination) {
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
`) as unknown as TypedDocumentString<
  { getProductListings: ProductListingPage },
  {
    filters?: {
      searchTerm?: string | null;
      gameName?: string | null;
      inStockOnly?: boolean | null;
      includeSingles?: boolean | null;
      includeSealed?: boolean | null;
    } | null;
    pagination?: { page?: number | null; pageSize?: number | null } | null;
  }
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

@customElement('ogs-products-sealed-page')
export class OgsProductsSealedPage extends LitElement {
  static styles = [
    css`
      ${unsafeCSS(nativeStyle)}
    `,
    css`
      ${unsafeCSS(utilityStyles)}
    `,
    productPageStyles,
    filterBarStyles,
    productTableStyles,
    cartControlsStyles,
    paginationStyles,
    emptyStateStyles,
    loadingStateStyles,
    css`
      :host {
        box-sizing: border-box;
        display: block;
      }
    `,
  ];

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

  // Filter state (no Set or Condition for sealed)
  @state() private gameFilter = '';
  @state() private searchTerm = '';
  @state() private inStockOnly = true;

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

  private async fetchProducts() {
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

    try {
      const result = await execute(GetProductListingsQuery, {
        filters,
        pagination: { page: this.currentPage, pageSize: this.pageSize },
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        const data = result.data.getProductListings;
        this.products = data.items;
        this.totalCount = data.totalCount;
        this.totalPages = data.totalPages;
        this.currentPage = data.page;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load products';
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

  private handleGameFilterChange(event: Event) {
    const select = event.target as WaSelect;
    const value = Array.isArray(select.value) ? select.value.join(',') : (select.value as string);
    this.gameFilter = value;
    this.currentPage = 1;
    this.fetchProducts();
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
    const container = btn?.closest('.cart-controls');
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
    return html`
      <ogs-page
        activePage="products/sealed"
        ?showUserMenu="${true}"
        ?showCartButton="${true}"
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
        @store-changed="${() => this.fetchProducts()}"
        @order-submitted="${() => this.fetchProducts()}"
      >
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
          () => this.renderProductTable(),
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
          <wa-icon name="box" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Sealed Products</h2>
          <p>Browse booster boxes, bundles, and other sealed products</p>
        </div>
      </div>
    `;
  }

  // --- Filter Bar (no Set filter for sealed) ---

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
          <wa-option value="magic">Magic</wa-option>
          <wa-option value="pokemon">Pokemon</wa-option>
        </wa-select>
        <div
          class="in-stock-toggle ${this.inStockOnly ? 'active' : ''}"
          @click="${() => {
            this.inStockOnly = !this.inStockOnly;
            this.currentPage = 1;
            this.fetchProducts();
          }}"
        >
          <wa-checkbox ?checked="${this.inStockOnly}"></wa-checkbox>
          <span>In Stock Only</span>
        </div>
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

  // --- Product Table (no Rarity column for sealed) ---

  private renderProductTable() {
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
      <div class="table-container">
        <table class="wa-table">
          <thead>
            <tr>
              <th class="wa-visually-hidden">Thumbnail</th>
              <th>Name</th>
              <th>Game</th>
              <th>Set</th>
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
                      : html`<div class="card-thumbnail">
                          <wa-icon name="box" variant="regular" style="font-size: 1.25rem;"></wa-icon>
                        </div>`}
                  </td>
                  <td class="product-name">
                    <a href="/products/${product.id}">
                      ${product.name.length > 31 ? `${product.name.substring(0, 31)}...` : product.name}
                    </a>
                  </td>
                  <td>
                    <span class="game-badge ${product.gameName.toLowerCase()}">${product.gameName}</span>
                  </td>
                  <td class="product-set">
                    ${product.setName.length > 20 ? `${product.setName.substring(0, 20)}...` : product.setName}
                  </td>
                  <td class="quantity-cell">
                    <span class="quantity-badge ${getQuantityBadgeClass(product.totalQuantity)}">
                      ${product.totalQuantity > 0 ? product.totalQuantity : '0'}
                    </span>
                  </td>
                  <td class="price-cell">
                    ${product.lowestPrice != null
                      ? html`<span class="price-value"
                          ><span class="price-from">from</span> $${product.lowestPrice}</span
                        >`
                      : html`<span class="out-of-stock-text">—</span>`}
                  </td>
                  <td>
                    ${product.totalQuantity > 0
                      ? html`
                          <div class="cart-controls">
                            <wa-input type="number" min="1" max="${product.totalQuantity}" value="1">
                              <span slot="label" class="wa-visually-hidden">Quantity</span>
                            </wa-input>
                            <wa-button
                              appearance="filled"
                              size="small"
                              ?disabled="${this.addingToCart}"
                              @click="${(e: Event) => this.handleAddToCart(product.lowestPriceInventoryItemId!, e)}"
                            >
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
