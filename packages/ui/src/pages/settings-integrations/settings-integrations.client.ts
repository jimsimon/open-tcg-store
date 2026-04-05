import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '../../components/ogs-page.ts';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql';
import { TypedDocumentString } from '../../graphql/graphql';

const GetIntegrationSettingsQuery = new TypedDocumentString(`
  query GetIntegrationSettings {
    getIntegrationSettings {
      stripe { enabled hasApiKey }
      shopify { enabled hasApiKey shopDomain }
    }
  }
`) as unknown as TypedDocumentString<
  {
    getIntegrationSettings: {
      stripe: { enabled: boolean; hasApiKey: boolean };
      shopify: { enabled: boolean; hasApiKey: boolean; shopDomain: string | null };
    };
  },
  Record<string, never>
>;

const UpdateStripeMutation = new TypedDocumentString(`
  mutation UpdateStripeIntegration($input: UpdateStripeIntegrationInput!) {
    updateStripeIntegration(input: $input) { enabled hasApiKey }
  }
`) as unknown as TypedDocumentString<
  { updateStripeIntegration: { enabled: boolean; hasApiKey: boolean } },
  { input: { enabled?: boolean; apiKey?: string } }
>;

const UpdateShopifyMutation = new TypedDocumentString(`
  mutation UpdateShopifyIntegration($input: UpdateShopifyIntegrationInput!) {
    updateShopifyIntegration(input: $input) { enabled hasApiKey shopDomain }
  }
`) as unknown as TypedDocumentString<
  { updateShopifyIntegration: { enabled: boolean; hasApiKey: boolean; shopDomain: string | null } },
  { input: { enabled?: boolean; apiKey?: string; shopDomain?: string } }
>;

@customElement('ogs-settings-integrations-page')
export class OgsSettingsIntegrationsPage extends LitElement {
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';
  @property({ type: Boolean }) canManageInventory = false;
  @property({ type: Boolean }) canViewDashboard = false;
  @property({ type: Boolean }) canAccessSettings = false;
  @property({ type: Boolean }) canManageStoreLocations = false;
  @property({ type: Boolean }) canManageUsers = false;
  @property({ type: Boolean }) canViewTransactionLog = false;
  @property({ type: String }) activeOrganizationId = '';

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

      *,
      *::before,
      *::after {
        box-sizing: border-box;
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

      /* --- Integration Cards --- */

      .integrations-grid {
        display: grid;
        gap: 1.5rem;
      }

      .integration-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }

      .integration-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .integration-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: var(--wa-border-radius-m);
        background: var(--wa-color-brand-container);
        color: var(--wa-color-brand-text);
        font-size: 1.125rem;
        flex-shrink: 0;
      }

      .integration-title-text h3 {
        margin: 0;
        font-size: var(--wa-font-size-l);
        font-weight: 600;
      }

      .integration-title-text p {
        margin: 0.125rem 0 0 0;
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-s);
      }

      /* --- Form Fields --- */

      .integration-fields {
        display: grid;
        gap: 0.75rem;
      }

      .key-status {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: var(--wa-font-size-xs);
        margin-top: 0.25rem;
      }

      .key-status.configured {
        color: var(--wa-color-success-text);
      }

      .key-status.not-configured {
        color: var(--wa-color-text-muted);
      }

      .integration-save {
        margin-top: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--wa-color-surface-border);
      }

      /* --- Loading & Messages --- */

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        gap: 1rem;
      }

      .loading-container span {
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-s);
      }
    `,
  ];

  @state() stripeEnabled = false;
  @state() stripeHasApiKey = false;
  @state() stripeApiKey = '';
  @state() shopifyEnabled = false;
  @state() shopifyHasApiKey = false;
  @state() shopifyApiKey = '';
  @state() shopifyShopDomain = '';
  @state() loading = true;
  @state() savingStripe = false;
  @state() savingShopify = false;
  @state() successMessage = '';
  @state() errorMessage = '';

  connectedCallback(): void {
    super.connectedCallback();
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const result = await execute(GetIntegrationSettingsQuery);
      if (result?.data?.getIntegrationSettings) {
        const s = result.data.getIntegrationSettings;
        this.stripeEnabled = s.stripe.enabled;
        this.stripeHasApiKey = s.stripe.hasApiKey;
        this.shopifyEnabled = s.shopify.enabled;
        this.shopifyHasApiKey = s.shopify.hasApiKey;
        this.shopifyShopDomain = s.shopify.shopDomain ?? '';
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to load settings';
    } finally {
      this.loading = false;
    }
  }

  async saveStripe() {
    this.savingStripe = true;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const input: { enabled?: boolean; apiKey?: string } = { enabled: this.stripeEnabled };
      if (this.stripeApiKey) input.apiKey = this.stripeApiKey;
      const result = await execute(UpdateStripeMutation, { input });
      if (result?.errors?.length) {
        this.errorMessage = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.stripeHasApiKey = result.data.updateStripeIntegration.hasApiKey;
        this.stripeApiKey = '';
        this.successMessage = 'Stripe settings saved';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to save';
    } finally {
      this.savingStripe = false;
    }
  }

  async saveShopify() {
    this.savingShopify = true;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const input: { enabled?: boolean; apiKey?: string; shopDomain?: string } = {
        enabled: this.shopifyEnabled,
        shopDomain: this.shopifyShopDomain,
      };
      if (this.shopifyApiKey) input.apiKey = this.shopifyApiKey;
      const result = await execute(UpdateShopifyMutation, { input });
      if (result?.errors?.length) {
        this.errorMessage = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.shopifyHasApiKey = result.data.updateShopifyIntegration.hasApiKey;
        this.shopifyApiKey = '';
        this.successMessage = 'Shopify settings saved';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to save';
    } finally {
      this.savingShopify = false;
    }
  }

  render() {
    return html`
      <ogs-page
        activePage="settings/integrations"
        ?showUserMenu="${true}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
        ?canManageInventory="${this.canManageInventory}"
        ?canViewDashboard="${this.canViewDashboard}"
        ?canAccessSettings="${this.canAccessSettings}"
        ?canManageStoreLocations="${this.canManageStoreLocations}"
        ?canManageUsers="${this.canManageUsers}"
        ?canViewTransactionLog="${this.canViewTransactionLog}"
        activeOrganizationId="${this.activeOrganizationId}"
      >
        ${this.renderPageHeader()}
        ${when(
          this.loading,
          () => html`
            <div class="loading-container">
              <wa-spinner style="font-size: 2rem;"></wa-spinner>
              <span>Loading integrations...</span>
            </div>
          `,
          () => this.renderContent(),
        )}
      </ogs-page>
    `;
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="puzzle-piece" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Integrations</h2>
          <p>Connect third-party services for payments, e-commerce, and accounting</p>
        </div>
      </div>
    `;
  }

  private renderContent() {
    return html`
      ${this.successMessage
        ? html`
            <wa-callout variant="success" style="margin-bottom: 1rem;">
              <wa-icon slot="icon" name="circle-check"></wa-icon>
              ${this.successMessage}
            </wa-callout>
          `
        : nothing}
      ${this.errorMessage
        ? html`
            <wa-callout variant="danger" style="margin-bottom: 1rem;">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              ${this.errorMessage}
            </wa-callout>
          `
        : nothing}

      <div class="integrations-grid">${this.renderStripeCard()} ${this.renderShopifyCard()}</div>
    `;
  }

  private renderKeyStatus(configured: boolean, label: string) {
    return html`
      <div class="key-status ${configured ? 'configured' : 'not-configured'}">
        <wa-icon name="${configured ? 'circle-check' : 'circle-xmark'}" style="font-size: 0.75rem;"></wa-icon>
        <span>${configured ? `✓ ${label} configured` : `No ${label} configured`}</span>
      </div>
    `;
  }

  private renderStripeCard() {
    return html`
      <wa-card appearance="outline">
        <div class="integration-card-header">
          <div class="integration-title">
            <div class="integration-icon">
              <wa-icon name="credit-card"></wa-icon>
            </div>
            <div class="integration-title-text">
              <h3>Stripe</h3>
              <p>Payment processing for point-of-sale transactions</p>
            </div>
          </div>
          <wa-switch
            ?checked="${this.stripeEnabled}"
            @change="${(e: Event) => {
              this.stripeEnabled = (e.target as HTMLInputElement).checked;
            }}"
          >
            ${this.stripeEnabled ? 'Enabled' : 'Disabled'}
          </wa-switch>
        </div>
        <div class="integration-fields">
          <div>
            <wa-input
              type="password"
              label="API Key"
              placeholder="${this.stripeHasApiKey ? '••••••••••••••••' : 'Enter Stripe API key'}"
              .value="${this.stripeApiKey}"
              @input="${(e: Event) => {
                this.stripeApiKey = (e.target as HTMLInputElement).value;
              }}"
              password-toggle
            >
              <wa-icon slot="prefix" name="key"></wa-icon>
            </wa-input>
            ${this.renderKeyStatus(this.stripeHasApiKey, 'API key')}
          </div>
          <div class="integration-save">
            <wa-button variant="brand" size="small" ?loading="${this.savingStripe}" @click="${this.saveStripe}">
              <wa-icon slot="start" name="floppy-disk"></wa-icon>
              Save Stripe Settings
            </wa-button>
          </div>
        </div>
      </wa-card>
    `;
  }

  private renderShopifyCard() {
    return html`
      <wa-card appearance="outline">
        <div class="integration-card-header">
          <div class="integration-title">
            <div class="integration-icon">
              <wa-icon name="cart-shopping"></wa-icon>
            </div>
            <div class="integration-title-text">
              <h3>Shopify</h3>
              <p>E-commerce syncing and online storefront integration</p>
            </div>
          </div>
          <wa-switch
            ?checked="${this.shopifyEnabled}"
            @change="${(e: Event) => {
              this.shopifyEnabled = (e.target as HTMLInputElement).checked;
            }}"
          >
            ${this.shopifyEnabled ? 'Enabled' : 'Disabled'}
          </wa-switch>
        </div>
        <div class="integration-fields">
          <wa-input
            label="Shop Domain"
            placeholder="your-store.myshopify.com"
            .value="${this.shopifyShopDomain}"
            @input="${(e: Event) => {
              this.shopifyShopDomain = (e.target as HTMLInputElement).value;
            }}"
          >
            <wa-icon slot="prefix" name="globe"></wa-icon>
          </wa-input>
          <div>
            <wa-input
              type="password"
              label="API Key"
              placeholder="${this.shopifyHasApiKey ? '••••••••••••••••' : 'Enter Shopify API key'}"
              .value="${this.shopifyApiKey}"
              @input="${(e: Event) => {
                this.shopifyApiKey = (e.target as HTMLInputElement).value;
              }}"
              password-toggle
            >
              <wa-icon slot="prefix" name="key"></wa-icon>
            </wa-input>
            ${this.renderKeyStatus(this.shopifyHasApiKey, 'API key')}
          </div>
          <div class="integration-save">
            <wa-button variant="brand" size="small" ?loading="${this.savingShopify}" @click="${this.saveShopify}">
              <wa-icon slot="start" name="floppy-disk"></wa-icon>
              Save Shopify Settings
            </wa-button>
          </div>
        </div>
      </wa-card>
    `;
  }
}
