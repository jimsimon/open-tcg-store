import { css, html, nothing, unsafeCSS } from 'lit';
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
import { OgsPageBase } from '../../components/ogs-page-base.ts';
import { execute } from '../../lib/graphql.ts';
import { graphql } from '../../graphql/index.ts';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
import { cartState } from '../../lib/cart-state.ts';
import { formatCurrency } from '../../lib/currency.ts';
import { conditionLabel } from '../../lib/labels';
import { AddToCartMutation } from '../../lib/shared-queries';

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

const GetProductQuery = graphql(`
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
`);

// --- HTML Sanitization ---

const ALLOWED_TAGS = new Set(['br', 'em', 'strong', 'i', 'b', 'p', 'span']);

/**
 * Sanitize HTML using the browser's native DOM parser instead of regex.
 * Only allows safe formatting tags (no attributes, no scripts, no event handlers).
 * Regex-based sanitizers are bypassable with malformed nesting — the DOM parser
 * handles all edge cases correctly.
 */
function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? '';
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      const childContent = Array.from(el.childNodes).map(walk).join('');
      if (ALLOWED_TAGS.has(tag)) {
        return tag === 'br' ? '<br>' : `<${tag}>${childContent}</${tag}>`;
      }
      // Disallowed tag — keep text content, strip the tag
      return childContent;
    }
    return '';
  }

  return Array.from(doc.body.childNodes).map(walk).join('');
}

// --- Component ---

@customElement('ogs-product-details-page')
export class ProductDetailsPage extends OgsPageBase {
  static styles = [
    css`
      ${unsafeCSS(nativeStyle)}
    `,
    css`
      ${unsafeCSS(utilityStyles)}
    `,
    css`
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      /* --- Breadcrumb --- */

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-muted);
      }

      .breadcrumb a {
        color: var(--wa-color-text-link);
        text-decoration: none;
      }

      .breadcrumb a:hover {
        text-decoration: underline;
      }

      .breadcrumb wa-icon {
        font-size: 0.75rem;
      }

      /* --- Page Header --- */

      .page-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }

      .page-header-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: var(--wa-border-radius-l);
        background: var(--wa-color-brand-fill-normal);
        color: var(--wa-color-brand-on-normal);
        flex-shrink: 0;
      }

      .page-header-content {
        flex: 1;
      }

      .page-header h2 {
        margin: 0;
        font-size: var(--wa-font-size-2xl);
        font-weight: 700;
        letter-spacing: -0.01em;
      }

      .page-header p {
        margin: 0.25rem 0 0 0;
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-s);
      }

      /* --- Section Header --- */

      .section-header {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        font-size: var(--wa-font-size-l);
        font-weight: 700;
      }

      .section-header wa-icon {
        color: var(--wa-color-brand-60);
        font-size: 1.125rem;
      }

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

      .cart-controls wa-input::part(form-control-label) {
        display: none;
      }

      .out-of-stock {
        color: var(--wa-color-text-secondary);
        font-style: italic;
      }

      .image-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 200px;
        background: var(--wa-color-fill-quiet);
        color: var(--wa-color-text-quiet);
        font-size: 4rem;
        border-radius: var(--wa-border-radius-m);
      }

      .price-cell {
        text-align: right;
        white-space: nowrap;
      }

      .quantity-cell {
        text-align: center;
      }

      td {
        vertical-align: middle;
      }

      .sealed-cart-section {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--wa-color-surface-border);
      }

      .sealed-cart-section wa-input::part(form-control-label) {
        display: none;
      }

      .sealed-price {
        font-size: var(--wa-font-size-2xl);
        font-weight: 700;
        color: var(--wa-color-text-normal);
      }

      .sealed-available {
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-quiet);
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 3rem;
      }
    `,
  ];

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
        this.product = result.data.getProduct as ProductDetail;
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

  private handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.hidden = true;
    const placeholder = img.parentElement?.querySelector('.image-placeholder') as HTMLElement | null;
    if (placeholder) placeholder.hidden = false;
  }

  render() {
    return this.renderPage(
      html`
        ${when(
          this.loading,
          () => html`<div class="loading-container"><wa-spinner style="font-size: 2rem;"></wa-spinner></div>`,
          () => this.renderContent(),
        )}
      `,
      {
        activePage: 'products',
        showStoreSelector: this.showStoreSelector,
        showCartButton: true,
        onStoreChanged: () => this.fetchProduct(),
        onOrderSubmitted: () => this.fetchProduct(),
      },
    );
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

    const p = this.product;
    const icon = p.isSingle ? 'id-card' : 'box';
    const backUrl = p.isSingle ? '/products/singles' : '/products/sealed';
    const backLabel = p.isSingle ? 'Single Cards' : 'Sealed Products';
    const subtitle = [p.gameName, p.setName].filter(Boolean).join(' / ');

    return html`
      <div class="breadcrumb">
        <a href="${backUrl}">${backLabel}</a>
        <wa-icon name="chevron-right"></wa-icon>
        <span>${p.name}</span>
      </div>
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="${icon}" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>${p.name}</h2>
          <p>${subtitle}</p>
        </div>
      </div>
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
        ${this.product.isSingle ? this.renderPricingSection() : nothing}
      </div>
    `;
  }

  // --- Singles Details ---

  private renderSingleDetails() {
    const p = this.product!;
    return html`
      <wa-card appearance="outlined">
          <div class="wa-flank wa-align-items-start" style="--flank-size: 20rem;">
            <div class="wa-frame wa-border-radius-m" style="aspect-ratio: auto;">
              ${p.images?.large
                ? html`<img src="${p.images.large}" alt="${p.name}" @error="${this.handleImageError}" />`
                : nothing}
              <div class="image-placeholder" ?hidden="${!!p.images?.large}">
                <wa-icon name="id-card" variant="regular"></wa-icon>
              </div>
            </div>
            <table class="wa-table wa-zebra-rows wa-hover-rows">
              <tbody>
                <tr>
                  <th scope="row">Set</th>
                  <td>${p.setName}</td>
                </tr>
                <tr>
                  <th scope="row">Game</th>
                  <td>${p.gameName}</td>
                </tr>
                <tr>
                  <th scope="row">Type</th>
                <td>${p.type ?? '—'}</td>
              </tr>
              <tr>
                <th scope="row">Rarity</th>
                <td>${p.rarity ?? '—'}</td>
              </tr>
              <tr>
                <th scope="row">Printings</th>
                <td>${p.finishes?.map((f) => html` <wa-badge> ${f.toUpperCase()} </wa-badge> `)}</td>
              </tr>
              <tr>
                <th scope="row">Text</th>
                <td>${p.text ? unsafeHTML(sanitizeHtml(p.text)) : '—'}</td>
              </tr>
              <tr>
                <th scope="row">Flavor Text</th>
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
         <div class="wa-flank wa-align-items-start" style="--flank-size: 20rem;">
           <div class="wa-frame wa-border-radius-m" style="aspect-ratio: auto;">
              ${p.images?.large
                ? html`<img src="${p.images.large}" alt="${p.name}" @error="${this.handleImageError}" />`
                : nothing}
              <div class="image-placeholder" ?hidden="${!!p.images?.large}">
                <wa-icon name="box" variant="regular"></wa-icon>
              </div>

          </div>
          <table class="wa-table wa-zebra-rows wa-hover-rows">
            <tbody>
              <tr>
                <th scope="row">Set</th>
                <td>${p.setName}</td>
              </tr>
              <tr>
                <th scope="row">Game</th>
                <td>${p.gameName}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ${inStock
          ? html`
              <div class="sealed-cart-section">
                ${p.inventoryRecords[0]?.price != null
                  ? html`<span class="sealed-price">${formatCurrency(p.inventoryRecords[0].price)}</span>`
                  : nothing}
                <span class="sealed-available">${totalQuantity} available</span>
                <div style="flex: 1;"></div>
                <wa-input type="number" min="1" max="${totalQuantity}" value="1" style="width: 80px;">
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
          <div slot="header" class="section-header">
            <wa-icon name="tags"></wa-icon>
            <span>Pricing & Availability</span>
          </div>
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

    return html`
      <wa-card appearance="outlined">
        <div slot="header" class="section-header">
          <wa-icon name="tags"></wa-icon>
          <span>Pricing & Availability</span>
        </div>
        <table class="wa-table wa-zebra-rows wa-hover-rows">
          <thead>
            <tr>
              <th scope="col">Condition</th>
              <th scope="col" class="price-cell">Price</th>
              <th scope="col" class="quantity-cell">In Stock</th>
              <th scope="col" class="wa-visually-hidden">Add to Cart</th>
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
                    <td>${conditionLabel(condition)}</td>
                    <td class="price-cell">${formatCurrency(data.lowestPrice)}</td>
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
              <th scope="col" class="price-cell">Price</th>
              <th scope="col" class="quantity-cell">Available</th>
              <th scope="col" class="wa-visually-hidden">Add to Cart</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(
              (record) => html`
                <tr>
                  <td class="price-cell">${formatCurrency(record.price)}</td>
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
