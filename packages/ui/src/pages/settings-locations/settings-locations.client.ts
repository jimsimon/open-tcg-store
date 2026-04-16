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
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql';
import { graphql } from '../../graphql/index.ts';
import { US_STATES } from '../../lib/us-states';

if (typeof globalThis.document !== 'undefined') {
  import('@awesome.me/webawesome/dist/components/dialog/dialog.js');
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// --- TypedDocumentString Queries/Mutations ---

interface StoreHours {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
}

interface StoreLocation {
  id: string;
  name: string;
  slug: string;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  hours: StoreHours[];
  createdAt: string;
}

const GetAllStoreLocationsAdminQuery = graphql(`
  query GetAllStoreLocationsAdmin {
    getEmployeeStoreLocations {
      id
      name
      slug
      street1
      street2
      city
      state
      zip
      phone
      hours {
        dayOfWeek
        openTime
        closeTime
      }
      createdAt
    }
  }
`);

const AddStoreLocationMutation = graphql(`
  mutation AddStoreLocation($input: AddStoreLocationInput!) {
    addStoreLocation(input: $input) {
      id
      name
      slug
      street1
      street2
      city
      state
      zip
      phone
      hours {
        dayOfWeek
        openTime
        closeTime
      }
      createdAt
    }
  }
`);

const UpdateStoreLocationMutation = graphql(`
  mutation UpdateStoreLocation($input: UpdateStoreLocationInput!) {
    updateStoreLocation(input: $input) {
      id
      name
      slug
      street1
      street2
      city
      state
      zip
      phone
      hours {
        dayOfWeek
        openTime
        closeTime
      }
      createdAt
    }
  }
`);

const RemoveStoreLocationMutation = graphql(`
  mutation RemoveStoreLocation($id: String!) {
    removeStoreLocation(id: $id)
  }
`);

// --- Helpers ---

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// --- Component ---

@customElement('ogs-settings-locations-page')
export class SettingsLocationsPage extends LitElement {
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';
  @property({ type: String }) activePage = '';
  @property({ type: String }) activeOrganizationId = '';
  @property({ type: Boolean }) canManageInventory = false;
  @property({ type: Boolean })
  canManageLots = false;
  @property({ type: Boolean }) canViewDashboard = false;
  @property({ type: Boolean }) canAccessSettings = false;
  @property({ type: Boolean }) canManageStoreLocations = false;
  @property({ type: Boolean }) canManageUsers = false;
  @property({ type: Boolean }) canViewTransactionLog = false;

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

      /* --- Stats Bar --- */

      .stats-bar {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1.25rem;
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
        min-width: 160px;
        flex: 1;
      }

      .stat-icon {
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

      .stat-icon.neutral {
        background: var(--wa-color-neutral-container);
        color: var(--wa-color-text-muted);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .stat-label {
        font-size: var(--wa-font-size-xs);
        color: var(--wa-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: 600;
      }

      .stat-value {
        font-size: var(--wa-font-size-xl);
        font-weight: 700;
        line-height: 1;
      }

      /* --- Filter Bar --- */

      .filter-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1rem;
        align-items: center;
        justify-content: flex-end;
        padding: 1rem;
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
      }

      /* --- Table --- */

      .table-container {
        overflow-x: auto;
      }

      .wa-table {
        width: 100%;
        border-collapse: collapse;
      }

      .wa-table th,
      .wa-table td {
        vertical-align: middle;
      }

      .wa-table th {
        font-size: var(--wa-font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--wa-color-text-muted);
        font-weight: 600;
        padding: 0.875rem 1rem;
        text-align: left;
        border-bottom: 2px solid var(--wa-color-surface-border);
      }

      .wa-table td {
        padding: 0.875rem 1rem;
        font-size: var(--wa-font-size-s);
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .wa-table tr:last-child td {
        border-bottom: none;
      }

      .wa-table tbody tr {
        transition: background 0.15s ease;
      }

      .wa-table tbody tr:hover td {
        background: var(--wa-color-surface-sunken);
      }

      .actions-cell {
        white-space: nowrap;
      }

      .actions-cell-inner {
        display: flex;
        gap: 0.25rem;
      }

      /* --- Empty State --- */

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 4rem 2rem;
        color: var(--wa-color-text-muted);
        background: var(--wa-color-surface-raised);
        border: 2px dashed var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
        margin: 0.5rem 0;
      }

      .empty-state > wa-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .empty-state h3 {
        margin: 0 0 0.5rem 0;
        font-size: var(--wa-font-size-xl);
        color: var(--wa-color-text-normal);
      }

      .empty-state p {
        margin: 0 0 1.5rem 0;
        max-width: 400px;
        margin-inline: auto;
      }

      /* --- Loading --- */

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

      /* --- Dialog --- */

      .dialog-form {
        display: grid;
        gap: 0.75rem;
      }

      wa-dialog::part(body) {
        max-height: 70vh;
        overflow-y: auto;
      }

      wa-dialog::part(title) {
        font-size: var(--wa-font-size-xl);
        font-weight: 700;
      }

      /* --- Hours Grid --- */

      .hours-section-label {
        font-size: var(--wa-font-size-s);
        font-weight: 600;
        color: var(--wa-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-top: 0.5rem;
      }

      .hours-grid {
        display: grid;
        gap: 0.5rem;
      }

      .hours-row {
        display: grid;
        grid-template-columns: 6rem 5rem 1fr 1fr;
        gap: 0.5rem;
        align-items: center;
      }

      .hours-day-label {
        font-size: var(--wa-font-size-s);
        font-weight: 500;
      }
    `,
  ];

  @state() locations: StoreLocation[] = [];
  @state() loading = true;
  @state() saving = false;
  @state() successMessage = '';
  @state() errorMessage = '';

  // Add dialog
  @state() showAddDialog = false;
  @state() addName = '';
  @state() addSlug = '';
  @state() addStreet1 = '';
  @state() addStreet2 = '';
  @state() addCity = '';
  @state() addState = '';
  @state() addZip = '';
  @state() addPhone = '';
  @state() addHoursClosed: boolean[] = [true, true, true, true, true, true, true];
  @state() addHoursOpen: string[] = ['09:00', '09:00', '09:00', '09:00', '09:00', '09:00', '09:00'];
  @state() addHoursClose: string[] = ['17:00', '17:00', '17:00', '17:00', '17:00', '17:00', '17:00'];

  // Edit dialog
  @state() showEditDialog = false;
  @state() editingLocation: StoreLocation | null = null;
  @state() editName = '';
  @state() editSlug = '';
  @state() editStreet1 = '';
  @state() editStreet2 = '';
  @state() editCity = '';
  @state() editState = '';
  @state() editZip = '';
  @state() editPhone = '';
  @state() editHoursClosed: boolean[] = [true, true, true, true, true, true, true];
  @state() editHoursOpen: string[] = ['09:00', '09:00', '09:00', '09:00', '09:00', '09:00', '09:00'];
  @state() editHoursClose: string[] = ['17:00', '17:00', '17:00', '17:00', '17:00', '17:00', '17:00'];

  // Remove dialog
  @state() showRemoveDialog = false;
  @state() removingLocation: StoreLocation | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadLocations();
  }

  async loadLocations() {
    this.loading = true;
    try {
      const result = await execute(GetAllStoreLocationsAdminQuery);
      if (result.errors?.length) {
        this.errorMessage = result.errors[0].message;
      } else {
        this.locations = result.data.getEmployeeStoreLocations as StoreLocation[];
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to load store locations';
    } finally {
      this.loading = false;
    }
  }

  private resetAddForm() {
    this.addName = '';
    this.addSlug = '';
    this.addStreet1 = '';
    this.addStreet2 = '';
    this.addCity = '';
    this.addState = '';
    this.addZip = '';
    this.addPhone = '';
    this.addHoursClosed = [true, true, true, true, true, true, true];
    this.addHoursOpen = ['09:00', '09:00', '09:00', '09:00', '09:00', '09:00', '09:00'];
    this.addHoursClose = ['17:00', '17:00', '17:00', '17:00', '17:00', '17:00', '17:00'];
  }

  private buildHoursInput(closed: boolean[], open: string[], close: string[]) {
    const hours: { dayOfWeek: number; openTime: string | null; closeTime: string | null }[] = [];
    for (let i = 0; i < 7; i++) {
      hours.push({
        dayOfWeek: i,
        openTime: closed[i] ? null : open[i],
        closeTime: closed[i] ? null : close[i],
      });
    }
    return hours;
  }

  private isAddFormValid(): boolean {
    return !!(
      this.addName.trim() &&
      this.addSlug.trim() &&
      this.addStreet1.trim() &&
      this.addCity.trim() &&
      this.addState &&
      this.addZip.trim()
    );
  }

  private isEditFormValid(): boolean {
    return !!(
      this.editName.trim() &&
      this.editSlug.trim() &&
      this.editStreet1.trim() &&
      this.editCity.trim() &&
      this.editState &&
      this.editZip.trim()
    );
  }

  async handleAddLocation() {
    if (!this.isAddFormValid()) return;
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const input: {
        name: string;
        slug: string;
        street1: string;
        street2?: string;
        city: string;
        state: string;
        zip: string;
        phone?: string;
        hours: { dayOfWeek: number; openTime: string | null; closeTime: string | null }[];
      } = {
        name: this.addName.trim(),
        slug: this.addSlug.trim(),
        street1: this.addStreet1.trim(),
        city: this.addCity.trim(),
        state: this.addState,
        zip: this.addZip.trim(),
        hours: this.buildHoursInput(this.addHoursClosed, this.addHoursOpen, this.addHoursClose),
      };
      if (this.addStreet2.trim()) input.street2 = this.addStreet2.trim();
      if (this.addPhone.trim()) input.phone = this.addPhone.trim();

      const result = await execute(AddStoreLocationMutation, { input });
      if (result.errors?.length) {
        this.errorMessage = result.errors[0].message;
      } else {
        this.successMessage = `Store "${this.addName.trim()}" created successfully`;
        this.showAddDialog = false;
        this.resetAddForm();
        await this.loadLocations();
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to create store location';
    } finally {
      this.saving = false;
    }
  }

  openEditDialog(location: StoreLocation) {
    this.editingLocation = location;
    this.editName = location.name;
    this.editSlug = location.slug;
    this.editStreet1 = location.street1;
    this.editStreet2 = location.street2 ?? '';
    this.editCity = location.city;
    this.editState = location.state;
    this.editZip = location.zip;
    this.editPhone = location.phone ?? '';

    const closed = [true, true, true, true, true, true, true];
    const open = ['09:00', '09:00', '09:00', '09:00', '09:00', '09:00', '09:00'];
    const close = ['17:00', '17:00', '17:00', '17:00', '17:00', '17:00', '17:00'];

    for (const h of location.hours) {
      if (h.openTime != null && h.closeTime != null) {
        closed[h.dayOfWeek] = false;
        open[h.dayOfWeek] = h.openTime;
        close[h.dayOfWeek] = h.closeTime;
      }
    }

    this.editHoursClosed = [...closed];
    this.editHoursOpen = [...open];
    this.editHoursClose = [...close];
    this.showEditDialog = true;
  }

  async handleEditLocation() {
    if (!this.editingLocation || !this.isEditFormValid()) return;
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const input: {
        id: string;
        name: string;
        slug: string;
        street1: string;
        street2?: string;
        city: string;
        state: string;
        zip: string;
        phone?: string;
        hours: { dayOfWeek: number; openTime: string | null; closeTime: string | null }[];
      } = {
        id: this.editingLocation.id,
        name: this.editName.trim(),
        slug: this.editSlug.trim(),
        street1: this.editStreet1.trim(),
        city: this.editCity.trim(),
        state: this.editState,
        zip: this.editZip.trim(),
        hours: this.buildHoursInput(this.editHoursClosed, this.editHoursOpen, this.editHoursClose),
      };
      if (this.editStreet2.trim()) input.street2 = this.editStreet2.trim();
      if (this.editPhone.trim()) input.phone = this.editPhone.trim();

      const result = await execute(UpdateStoreLocationMutation, { input });
      if (result.errors?.length) {
        this.errorMessage = result.errors[0].message;
      } else {
        this.successMessage = `Store "${this.editName.trim()}" updated successfully`;
        this.showEditDialog = false;
        this.editingLocation = null;
        await this.loadLocations();
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to update store location';
    } finally {
      this.saving = false;
    }
  }

  openRemoveDialog(location: StoreLocation) {
    this.removingLocation = location;
    this.showRemoveDialog = true;
  }

  async handleRemoveLocation() {
    if (!this.removingLocation) return;
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const result = await execute(RemoveStoreLocationMutation, { id: this.removingLocation.id });
      if (result.errors?.length) {
        this.errorMessage = result.errors[0].message;
      } else {
        this.successMessage = `Store "${this.removingLocation.name}" removed successfully`;
        this.showRemoveDialog = false;
        this.removingLocation = null;
        await this.loadLocations();
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to remove store location';
    } finally {
      this.saving = false;
    }
  }

  private hasHoursSet(location: StoreLocation): boolean {
    return location.hours.some((h) => h.openTime != null && h.closeTime != null);
  }

  render() {
    return html`
      <ogs-page
        activePage="${this.activePage}"
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
        showUserMenu
      >
        ${this.renderPageHeader()}
        ${when(
          this.loading,
          () => html`
            <div class="loading-container">
              <wa-spinner style="font-size: 2rem;"></wa-spinner>
              <span>Loading store locations...</span>
            </div>
          `,
          () => this.renderContent(),
        )}
        ${this.renderAddDialog()} ${this.renderEditDialog()} ${this.renderRemoveDialog()}
      </ogs-page>
    `;
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="location-dot" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Store Locations</h2>
          <p>Manage your store locations, addresses, and business hours.</p>
        </div>
      </div>
    `;
  }

  private renderStatsBar() {
    return html`
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-icon neutral">
            <wa-icon name="location-dot"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Locations</span>
            <span class="stat-value">${this.locations.length}</span>
          </div>
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
      ${this.renderStatsBar()} ${this.renderActionBar()}
      ${this.locations.length === 0 ? this.renderEmptyState() : this.renderTable()}
    `;
  }

  private renderActionBar() {
    return html`
      <div class="filter-bar">
        <wa-button
          variant="brand"
          size="small"
          @click="${() => {
            this.showAddDialog = true;
          }}"
        >
          <wa-icon slot="start" name="plus"></wa-icon>
          Add Store
        </wa-button>
      </div>
    `;
  }

  private renderEmptyState() {
    return html`
      <div class="empty-state">
        <wa-icon name="location-dot"></wa-icon>
        <h3>No Store Locations</h3>
        <p>No store locations have been created yet. Add your first store to get started.</p>
        <wa-button
          variant="brand"
          @click="${() => {
            this.showAddDialog = true;
          }}"
        >
          <wa-icon slot="start" name="plus"></wa-icon>
          Add Store
        </wa-button>
      </div>
    `;
  }

  private renderTable() {
    const onlyOne = this.locations.length <= 1;
    return html`
      <wa-card appearance="outline">
        <div class="table-container">
          <table class="wa-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Address</th>
                <th scope="col">Hours</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.locations.map(
                (loc) => html`
                  <tr>
                    <td><strong>${loc.name}</strong></td>
                    <td>${loc.city}, ${loc.state} ${loc.zip}</td>
                    <td>
                      ${this.hasHoursSet(loc)
                        ? html`<wa-badge variant="success">Set</wa-badge>`
                        : html`<wa-badge variant="neutral">Not set</wa-badge>`}
                    </td>
                    <td class="actions-cell">
                      <div class="actions-cell-inner">
                        <wa-button
                          size="small"
                          variant="neutral"
                          appearance="outlined"
                          @click="${() => this.openEditDialog(loc)}"
                        >
                          <wa-icon slot="start" name="pen-to-square"></wa-icon>
                          Edit
                        </wa-button>
                        <wa-button
                          size="small"
                          variant="danger"
                          appearance="outlined"
                          ?disabled="${onlyOne}"
                          title="${onlyOne ? 'Cannot remove the only store location' : 'Remove this store location'}"
                          @click="${() => this.openRemoveDialog(loc)}"
                        >
                          <wa-icon slot="start" name="trash"></wa-icon>
                          Remove
                        </wa-button>
                      </div>
                    </td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
      </wa-card>
    `;
  }

  private renderHoursGrid(
    closed: boolean[],
    open: string[],
    close: string[],
    onClosedChange: (day: number, val: boolean) => void,
    onOpenChange: (day: number, val: string) => void,
    onCloseChange: (day: number, val: string) => void,
  ) {
    return html`
      <div class="hours-section-label">Store Hours</div>
      <div class="hours-grid">
        ${DAYS_OF_WEEK.map(
          (dayName, i) => html`
            <div class="hours-row">
              <span class="hours-day-label">${dayName}</span>
              <wa-checkbox
                ?checked="${closed[i]}"
                @change="${(e: Event) => onClosedChange(i, (e.target as HTMLInputElement).checked)}"
              >
                Closed
              </wa-checkbox>
              <wa-input
                type="time"
                size="small"
                .value="${open[i]}"
                ?disabled="${closed[i]}"
                @input="${(e: Event) => onOpenChange(i, (e.target as HTMLInputElement).value)}"
              ></wa-input>
              <wa-input
                type="time"
                size="small"
                .value="${close[i]}"
                ?disabled="${closed[i]}"
                @input="${(e: Event) => onCloseChange(i, (e.target as HTMLInputElement).value)}"
              ></wa-input>
            </div>
          `,
        )}
      </div>
    `;
  }

  private renderAddDialog() {
    return html`
      <wa-dialog
        label="Add Store"
        ?open="${this.showAddDialog}"
        @wa-after-hide="${(e: Event) => {
          if (e.target === e.currentTarget) this.showAddDialog = false;
        }}"
      >
        <div class="dialog-form">
          <wa-input
            label="Name"
            required
            .value="${this.addName}"
            @input="${(e: Event) => {
              this.addName = (e.target as HTMLInputElement).value;
              this.addSlug = toKebabCase((e.target as HTMLInputElement).value);
            }}"
          >
            <wa-icon slot="prefix" name="store"></wa-icon>
          </wa-input>
          <wa-input
            label="Slug"
            required
            .value="${this.addSlug}"
            @input="${(e: Event) => {
              this.addSlug = (e.target as HTMLInputElement).value;
            }}"
          >
            <wa-icon slot="prefix" name="link"></wa-icon>
          </wa-input>
          <wa-input
            label="Street Address 1"
            required
            .value="${this.addStreet1}"
            @input="${(e: Event) => {
              this.addStreet1 = (e.target as HTMLInputElement).value;
            }}"
          >
            <wa-icon slot="prefix" name="location-dot"></wa-icon>
          </wa-input>
          <wa-input
            label="Street Address 2"
            .value="${this.addStreet2}"
            @input="${(e: Event) => {
              this.addStreet2 = (e.target as HTMLInputElement).value;
            }}"
          >
            <wa-icon slot="prefix" name="location-dot"></wa-icon>
          </wa-input>
          <wa-input
            label="City"
            required
            .value="${this.addCity}"
            @input="${(e: Event) => {
              this.addCity = (e.target as HTMLInputElement).value;
            }}"
          >
            <wa-icon slot="prefix" name="city"></wa-icon>
          </wa-input>
          <wa-select
            label="State"
            required
            .value="${this.addState}"
            @change="${(e: Event) => {
              this.addState = (e.target as HTMLSelectElement).value;
            }}"
          >
            ${US_STATES.map((s) => html`<wa-option value="${s.code}">${s.name}</wa-option>`)}
          </wa-select>
          <wa-input
            label="ZIP"
            required
            .value="${this.addZip}"
            @input="${(e: Event) => {
              this.addZip = (e.target as HTMLInputElement).value;
            }}"
          >
            <wa-icon slot="prefix" name="hashtag"></wa-icon>
          </wa-input>
          <wa-input
            label="Phone"
            .value="${this.addPhone}"
            @input="${(e: Event) => {
              this.addPhone = (e.target as HTMLInputElement).value;
            }}"
          >
            <wa-icon slot="prefix" name="phone"></wa-icon>
          </wa-input>
          ${this.renderHoursGrid(
            this.addHoursClosed,
            this.addHoursOpen,
            this.addHoursClose,
            (day, val) => {
              const arr = [...this.addHoursClosed];
              arr[day] = val;
              this.addHoursClosed = arr;
            },
            (day, val) => {
              const arr = [...this.addHoursOpen];
              arr[day] = val;
              this.addHoursOpen = arr;
            },
            (day, val) => {
              const arr = [...this.addHoursClose];
              arr[day] = val;
              this.addHoursClose = arr;
            },
          )}
        </div>
        <wa-button
          autofocus
          slot="footer"
          variant="neutral"
          @click="${() => {
            this.showAddDialog = false;
            this.resetAddForm();
          }}"
          >Cancel</wa-button
        >
        <wa-button
          slot="footer"
          variant="brand"
          ?loading="${this.saving}"
          ?disabled="${!this.isAddFormValid()}"
          @click="${this.handleAddLocation}"
        >
          <wa-icon slot="start" name="plus"></wa-icon>
          Save
        </wa-button>
      </wa-dialog>
    `;
  }

  private renderEditDialog() {
    return html`
      ${when(
        this.editingLocation,
        () => html`
          <wa-dialog
            with-footer
            label="Edit Store"
            ?open="${this.showEditDialog}"
            @wa-after-hide="${(e: Event) => {
              if (e.target === e.currentTarget) {
                this.showEditDialog = false;
                this.editingLocation = null;
              }
            }}"
          >
            <div class="dialog-form">
              <wa-input
                label="Name"
                required
                .value="${this.editName}"
                @input="${(e: Event) => {
                  this.editName = (e.target as HTMLInputElement).value;
                }}"
              >
                <wa-icon slot="prefix" name="store"></wa-icon>
              </wa-input>
              <wa-input
                label="Slug"
                required
                .value="${this.editSlug}"
                @input="${(e: Event) => {
                  this.editSlug = (e.target as HTMLInputElement).value;
                }}"
              >
                <wa-icon slot="prefix" name="link"></wa-icon>
              </wa-input>
              <wa-input
                label="Street Address 1"
                required
                .value="${this.editStreet1}"
                @input="${(e: Event) => {
                  this.editStreet1 = (e.target as HTMLInputElement).value;
                }}"
              >
                <wa-icon slot="prefix" name="location-dot"></wa-icon>
              </wa-input>
              <wa-input
                label="Street Address 2"
                .value="${this.editStreet2}"
                @input="${(e: Event) => {
                  this.editStreet2 = (e.target as HTMLInputElement).value;
                }}"
              >
                <wa-icon slot="prefix" name="location-dot"></wa-icon>
              </wa-input>
              <wa-input
                label="City"
                required
                .value="${this.editCity}"
                @input="${(e: Event) => {
                  this.editCity = (e.target as HTMLInputElement).value;
                }}"
              >
                <wa-icon slot="prefix" name="city"></wa-icon>
              </wa-input>
              <wa-select
                label="State"
                required
                .value="${this.editState}"
                @change="${(e: Event) => {
                  this.editState = (e.target as HTMLSelectElement).value;
                }}"
              >
                ${US_STATES.map((s) => html`<wa-option value="${s.code}">${s.name}</wa-option>`)}
              </wa-select>
              <wa-input
                label="ZIP"
                required
                .value="${this.editZip}"
                @input="${(e: Event) => {
                  this.editZip = (e.target as HTMLInputElement).value;
                }}"
              >
                <wa-icon slot="prefix" name="hashtag"></wa-icon>
              </wa-input>
              <wa-input
                label="Phone"
                .value="${this.editPhone}"
                @input="${(e: Event) => {
                  this.editPhone = (e.target as HTMLInputElement).value;
                }}"
              >
                <wa-icon slot="prefix" name="phone"></wa-icon>
              </wa-input>
              ${this.renderHoursGrid(
                this.editHoursClosed,
                this.editHoursOpen,
                this.editHoursClose,
                (day, val) => {
                  const arr = [...this.editHoursClosed];
                  arr[day] = val;
                  this.editHoursClosed = arr;
                },
                (day, val) => {
                  const arr = [...this.editHoursOpen];
                  arr[day] = val;
                  this.editHoursOpen = arr;
                },
                (day, val) => {
                  const arr = [...this.editHoursClose];
                  arr[day] = val;
                  this.editHoursClose = arr;
                },
              )}
            </div>
            <wa-button
              autofocus
              slot="footer"
              variant="neutral"
              @click="${() => {
                this.showEditDialog = false;
                this.editingLocation = null;
              }}"
              >Cancel</wa-button
            >
            <wa-button
              slot="footer"
              variant="brand"
              ?loading="${this.saving}"
              ?disabled="${!this.isEditFormValid()}"
              @click="${this.handleEditLocation}"
            >
              <wa-icon slot="start" name="floppy-disk"></wa-icon>
              Save Changes
            </wa-button>
          </wa-dialog>
        `,
      )}
    `;
  }

  private renderRemoveDialog() {
    return html`
      ${when(
        this.removingLocation,
        () => html`
          <wa-dialog
            with-footer
            label="Remove Store Location"
            ?open="${this.showRemoveDialog}"
            @wa-after-hide="${(e: Event) => {
              if (e.target === e.currentTarget) {
                this.showRemoveDialog = false;
                this.removingLocation = null;
              }
            }}"
          >
            <p>
              Are you sure you want to remove <strong>${this.removingLocation!.name}</strong>? This action cannot be
              undone.
            </p>
            <wa-button
              autofocus
              slot="footer"
              variant="neutral"
              @click="${() => {
                this.showRemoveDialog = false;
                this.removingLocation = null;
              }}"
              >Cancel</wa-button
            >
            <wa-button slot="footer" variant="danger" ?loading="${this.saving}" @click="${this.handleRemoveLocation}">
              <wa-icon slot="start" name="trash"></wa-icon>
              Remove
            </wa-button>
          </wa-dialog>
        `,
      )}
    `;
  }
}
