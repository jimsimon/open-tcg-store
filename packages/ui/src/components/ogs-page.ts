import { LitElement, PropertyValues, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { when } from 'lit/directives/when.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import '@awesome.me/webawesome/dist/components/avatar/avatar.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import WaSelect from '@awesome.me/webawesome/dist/components/select/select.js';

// These components reference `document` at module scope, so they must be
// loaded dynamically to avoid "document is not defined" during SSR.
if (typeof globalThis.document !== 'undefined') {
  import('@awesome.me/webawesome/dist/components/dropdown/dropdown.js');
  import('@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js');
  import('@awesome.me/webawesome/dist/components/dialog/dialog.js');
  import('@awesome.me/webawesome/dist/components/input/input.js');
  import('@awesome.me/webawesome/dist/components/drawer/drawer.js');
  import('@awesome.me/webawesome/dist/components/spinner/spinner.js');
  import('@awesome.me/webawesome/dist/components/callout/callout.js');
}
import Cookies from 'js-cookie';
import { graphql } from '../graphql';
import { execute } from '../lib/graphql';
import { TypedDocumentString } from '../graphql/graphql';
import logoSvg from '../assets/logo.svg?raw';
import { cartState } from '../lib/cart-state';
import type { CartItem } from '../lib/cart-state';
import {
  storeList,
  activeStoreId,
  initActiveStoreFromCookie,
  setActiveStoreCookie,
  type StoreInfo,
} from '../lib/store-context';

// Lazy-load authClient to avoid potential SSR issues
let _authClient: typeof import('../auth-client').authClient | undefined;
async function getAuthClient() {
  if (!_authClient) {
    const mod = await import('../auth-client');
    _authClient = mod.authClient;
  }
  return _authClient;
}

// --- GraphQL Mutations for Cart ---

const UpdateItemInCartMutation = new TypedDocumentString(`
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
`) as unknown as TypedDocumentString<
  { updateItemInCart: { items: CartItem[] } },
  { cartItem: { inventoryItemId: number; quantity: number } }
>;

const RemoveFromCartMutation = new TypedDocumentString(`
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
`) as unknown as TypedDocumentString<
  { removeFromCart: { items: CartItem[] } },
  { cartItem: { inventoryItemId: number; quantity: number } }
>;

const SubmitOrderMutation = new TypedDocumentString(`
  mutation SubmitOrder($input: SubmitOrderInput!) {
    submitOrder(input: $input) {
      order {
        id
        orderNumber
        customerName
        totalAmount
        createdAt
      }
      error
      insufficientItems {
        productId
        productName
        condition
        requested
        available
      }
    }
  }
`) as unknown as TypedDocumentString<
  {
    submitOrder: {
      order?: { id: number; orderNumber: string; customerName: string; totalAmount: number; createdAt: string };
      error?: string;
      insufficientItems?: {
        productId: number;
        productName: string;
        condition: string;
        requested: number;
        available: number;
      }[];
    };
  },
  { input: { organizationId: string; customerName: string } }
>;

// --- GraphQL Queries for Store Locations ---

const GetAllStoreLocationsQuery = new TypedDocumentString(`
  query GetAllStoreLocations {
    getAllStoreLocations {
      id
      name
      slug
      city
      state
    }
  }
`) as unknown as TypedDocumentString<{ getAllStoreLocations: StoreInfo[] }, Record<string, never>>;

const GetEmployeeStoreLocationsQuery = new TypedDocumentString(`
  query GetEmployeeStoreLocations {
    getEmployeeStoreLocations {
      id
      name
      slug
      city
      state
    }
  }
`) as unknown as TypedDocumentString<{ getEmployeeStoreLocations: StoreInfo[] }, Record<string, never>>;

@customElement('ogs-page')
export class OgsPage extends SignalWatcher(LitElement) {
  static styles = [
    css`
      ${unsafeCSS(utilityStyles)}
    `,
    css`
      :host {
        display: block;
        box-sizing: border-box;
      }

      :root {
        height: 100%;
      }

      #page {
        display: flex;
        min-height: calc(100vh - 64px);
      }

      header {
        box-sizing: border-box;
        border-bottom: var(--wa-border-style) var(--wa-panel-border-width) var(--wa-color-surface-border);
        padding-inline: var(--wa-space-l);
        padding-inline-end: var(--wa-space-s);
        block-size: 64px;
        background: var(--wa-color-surface-raised);
        position: sticky;
        top: 0;
        z-index: 10;
        transition: translate 0.3s ease;
      }

      :host([header-hidden]) header {
        translate: 0 -100%;
      }

      header h1 {
        display: flex;
        align-items: center;
        gap: var(--wa-space-xs);
        font-size: var(--wa-font-size-xl);
        margin: 0;
        letter-spacing: -0.02em;
      }

      .logo {
        display: inline-flex;
        width: 1.5em;
        height: 1.5em;
        color: var(--wa-color-brand-text);
      }

      .logo svg {
        width: 100%;
        height: 100%;
      }

      nav {
        display: flex;
        flex-direction: column;
        gap: 1px;
        position: sticky;
        top: 64px;
        height: calc(100vh - 64px);
        min-width: 260px;
        max-width: 260px;
        flex-shrink: 0;
        box-sizing: border-box;
        border-right: var(--wa-border-style) var(--wa-panel-border-width) var(--wa-color-surface-border);
        background: var(--wa-color-surface-raised);
        padding: var(--wa-space-s) 0;
        overflow-x: hidden;
        overflow-y: auto;
        align-self: flex-start;
        transition:
          top 0.3s ease,
          height 0.3s ease;
      }

      :host([header-hidden]) nav {
        top: 0;
        height: 100vh;
      }

      .nav-section-label {
        padding: var(--wa-space-2xs) var(--wa-space-l);
        margin: 0;
        font-size: var(--wa-font-size-2xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--wa-color-text-muted);
        user-select: none;
      }

      .nav-link {
        display: flex;
        align-items: center;
        gap: var(--wa-space-s);
        padding: var(--wa-space-xs) var(--wa-space-l);
        color: var(--wa-color-text-normal);
        text-decoration: none;
        font-size: var(--wa-font-size-m);
        font-weight: 500;
        border-radius: var(--wa-border-radius-m);
        margin-inline: var(--wa-space-xs);
        transition:
          background-color 0.15s ease,
          color 0.15s ease;
      }

      .nav-link:hover {
        background: var(--wa-color-surface-sunken);
        color: var(--wa-color-text-link);
      }

      .nav-link[current] {
        background: var(--wa-color-brand-container);
        color: var(--wa-color-brand-text);
        font-weight: 600;
      }

      .nav-link wa-icon {
        font-size: var(--wa-font-size-l);
        flex-shrink: 0;
        width: 1.25em;
        text-align: center;
      }

      .nav-sub-link {
        display: flex;
        align-items: center;
        gap: var(--wa-space-s);
        padding: var(--wa-space-2xs) var(--wa-space-l);
        padding-left: var(--wa-space-m);
        margin-left: calc(var(--wa-space-xs) + var(--wa-space-l) + 0.625em + 4px);
        margin-right: var(--wa-space-xs);
        border-left: 2px solid var(--wa-color-surface-border);
        color: var(--wa-color-text-muted);
        text-decoration: none;
        font-size: var(--wa-font-size-s);
        font-weight: 400;
        border-radius: 0 var(--wa-border-radius-m) var(--wa-border-radius-m) 0;
        transition:
          background-color 0.15s ease,
          color 0.15s ease,
          border-color 0.15s ease;
      }

      .nav-sub-link:hover {
        background: var(--wa-color-surface-sunken);
        color: var(--wa-color-text-link);
        border-left-color: var(--wa-color-text-link);
      }

      .nav-sub-link[current] {
        background: var(--wa-color-brand-container);
        color: var(--wa-color-brand-text);
        font-weight: 600;
        border-left-color: var(--wa-color-brand-text);
      }

      section {
        box-sizing: border-box;
        margin-inline: auto;
        max-width: 1200px;
        flex: 1;
        padding: var(--wa-space-l);
      }

      [hidden] {
        display: none;
      }

      wa-button.avatar-button::part(base) {
        border-radius: 100%;
      }

      .auth-form {
        display: flex;
        flex-direction: column;
        gap: var(--wa-space-m);
      }

      .auth-error {
        color: var(--wa-color-danger-text);
        margin: 0;
        font-size: var(--wa-font-size-s);
      }

      .auth-toggle {
        margin-top: var(--wa-space-m);
        text-align: center;
        font-size: var(--wa-font-size-s);
      }

      .auth-toggle a {
        color: var(--wa-color-text-link);
        cursor: pointer;
        text-decoration: underline;
      }

      .dropdown-user-label {
        padding: var(--wa-space-xs) var(--wa-space-m);
        font-weight: bold;
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-normal);
      }

      /* Cart Drawer Styles */
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
        font-size: var(--wa-font-size-s);
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
        font-size: var(--wa-font-size-s);
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

      .store-selector {
        min-width: 180px;
        max-width: 250px;
      }
    `,
  ];

  @property({ type: String })
  activePage?: string;

  /** @deprecated Use permission flags instead. Kept for backward compat during migration. */
  @property({ type: String })
  userRole = '';

  @property({ type: Boolean })
  hideNav = false;

  @property({ type: Boolean })
  isAnonymous = false;

  @property({ type: Boolean })
  showCartButton = false;

  @property({ type: Boolean })
  showUserMenu = false;

  @property({ type: String })
  userName = '';

  /** Whether to show the store selector dropdown in the header */
  @property({ type: Boolean })
  showStoreSelector = false;

  /** Permission flags — set by server-side render or client-side check */
  @property({ type: Boolean })
  canManageInventory = false;

  @property({ type: Boolean })
  canViewDashboard = false;

  @property({ type: Boolean })
  canAccessSettings = false;

  @property({ type: Boolean })
  canManageStoreLocations = false;

  @property({ type: Boolean })
  canManageUsers = false;

  @property({ type: Boolean })
  canViewTransactionLog = false;

  /** The active organization ID, passed from server-side or session */
  @property({ type: String })
  activeOrganizationId = '';

  @state()
  themePreference = Cookies.get('ogs-theme-preference') || 'auto';

  @state()
  themeColor = this.determineThemeColor();

  @state()
  showAuthDialog = false;

  @state()
  authMode: 'signin' | 'signup' = 'signin';

  @state()
  authEmail = '';

  @state()
  authPassword = '';

  @state()
  authConfirmPassword = '';

  @state()
  authName = '';

  @state()
  authError = '';

  @state()
  authLoading = false;

  // Cart drawer state
  @state()
  showCartDrawer = false;

  @state()
  customerName = '';

  @state()
  submittingOrder = false;

  @state()
  orderError = '';

  @state()
  orderSuccess = '';

  @state()
  updatingCartItem = false;

  private lastScrollY = 0;
  private scrollThreshold = 10;
  private boundHandleScroll = this.handleScroll.bind(this);

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.updateThemeClass();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.fetchCart();
    this.initStoreContext();
    window.addEventListener('scroll', this.boundHandleScroll, { passive: true });
  }

  private async initStoreContext() {
    // Initialize from cookie for anonymous users
    initActiveStoreFromCookie();

    // If we have an activeOrganizationId from the server, use it
    if (this.activeOrganizationId) {
      activeStoreId.set(this.activeOrganizationId);
    }

    // Fetch store list if the selector is shown
    if (this.showStoreSelector) {
      await this.fetchStoreList();
    }
  }

  private async fetchStoreList() {
    try {
      if (this.isAnonymous) {
        // Anonymous users get the full public list
        const result = await execute(GetAllStoreLocationsQuery);
        if (result?.data?.getAllStoreLocations) {
          storeList.set(result.data.getAllStoreLocations);
          // Auto-select first store if none selected
          if (!activeStoreId.get() && result.data.getAllStoreLocations.length > 0) {
            setActiveStoreCookie(result.data.getAllStoreLocations[0].id);
          }
        }
      } else {
        // Authenticated users get their assigned stores
        const result = await execute(GetEmployeeStoreLocationsQuery);
        if (result?.data?.getEmployeeStoreLocations) {
          storeList.set(result.data.getEmployeeStoreLocations);
        }
      }
    } catch {
      // Silently fail — store list will be empty
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('scroll', this.boundHandleScroll);
  }

  async fetchCart() {
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

    try {
      const result = await execute(GetShoppingCartQuery);

      if (result?.errors?.length) {
        console.log({ result });
      } else if (result?.data?.getShoppingCart) {
        cartState.set(result.data.getShoppingCart);
      }
    } catch {
      // Fetch may fail if the API server is unavailable (e.g. during tests)
    }
  }

  private handleScroll() {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - this.lastScrollY;

    if (Math.abs(delta) < this.scrollThreshold) return;

    if (delta > 0 && currentScrollY > 64) {
      // Scrolling down & past the header height
      this.toggleAttribute('header-hidden', true);
    } else if (delta < 0) {
      // Scrolling up
      this.toggleAttribute('header-hidden', false);
    }

    this.lastScrollY = currentScrollY;
  }

  render() {
    return html`
      <header class="wa-split">
        <h1><span class="logo">${this.renderLogo()}</span>OpenTCGS</h1>
        <div class="wa-cluster">
          <wa-select
            class="color-scheme-selector"
            appearance="filled"
            value="${this.themePreference}"
            title="Press  to toggle"
            placement="bottom"
            @change="${this.handleThemePreferenceChange}"
          >
            <span slot="label" class="wa-visually-hidden">Choose Theme</span>
            <wa-icon
              class="only-light"
              slot="start"
              name="sun"
              variant="regular"
              .hidden="${this.themeColor === 'dark'}"
            ></wa-icon>
            <wa-icon
              class="only-dark"
              slot="start"
              name="moon"
              variant="regular"
              .hidden="${this.themeColor === 'light'}"
            ></wa-icon>
            <wa-option value="light">
              <wa-icon slot="start" name="sun" variant="regular"></wa-icon>
              Light
            </wa-option>
            <wa-option value="dark">
              <wa-icon slot="start" name="moon" variant="regular"></wa-icon>
              Dark
            </wa-option>
            <wa-divider role="separator" aria-orientation="horizontal" orientation="horizontal"></wa-divider>
            <wa-option value="auto">
              <wa-icon class="only-light" slot="start" name="sun" variant="regular"></wa-icon>
              <wa-icon class="only-dark" slot="start" name="moon" variant="regular"></wa-icon>
              System
            </wa-option>
          </wa-select>
          ${this.showStoreSelector && storeList.get().length > 0
            ? html`
                <wa-select
                  class="store-selector"
                  appearance="filled"
                  value="${activeStoreId.get() ?? ''}"
                  placement="bottom"
                  @change="${this.handleStoreChange}"
                >
                  <wa-icon slot="start" name="store" variant="regular"></wa-icon>
                  <span slot="label" class="wa-visually-hidden">Select Store</span>
                  ${storeList.get().map((store) => html` <wa-option value="${store.id}">${store.name}</wa-option> `)}
                </wa-select>
              `
            : nothing}
          ${this.showCartButton
            ? html`
                <wa-button appearance="filled" aria-label="Shopping cart" @click="${this.openCartDrawer}">
                  <wa-icon name="shopping-cart" label="Shopping cart"></wa-icon>
                  <wa-badge pill>${cartState.get().items.reduce((total, item) => total + item.quantity, 0)}</wa-badge>
                </wa-button>
                <wa-divider orientation="vertical"></wa-divider>
              `
            : nothing}
          ${this.showUserMenu ? this.renderUserMenu() : nothing}
        </div>
      </header>
      <div id="page">
        ${when(
          !this.hideNav,
          () => html`
            <nav>
              <div class="nav-section-label">Shop</div>
              ${this.renderNavLink('/products/singles', 'bag-shopping', 'Browse', 'products')}
              ${this.renderNavSubLink('/products/singles', 'Singles', 'products/singles')}
              ${this.renderNavSubLink('/products/sealed', 'Sealed', 'products/sealed')}
              ${when(
                this.canManageInventory,
                () => html`
                  <wa-divider></wa-divider>
                  <div class="nav-section-label">Employees</div>

                  ${when(this.canViewDashboard, () => this.renderNavLink('/', 'house', 'Dashboard', 'Dashboard'))}
                  ${this.renderNavLink('/orders', 'receipt', 'Orders', 'Orders')}
                  ${this.renderNavLink('/inventory/singles', 'boxes-stacked', 'Inventory', 'inventory')}
                  ${this.renderNavSubLink('/inventory/singles', 'Singles', 'inventory/singles')}
                  ${this.renderNavSubLink('/inventory/sealed', 'Sealed', 'inventory/sealed')}
                  ${when(this.canViewTransactionLog, () =>
                    this.renderNavLink('/transaction-log', 'clock-rotate-left', 'Transaction Log', 'Transaction Log'),
                  )}
                `,
              )}
              ${when(
                this.canAccessSettings,
                () => html`
                  <wa-divider></wa-divider>
                  <div class="nav-section-label">Owner</div>

                  ${this.renderNavLink('/settings/general', 'gear', 'Settings', 'settings')}
                  ${this.renderNavSubLink('/settings/general', 'General', 'settings/general')}
                  ${when(this.canManageStoreLocations, () =>
                    this.renderNavSubLink('/settings/locations', 'Store Locations', 'settings/locations'),
                  )}
                  ${this.renderNavSubLink('/settings/backup', 'Backup & Restore', 'settings/backup')}
                  ${this.renderNavSubLink('/settings/autoprice', 'Autoprice', 'settings/autoprice')}
                  ${this.renderNavSubLink('/settings/integrations', 'Integrations', 'settings/integrations')}
                  ${when(this.canManageUsers, () =>
                    this.renderNavSubLink('/settings/users', 'User Accounts', 'settings/users'),
                  )}
                `,
              )}
            </nav>
          `,
          () => nothing,
        )}
        <section>
          <slot></slot>
        </section>
      </div>
      ${this.renderAuthDialog()} ${this.renderCartDrawer()}
    `;
  }

  // --- Store Selector ---

  private async handleStoreChange(e: Event) {
    const select = e.target as WaSelect;
    const newStoreId = select.value as string;
    if (!newStoreId || newStoreId === activeStoreId.get()) return;

    if (this.isAnonymous) {
      // Anonymous users: just update the cookie
      setActiveStoreCookie(newStoreId);
    } else {
      // Authenticated users: update the session via better-auth
      try {
        const authClient = await getAuthClient();
        await authClient.organization.setActive({ organizationId: newStoreId });
        activeStoreId.set(newStoreId);
      } catch (err) {
        console.error('Failed to set active store:', err);
        return;
      }
    }

    // Re-fetch cart for the new store
    await this.fetchCart();

    // Dispatch event so page components can re-fetch their data
    this.dispatchEvent(
      new CustomEvent('store-changed', { detail: { storeId: newStoreId }, bubbles: true, composed: true }),
    );
  }

  // --- Cart Drawer ---

  private openCartDrawer() {
    this.orderError = '';
    this.orderSuccess = '';
    this.showCartDrawer = true;
  }

  private closeCartDrawer() {
    this.showCartDrawer = false;
  }

  private renderCartDrawer() {
    const cart = cartState.get();
    const cartTotal = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const hasItems = cart.items.length > 0;

    return html`
      <wa-drawer
        label="Shopping Cart"
        placement="end"
        ?open="${this.showCartDrawer}"
        @wa-after-hide="${this.closeCartDrawer}"
      >
        ${this.orderSuccess
          ? this.renderOrderSuccess()
          : html`
              ${hasItems
                ? html`
                    <div class="cart-items">${cart.items.map((item) => this.renderCartItem(item))}</div>
                    <div class="cart-total">
                      <span>Total</span>
                      <span>$${cartTotal.toFixed(2)}</span>
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
                      <p style="font-size: var(--wa-font-size-s);">Browse products to add items to your cart.</p>
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

  private renderCartItem(item: CartItem) {
    const lineTotal = item.unitPrice * item.quantity;
    return html`
      <div class="cart-item">
        <div class="cart-item-header">
          <div>
            <div class="cart-item-name">${item.productName}</div>
            <div class="cart-item-condition">${item.condition} · $${item.unitPrice.toFixed(2)} each</div>
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
          <div class="cart-item-price">$${lineTotal.toFixed(2)}</div>
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
            this.closeCartDrawer();
          }}"
        >
          Close
        </wa-button>
      </div>
    `;
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
      } else {
        const data = result.data.submitOrder;
        if (data.error) {
          if (data.insufficientItems && data.insufficientItems.length > 0) {
            const details = data.insufficientItems
              .map(
                (i: { productName: string; condition: string; requested: number; available: number }) =>
                  `${i.productName} (${i.condition}): requested ${i.requested}, only ${i.available} available`,
              )
              .join('; ');
            this.orderError = `${data.error}: ${details}`;
          } else {
            this.orderError = data.error;
          }
          // Refresh cart to get updated maxAvailable values
          await this.fetchCart();
        } else if (data.order) {
          this.orderSuccess = `Order ${data.order.orderNumber} created for $${data.order.totalAmount.toFixed(2)}`;
          cartState.set({ items: [] });
          this.customerName = '';
          // Notify product pages to refresh listings with updated inventory
          this.dispatchEvent(new CustomEvent('order-submitted', { bubbles: true, composed: true }));
        }
      }
    } catch (e) {
      this.orderError = e instanceof Error ? e.message : 'Failed to submit order';
    } finally {
      this.submittingOrder = false;
    }
  }

  // --- User Menu ---

  private renderUserMenu() {
    if (this.isAnonymous || !this.userName) {
      return html`
        <wa-dropdown>
          <wa-button class="avatar-button" appearance="filled" slot="trigger" aria-label="User menu">
            <wa-icon name="user" variant="solid" label="User"></wa-icon>
          </wa-button>
          <wa-dropdown-item @click="${this.openAuthDialog}">
            <wa-icon slot="icon" name="sign-in"></wa-icon>
            Sign In
          </wa-dropdown-item>
        </wa-dropdown>
      `;
    }

    return html`
      <wa-dropdown>
        <wa-button class="avatar-button" appearance="filled" slot="trigger" aria-label="User menu">
          <wa-icon name="user" variant="solid" label="User"></wa-icon>
        </wa-button>
        <div class="dropdown-user-label">${this.userName}</div>
        <wa-divider></wa-divider>
        <wa-dropdown-item @click="${this.handleSignOut}">
          <wa-icon slot="icon" name="sign-out"></wa-icon>
          Sign Out
        </wa-dropdown-item>
      </wa-dropdown>
    `;
  }

  private renderAuthDialog() {
    return html`
      <wa-dialog
        label="${this.authMode === 'signin' ? 'Sign In' : 'Sign Up'}"
        ?open="${this.showAuthDialog}"
        @wa-after-hide="${this.closeAuthDialog}"
      >
        <div class="auth-form" @keydown="${this.handleAuthKeydown}">
          ${when(
            this.authMode === 'signup',
            () => html`
              <wa-input
                label="Name"
                name="name"
                autocomplete="name"
                required
                .value="${this.authName}"
                @input="${this.handleAuthNameInput}"
              >
                <wa-icon slot="start" name="user"></wa-icon>
                <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
              </wa-input>
            `,
          )}

          <wa-input
            autofocus
            type="email"
            name="email"
            autocomplete="email"
            label="Email"
            required
            .value="${this.authEmail}"
            @input="${this.handleAuthEmailInput}"
          >
            <wa-icon slot="start" name="envelope"></wa-icon>
            <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
          </wa-input>

          <wa-input
            type="password"
            name="password"
            autocomplete="${this.authMode === 'signin' ? 'current-password' : 'new-password'}"
            label="Password"
            required
            password-toggle
            .value="${this.authPassword}"
            @input="${this.handleAuthPasswordInput}"
          >
            <wa-icon slot="start" name="lock"></wa-icon>
            <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
          </wa-input>

          ${when(
            this.authMode === 'signup',
            () => html`
              <wa-input
                type="password"
                name="confirm-password"
                autocomplete="new-password"
                label="Confirm Password"
                required
                password-toggle
                .value="${this.authConfirmPassword}"
                @input="${this.handleAuthConfirmPasswordInput}"
              >
                <wa-icon slot="start" name="lock"></wa-icon>
                <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
              </wa-input>
            `,
          )}
          ${this.authError ? html`<p class="auth-error">${this.authError}</p>` : nothing}

          <div class="auth-toggle">
            ${this.authMode === 'signin'
              ? html`Don't have an account? <a @click="${this.switchToSignUp}">Sign up</a>`
              : html`Already have an account? <a @click="${this.switchToSignIn}">Sign in</a>`}
          </div>
        </div>

        <wa-button slot="footer" variant="neutral" @click="${this.closeAuthDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="brand" ?loading="${this.authLoading}" @click="${this.handleAuthSubmit}">
          ${this.authMode === 'signin' ? 'Sign in' : 'Sign up'}
        </wa-button>
      </wa-dialog>
    `;
  }

  private openAuthDialog() {
    this.authMode = 'signin';
    this.authEmail = '';
    this.authPassword = '';
    this.authConfirmPassword = '';
    this.authName = '';
    this.authError = '';
    this.authLoading = false;
    this.showAuthDialog = true;
  }

  private closeAuthDialog() {
    this.showAuthDialog = false;
    this.authError = '';
  }

  private switchToSignUp(event: Event) {
    event.preventDefault();
    this.authMode = 'signup';
    this.authError = '';
  }

  private switchToSignIn(event: Event) {
    event.preventDefault();
    this.authMode = 'signin';
    this.authError = '';
  }

  private handleAuthNameInput(event: Event) {
    this.authName = (event.target as HTMLInputElement).value;
  }

  private handleAuthEmailInput(event: Event) {
    this.authEmail = (event.target as HTMLInputElement).value;
  }

  private handleAuthPasswordInput(event: Event) {
    this.authPassword = (event.target as HTMLInputElement).value;
  }

  private handleAuthConfirmPasswordInput(event: Event) {
    this.authConfirmPassword = (event.target as HTMLInputElement).value;
  }

  private handleAuthKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleAuthSubmit();
    }
  }

  private async handleAuthSubmit() {
    this.authError = '';
    this.authLoading = true;

    try {
      const authClient = await getAuthClient();
      if (this.authMode === 'signin') {
        const result = await authClient.signIn.email({
          email: this.authEmail,
          password: this.authPassword,
        });
        if (result.error) {
          this.authError = result.error.message ?? 'Sign in failed';
        } else {
          window.location.reload();
        }
      } else {
        if (this.authPassword !== this.authConfirmPassword) {
          this.authError = 'Passwords do not match';
          this.authLoading = false;
          return;
        }
        const signUpResult = await authClient.signUp.email({
          email: this.authEmail,
          password: this.authPassword,
          name: this.authName,
        });
        if (signUpResult.error) {
          this.authError = signUpResult.error.message ?? 'Sign up failed';
        } else {
          // Better Auth auto-signs in after sign-up by default (autoSignIn: true)
          window.location.reload();
        }
      }
    } catch (e) {
      this.authError = e instanceof Error ? e.message : 'An unexpected error occurred';
    } finally {
      this.authLoading = false;
    }
  }

  private async handleSignOut() {
    try {
      const authClient = await getAuthClient();
      await authClient.signOut();
      // Clear session cookies to prevent stale session issues on next sign-in
      Cookies.remove('better-auth.session_token');
      Cookies.remove('better-auth.session_data');
      window.location.href = '/';
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  }

  handleThemePreferenceChange(event: Event) {
    const { value } = event.target as WaSelect;
    if (value && typeof value === 'string') {
      Cookies.set('ogs-theme-preference', value);
      this.themePreference = value;
    }

    this.themeColor = this.determineThemeColor();
    this.updateThemeClass();
  }

  determineThemeColor() {
    if (this.themePreference === 'auto') {
      const prefersDarkColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
      if (prefersDarkColorScheme.matches) {
        document.querySelector('html')?.classList.add('wa-dark');
        return 'dark';
      } else {
        document.querySelector('html')?.classList.remove('wa-dark');
        return 'light';
      }
    }
    return this.themePreference;
  }

  updateThemeClass() {
    if (this.themeColor === 'light') {
      document.querySelector('html')?.classList.remove('wa-dark');
    } else {
      document.querySelector('html')?.classList.add('wa-dark');
    }
  }

  private renderLogo() {
    return unsafeHTML(logoSvg);
  }

  private renderNavLink(href: string, icon: string, label: string, activationKey: string) {
    const isActive = this.activePage === activationKey || (this.activePage?.startsWith(activationKey + '/') ?? false);
    return html`<a class="nav-link" href="${href}" ?current="${isActive}">
      <wa-icon name="${icon}" variant="solid"></wa-icon>
      ${label}
    </a>`;
  }

  private renderNavSubLink(href: string, label: string, activationKey: string) {
    return html`<a class="nav-sub-link" href="${href}" ?current="${this.activePage === activationKey}"> ${label} </a>`;
  }
}
