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
import logoSvg from '../assets/logo.svg?raw';
import { cartState } from '../lib/cart-state';
import { storeList, activeStoreId, initActiveStoreFromCookie, setActiveStoreCookie } from '../lib/store-context';
import { getAuthClient } from '../lib/auth';
import './ogs-cart-drawer.ts';
import './ogs-auth-dialog.ts';
import type { OgsCartDrawer } from './ogs-cart-drawer.ts';

// --- GraphQL Queries for Store Locations ---

const GetAllStoreLocationsQuery = graphql(`
  query GetAllStoreLocations {
    getAllStoreLocations {
      id
      name
      slug
      city
      state
    }
  }
`);

const GetEmployeeStoreLocationsQuery = graphql(`
  query GetEmployeeStoreLocations {
    getEmployeeStoreLocations {
      id
      name
      slug
      city
      state
    }
  }
`);

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

      .dropdown-user-label {
        padding: var(--wa-space-xs) var(--wa-space-m);
        font-weight: bold;
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-normal);
      }

      .store-selector {
        min-width: 180px;
        max-width: 250px;
      }

      .color-scheme-selector {
        max-width: 160px;
      }
    `,
  ];

  @property({ type: String })
  activePage?: string;

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
  canManageLots = false;

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

  @property({ type: Boolean })
  canUsePOS = false;

  @property({ type: Boolean })
  canManageEvents = false;

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
  showCartDrawer = false;

  private lastScrollY = 0;
  private scrollThreshold = 10;
  private boundHandleScroll = this.handleScroll.bind(this);

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.updateThemeClass();
  }

  connectedCallback(): void {
    super.connectedCallback();
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

  private get cartDrawer(): OgsCartDrawer | null {
    return this.renderRoot.querySelector('ogs-cart-drawer');
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
          ${this.showStoreSelector && storeList.get().length > 0
            ? html`
                <wa-select
                  class="store-selector"
                  appearance="filled"
                  value="${activeStoreId.get() ?? ''}"
                  placement="bottom"
                  @change="${this.handleStoreChange}"
                >
                  <wa-icon slot="start" name="location-dot" variant="solid"></wa-icon>
                  <span slot="label" class="wa-visually-hidden">Select Store</span>
                  ${storeList.get().map((store) => html` <wa-option value="${store.id}">${store.name}</wa-option> `)}
                </wa-select>
              `
            : nothing}
          <wa-select
            class="color-scheme-selector"
            appearance="filled"
            size="small"
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
            <nav aria-label="Main navigation">
              <div class="nav-section-label">Shop</div>
              ${this.renderNavLink('/products/singles', 'bag-shopping', 'Browse', 'products')}
              ${this.renderNavSubLink('/products/singles', 'Singles', 'products/singles')}
              ${this.renderNavSubLink('/products/sealed', 'Sealed', 'products/sealed')}
              ${this.renderNavLink('/buy-rates', 'hand-holding-dollar', 'Buy Rates', 'buy-rates')}
              ${this.renderNavLink('/events', 'calendar-days', 'Events', 'events')}
              ${when(
                this.canManageInventory,
                () => html`
                  <wa-divider></wa-divider>
                  <div class="nav-section-label">Employees</div>

                  ${when(this.canViewDashboard, () =>
                    this.renderNavLink('/settings-dashboard', 'house', 'Dashboard', 'Dashboard'),
                  )}
                  ${this.renderNavLink('/orders', 'receipt', 'Orders', 'Orders')}
                  ${when(this.canUsePOS, () => this.renderNavLink('/pos', 'cash-register', 'POS', 'pos'))}
                  ${this.renderNavLink('/inventory/singles', 'boxes-stacked', 'Inventory', 'inventory')}
                  ${this.renderNavSubLink('/inventory/singles', 'Singles', 'inventory/singles')}
                  ${this.renderNavSubLink('/inventory/sealed', 'Sealed', 'inventory/sealed')}
                  ${when(this.canManageLots, () => this.renderNavLink('/lots', 'layer-group', 'Lots', 'lots'))}
                  ${when(this.canViewTransactionLog, () =>
                    this.renderNavLink('/transaction-log', 'clock-rotate-left', 'Transaction Log', 'Transaction Log'),
                  )}
                  ${when(this.canManageUsers, () =>
                    this.renderNavLink('/users', 'users-gear', 'User Accounts', 'users'),
                  )}
                  ${when(this.canManageEvents, () =>
                    this.renderNavLink('/event-management', 'calendar-pen', 'Events', 'event-management'),
                  )}
                `,
              )}
              ${when(
                this.canAccessSettings,
                () => html`
                  <wa-divider></wa-divider>
                  <div class="nav-section-label">Settings</div>

                  ${this.renderNavLink('/settings/general', 'gear', 'General', 'settings/general')}
                  ${when(this.canManageStoreLocations, () =>
                    this.renderNavLink('/settings/locations', 'location-dot', 'Store Locations', 'settings/locations'),
                  )}
                  ${this.renderNavLink('/settings/backup', 'floppy-disk', 'Backup & Restore', 'settings/backup')}
                  ${this.renderNavLink('/settings/autoprice', 'tags', 'Autoprice', 'settings/autoprice')}
                  ${this.renderNavLink('/settings/buyrates', 'hand-holding-dollar', 'Buy Rates', 'settings/buyrates')}
                  ${this.renderNavLink('/settings/data-updates', 'database', 'Card Data', 'settings/data-updates')}
                  ${this.renderNavLink('/settings/integrations', 'plug', 'Integrations', 'settings/integrations')}
                  ${this.renderNavLink('/settings/scheduled-tasks', 'clock', 'Scheduled Tasks', 'settings/scheduled-tasks')}
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
      <ogs-auth-dialog
        ?open="${this.showAuthDialog}"
        @closed="${() => (this.showAuthDialog = false)}"
      ></ogs-auth-dialog>
      <ogs-cart-drawer
        ?open="${this.showCartDrawer}"
        @wa-after-hide="${() => (this.showCartDrawer = false)}"
      ></ogs-cart-drawer>
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
    await this.cartDrawer?.fetchCart();

    // Dispatch event so page components can re-fetch their data
    this.dispatchEvent(
      new CustomEvent('store-changed', { detail: { storeId: newStoreId }, bubbles: true, composed: true }),
    );
  }

  private openCartDrawer() {
    this.showCartDrawer = true;
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

  private openAuthDialog() {
    this.showAuthDialog = true;
  }

  private async handleSignOut() {
    try {
      const authClient = await getAuthClient();
      // Server-side session invalidation via Better Auth handles cookie cleanup.
      // Client-side Cookies.remove() for HttpOnly cookies is a no-op, so we
      // rely on the server to clear them via the signOut response.
      await authClient.signOut();
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
    return html`<a class="nav-link" href="${href}" ?current="${isActive}" aria-current="${isActive ? 'page' : nothing}">
      <wa-icon name="${icon}" variant="solid"></wa-icon>
      ${label}
    </a>`;
  }

  private renderNavSubLink(href: string, label: string, activationKey: string) {
    const isActive = this.activePage === activationKey;
    return html`<a
      class="nav-sub-link"
      href="${href}"
      ?current="${isActive}"
      aria-current="${isActive ? 'page' : nothing}"
    >
      ${label}
    </a>`;
  }
}
