import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '../../components/ogs-page.ts';
import '../../components/ogs-wizard.ts';
import '../../components/ogs-two-pane-panel.ts';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import { graphql } from '../../graphql/index.ts';
import { execute } from '../../lib/graphql.ts';

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

interface User {
  firstName?: string;
  email?: string;
  password?: string;
}

interface Company {
  companyName?: string;
  ein?: string;
}

interface Store {
  name?: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
}

@customElement('ogs-first-time-setup-page')
export class FirstTimeSetupPage extends LitElement {
  static styles = css`
    :host {
      display: flex;
      justify-content: center;
    }

    ogs-wizard {
      display: block;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: var(--wa-space-m);
    }

    wa-callout {
      margin-bottom: var(--wa-space-m);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--wa-space-m);
    }
  `;

  @state() user: User = {};
  @state() company: Company = {};
  @state() store: Store = {};
  @state() error = '';
  @state() saving = false;

  render() {
    return html`
      <ogs-page hideNav>
        ${when(
          this.error,
          () => html`
            <wa-callout variant="danger">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              ${this.error}
            </wa-callout>
          `,
        )}
        <ogs-wizard @ogs-wizard-save-click="${this.handleSaveClick}">
          <!-- Step 1: Welcome -->
          <ogs-wizard-item heading="First Time Setup">
            <p>Welcome to the first time setup wizard! This process will help you with the following tasks:</p>
            <ul>
              <li>Creating your first admin user account</li>
              <li>Entering your company information</li>
              <li>Setting up your first store location</li>
            </ul>
            <p>Click the "Next" button to continue through the setup process!</p>
          </ogs-wizard-item>

          <!-- Step 2: Admin User -->
          <ogs-wizard-item heading="Create Admin User">
            <ogs-two-pane-panel>
              <p slot="start">
                Complete the form to create your first user account. This account will automatically be made an admin.
                Don't worry, you'll be able to add additional accounts, including more admins, after this initial setup
                process is complete.
              </p>
              <form slot="end" @submit="${(e: Event) => e.preventDefault()}">
                <wa-input label="First Name" name="name" autocomplete="name" required
                  @input="${(e: InputEvent) => { this.user = { ...this.user, firstName: (e.target as HTMLInputElement).value }; }}">
                  <wa-icon slot="start" name="pencil"></wa-icon>
                  <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
                </wa-input>
                <wa-input type="email" label="E-mail Address" name="email" autocomplete="email" required
                  @input="${(e: Event) => { this.user = { ...this.user, email: (e.target as HTMLInputElement).value }; }}">
                  <wa-icon slot="start" name="envelope"></wa-icon>
                  <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
                </wa-input>
                <wa-input type="password" label="Password" name="password" autocomplete="new-password" password-toggle required
                  @input="${(e: Event) => { this.user = { ...this.user, password: (e.target as HTMLInputElement).value }; }}">
                  <wa-icon slot="start" name="lock"></wa-icon>
                  <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
                </wa-input>
              </form>
            </ogs-two-pane-panel>
          </ogs-wizard-item>

          <!-- Step 3: Company Information -->
          <ogs-wizard-item heading="Company Information">
            <ogs-two-pane-panel>
              <p slot="start">
                Enter your company details. These are used for business identification across all your store locations.
              </p>
              <form slot="end" @submit="${(e: Event) => e.preventDefault()}">
                <wa-input label="Company Name" required
                  @input="${(e: InputEvent) => { this.company = { ...this.company, companyName: (e.target as HTMLInputElement).value }; }}">
                  <wa-icon slot="start" name="building"></wa-icon>
                  <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
                </wa-input>
                <wa-input label="EIN (Employer Identification Number)" required
                  @input="${(e: InputEvent) => { this.company = { ...this.company, ein: (e.target as HTMLInputElement).value }; }}">
                  <wa-icon slot="start" name="hashtag"></wa-icon>
                  <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
                </wa-input>
              </form>
            </ogs-two-pane-panel>
          </ogs-wizard-item>

          <!-- Step 4: First Store Location -->
          <ogs-wizard-item heading="First Store Location">
            <ogs-two-pane-panel>
              <p slot="start">
                Set up your first store location. You'll be able to add more locations later from the Settings page.
                All fields are required.
              </p>
              <form slot="end" @submit="${(e: Event) => e.preventDefault()}">
                <wa-input label="Store Name" required
                  @input="${(e: InputEvent) => { this.store = { ...this.store, name: (e.target as HTMLInputElement).value }; }}">
                  <wa-icon slot="start" name="store"></wa-icon>
                  <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
                </wa-input>
                <wa-input label="Street Address" required
                  @input="${(e: InputEvent) => { this.store = { ...this.store, street1: (e.target as HTMLInputElement).value }; }}">
                  <wa-icon slot="start" name="location-dot"></wa-icon>
                  <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
                </wa-input>
                <wa-input label="Street Address 2"
                  @input="${(e: InputEvent) => { this.store = { ...this.store, street2: (e.target as HTMLInputElement).value }; }}">
                </wa-input>
                <div class="form-row">
                  <wa-input label="City" required
                    @input="${(e: InputEvent) => { this.store = { ...this.store, city: (e.target as HTMLInputElement).value }; }}">
                  </wa-input>
                  <wa-select label="State" required
                    @change="${(e: Event) => { this.store = { ...this.store, state: (e.target as HTMLSelectElement).value }; }}">
                    <wa-option value="">Select state...</wa-option>
                    ${US_STATES.map((s) => html`<wa-option value="${s.code}">${s.name}</wa-option>`)}
                  </wa-select>
                </div>
                <div class="form-row">
                  <wa-input label="ZIP Code" required
                    @input="${(e: InputEvent) => { this.store = { ...this.store, zip: (e.target as HTMLInputElement).value }; }}">
                  </wa-input>
                  <wa-input label="Phone" type="tel"
                    @input="${(e: InputEvent) => { this.store = { ...this.store, phone: (e.target as HTMLInputElement).value }; }}">
                  </wa-input>
                </div>
              </form>
            </ogs-two-pane-panel>
          </ogs-wizard-item>
        </ogs-wizard>
      </ogs-page>
    `;
  }

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async handleSaveClick() {
    this.error = '';

    // Validate all fields across all steps
    const missingFields: string[] = [];
    if (!this.user.firstName?.trim()) missingFields.push('First Name');
    if (!this.user.email?.trim()) missingFields.push('E-mail Address');
    if (!this.user.password) missingFields.push('Password');
    if (!this.company.companyName?.trim()) missingFields.push('Company Name');
    if (!this.company.ein?.trim()) missingFields.push('EIN');
    if (!this.store.name?.trim()) missingFields.push('Store Name');
    if (!this.store.street1?.trim()) missingFields.push('Street Address');
    if (!this.store.city?.trim()) missingFields.push('City');
    if (!this.store.state) missingFields.push('State');
    if (!this.store.zip?.trim()) missingFields.push('ZIP Code');

    if (missingFields.length > 0) {
      this.error = `Please fill in the following required fields: ${missingFields.join(', ')}`;
      return;
    }

    this.saving = true;

    const FirstTimeSetupMutation = graphql(`
      mutation FirstTimeSetupMutation($userDetails: UserDetails!, $company: CompanySettings!, $store: InitialStoreLocation!) {
        firstTimeSetup(userDetails: $userDetails, company: $company, store: $store)
      }
    `);

    try {
      const result = await execute(FirstTimeSetupMutation, {
        userDetails: {
          firstName: this.user.firstName!,
          email: this.user.email!,
          password: this.user.password!,
        },
        company: {
          companyName: this.company.companyName!,
          ein: this.company.ein!,
        },
        store: {
          name: this.store.name!,
          slug: this.toSlug(this.store.name!),
          street1: this.store.street1!,
          street2: this.store.street2 || undefined,
          city: this.store.city!,
          state: this.store.state!,
          zip: this.store.zip!,
          phone: this.store.phone || undefined,
        },
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join('. ');
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
    } finally {
      this.saving = false;
    }
  }
}
