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
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';

// Lazy-load authClient to avoid SSR issues
let _authClient: typeof import('../../auth-client').authClient | undefined;
async function getAuthClient() {
  if (!_authClient) {
    const mod = await import('../../auth-client');
    _authClient = mod.authClient;
  }
  return _authClient;
}

// --- Permission definitions ---

/** A permission area presented in the UI as a single toggleable section. */
interface PermissionArea {
  label: string;
  resource: string;
  actions: string[];
  description: string;
  icon: string;
}

const PERMISSION_AREAS: PermissionArea[] = [
  {
    label: 'Inventory Management',
    resource: 'inventory',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'View and manage product inventory',
    icon: 'boxes-stacked',
  },
  {
    label: 'Lot Management',
    resource: 'lot',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Create and manage purchase lots',
    icon: 'box-open',
  },
  {
    label: 'Order Management',
    resource: 'order',
    actions: ['create', 'read', 'update', 'cancel'],
    description: 'View and manage customer orders',
    icon: 'receipt',
  },
  {
    label: 'Dashboard & Transaction Log',
    resource: 'transactionLog',
    actions: ['read'],
    description: 'View dashboard analytics and transaction history',
    icon: 'chart-line',
  },
  {
    label: 'Company Settings',
    resource: 'companySettings',
    actions: ['read', 'update'],
    description: 'Access and modify company-wide settings',
    icon: 'gear',
  },
  {
    label: 'Store Location Management',
    resource: 'storeLocations',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Create and manage store locations',
    icon: 'location-dot',
  },
  {
    label: 'User Management',
    resource: 'userManagement',
    actions: ['create', 'read', 'update', 'delete'],
    description: 'Manage user accounts, roles, and permissions',
    icon: 'users-gear',
  },
];

/**
 * Default app-level permissions for each standard role.
 * These only include the custom app resources — org-management and admin-plugin
 * permissions are handled separately based on the base role.
 */
const ROLE_APP_DEFAULTS: Record<string, Record<string, string[]>> = {
  owner: {
    inventory: ['create', 'read', 'update', 'delete'],
    lot: ['create', 'read', 'update', 'delete'],
    order: ['create', 'read', 'update', 'cancel'],
    transactionLog: ['read'],
    companySettings: ['read', 'update'],
    storeLocations: ['create', 'read', 'update', 'delete'],
    userManagement: ['create', 'read', 'update', 'delete'],
  },
  manager: {
    inventory: ['create', 'read', 'update', 'delete'],
    lot: ['create', 'read', 'update', 'delete'],
    order: ['create', 'read', 'update', 'cancel'],
    transactionLog: ['read'],
  },
  member: {
    inventory: ['create', 'read', 'update', 'delete'],
    lot: ['create', 'read', 'update', 'delete'],
    order: ['create', 'read', 'update', 'cancel'],
  },
};

/**
 * Non-overridable permissions that come from the base role.
 * These include org-management and admin-plugin permissions.
 */
const BASE_ROLE_FIXED_PERMISSIONS: Record<string, Record<string, string[]>> = {
  owner: {
    // Admin plugin permissions
    user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'delete', 'set-password', 'get', 'update'],
    session: ['list', 'revoke', 'delete'],
    // Org management permissions
    organization: ['update', 'delete'],
    member: ['create', 'update', 'delete'],
    invitation: ['create', 'cancel'],
    ac: ['create', 'read', 'update', 'delete'],
  },
  manager: {},
  member: {},
};

const STANDARD_ROLES = ['owner', 'manager', 'member'];

// --- Types ---

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
}

interface MemberRecord {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
}

interface OrgRole {
  id: string;
  role: string;
  permission: Record<string, string[]>;
  organizationId: string;
}

// --- Helpers ---

const AUTH_BASE = 'http://localhost:5174';

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Auth API error: ${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

function customRoleName(memberId: string): string {
  return `custom-${memberId}`;
}

/** Check if a permissions set matches a standard role's defaults exactly. */
function matchesStandardRole(permissions: Record<string, string[]>): string | null {
  for (const roleName of STANDARD_ROLES) {
    const rolePerms = ROLE_APP_DEFAULTS[roleName];
    const enabledResources = Object.keys(permissions).filter((r) => permissions[r].length > 0);
    const roleResources = Object.keys(rolePerms);

    if (enabledResources.length !== roleResources.length) continue;

    let matches = true;
    for (const resource of enabledResources) {
      if (!rolePerms[resource]) {
        matches = false;
        break;
      }
      if ([...permissions[resource]].sort().join(',') !== [...rolePerms[resource]].sort().join(',')) {
        matches = false;
        break;
      }
    }
    if (matches) return roleName;
  }
  return null;
}

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
      return 'Custom';
  }
}

@customElement('ogs-settings-user-edit-page')
export class OgsSettingsUserEditPage extends LitElement {
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
  @property({ type: String }) userId = '';

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

      /* --- Back link --- */

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--wa-color-text-muted);
        text-decoration: none;
        font-size: var(--wa-font-size-s);
        margin-bottom: 1rem;
        cursor: pointer;
        transition: color 0.15s ease;
      }

      .back-link:hover {
        color: var(--wa-color-brand-text);
      }

      /* --- Sections --- */

      .section {
        margin-bottom: 1.5rem;
      }

      .section-title {
        font-size: var(--wa-font-size-l);
        font-weight: 700;
        margin: 0 0 1rem 0;
      }

      /* --- User Info Card --- */

      .user-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        padding: 1.25rem;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .info-label {
        font-size: var(--wa-font-size-xs);
        color: var(--wa-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: 600;
      }

      .info-value {
        font-size: var(--wa-font-size-m);
        font-weight: 500;
      }

      /* --- Role Section --- */

      .role-selector {
        padding: 1.25rem;
      }

      .role-selector wa-select {
        max-width: 300px;
      }

      .override-toggle {
        margin-top: 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .override-description {
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-s);
      }

      /* --- Permission Grid --- */

      .permissions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }

      .permission-card {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem 1.25rem;
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
        transition:
          border-color 0.15s ease,
          background 0.15s ease;
      }

      .permission-card.enabled {
        border-color: var(--wa-color-brand-fill-normal);
        background: color-mix(in srgb, var(--wa-color-brand-container) 30%, var(--wa-color-surface-raised));
      }

      .permission-card-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: var(--wa-border-radius-m);
        background: var(--wa-color-neutral-container);
        color: var(--wa-color-text-muted);
        font-size: 1rem;
        flex-shrink: 0;
      }

      .permission-card.enabled .permission-card-icon {
        background: var(--wa-color-brand-container);
        color: var(--wa-color-brand-text);
      }

      .permission-card-content {
        flex: 1;
        min-width: 0;
      }

      .permission-card-label {
        font-weight: 600;
        font-size: var(--wa-font-size-m);
        margin-bottom: 0.125rem;
      }

      .permission-card-description {
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-s);
      }

      .permission-card wa-switch {
        flex-shrink: 0;
        margin-top: 0.25rem;
      }

      /* --- Not a member state --- */

      .not-member-state {
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

      .not-member-state > wa-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .not-member-state h3 {
        margin: 0 0 0.5rem 0;
        font-size: var(--wa-font-size-xl);
        color: var(--wa-color-text-normal);
      }

      .not-member-state p {
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

      /* --- Footer Actions --- */

      .footer-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        padding-top: 1rem;
        border-top: 1px solid var(--wa-color-surface-border);
        margin-top: 1rem;
      }
    `,
  ];

  @state() private user: UserRecord | null = null;
  @state() private member: MemberRecord | null = null;
  @state() private loading = true;
  @state() private saving = false;

  /** The base role selected in the dropdown */
  @state() private selectedBaseRole = 'member';
  /** Whether per-permission overrides are active */
  @state() private overridePermissions = false;
  /** Current permission toggles per resource */
  @state() private permissions: Record<string, string[]> = {};
  /** Name of an existing custom role for this member (if any) */
  @state() private existingCustomRoleName: string | null = null;

  @state() private successMessage = '';
  @state() private errorMessage = '';

  connectedCallback(): void {
    super.connectedCallback();
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    this.errorMessage = '';

    try {
      // Fetch user details and org members in parallel
      const [userResult, orgResult] = await Promise.all([this.fetchUser(), this.fetchOrgMembers()]);

      if (!userResult) {
        this.errorMessage = 'User not found';
        return;
      }
      this.user = userResult;

      if (orgResult) {
        this.member = orgResult.member;

        // Determine current role and permissions
        const memberRole = this.member.role;
        if (STANDARD_ROLES.includes(memberRole)) {
          this.selectedBaseRole = memberRole;
          this.permissions = structuredClone(ROLE_APP_DEFAULTS[memberRole] ?? {});
          this.overridePermissions = false;
        } else {
          // Custom role — fetch its permissions
          this.overridePermissions = true;
          this.existingCustomRoleName = memberRole;
          try {
            const roleData = await this.fetchOrgRole(memberRole);
            if (roleData) {
              this.permissions = this.extractAppPermissions(roleData.permission);
              // Try to infer the closest base role
              this.selectedBaseRole = this.inferBaseRole(roleData.permission);
            }
          } catch {
            // If we can't fetch the role, start with empty permissions
            this.permissions = {};
            this.selectedBaseRole = 'member';
          }
        }
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to load user data';
    } finally {
      this.loading = false;
    }
  }

  private async fetchUser(): Promise<UserRecord | null> {
    const authClient = await getAuthClient();
    const result = await authClient.admin.listUsers({
      query: { limit: 200, sortBy: 'createdAt', sortDirection: 'desc' },
    });
    if (result.data) {
      const users = result.data.users as unknown as UserRecord[];
      return users.find((u) => u.id === this.userId) ?? null;
    }
    return null;
  }

  private async fetchOrgMembers(): Promise<{ member: MemberRecord } | null> {
    try {
      const result = await authFetch<{
        members: Array<{ id: string; userId: string; role: string; createdAt: string }>;
      }>('/api/auth/organization/get-full-organization', {
        method: 'GET',
      });
      const member = result.members?.find((m) => m.userId === this.userId);
      if (member) {
        return { member };
      }
    } catch {
      // User might not be a member of the current org
    }
    return null;
  }

  private async fetchOrgRole(roleName: string): Promise<OrgRole | null> {
    try {
      return await authFetch<OrgRole>(`/api/auth/organization/get-role?roleName=${encodeURIComponent(roleName)}`, {
        method: 'GET',
      });
    } catch {
      return null;
    }
  }

  /** Extract only app-level permissions from a full permission set. */
  private extractAppPermissions(perms: Record<string, string[]>): Record<string, string[]> {
    const appResources = PERMISSION_AREAS.map((a) => a.resource);
    const result: Record<string, string[]> = {};
    for (const resource of appResources) {
      if (perms[resource]?.length) {
        result[resource] = [...perms[resource]];
      }
    }
    return result;
  }

  /** Infer the closest base role from a permission set (for display purposes). */
  private inferBaseRole(perms: Record<string, string[]>): string {
    // Check if the permission set includes org-admin permissions (owner indicator)
    if (perms.organization?.length || perms.ac?.length) return 'owner';
    // Check if it has transactionLog (manager includes it, member doesn't)
    if (perms.transactionLog?.length) return 'manager';
    return 'member';
  }

  private handleBaseRoleChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.selectedBaseRole = select.value;
    if (!this.overridePermissions) {
      this.permissions = structuredClone(ROLE_APP_DEFAULTS[this.selectedBaseRole] ?? {});
    }
  }

  private handleOverrideToggle(e: Event) {
    const checkbox = e.target as HTMLInputElement;
    this.overridePermissions = checkbox.checked;
    if (!this.overridePermissions) {
      // Reset to base role defaults
      this.permissions = structuredClone(ROLE_APP_DEFAULTS[this.selectedBaseRole] ?? {});
    }
  }

  private handlePermissionToggle(resource: string, actions: string[], enabled: boolean) {
    const updated = { ...this.permissions };
    if (enabled) {
      updated[resource] = [...actions];
    } else {
      delete updated[resource];
    }
    this.permissions = updated;
  }

  private isPermissionEnabled(resource: string): boolean {
    return (this.permissions[resource]?.length ?? 0) > 0;
  }

  async handleSave() {
    if (!this.member) return;

    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      if (!this.overridePermissions) {
        // Using a standard role — assign it directly
        await this.assignStandardRole(this.selectedBaseRole);
      } else {
        // Check if custom permissions match a standard role
        const matchedRole = matchesStandardRole(this.permissions);
        if (matchedRole) {
          await this.assignStandardRole(matchedRole);
        } else {
          await this.assignCustomPermissions();
        }
      }

      this.successMessage = 'Permissions updated successfully';
      // Refresh data to reflect changes
      await this.loadData();
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to save permissions';
    } finally {
      this.saving = false;
    }
  }

  private async assignStandardRole(roleName: string) {
    // Update the member's role to a standard role
    await authFetch('/api/auth/organization/update-member-role', {
      method: 'POST',
      body: JSON.stringify({
        memberId: this.member!.id,
        role: roleName,
      }),
    });

    // Clean up any existing custom role
    if (this.existingCustomRoleName && !STANDARD_ROLES.includes(this.existingCustomRoleName)) {
      try {
        await authFetch('/api/auth/organization/delete-role', {
          method: 'POST',
          body: JSON.stringify({ roleName: this.existingCustomRoleName }),
        });
      } catch {
        // Role might already be deleted or assigned to others — ignore
      }
      this.existingCustomRoleName = null;
    }
  }

  private async assignCustomPermissions() {
    const roleName = customRoleName(this.member!.id);

    // Build the full permission set: fixed base-role permissions + checked app permissions
    const fullPermissions: Record<string, string[]> = {
      ...BASE_ROLE_FIXED_PERMISSIONS[this.selectedBaseRole],
      ...this.permissions,
    };

    if (this.existingCustomRoleName === roleName) {
      // Update the existing custom role
      await authFetch('/api/auth/organization/update-role', {
        method: 'POST',
        body: JSON.stringify({
          roleName,
          data: { permission: fullPermissions },
        }),
      });
    } else {
      // Delete old custom role if exists
      if (this.existingCustomRoleName && !STANDARD_ROLES.includes(this.existingCustomRoleName)) {
        try {
          await authFetch('/api/auth/organization/delete-role', {
            method: 'POST',
            body: JSON.stringify({ roleName: this.existingCustomRoleName }),
          });
        } catch {
          // Ignore
        }
      }

      // Create a new custom role
      await authFetch('/api/auth/organization/create-role', {
        method: 'POST',
        body: JSON.stringify({
          role: roleName,
          permission: fullPermissions,
        }),
      });
    }

    // Assign the custom role to the member
    await authFetch('/api/auth/organization/update-member-role', {
      method: 'POST',
      body: JSON.stringify({
        memberId: this.member!.id,
        role: roleName,
      }),
    });

    this.existingCustomRoleName = roleName;
  }

  render() {
    return html`
      <ogs-page
        activePage="settings/users"
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
        <a class="back-link" href="/settings/users">
          <wa-icon name="arrow-left"></wa-icon>
          Back to Users
        </a>
        ${when(
          this.loading,
          () => html`
            <div class="loading-container">
              <wa-spinner style="font-size: 2rem;"></wa-spinner>
              <span>Loading user data...</span>
            </div>
          `,
          () => this.renderContent(),
        )}
      </ogs-page>
    `;
  }

  private renderContent() {
    if (!this.user) {
      return html`
        <wa-callout variant="danger">
          <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
          User not found
        </wa-callout>
      `;
    }

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
      ${this.renderPageHeader()} ${this.renderUserInfo()}
      ${this.member ? this.renderRoleAndPermissions() : this.renderNotMemberState()}
      ${this.member ? this.renderFooter() : nothing}
    `;
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="user-pen" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Edit User${this.user ? html` — ${this.user.name}` : nothing}</h2>
          <p>Manage role and permission overrides for this user</p>
        </div>
      </div>
    `;
  }

  private renderUserInfo() {
    if (!this.user) return nothing;
    return html`
      <div class="section">
        <wa-card appearance="outline">
          <div class="user-info-grid">
            <div class="info-item">
              <span class="info-label">Name</span>
              <span class="info-value">${this.user.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">${this.user.email}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status</span>
              <span class="info-value">
                ${this.user.banned
                  ? html`<wa-badge variant="danger">Deactivated</wa-badge>`
                  : html`<wa-badge variant="success">Active</wa-badge>`}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Created</span>
              <span class="info-value">${new Date(this.user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </wa-card>
      </div>
    `;
  }

  private renderNotMemberState() {
    return html`
      <div class="not-member-state">
        <wa-icon name="user-xmark"></wa-icon>
        <h3>Not a Store Member</h3>
        <p>This user is not a member of the current store. Add them to the store first to manage their permissions.</p>
        <wa-button variant="brand" href="/settings/users">
          <wa-icon slot="start" name="arrow-left"></wa-icon>
          Back to Users
        </wa-button>
      </div>
    `;
  }

  private renderRoleAndPermissions() {
    return html`
      <div class="section">
        <h3 class="section-title">Role & Permissions</h3>
        <wa-card appearance="outline">
          <div class="role-selector">
            <wa-select label="Base Role" .value="${this.selectedBaseRole}" @change="${this.handleBaseRoleChange}">
              <wa-option value="owner">Owner</wa-option>
              <wa-option value="manager">Store Manager</wa-option>
              <wa-option value="member">Employee</wa-option>
            </wa-select>
            <div class="override-toggle">
              <wa-switch ?checked="${this.overridePermissions}" @change="${this.handleOverrideToggle}">
                Override default permissions
              </wa-switch>
            </div>
            ${this.overridePermissions
              ? html`<p class="override-description">
                  Customize which features this user can access. Unchecked permissions will be denied regardless of the
                  base role.
                </p>`
              : html`<p class="override-description">
                  Using default permissions for the ${roleLabel(this.selectedBaseRole)} role.
                </p>`}
          </div>
        </wa-card>
      </div>

      <div class="section">
        <div class="permissions-grid">${PERMISSION_AREAS.map((area) => this.renderPermissionCard(area))}</div>
      </div>
    `;
  }

  private renderPermissionCard(area: PermissionArea) {
    const enabled = this.isPermissionEnabled(area.resource);
    const disabled = !this.overridePermissions;
    return html`
      <div class="permission-card ${enabled ? 'enabled' : ''}">
        <div class="permission-card-icon">
          <wa-icon name="${area.icon}"></wa-icon>
        </div>
        <div class="permission-card-content">
          <div class="permission-card-label">${area.label}</div>
          <div class="permission-card-description">${area.description}</div>
        </div>
        <wa-switch
          ?checked="${enabled}"
          ?disabled="${disabled}"
          @change="${(e: Event) => {
            const sw = e.target as HTMLInputElement;
            this.handlePermissionToggle(area.resource, area.actions, sw.checked);
          }}"
        ></wa-switch>
      </div>
    `;
  }

  private renderFooter() {
    return html`
      <div class="footer-actions">
        <wa-button variant="neutral" href="/settings/users">Cancel</wa-button>
        <wa-button variant="brand" ?loading="${this.saving}" @click="${this.handleSave}">
          <wa-icon slot="start" name="floppy-disk"></wa-icon>
          Save Changes
        </wa-button>
      </div>
    `;
  }
}
