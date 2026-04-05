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
import { TypedDocumentString } from '../../graphql/graphql';
import { execute } from '../../lib/graphql';

if (typeof globalThis.document !== 'undefined') {
  import('@awesome.me/webawesome/dist/components/dialog/dialog.js');
}

// Lazy-load authClient to avoid SSR issues
let _authClient: typeof import('../../auth-client').authClient | undefined;
async function getAuthClient() {
  if (!_authClient) {
    const mod = await import('../../auth-client');
    _authClient = mod.authClient;
  }
  return _authClient;
}

// --- GraphQL Queries ---

const GetStoresQuery = new TypedDocumentString(`
  query GetStoresForUserMgmt {
    getEmployeeStoreLocations { id name }
  }
`) as unknown as TypedDocumentString<
  { getEmployeeStoreLocations: { id: string; name: string }[] },
  Record<string, never>
>;

// --- Types ---

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  isAnonymous: boolean;
}

// --- Helpers ---

/** Map a role value to a display label. */
function roleLabel(role: string | null): string {
  switch (role) {
    case 'owner':
    case 'admin':
      return 'Owner';
    case 'member':
    case 'employee':
      return 'Employee';
    default:
      return 'Store Manager';
  }
}

/** Map a role value to a badge variant. */
function roleBadgeVariant(role: string | null): string {
  switch (role) {
    case 'owner':
    case 'admin':
      return 'danger';
    case 'member':
    case 'employee':
      return 'neutral';
    default:
      return 'brand';
  }
}

@customElement('ogs-settings-users-page')
export class OgsSettingsUsersPage extends LitElement {
  @property({ type: String }) userRole = '';
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';
  @property({ type: Boolean }) canManageInventory = false;
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

      .stat-icon.success {
        background: var(--wa-color-success-container);
        color: var(--wa-color-success-text);
      }

      .stat-icon.warning {
        background: var(--wa-color-warning-container);
        color: var(--wa-color-warning-text);
      }

      .stat-icon.neutral {
        background: var(--wa-color-neutral-container);
        color: var(--wa-color-text-muted);
      }

      .stat-icon.danger {
        background: var(--wa-color-danger-container);
        color: var(--wa-color-danger-text);
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
        justify-content: space-between;
        padding: 1rem;
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
      }

      .filter-bar-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
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
    `,
  ];

  @state() users: UserRecord[] = [];
  @state() stores: { id: string; name: string }[] = [];
  @state() loading = true;
  @state() hideDeactivated = true;
  @state() showAddDialog = false;
  @state() showEditDialog = false;
  @state() editingUser: UserRecord | null = null;
  @state() addName = '';
  @state() addEmail = '';
  @state() addPassword = '';
  @state() addRole = 'member';
  @state() addStoreIds: string[] = [];
  @state() editName = '';
  @state() editRole = '';
  @state() editStoreIds: string[] = [];
  @state() saving = false;
  @state() successMessage = '';
  @state() errorMessage = '';

  connectedCallback(): void {
    super.connectedCallback();
    this.loadUsers();
    this.loadStores();
  }

  async loadUsers() {
    this.loading = true;
    try {
      const authClient = await getAuthClient();
      const result = await authClient.admin.listUsers({
        query: { limit: 200, sortBy: 'createdAt', sortDirection: 'desc' },
      });

      if (result.data) {
        this.users = (result.data.users as unknown as UserRecord[]).filter((u) => !u.isAnonymous);
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to load users';
    } finally {
      this.loading = false;
    }
  }

  async loadStores() {
    try {
      const result = await execute(GetStoresQuery);
      if (result.data?.getEmployeeStoreLocations) {
        this.stores = result.data.getEmployeeStoreLocations;
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to load stores';
    }
  }

  get filteredUsers(): UserRecord[] {
    if (this.hideDeactivated) {
      return this.users.filter((u) => !u.banned);
    }
    return this.users;
  }

  private computeUserStats() {
    const total = this.users.length;
    const active = this.users.filter((u) => !u.banned).length;
    const deactivated = this.users.filter((u) => u.banned).length;
    const owners = this.users.filter((u) => u.role === 'admin' || u.role === 'owner').length;
    return { total, active, deactivated, owners };
  }

  async handleAddUser() {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const authClient = await getAuthClient();
      const result = await authClient.admin.createUser({
        email: this.addEmail,
        password: this.addPassword,
        name: this.addName,
        role: this.addRole as 'admin' | 'member',
      });

      if (result.error) {
        this.errorMessage = result.error.message ?? 'Failed to create user';
      } else {
        // Add user to selected store organizations
        const newUserId = (result.data as unknown as { id: string })?.id;
        if (newUserId && this.addStoreIds.length > 0) {
          for (const storeId of this.addStoreIds) {
            try {
              await fetch('/api/auth/organization/add-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  userId: newUserId,
                  role: this.addRole as 'owner' | 'admin' | 'member',
                  organizationId: storeId,
                }),
              });
            } catch (memberErr) {
              console.error(`Failed to add user to store ${storeId}`, memberErr);
            }
          }
        }

        this.successMessage = `User ${this.addName} created successfully`;
        this.showAddDialog = false;
        this.addName = '';
        this.addEmail = '';
        this.addPassword = '';
        this.addRole = 'member';
        this.addStoreIds = [];
        await this.loadUsers();
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to create user';
    } finally {
      this.saving = false;
    }
  }

  openEditDialog(user: UserRecord) {
    this.editingUser = user;
    this.editName = user.name;
    this.editRole = user.role ?? 'member';
    this.editStoreIds = [];
    this.showEditDialog = true;
  }

  async handleEditUser() {
    if (!this.editingUser) return;
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const authClient = await getAuthClient();

      // Set global role (admin plugin compat)
      const roleResult = await authClient.admin.setRole({
        userId: this.editingUser.id,
        role: this.editRole as 'admin' | 'member',
      });

      if (roleResult.error) {
        this.errorMessage = roleResult.error.message ?? 'Failed to update role';
        return;
      }

      this.successMessage = `User ${this.editName} updated successfully`;
      this.showEditDialog = false;
      this.editingUser = null;
      await this.loadUsers();
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to update user';
    } finally {
      this.saving = false;
    }
  }

  async toggleUserStatus(user: UserRecord) {
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const authClient = await getAuthClient();

      if (user.banned) {
        const result = await authClient.admin.unbanUser({ userId: user.id });
        if (result.error) {
          this.errorMessage = result.error.message ?? 'Failed to activate user';
          return;
        }
        this.successMessage = `User ${user.name} activated`;
      } else {
        const result = await authClient.admin.banUser({
          userId: user.id,
          banReason: 'Deactivated by admin',
        });
        if (result.error) {
          this.errorMessage = result.error.message ?? 'Failed to deactivate user';
          return;
        }
        this.successMessage = `User ${user.name} deactivated`;
      }

      await this.loadUsers();
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to update user status';
    }
  }

  render() {
    return html`
      <ogs-page
        activePage="settings/users"
        userRole="${this.userRole}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
        ?canManageInventory="${this.canManageInventory}"
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
              <span>Loading users...</span>
            </div>
          `,
          () => this.renderContent(),
        )}
        ${this.renderAddDialog()} ${this.renderEditDialog()}
      </ogs-page>
    `;
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="users" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>User Accounts</h2>
          <p>Manage user accounts, roles, and access permissions</p>
        </div>
      </div>
    `;
  }

  private renderStatsBar() {
    const stats = this.computeUserStats();
    return html`
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-icon neutral">
            <wa-icon name="users"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total</span>
            <span class="stat-value">${stats.total}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success">
            <wa-icon name="user-check"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Active</span>
            <span class="stat-value">${stats.active}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon danger">
            <wa-icon name="user-xmark"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Deactivated</span>
            <span class="stat-value">${stats.deactivated}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <wa-icon name="shield-halved"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Owners</span>
            <span class="stat-value">${stats.owners}</span>
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
      ${this.renderStatsBar()} ${this.renderFilterBar()}
      ${this.filteredUsers.length === 0 ? this.renderEmptyState() : this.renderTable()}
    `;
  }

  private renderFilterBar() {
    return html`
      <div class="filter-bar">
        <div class="filter-bar-left">
          <wa-checkbox
            ?checked="${this.hideDeactivated}"
            @change="${(e: Event) => {
              this.hideDeactivated = (e.target as HTMLInputElement).checked;
            }}"
          >
            Hide deactivated users
          </wa-checkbox>
        </div>
        <wa-button
          variant="brand"
          size="small"
          @click="${() => {
            this.showAddDialog = true;
          }}"
        >
          <wa-icon slot="start" name="user-plus"></wa-icon>
          Add User
        </wa-button>
      </div>
    `;
  }

  private renderEmptyState() {
    return html`
      <div class="empty-state">
        <wa-icon name="users"></wa-icon>
        <h3>No Users Found</h3>
        <p>
          ${this.hideDeactivated
            ? 'No active users found. Try unchecking "Hide deactivated users" to see all users.'
            : 'No users have been created yet. Add your first user to get started.'}
        </p>
        <wa-button
          variant="brand"
          @click="${() => {
            this.showAddDialog = true;
          }}"
        >
          <wa-icon slot="start" name="user-plus"></wa-icon>
          Add User
        </wa-button>
      </div>
    `;
  }

  private renderTable() {
    return html`
      <wa-card appearance="outline">
        <div class="table-container">
          <table class="wa-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.filteredUsers.map(
                (user) => html`
                  <tr>
                    <td><strong>${user.name}</strong></td>
                    <td>${user.email}</td>
                    <td>
                      <wa-badge variant="${roleBadgeVariant(user.role)}"> ${roleLabel(user.role)} </wa-badge>
                    </td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      ${user.banned
                        ? html`<wa-badge variant="danger">Deactivated</wa-badge>`
                        : html`<wa-badge variant="success">Active</wa-badge>`}
                    </td>
                    <td class="actions-cell">
                      <div class="actions-cell-inner">
                        <wa-button
                          size="small"
                          variant="neutral"
                          appearance="outlined"
                          @click="${() => this.openEditDialog(user)}"
                        >
                          <wa-icon slot="start" name="pen-to-square"></wa-icon>
                          Edit
                        </wa-button>
                        <wa-button
                          size="small"
                          variant="${user.banned ? 'success' : 'danger'}"
                          appearance="outlined"
                          @click="${() => this.toggleUserStatus(user)}"
                        >
                          <wa-icon slot="start" name="${user.banned ? 'user-check' : 'user-xmark'}"></wa-icon>
                          ${user.banned ? 'Activate' : 'Deactivate'}
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

  private renderAddDialog() {
    return html`
      <wa-dialog
        label="Add User"
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
            }}"
          >
            <wa-icon slot="prefix" name="user"></wa-icon>
          </wa-input>
          <wa-input
            type="email"
            label="Email"
            required
            .value="${this.addEmail}"
            @input="${(e: Event) => {
              this.addEmail = (e.target as HTMLInputElement).value;
            }}"
          >
            <wa-icon slot="prefix" name="envelope"></wa-icon>
          </wa-input>
          <wa-input
            type="password"
            label="Password"
            required
            password-toggle
            .value="${this.addPassword}"
            @input="${(e: Event) => {
              this.addPassword = (e.target as HTMLInputElement).value;
            }}"
          >
            <wa-icon slot="prefix" name="lock"></wa-icon>
          </wa-input>
          <wa-select
            label="Role"
            .value="${this.addRole}"
            @change="${(e: Event) => {
              this.addRole = (e.target as HTMLSelectElement).value;
            }}"
          >
            <wa-option value="owner">Owner</wa-option>
            <wa-option value="admin">Store Manager</wa-option>
            <wa-option value="member">Employee</wa-option>
          </wa-select>
          <wa-select
            label="Store Assignment"
            multiple
            .value="${this.addStoreIds}"
            @change="${(e: Event) => {
              const select = e.target as HTMLSelectElement;
              this.addStoreIds = Array.from((select as unknown as { value: string[] }).value);
            }}"
          >
            ${this.stores.map((s) => html`<wa-option value="${s.id}">${s.name}</wa-option>`)}
          </wa-select>
        </div>
        <wa-button
          autofocus
          slot="footer"
          variant="neutral"
          @click="${() => {
            this.showAddDialog = false;
          }}"
          >Cancel</wa-button
        >
        <wa-button slot="footer" variant="brand" ?loading="${this.saving}" @click="${this.handleAddUser}">
          <wa-icon slot="start" name="user-plus"></wa-icon>
          Create User
        </wa-button>
      </wa-dialog>
    `;
  }

  private renderEditDialog() {
    return html`
      ${when(
        this.editingUser,
        () => html`
          <wa-dialog
            label="Edit User"
            ?open="${this.showEditDialog}"
            @wa-after-hide="${(e: Event) => {
              if (e.target === e.currentTarget) {
                this.showEditDialog = false;
                this.editingUser = null;
              }
            }}"
          >
            <div class="dialog-form">
              <wa-input label="Name" readonly .value="${this.editName}">
                <wa-icon slot="prefix" name="user"></wa-icon>
              </wa-input>
              <wa-input label="Email" readonly .value="${this.editingUser!.email}">
                <wa-icon slot="prefix" name="envelope"></wa-icon>
              </wa-input>
              <wa-select
                label="Role"
                .value="${this.editRole}"
                @change="${(e: Event) => {
                  this.editRole = (e.target as HTMLSelectElement).value;
                }}"
              >
                <wa-option value="owner">Owner</wa-option>
                <wa-option value="admin">Store Manager</wa-option>
                <wa-option value="member">Employee</wa-option>
              </wa-select>
              <wa-select
                label="Store Assignment"
                multiple
                .value="${this.editStoreIds}"
                @change="${(e: Event) => {
                  const select = e.target as HTMLSelectElement;
                  this.editStoreIds = Array.from((select as unknown as { value: string[] }).value);
                }}"
              >
                ${this.stores.map((s) => html`<wa-option value="${s.id}">${s.name}</wa-option>`)}
              </wa-select>
            </div>
            <wa-button
              autofocus
              slot="footer"
              variant="neutral"
              @click="${() => {
                this.showEditDialog = false;
                this.editingUser = null;
              }}"
              >Cancel</wa-button
            >
            <wa-button slot="footer" variant="brand" ?loading="${this.saving}" @click="${this.handleEditUser}">
              <wa-icon slot="start" name="floppy-disk"></wa-icon>
              Save Changes
            </wa-button>
          </wa-dialog>
        `,
      )}
    `;
  }
}
