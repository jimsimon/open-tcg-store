import { LitElement, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import './ogs-page.ts';

/**
 * Configuration for the `<ogs-page>` wrapper rendered by {@link OgsPageBase.renderPage}.
 *
 * Only page-specific options need to be provided here; identity, permissions,
 * and `activeOrganizationId` are forwarded automatically from the base-class
 * properties (which are set by server-side rendering via `renderPageAttributes`).
 */
export interface PageConfig {
  /** Identifies the current page for sidebar-nav highlighting. */
  activePage?: string;
  /** Show the user menu (sign-in / sign-out) in the header. */
  showUserMenu?: boolean;
  /** Show the store-location selector dropdown in the header. */
  showStoreSelector?: boolean;
  /** Show the shopping-cart button in the header. */
  showCartButton?: boolean;
  /** Called when the user selects a different store location. */
  onStoreChanged?: () => void;
  /** Called after a shop order is submitted (e.g. to refresh product data). */
  onOrderSubmitted?: () => void;
}

/**
 * Shared base class for every page-level component.
 *
 * Centralises the identity / permission `@property` declarations that every
 * page must receive from the server-rendered HTML and relay to `<ogs-page>`.
 *
 * **Adding a new permission?**  Declare it here and add the binding inside
 * {@link renderPage} — every page inherits the change automatically.
 */
export class OgsPageBase extends LitElement {
  // ── Identity ────────────────────────────────────────────────────────
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';
  @property({ type: String }) activeOrganizationId = '';

  // ── Permissions ─────────────────────────────────────────────────────
  @property({ type: Boolean }) canManageInventory = false;
  @property({ type: Boolean }) canManageLots = false;
  @property({ type: Boolean }) canViewDashboard = false;
  @property({ type: Boolean }) canAccessSettings = false;
  @property({ type: Boolean }) canManageStoreLocations = false;
  @property({ type: Boolean }) canManageUsers = false;
  @property({ type: Boolean }) canViewTransactionLog = false;
  @property({ type: Boolean }) canUsePOS = false;
  @property({ type: Boolean }) canManageEvents = false;

  // ── Page wrapper ────────────────────────────────────────────────────
  /**
   * Render the standard `<ogs-page>` shell around the given content.
   *
   * All identity/permission attributes are forwarded from the base-class
   * properties.  Page-specific flags (`showUserMenu`, `showStoreSelector`,
   * etc.) and event callbacks are supplied through {@link PageConfig}.
   */
  protected renderPage(content: TemplateResult, config: PageConfig = {}): TemplateResult {
    return html`
      <ogs-page
        activePage="${ifDefined(config.activePage)}"
        ?showUserMenu="${config.showUserMenu ?? false}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
        ?canManageInventory="${this.canManageInventory}"
        ?canManageLots="${this.canManageLots}"
        ?canViewDashboard="${this.canViewDashboard}"
        ?canAccessSettings="${this.canAccessSettings}"
        ?canManageStoreLocations="${this.canManageStoreLocations}"
        ?canManageUsers="${this.canManageUsers}"
        ?canViewTransactionLog="${this.canViewTransactionLog}"
        ?canUsePOS="${this.canUsePOS}"
        ?canManageEvents="${this.canManageEvents}"
        activeOrganizationId="${this.activeOrganizationId}"
        ?showStoreSelector="${config.showStoreSelector ?? false}"
        ?showCartButton="${config.showCartButton ?? false}"
        @store-changed="${ifDefined(config.onStoreChanged)}"
        @order-submitted="${ifDefined(config.onOrderSubmitted)}"
      >
        ${content}
      </ogs-page>
    `;
  }
}
