import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
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
import { activeStoreId } from '../../lib/store-context';

// Lazy-load authClient to avoid SSR issues
let _authClient: typeof import('../../auth-client').authClient | undefined;
async function getAuthClient() {
  if (!_authClient) {
    const mod = await import('../../auth-client');
    _authClient = mod.authClient;
  }
  return _authClient;
}

// --- Types ---

interface OrgMember {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    banned: boolean;
    banReason: string | null;
  };
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
}

// --- Helpers ---

/** Map a role value to a display label. */
function roleLabel(role: string | null): string {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'manager':
      return 'Store Manager';
    case 'member':
      return 'Employee';
    default:
      return role ?? 'Unknown';
  }
}

/** Map a role value to a badge variant. */
function roleBadgeVariant(role: string | null): string {
  switch (role) {
    case 'owner':
      return 'danger';
    case 'manager':
      return 'brand';
    case 'member':
      return 'neutral';
    default:
      return 'neutral';
  }
}

@customElement('ogs-settings-users-page')
export class OgsSettingsUsersPage extends SignalWatcher(LitElement) {
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';
  @property({ type: Boolean }) canManageInventory = false;
  @property({ type: Boolean }) canManageLots = false;
  @property({ type: Boolean }) canViewDashboard = false;
  @property({ type: Boolean }) canAccessSettings = false;
  @property({ type: Boolean }) canManageStoreLocations = false;
  @property({ type: Boolean }) canManageUsers = false;
  @property({ type: Boolean }) canViewTransactionLog = false;
  @property({ type: String }) activeOrganizationId = '';
  @property({ type: Boolean }) showStoreSelector = false;

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

      /* --- Section Header --- */

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
        margin-top: 1.5rem;
      }

      .section-header:first-of-type {
        margin-top: 0;
      }

      .section-title {
        font-size: var(--wa-font-size-l);
        font-weight: 700;
        margin: 0;
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
        padding: 3rem 2rem;
        color: var(--wa-color-text-muted);
      }

      .empty-state > wa-icon {
        font-size: 3rem;
        margin-bottom: 0.75rem;
        opacity: 0.5;
      }

      .empty-state h3 {
        margin: 0 0 0.25rem 0;
        font-size: var(--wa-font-size-l);
        color: var(--wa-color-text-normal);
      }

      .empty-state p {
        margin: 0;
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

      /* --- No Store State --- */

      .no-store-state {
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
      }

      .no-store-state > wa-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .no-store-state h3 {
        margin: 0 0 0.5rem 0;
        font-size: var(--wa-font-size-xl);
        color: var(--wa-color-text-normal);
      }

      .no-store-state p {
        margin: 0;
        max-width: 400px;
        margin-inline: auto;
      }
    `,
  ];

  @state() private assignedMembers: OrgMember[] = [];
  @state() private allUsers: UserRecord[] = [];
  @state() private loading = true;
  @state() private hideDeactivated = true;
  @state() private successMessage = '';
  @state() private errorMessage = '';
  /** The current user's role in the active store (to enable manager guards) */
  @state() private currentUserRole: string | null = null;

  private boundHandleStoreChanged = () => this.loadData();

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('store-changed', this.boundHandleStoreChanged);
    this.loadData();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('store-changed', this.boundHandleStoreChanged);
  }

  async loadData() {
    const storeId = activeStoreId.get();
    if (!storeId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    try {
      await Promise.all([this.loadAssignedMembers(), this.loadAllUsers()]);
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to load data';
    } finally {
      this.loading = false;
    }
  }

  private async loadAssignedMembers() {
    const authClient = await getAuthClient();
    const result = await authClient.organization.getFullOrganization();
    if (result.data) {
      const org = result.data as unknown as { members: OrgMember[] };
      this.assignedMembers = org.members ?? [];

      // Determine the current user's role in this store
      const currentUserId = (await authClient.getSession())?.data?.user?.id;
      if (currentUserId) {
        const myMember = this.assignedMembers.find((m) => m.userId === currentUserId);
        this.currentUserRole = myMember?.role ?? null;
      }
    }
  }

  private async loadAllUsers() {
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (res.ok) {
        this.allUsers = (await res.json()) as UserRecord[];
      } else {
        console.warn('Failed to fetch users:', res.status);
      }
    } catch (e) {
      // Non-fatal — unassigned table will be empty
      console.warn('Failed to fetch users:', e);
    }
  }

  /** Whether the current user is an owner (can deactivate users, edit managers, etc.) */
  private get isOwner(): boolean {
    return this.currentUserRole === 'owner';
  }

  private get filteredAssigned(): OrgMember[] {
    if (this.hideDeactivated) {
      return this.assignedMembers.filter((m) => !m.user.banned);
    }
    return this.assignedMembers;
  }

  private get unassignedUsers(): UserRecord[] {
    const assignedUserIds = new Set(this.assignedMembers.map((m) => m.userId));
    let users = this.allUsers.filter((u) => !assignedUserIds.has(u.id));
    if (this.hideDeactivated) {
      users = users.filter((u) => !u.banned);
    }
    return users;
  }

  /** Check whether the current user can manage (edit/deactivate/remove) a given member. */
  private canManageMember(member: OrgMember): boolean {
    // Owners can manage anyone except other owners
    if (this.isOwner) return member.role !== 'owner';
    // Managers can only manage standard members. Custom roles may carry elevated
    // permissions set by an owner, so managers cannot modify those users.
    return member.role === 'member';
  }

  async handleAssignUser(user: UserRecord) {
    const storeId = activeStoreId.get();
    if (!storeId) return;

    this.successMessage = '';
    this.errorMessage = '';
    try {
      const res = await fetch('/api/users/store-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id, organizationId: storeId, role: 'member' }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        this.errorMessage = err.error ?? 'Failed to assign user';
        return;
      }
      this.successMessage = `${user.name} assigned to this store`;
      await this.loadData();
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to assign user';
    }
  }

  async handleRemoveMember(member: OrgMember) {
    const storeId = activeStoreId.get();
    if (!storeId) return;

    this.successMessage = '';
    this.errorMessage = '';
    try {
      const res = await fetch('/api/users/store-membership', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ memberId: member.id, organizationId: storeId }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        this.errorMessage = err.error ?? 'Failed to remove user';
        return;
      }
      this.successMessage = `${member.user.name} removed from this store`;
      await this.loadData();
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to remove user';
    }
  }

  async toggleUserStatus(member: OrgMember) {
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const authClient = await getAuthClient();

      if (member.user.banned) {
        const result = await authClient.admin.unbanUser({ userId: member.userId });
        if (result.error) {
          this.errorMessage = result.error.message ?? 'Failed to activate user';
          return;
        }
        this.successMessage = `User ${member.user.name} activated`;
      } else {
        const result = await authClient.admin.banUser({
          userId: member.userId,
          banReason: 'Deactivated by admin',
        });
        if (result.error) {
          this.errorMessage = result.error.message ?? 'Failed to deactivate user';
          return;
        }
        this.successMessage = `User ${member.user.name} deactivated`;
      }

      await this.loadData();
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
        activePage="users"
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
        ?showStoreSelector="${this.showStoreSelector}"
        showUserMenu
      >
        ${this.renderPageHeader()}
        ${when(
          !activeStoreId.get(),
          () => this.renderNoStoreState(),
          () =>
            when(
              this.loading,
              () => html`
                <div class="loading-container">
                  <wa-spinner style="font-size: 2rem;"></wa-spinner>
                  <span>Loading users...</span>
                </div>
              `,
              () => this.renderContent(),
            ),
        )}
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
          <p>Manage user accounts, roles, and access permissions for this store</p>
        </div>
      </div>
    `;
  }

  private renderNoStoreState() {
    return html`
      <div class="no-store-state">
        <wa-icon name="store"></wa-icon>
        <h3>No Store Selected</h3>
        <p>Select a store from the header dropdown to manage its users.</p>
      </div>
    `;
  }

  private renderStatsBar() {
    const assigned = this.assignedMembers.length;
    const active = this.assignedMembers.filter((m) => !m.user.banned).length;
    const deactivated = this.assignedMembers.filter((m) => m.user.banned).length;
    const unassigned = this.unassignedUsers.length;
    return html`
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-icon success">
            <wa-icon name="user-check"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Assigned</span>
            <span class="stat-value">${assigned}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon neutral">
            <wa-icon name="users"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Active</span>
            <span class="stat-value">${active}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon danger">
            <wa-icon name="user-xmark"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Deactivated</span>
            <span class="stat-value">${deactivated}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning">
            <wa-icon name="user-plus"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Unassigned</span>
            <span class="stat-value">${unassigned}</span>
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
      ${this.renderStatsBar()}

      <wa-checkbox
        ?checked="${this.hideDeactivated}"
        @change="${(e: Event) => {
          this.hideDeactivated = (e.target as HTMLInputElement).checked;
        }}"
        style="margin-bottom: 1rem;"
      >
        Hide deactivated users
      </wa-checkbox>

      ${this.renderAssignedSection()} ${this.renderUnassignedSection()}
    `;
  }

  private renderAssignedSection() {
    return html`
      <div class="section-header">
        <h3 class="section-title">Assigned Users</h3>
      </div>
      <wa-card appearance="outline">
        ${this.filteredAssigned.length === 0
          ? html`
              <div class="empty-state">
                <wa-icon name="users"></wa-icon>
                <h3>No Assigned Users</h3>
                <p>No users are assigned to this store. Assign users from the Unassigned Users section below.</p>
              </div>
            `
          : html`
              <div class="table-container">
                <table class="wa-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.filteredAssigned.map((member) => this.renderAssignedRow(member))}
                  </tbody>
                </table>
              </div>
            `}
      </wa-card>
    `;
  }

  private renderAssignedRow(member: OrgMember) {
    const canManage = this.canManageMember(member);
    return html`
      <tr>
        <td><strong>${member.user.name}</strong></td>
        <td>${member.user.email}</td>
        <td>
          <wa-badge variant="${roleBadgeVariant(member.role)}"> ${roleLabel(member.role)} </wa-badge>
        </td>
        <td>
          ${member.user.banned
            ? html`<wa-badge variant="danger">Deactivated</wa-badge>`
            : html`<wa-badge variant="success">Active</wa-badge>`}
        </td>
        <td class="actions-cell">
          <div class="actions-cell-inner">
            ${canManage
              ? html`
                  <wa-button
                    size="small"
                    variant="neutral"
                    appearance="outlined"
                    href="/users/${encodeURIComponent(member.userId)}"
                  >
                    <wa-icon slot="start" name="pen-to-square"></wa-icon>
                    Edit
                  </wa-button>
                  ${when(
                    this.isOwner,
                    () => html`
                      <wa-button
                        size="small"
                        variant="${member.user.banned ? 'success' : 'danger'}"
                        appearance="outlined"
                        @click="${() => this.toggleUserStatus(member)}"
                      >
                        <wa-icon slot="start" name="${member.user.banned ? 'user-check' : 'user-xmark'}"></wa-icon>
                        ${member.user.banned ? 'Activate' : 'Deactivate'}
                      </wa-button>
                    `,
                  )}
                  <wa-button
                    size="small"
                    variant="danger"
                    appearance="outlined"
                    @click="${() => this.handleRemoveMember(member)}"
                  >
                    <wa-icon slot="start" name="xmark"></wa-icon>
                    Remove
                  </wa-button>
                `
              : nothing}
          </div>
        </td>
      </tr>
    `;
  }

  private renderUnassignedSection() {
    return html`
      <div class="section-header" style="margin-top: 2rem;">
        <h3 class="section-title">Unassigned Users</h3>
      </div>
      <wa-card appearance="outline">
        ${this.unassignedUsers.length === 0
          ? html`
              <div class="empty-state">
                <wa-icon name="user-plus"></wa-icon>
                <h3>No Unassigned Users</h3>
                <p>
                  All registered users are assigned to this store, or there are no other users yet. New users can sign
                  up from the login page.
                </p>
              </div>
            `
          : html`
              <div class="table-container">
                <table class="wa-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.unassignedUsers.map((user) => this.renderUnassignedRow(user))}
                  </tbody>
                </table>
              </div>
            `}
      </wa-card>
    `;
  }

  private renderUnassignedRow(user: UserRecord) {
    return html`
      <tr>
        <td><strong>${user.name}</strong></td>
        <td>${user.email}</td>
        <td>
          ${user.banned
            ? html`<wa-badge variant="danger">Deactivated</wa-badge>`
            : html`<wa-badge variant="success">Active</wa-badge>`}
        </td>
        <td class="actions-cell">
          <div class="actions-cell-inner">
            <wa-button size="small" variant="brand" appearance="outlined" @click="${() => this.handleAssignUser(user)}">
              <wa-icon slot="start" name="user-plus"></wa-icon>
              Assign to Store
            </wa-button>
          </div>
        </td>
      </tr>
    `;
  }
}
