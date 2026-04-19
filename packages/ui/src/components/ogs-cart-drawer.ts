import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { when } from 'lit/directives/when.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/button/button.js';

if (typeof globalThis.document !== 'undefined') {
  import('@awesome.me/webawesome/dist/components/drawer/drawer.js');
  import('@awesome.me/webawesome/dist/components/input/input.js');
  import('@awesome.me/webawesome/dist/components/spinner/spinner.js');
  import('@awesome.me/webawesome/dist/components/callout/callout.js');
}

import { graphql } from '../graphql';
import { execute } from '../lib/graphql';
import { cartState, type CartItem } from '../lib/cart-state';
import { formatCurrency } from '../lib/currency';
import { activeStoreId } from '../lib/store-context';

// --- GraphQL Operations ---

const UpdateItemInCartMutation = graphql(`
  mutation UpdateItemInCart($cartItem: CartItemInput!) {
    updateItemInCart(cartItem: $cartItem) {
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
`);

const RemoveFromCartMutation = graphql(`
  mutation RemoveFromCart($cartItem: CartItemInput!) {
    removeFromCart(cartItem: $cartItem) {
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
`);

const SubmitOrderMutation = graphql(`
  mutation SubmitOrder($input: SubmitOrderInput!) {
    submitOrder(input: $input) {
      id
      orderNumber
      customerName
      totalAmount
      createdAt
    }
  }
`);

const GetShoppingCartQuery = graphql(`
  query GetShoppingCartQuery {
    getShoppingCart {
      items {
        inventoryItemId
        quantity
        productId
        productName
        condition
        unitPrice
        maxAvailable
      }
    }
  }
`);

@customElement('ogs-cart-drawer')
export class OgsCartDrawer extends SignalWatcher(LitElement) {
  static styles = css`
    .cart-items {
      display: flex;
      flex-direction: column;
      gap: var(--wa-space-m);
    }

    .cart-item {
      display: flex;
      flex-direction: column;
      gap: var(--wa-space-xs);
      padding: var(--wa-space-s);
      border: 1px solid var(--wa-color-surface-border);
      border-radius: var(--wa-border-radius-m);
      background: var(--wa-color-surface-sunken);
    }

    .cart-item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--wa-space-xs);
    }

    .cart-item-name {
      font-weight: 600;
      font-size: var(--wa-font-size-m);
      flex: 1;
      word-break: break-word;
    }

    .cart-item-condition {
      font-size: var(--wa-font-size-2xs);
      color: var(--wa-color-text-muted);
    }

    .cart-item-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--wa-space-xs);
    }

    .cart-item-qty {
      display: flex;
      align-items: center;
      gap: var(--wa-space-2xs);
    }

    .cart-item-price {
      font-weight: 600;
      font-size: var(--wa-font-size-m);
      white-space: nowrap;
    }

    .cart-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--wa-space-s) 0;
      border-top: 2px solid var(--wa-color-surface-border);
      margin-top: var(--wa-space-s);
      font-weight: 700;
      font-size: var(--wa-font-size-m);
    }

    .cart-empty {
      text-align: center;
      padding: var(--wa-space-xl) var(--wa-space-m);
      color: var(--wa-color-text-muted);
    }

    .cart-empty wa-icon {
      font-size: 3rem;
      margin-bottom: var(--wa-space-s);
      opacity: 0.4;
    }

    .cart-form {
      display: flex;
      flex-direction: column;
      gap: var(--wa-space-m);
      margin-top: var(--wa-space-m);
      padding-top: var(--wa-space-m);
      border-top: 1px solid var(--wa-color-surface-border);
    }

    .cart-success {
      text-align: center;
      padding: var(--wa-space-l);
    }

    .cart-success wa-icon {
      font-size: 3rem;
      color: var(--wa-color-success-text);
      margin-bottom: var(--wa-space-s);
    }
  `;

  @property({ type: Boolean })
  open = false;

  @state()
  private customerName = '';

  @state()
  private submittingOrder = false;

  @state()
  private orderError = '';

  @state()
  private orderSuccess = '';

  @state()
  private updatingCartItem = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.fetchCart();
  }

  protected willUpdate(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('open') && this.open) {
      this.orderError = '';
      this.orderSuccess = '';
    }
  }

  async fetchCart() {
    try {
      const result = await execute(GetShoppingCartQuery);

      if (result?.errors?.length) {
        console.error('Cart fetch errors:', result.errors);
      } else if (result?.data?.getShoppingCart) {
        cartState.set(result.data.getShoppingCart);
      }
    } catch {
      // Fetch may fail if the API server is unavailable (e.g. during tests)
    }
  }

  private handleDrawerHide() {
    this.open = false;
  }

  private handleCustomerNameInput(event: Event) {
    this.customerName = (event.target as HTMLInputElement).value;
  }

  private async handleUpdateQuantity(item: CartItem, newQuantity: number) {
    if (this.updatingCartItem) return;
    this.updatingCartItem = true;

    try {
      const result = await execute(UpdateItemInCartMutation, {
        cartItem: { inventoryItemId: item.inventoryItemId, quantity: newQuantity },
      });

      if (result?.errors?.length) {
        console.error('Failed to update cart item:', result.errors);
      } else {
        cartState.set(result.data.updateItemInCart);
      }
    } catch (e) {
      console.error('Failed to update cart item:', e);
    } finally {
      this.updatingCartItem = false;
    }
  }

  private async handleRemoveFromCart(item: CartItem) {
    if (this.updatingCartItem) return;
    this.updatingCartItem = true;

    try {
      const result = await execute(RemoveFromCartMutation, {
        cartItem: { inventoryItemId: item.inventoryItemId, quantity: item.quantity },
      });

      if (result?.errors?.length) {
        console.error('Failed to remove cart item:', result.errors);
      } else {
        cartState.set(result.data.removeFromCart);
      }
    } catch (e) {
      console.error('Failed to remove cart item:', e);
    } finally {
      this.updatingCartItem = false;
    }
  }

  private async handleSubmitOrder() {
    if (this.submittingOrder || !this.customerName.trim()) return;
    this.submittingOrder = true;
    this.orderError = '';

    try {
      const currentStoreId = activeStoreId.get();
      if (!currentStoreId) {
        this.orderError = 'Please select a store before submitting an order.';
        this.submittingOrder = false;
        return;
      }
      const result = await execute(SubmitOrderMutation, {
        input: { organizationId: currentStoreId, customerName: this.customerName.trim() },
      });

      if (result?.errors?.length) {
        this.orderError = result.errors.map((e: { message: string }) => e.message).join(', ');
        // Refresh cart to get updated maxAvailable values on inventory errors
        await this.fetchCart();
      } else {
        const order = result.data.submitOrder;
        this.orderSuccess = `Order ${order.orderNumber} created for ${formatCurrency(order.totalAmount)}`;
        cartState.set({ items: [] });
        this.customerName = '';
        // Notify product pages to refresh listings with updated inventory
        this.dispatchEvent(new CustomEvent('order-submitted', { bubbles: true, composed: true }));
      }
    } catch (e) {
      this.orderError = e instanceof Error ? e.message : 'Failed to submit order';
    } finally {
      this.submittingOrder = false;
    }
  }

  private renderCartItem(item: CartItem) {
    const lineTotal = item.unitPrice * item.quantity;
    return html`
      <div class="cart-item">
        <div class="cart-item-header">
          <div>
            <div class="cart-item-name">${item.productName}</div>
            <div class="cart-item-condition">${item.condition} · ${formatCurrency(item.unitPrice)} each</div>
          </div>
          <wa-button
            size="small"
            variant="danger"
            appearance="plain"
            aria-label="Remove ${item.productName}"
            ?disabled="${this.updatingCartItem}"
            @click="${() => this.handleRemoveFromCart(item)}"
          >
            <wa-icon name="trash"></wa-icon>
          </wa-button>
        </div>
        <div class="cart-item-controls">
          <div class="cart-item-qty">
            <wa-button
              size="small"
              appearance="outlined"
              ?disabled="${item.quantity <= 1 || this.updatingCartItem}"
              @click="${() => this.handleUpdateQuantity(item, item.quantity - 1)}"
            >
              <wa-icon name="minus"></wa-icon>
            </wa-button>
            <wa-input
              type="number"
              min="1"
              max="${item.maxAvailable}"
              .value="${String(item.quantity)}"
              style="width: 70px; text-align: center;"
              ?disabled="${this.updatingCartItem}"
              @change="${(e: Event) => {
                const val = Number.parseInt((e.target as HTMLInputElement).value, 10);
                if (val > 0 && val <= item.maxAvailable) {
                  this.handleUpdateQuantity(item, val);
                }
              }}"
            >
              <span slot="label" class="wa-visually-hidden">Quantity</span>
            </wa-input>
            <wa-button
              size="small"
              appearance="outlined"
              ?disabled="${item.quantity >= item.maxAvailable || this.updatingCartItem}"
              @click="${() => this.handleUpdateQuantity(item, item.quantity + 1)}"
            >
              <wa-icon name="plus"></wa-icon>
            </wa-button>
            <span style="font-size: var(--wa-font-size-2xs); color: var(--wa-color-text-muted);">
              of ${item.maxAvailable}
            </span>
          </div>
          <div class="cart-item-price">${formatCurrency(lineTotal)}</div>
        </div>
      </div>
    `;
  }

  private renderOrderSuccess() {
    return html`
      <div class="cart-success">
        <wa-icon name="circle-check"></wa-icon>
        <h3 style="margin: 0 0 var(--wa-space-xs) 0;">Order Submitted!</h3>
        <p style="color: var(--wa-color-text-muted); margin: 0;">${this.orderSuccess}</p>
        <wa-button
          variant="brand"
          style="margin-top: var(--wa-space-l);"
          @click="${() => {
            this.orderSuccess = '';
            this.open = false;
          }}"
        >
          Close
        </wa-button>
      </div>
    `;
  }

  render() {
    const cart = cartState.get();
    const cartTotal = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const hasItems = cart.items.length > 0;

    return html`
      <wa-drawer label="Shopping Cart" placement="end" ?open="${this.open}" @wa-after-hide="${this.handleDrawerHide}">
        ${this.orderSuccess
          ? this.renderOrderSuccess()
          : html`
              ${hasItems
                ? html`
                    <div class="cart-items">${cart.items.map((item) => this.renderCartItem(item))}</div>
                    <div class="cart-total">
                      <span>Total</span>
                      <span>${formatCurrency(cartTotal)}</span>
                    </div>
                    <div class="cart-form">
                      <wa-input
                        label="Customer Name"
                        placeholder="Enter customer name"
                        required
                        .value="${this.customerName}"
                        @input="${this.handleCustomerNameInput}"
                      >
                        <wa-icon slot="start" name="user"></wa-icon>
                      </wa-input>
                      ${this.orderError
                        ? html`<wa-callout variant="danger">
                            <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                            ${this.orderError}
                          </wa-callout>`
                        : nothing}
                    </div>
                  `
                : html`
                    <div class="cart-empty">
                      <wa-icon name="shopping-cart"></wa-icon>
                      <p>Your cart is empty</p>
                      <p style="font-size: var(--wa-font-size-m);">Browse products to add items to your cart.</p>
                    </div>
                  `}
            `}
        ${when(
          hasItems && !this.orderSuccess,
          () => html`
            <wa-button
              slot="footer"
              variant="brand"
              style="width: 100%;"
              ?loading="${this.submittingOrder}"
              ?disabled="${!this.customerName.trim() || this.updatingCartItem}"
              @click="${this.handleSubmitOrder}"
            >
              <wa-icon slot="start" name="check"></wa-icon>
              Submit Order
            </wa-button>
          `,
        )}
      </wa-drawer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ogs-cart-drawer': OgsCartDrawer;
  }
}
