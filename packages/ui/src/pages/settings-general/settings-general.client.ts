import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '../../components/ogs-page.ts';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql';
import { TypedDocumentString } from '../../graphql/graphql';

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

const GetStoreSettingsQuery = new TypedDocumentString(`
  query GetStoreSettings {
    getStoreSettings {
      storeName
      street1
      street2
      city
      state
      zip
      ein
      salesTaxRate
    }
  }
`) as unknown as TypedDocumentString<
  {
    getStoreSettings: {
      storeName: string | null;
      street1: string | null;
      street2: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      ein: string | null;
      salesTaxRate: number | null;
    };
  },
  Record<string, never>
>;

const UpdateStoreSettingsMutation = new TypedDocumentString(`
  mutation UpdateStoreSettings($input: UpdateStoreSettingsInput!) {
    updateStoreSettings(input: $input) {
      storeName
      street1
      street2
      city
      state
      zip
      ein
      salesTaxRate
    }
  }
`) as unknown as TypedDocumentString<
  {
    updateStoreSettings: {
      storeName: string | null;
      street1: string | null;
      street2: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      ein: string | null;
      salesTaxRate: number | null;
    };
  },
  {
    input: {
      storeName?: string;
      street1?: string;
      street2?: string;
      city?: string;
      state?: string;
      zip?: string;
      ein?: string;
    };
  }
>;

const LookupSalesTaxQuery = new TypedDocumentString(`
  query LookupSalesTax($countryCode: String!, $stateCode: String!) {
    lookupSalesTax(countryCode: $countryCode, stateCode: $stateCode) {
      rate
      type
      currency
    }
  }
`) as unknown as TypedDocumentString<
  { lookupSalesTax: { rate: number; type: string; currency: string | null } },
  { countryCode: string; stateCode: string }
>;

@customElement('ogs-settings-general-page')
export class OgsSettingsGeneralPage extends LitElement {
  @property({ type: String }) userRole = '';
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';

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

      /* --- Section Cards --- */

      .settings-section {
        margin-bottom: 1.5rem;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .section-header wa-icon {
        color: var(--wa-color-brand-text);
        font-size: 1.125rem;
      }

      .section-header h3 {
        margin: 0;
        font-size: var(--wa-font-size-l);
        font-weight: 600;
      }

      .section-header p {
        margin: 0;
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-s);
      }

      /* --- Form Layout --- */

      .form-grid {
        display: grid;
        gap: 0.75rem;
      }

      .address-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.75rem;
      }

      .tax-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: var(--wa-color-surface-alt);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-m);
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-muted);
      }

      .tax-info wa-icon {
        color: var(--wa-color-brand-text);
        flex-shrink: 0;
      }

      .save-bar {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 0.5rem;
        padding-top: 1rem;
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

  @state() storeName = '';
  @state() street1 = '';
  @state() street2 = '';
  @state() city = '';
  @state() stateCode = '';
  @state() zip = '';
  @state() ein = '';
  @state() salesTaxRate: number | null = null;
  @state() loading = true;
  @state() saving = false;
  @state() successMessage = '';
  @state() errorMessage = '';

  connectedCallback(): void {
    super.connectedCallback();
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const result = await execute(GetStoreSettingsQuery);
      if (result?.data?.getStoreSettings) {
        const s = result.data.getStoreSettings;
        this.storeName = s.storeName ?? '';
        this.street1 = s.street1 ?? '';
        this.street2 = s.street2 ?? '';
        this.city = s.city ?? '';
        this.stateCode = s.state ?? '';
        this.zip = s.zip ?? '';
        this.ein = s.ein ?? '';
        this.salesTaxRate = s.salesTaxRate;
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to load settings';
    } finally {
      this.loading = false;
    }
  }

  async handleStateChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.stateCode = select.value;

    if (this.stateCode) {
      try {
        const result = await execute(LookupSalesTaxQuery, { countryCode: 'US', stateCode: this.stateCode });
        if (result?.data?.lookupSalesTax) {
          this.salesTaxRate = result.data.lookupSalesTax.rate;
        }
      } catch {
        // Silently fail tax lookup
      }
    } else {
      this.salesTaxRate = null;
    }
  }

  async handleSave() {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const result = await execute(UpdateStoreSettingsMutation, {
        input: {
          storeName: this.storeName,
          street1: this.street1,
          street2: this.street2,
          city: this.city,
          state: this.stateCode,
          zip: this.zip,
          ein: this.ein,
        },
      });

      if (result?.errors?.length) {
        this.errorMessage = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else if (result?.data?.updateStoreSettings) {
        this.salesTaxRate = result.data.updateStoreSettings.salesTaxRate;
        this.successMessage = 'Settings saved successfully';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to save settings';
    } finally {
      this.saving = false;
    }
  }

  render() {
    return html`
      <ogs-page
        activePage="settings/general"
        ?showUserMenu="${true}"
        userRole="${this.userRole}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
      >
        ${this.renderPageHeader()}
        ${when(
          this.loading,
          () => html`
            <div class="loading-container">
              <wa-spinner style="font-size: 2rem;"></wa-spinner>
              <span>Loading settings...</span>
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
          <wa-icon name="gear" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>General Settings</h2>
          <p>Configure your store information, address, and tax settings</p>
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

      <wa-card appearance="outline">
        <!-- Store Information -->
        <div class="settings-section">
          <div class="section-header">
            <wa-icon name="store"></wa-icon>
            <div>
              <h3>Store Information</h3>
              <p>Basic details about your store</p>
            </div>
          </div>
          <div class="form-grid">
            <wa-input
              label="Store Name"
              .value="${this.storeName}"
              @input="${(e: Event) => {
                this.storeName = (e.target as HTMLInputElement).value;
              }}"
            >
              <wa-icon slot="prefix" name="store"></wa-icon>
            </wa-input>

            <wa-input
              label="EIN (Employer Identification Number)"
              .value="${this.ein}"
              @input="${(e: Event) => {
                this.ein = (e.target as HTMLInputElement).value;
              }}"
            >
              <wa-icon slot="prefix" name="id-card"></wa-icon>
            </wa-input>
          </div>
        </div>

        <!-- Address -->
        <div class="settings-section">
          <div class="section-header">
            <wa-icon name="location-dot"></wa-icon>
            <div>
              <h3>Store Address</h3>
              <p>Physical location of your store</p>
            </div>
          </div>
          <div class="form-grid">
            <wa-input
              label="Street Address"
              .value="${this.street1}"
              @input="${(e: Event) => {
                this.street1 = (e.target as HTMLInputElement).value;
              }}"
            ></wa-input>

            <wa-input
              label="Street Address 2"
              .value="${this.street2}"
              @input="${(e: Event) => {
                this.street2 = (e.target as HTMLInputElement).value;
              }}"
            ></wa-input>

            <div class="address-row">
              <wa-input
                label="City"
                .value="${this.city}"
                @input="${(e: Event) => {
                  this.city = (e.target as HTMLInputElement).value;
                }}"
              ></wa-input>

              <wa-select label="State" .value="${this.stateCode}" @change="${this.handleStateChange}">
                <wa-option value="">Select state</wa-option>
                ${US_STATES.map((s) => html`<wa-option value="${s.code}">${s.code} - ${s.name}</wa-option>`)}
              </wa-select>

              <wa-input
                label="ZIP Code"
                .value="${this.zip}"
                @input="${(e: Event) => {
                  this.zip = (e.target as HTMLInputElement).value;
                }}"
              ></wa-input>
            </div>
          </div>
        </div>

        <!-- Sales Tax -->
        <div class="settings-section">
          <div class="section-header">
            <wa-icon name="percent"></wa-icon>
            <div>
              <h3>Sales Tax</h3>
              <p>Automatically determined based on your state</p>
            </div>
          </div>
          <div class="form-grid">
            <wa-input
              label="Sales Tax Rate"
              .value="${this.salesTaxRate != null ? `${(this.salesTaxRate * 100).toFixed(2)}%` : 'N/A'}"
              readonly
            >
              <wa-icon slot="prefix" name="percent"></wa-icon>
            </wa-input>
            <div class="tax-info">
              <wa-icon name="circle-info"></wa-icon>
              <span>Tax rate is auto-populated based on your state selection using current sales tax data.</span>
            </div>
          </div>
        </div>

        <!-- Save -->
        <div class="save-bar">
          <wa-button variant="brand" ?loading="${this.saving}" @click="${this.handleSave}">
            <wa-icon slot="start" name="floppy-disk"></wa-icon>
            Save Settings
          </wa-button>
        </div>
      </wa-card>
    `;
  }
}
