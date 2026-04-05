import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import '../../components/ogs-page.ts';
import { execute } from '../../lib/graphql.ts';
import { TypedDocumentString } from '../../graphql/graphql.ts';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
import { cartState } from '../../lib/cart-state.ts';

// --- Types ---

interface ProductInventoryRecord {
  inventoryItemId: number;
  condition: string;
  quantity: number;
  price: number;
}

interface ProductDetail {
  id: string;
  name: string;
  setName: string;
  gameName: string;
  rarity: string | null;
  type: string | null;
  text: string | null;
  flavorText: string | null;
  finishes: string[];
  isSingle: boolean;
  isSealed: boolean;
  images: { small: string | null; large: string | null } | null;
  inventoryRecords: ProductInventoryRecord[];
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

const GetProductQuery = new TypedDocumentString(`
  query GetProduct($productId: String!) {
    getProduct(productId: $productId) {
      id
      name
      setName
      gameName
      rarity
      type
      text
      flavorText
      finishes
      isSingle
      isSealed
      images {
        small
        large
      }
      inventoryRecords {
        inventoryItemId
        condition
        quantity
        price
      }
    }
  }
`) as unknown as TypedDocumentString<{ getProduct: ProductDetail }, { productId: string }>;

// --- HTML Sanitization ---

/** Sanitize HTML to only allow safe formatting tags */
function sanitizeHtml(html: string): string {
  const allowedTags = ['br', 'em', 'strong', 'i', 'b', 'p', 'span'];
  // Remove all tags except allowed ones
  return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      // For allowed tags, only keep the tag name (strip attributes)
      const isClosing = match.startsWith('</');
      const isSelfClosing = match.endsWith('/>');
      if (isClosing) return `</${tag.toLowerCase()}>`;
      if (isSelfClosing) return `<${tag.toLowerCase()} />`;
      return `<${tag.toLowerCase()}>`;
    }
    return ''; // Strip disallowed tags
  });
}

// --- Component ---

@customElement('ogs-product-details-page')
export class ProductDetailsPage extends LitElement {
  static styles = [
    css`
      ${unsafeCSS(nativeStyle)}
    `,
    css`
      ${unsafeCSS(utilityStyles)}
    `,
    css`
      caption {
        text-align: left;
        font-size: var(--wa-font-size-xl);
        font-family: var(--wa-font-family-heading);
        font-weight: var(--wa-font-weight-heading);
        line-height: var(--wa-line-height-condensed);
        color: var(--wa-color-text-normal);
        text-wrap: balance;
      }

      .cart-controls {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;
        width: 100%;
      }

      .out-of-stock {
        color: var(--wa-color-text-secondary);
        font-style: italic;
      }

      .price-cell {
        text-align: right;
        white-space: nowrap;
      }

      .quantity-cell {
        text-align: center;
      }

      .sealed-cart-section {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--wa-color-surface-border);
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 3rem;
      }
    `,
  ];

  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';
  @property({ type: Boolean }) canManageInventory = false;
  @property({ type: Boolean }) canViewDashboard = false;
  @property({ type: Boolean }) canAccessSettings = false;
  @property({ type: Boolean }) canManageStoreLocations = false;
  @property({ type: Boolean }) canManageUsers = false;
  @property({ type: Boolean }) canViewTransactionLog = false;
  @property({ type: String }) activeOrganizationId = '';
  @property({ type: Boolean }) showStoreSelector = false;

  @property()
  private productId: string = '';

  @state()
  private product: ProductDetail | null = null;

  @state()
  private loading = true;

  @state()
  private error = '';

  @state()
  private cartMessage = '';

  @state()
  private cartError = '';

  @state()
  private addingToCart = false;

  connectedCallback() {
    super.connectedCallback();
    this.fetchProduct();
  }

  async fetchProduct() {
    this.loading = true;
    this.error = '';

    try {
      const result = await execute(GetProductQuery, {
        productId: this.productId,
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.product = result.data.getProduct;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load product';
    } finally {
      this.loading = false;
    }
  }

  private async handleAddToCart(inventoryItemId: number, button: EventTarget | null) {
    if (this.addingToCart) return;
    this.addingToCart = true;
    this.cartMessage = '';
    this.cartError = '';

    // Find the quantity input sibling to the clicked button
    const btn = button as HTMLElement;
    const container = btn?.closest('.cart-controls') ?? btn?.closest('.sealed-cart-section');
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

  render() {
    return html`
      <ogs-page
        activePage="products"
        ?showCartButton="${true}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
        ?canManageInventory="${this.canManageInventory}"
        ?canViewDashboard="${this.canViewDashboard}"
        ?canAccessSettings="${this.canAccessSettings}"
        ?canManageStoreLocations="${this.canManageStoreLocations}"
        ?canManageUsers="${this.canManageUsers}"
        ?canViewTransactionLog="${this.canViewTransactionLog}"
        activeOrganizationId="${this.activeOrganizationId}"
        ?showStoreSelector="${this.showStoreSelector}"
        @store-changed="${() => this.fetchProduct()}"
        @order-submitted="${() => this.fetchProduct()}"
      >
        ${when(
          this.loading,
          () => html`<div class="loading-container"><wa-spinner style="font-size: 2rem;"></wa-spinner></div>`,
          () => this.renderContent(),
        )}
      </ogs-page>
    `;
  }

  private renderContent() {
    if (this.error) {
      return html`
        <wa-callout variant="danger">
          <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
          ${this.error}
        </wa-callout>
      `;
    }

    if (!this.product) return nothing;

    return html`
      <h1>${this.product.name}</h1>
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
      <div class="wa-stack">
        ${this.product.isSingle ? this.renderSingleDetails() : this.renderSealedDetails()}
        ${this.renderPricingSection()}
      </div>
    `;
  }

  // --- Singles Details ---

  private renderSingleDetails() {
    const p = this.product!;
    return html`
      <wa-card appearance="outlined">
        <h2 slot="header">Details</h2>
        <div class="wa-flank wa-align-items-start" style="--flank-size: 20rem;">
          <div class="wa-frame wa-border-radius-m" style="aspect-ratio: auto;">
            <img src="${p.images?.large}" alt="" />
          </div>
          <table class="wa-table wa-zebra-rows wa-hover-rows">
            <tbody>
              <tr>
                <th>Set</th>
                <td>${p.setName}</td>
              </tr>
              <tr>
                <th>Game</th>
                <td>${p.gameName}</td>
              </tr>
              <tr>
                <th>Type</th>
                <td>${p.type ?? '—'}</td>
              </tr>
              <tr>
                <th>Rarity</th>
                <td>${p.rarity ?? '—'}</td>
              </tr>
              <tr>
                <th>Printings</th>
                <td>${p.finishes?.map((f) => html` <wa-badge> ${f.toUpperCase()} </wa-badge> `)}</td>
              </tr>
              <tr>
                <th>Text</th>
                <td>${p.text ? unsafeHTML(sanitizeHtml(p.text)) : '—'}</td>
              </tr>
              <tr>
                <th>Flavor Text</th>
                <td>${p.flavorText ? unsafeHTML(sanitizeHtml(p.flavorText)) : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </wa-card>
    `;
  }

  // --- Sealed Details ---

  private renderSealedDetails() {
    const p = this.product!;
    const totalQuantity = p.inventoryRecords.reduce((sum, r) => sum + r.quantity, 0);
    const inStock = totalQuantity > 0;

    return html`
      <wa-card appearance="outlined">
        <h2 slot="header">Details</h2>
        <div class="wa-flank wa-align-items-start" style="--flank-size: 20rem;">
          <div class="wa-frame wa-border-radius-m" style="aspect-ratio: auto;">
            <img src="${p.images?.large}" alt="" />
          </div>
          <table class="wa-table wa-zebra-rows wa-hover-rows">
            <tbody>
              <tr>
                <th>Set</th>
                <td>${p.setName}</td>
              </tr>
              <tr>
                <th>Game</th>
                <td>${p.gameName}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ${inStock
          ? html`
              <div class="sealed-cart-section">
                <wa-input type="number" min="1" max="${totalQuantity}" value="1" style="width: 100px;">
                  <span slot="label" class="wa-visually-hidden">Quantity</span>
                </wa-input>
                <wa-button
                  appearance="filled"
                  ?disabled="${this.addingToCart}"
                  @click="${(e: Event) => this.handleAddToCart(p.inventoryRecords[0].inventoryItemId, e.currentTarget)}"
                >
                  <wa-icon name="cart-plus" label="Add to cart"></wa-icon>
                  ${this.addingToCart ? 'Adding...' : 'Add to Cart'}
                </wa-button>
                <span>${totalQuantity} available</span>
              </div>
            `
          : html`<div class="sealed-cart-section"><span class="out-of-stock">Out of Stock</span></div>`}
      </wa-card>
    `;
  }

  // --- Pricing & Availability Section ---

  private renderPricingSection() {
    const p = this.product!;
    const records = p.inventoryRecords;

    if (records.length === 0) {
      return html`
        <wa-card appearance="outlined">
          <h2 slot="header">Pricing & Availability</h2>
          <div class="out-of-stock" style="padding: 1rem; text-align: center;">Out of Stock</div>
        </wa-card>
      `;
    }

    if (p.isSingle) {
      return this.renderSinglePricing(records);
    }
    return this.renderSealedPricing(records);
  }

  // --- Singles Pricing: grouped by condition ---

  private renderSinglePricing(records: ProductInventoryRecord[]) {
    // Group records by condition, tracking the inventoryItemId of the lowest-priced record
    const conditionMap = new Map<string, { totalQuantity: number; lowestPrice: number; inventoryItemId: number }>();
    for (const r of records) {
      const existing = conditionMap.get(r.condition);
      if (existing) {
        existing.totalQuantity += r.quantity;
        if (r.price < existing.lowestPrice) {
          existing.lowestPrice = r.price;
          existing.inventoryItemId = r.inventoryItemId;
        }
      } else {
        conditionMap.set(r.condition, {
          totalQuantity: r.quantity,
          lowestPrice: r.price,
          inventoryItemId: r.inventoryItemId,
        });
      }
    }

    const conditionOrder = ['NM', 'LP', 'MP', 'HP', 'D'];
    const conditionLabels: Record<string, string> = {
      NM: 'Near Mint',
      LP: 'Lightly Played',
      MP: 'Moderately Played',
      HP: 'Heavily Played',
      D: 'Damaged',
    };

    return html`
      <wa-card appearance="outlined">
        <h2 slot="header">Pricing & Availability</h2>
        <table class="wa-table wa-zebra-rows wa-hover-rows">
          <thead>
            <tr>
              <th>Condition</th>
              <th class="price-cell">Price</th>
              <th class="quantity-cell">In Stock</th>
              <th class="wa-visually-hidden">Add to Cart</th>
            </tr>
          </thead>
          <tbody>
            ${conditionOrder
              .filter((c) => conditionMap.has(c))
              .map((condition) => {
                const data = conditionMap.get(condition)!;
                const inStock = data.totalQuantity > 0;
                return html`
                  <tr>
                    <td>${conditionLabels[condition] ?? condition}</td>
                    <td class="price-cell">$${data.lowestPrice.toFixed(2)}</td>
                    <td class="quantity-cell">
                      ${inStock ? data.totalQuantity : html`<span class="out-of-stock">0</span>`}
                    </td>
                    <td>
                      ${inStock
                        ? html`
                            <div class="cart-controls">
                              <wa-input
                                type="number"
                                min="1"
                                max="${data.totalQuantity}"
                                value="1"
                                style="width: 100px;"
                              >
                                <span slot="label" class="wa-visually-hidden">Quantity</span>
                              </wa-input>
                              <wa-button
                                appearance="filled"
                                ?disabled="${this.addingToCart}"
                                @click="${(e: Event) => this.handleAddToCart(data.inventoryItemId, e.currentTarget)}"
                              >
                                <wa-icon name="cart-plus" label="Add to cart"></wa-icon>
                              </wa-button>
                            </div>
                          `
                        : nothing}
                    </td>
                  </tr>
                `;
              })}
          </tbody>
        </table>
      </wa-card>
    `;
  }

  // --- Sealed Pricing: individual inventory records ---

  private renderSealedPricing(records: ProductInventoryRecord[]) {
    return html`
      <wa-card appearance="outlined">
        <h2 slot="header">Pricing & Availability</h2>
        <table class="wa-table wa-zebra-rows wa-hover-rows">
          <thead>
            <tr>
              <th class="price-cell">Price</th>
              <th class="quantity-cell">Available</th>
              <th class="wa-visually-hidden">Add to Cart</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(
              (record) => html`
                <tr>
                  <td class="price-cell">$${record.price.toFixed(2)}</td>
                  <td class="quantity-cell">${record.quantity}</td>
                  <td>
                    ${record.quantity > 0
                      ? html`
                          <div class="cart-controls">
                            <wa-input type="number" min="1" max="${record.quantity}" value="1" style="width: 100px;">
                              <span slot="label" class="wa-visually-hidden">Quantity</span>
                            </wa-input>
                            <wa-button
                              appearance="filled"
                              ?disabled="${this.addingToCart}"
                              @click="${(e: Event) => this.handleAddToCart(record.inventoryItemId, e.currentTarget)}"
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
      </wa-card>
    `;
  }
}
