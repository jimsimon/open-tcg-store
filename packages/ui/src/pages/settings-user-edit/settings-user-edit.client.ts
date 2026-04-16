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
import { roles, statement } from '../../../../api/src/lib/permissions';
import { getAuthClient } from '../../lib/auth';
import { roleLabel } from '../../lib/labels';

// --- Permission definitions ---

/** A permission area presented in the UI as a single toggleable section. */
interface PermissionArea {
  label: string;
  resource: string;
  actions: string[];
  description: string;
  icon: string;
}

/** Resources that are app-specific (editable per-user in the UI). */
const APP_RESOURCES = new Set([
  'inventory',
  'lot',
  'order',
  'transactionLog',
  'companySettings',
  'storeLocations',
  'userManagement',
]);

/** UI metadata for each app-level permission area. Actions are derived from the shared statement. */
const PERMISSION_AREA_META: Omit<PermissionArea, 'actions'>[] = [
  {
    label: 'Inventory Management',
    resource: 'inventory',
    description: 'View and manage product inventory',
    icon: 'boxes-stacked',
  },
  { label: 'Lot Management', resource: 'lot', description: 'Create and manage purchase lots', icon: 'box-open' },
  { label: 'Order Management', resource: 'order', description: 'View and manage customer orders', icon: 'receipt' },
  {
    label: 'Dashboard & Transaction Log',
    resource: 'transactionLog',
    description: 'View dashboard analytics and transaction history',
    icon: 'chart-line',
  },
  {
    label: 'Company Settings',
    resource: 'companySettings',
    description: 'Access and modify company-wide settings',
    icon: 'gear',
  },
  {
    label: 'Store Location Management',
    resource: 'storeLocations',
    description: 'Create and manage store locations',
    icon: 'location-dot',
  },
  {
    label: 'User Management',
    resource: 'userManagement',
    description: 'Manage user accounts, roles, and permissions',
    icon: 'users-gear',
  },
];

const PERMISSION_AREAS: PermissionArea[] = PERMISSION_AREA_META.map((meta) => ({
  ...meta,
  actions: [...statement[meta.resource as keyof typeof statement]],
}));

/**
 * Derive app-level and fixed permission maps from the shared role definitions.
 * This ensures the UI always stays in sync with the server-side role config
 * in packages/api/src/lib/permissions.ts.
 */
function splitRolePermissions(roleStatements: Record<string, readonly string[]>): {
  app: Record<string, string[]>;
  fixed: Record<string, string[]>;
} {
  const app: Record<string, string[]> = {};
  const fixed: Record<string, string[]> = {};
  for (const [resource, actions] of Object.entries(roleStatements)) {
    if (APP_RESOURCES.has(resource)) {
      app[resource] = [...actions];
    } else if (actions.length > 0) {
      fixed[resource] = [...actions];
    }
  }
  return { app, fixed };
}

const ownerSplit = splitRolePermissions(roles.owner.statements);
const managerSplit = splitRolePermissions(roles.manager.statements);
const memberSplit = splitRolePermissions(roles.member.statements);

/** Default app-level permissions for each standard role (derived from shared permissions.ts). */
const ROLE_APP_DEFAULTS: Record<string, Record<string, string[]>> = {
  owner: ownerSplit.app,
  manager: managerSplit.app,
  member: memberSplit.app,
};

/**
 * Non-overridable permissions that come from the base role (derived from shared permissions.ts).
 * These include org-management and admin-plugin permissions.
 */
const BASE_ROLE_FIXED_PERMISSIONS: Record<string, Record<string, string[]>> = {
  owner: ownerSplit.fixed,
  manager: managerSplit.fixed,
  member: memberSplit.fixed,
};

const STANDARD_ROLES = ['owner', 'manager', 'member'];

// --- Types ---

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: string;
}

interface MemberRecord {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
}

// --- Helpers ---

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
  @property({ type: Boolean }) showStoreSelector = false;
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

  /** The current user's role in this store (for manager guards) */
  @state() private currentUserRole: string | null = null;

  @state() private successMessage = '';
  @state() private errorMessage = '';

  connectedCallback(): void {
    super.connectedCallback();
    this.loadData();
  }

  /** Whether the current user is an owner */
  private get isOwner(): boolean {
    return this.currentUserRole === 'owner';
  }

  /** Whether the current user can edit this target user's role/permissions */
  private get canEditTarget(): boolean {
    if (!this.member) return false;
    // Owners are always protected
    if (this.member.role === 'owner') return false;
    // Managers can only edit standard members. Custom roles may carry elevated
    // permissions set by an owner, so managers cannot modify those users.
    if (!this.isOwner && this.member.role !== 'member') return false;
    return true;
  }

  async loadData() {
    this.loading = true;
    this.errorMessage = '';

    try {
      const [userResult, orgResult] = await Promise.all([this.fetchUser(), this.fetchOrgMembers()]);

      if (!userResult) {
        this.errorMessage = 'User not found';
        return;
      }
      this.user = userResult;

      if (orgResult) {
        this.member = orgResult.member;
        this.currentUserRole = orgResult.currentUserRole;

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
    // Use the GET /api/users/:userId endpoint instead of authClient.admin.getUser()
    // because the admin plugin is restricted to owners (adminRoles: ['owner']),
    // but managers also need to load user details on this page.
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(this.userId)}`, { credentials: 'include' });
      if (res.ok) {
        return (await res.json()) as UserRecord;
      }
    } catch {
      // Fall through to return null
    }
    return null;
  }

  private async fetchOrgMembers(): Promise<{ member: MemberRecord; currentUserRole: string | null } | null> {
    try {
      const authClient = await getAuthClient();
      const result = await authClient.organization.getFullOrganization();
      if (result.data) {
        const org = result.data as unknown as {
          members: Array<{ id: string; userId: string; role: string; createdAt: string }>;
        };
        const member = org.members?.find((m: { userId: string }) => m.userId === this.userId);

        // Determine the current user's role in this org
        const currentUserId = (await authClient.getSession())?.data?.user?.id;
        const currentMember = currentUserId
          ? org.members?.find((m: { userId: string }) => m.userId === currentUserId)
          : null;

        if (member) {
          return { member, currentUserRole: currentMember?.role ?? null };
        }
      }
    } catch {
      // User might not be a member of the current org
    }
    return null;
  }

  private async fetchOrgRole(roleName: string): Promise<{ permission: Record<string, string[]> } | null> {
    try {
      const authClient = await getAuthClient();
      const result = await authClient.organization.getRole({
        query: { roleName },
      });
      if (result.data) {
        return result.data as unknown as { permission: Record<string, string[]> };
      }
      return null;
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
      // Owner-protection guard: owner roles cannot be changed through this interface.
      if (this.member.role === 'owner') {
        this.errorMessage = 'Owner permissions cannot be changed through this interface.';
        return;
      }

      // Manager guard: managers can only edit standard members
      if (!this.canEditTarget) {
        this.errorMessage = 'You do not have permission to edit this user.';
        return;
      }

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

      // Refresh data to reflect changes
      await this.loadData();
      this.successMessage = 'Permissions updated successfully';
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
    const authClient = await getAuthClient();

    // Update the member's role to a standard role
    const roleResult = await authClient.organization.updateMemberRole({
      memberId: this.member!.id,
      role: roleName,
    });
    if (roleResult.error) {
      throw new Error((roleResult.error as { message?: string }).message ?? 'Failed to update member role');
    }

    // Clean up any existing custom role
    if (this.existingCustomRoleName && !STANDARD_ROLES.includes(this.existingCustomRoleName)) {
      try {
        await authClient.organization.deleteRole({
          roleName: this.existingCustomRoleName,
        });
      } catch {
        // Role might already be deleted or assigned to others — ignore
      }
      this.existingCustomRoleName = null;
    }
  }

  private async assignCustomPermissions() {
    const authClient = await getAuthClient();
    const roleName = customRoleName(this.member!.id);

    // Build the full permission set: fixed base-role permissions + checked app permissions
    const fullPermissions: Record<string, string[]> = {
      ...BASE_ROLE_FIXED_PERMISSIONS[this.selectedBaseRole],
      ...this.permissions,
    };

    if (this.existingCustomRoleName === roleName) {
      // Update the existing custom role
      const updateResult = await authClient.organization.updateRole({
        roleName,
        data: { permission: fullPermissions },
      });
      if (updateResult.error) {
        throw new Error((updateResult.error as { message?: string }).message ?? 'Failed to update custom role');
      }
    } else {
      // Delete old custom role if exists
      if (this.existingCustomRoleName && !STANDARD_ROLES.includes(this.existingCustomRoleName)) {
        try {
          await authClient.organization.deleteRole({
            roleName: this.existingCustomRoleName,
          });
        } catch {
          // Ignore
        }
      }

      // Create a new custom role
      const createResult = await authClient.organization.createRole({
        role: roleName,
        permission: fullPermissions,
      });
      if (createResult.error) {
        throw new Error((createResult.error as { message?: string }).message ?? 'Failed to create custom role');
      }
    }

    // Assign the custom role to the member
    const assignResult = await authClient.organization.updateMemberRole({
      memberId: this.member!.id,
      role: roleName,
    });
    if (assignResult.error) {
      throw new Error((assignResult.error as { message?: string }).message ?? 'Failed to assign custom role');
    }

    this.existingCustomRoleName = roleName;
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
        <a class="back-link" href="/users">
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
      ${this.member
        ? this.member.role === 'owner'
          ? this.renderOwnerReadOnlyState()
          : !this.canEditTarget
            ? this.renderManagerProtectedState()
            : this.renderRoleAndPermissions()
        : this.renderNotMemberState()}
      ${this.member && this.canEditTarget ? this.renderFooter() : nothing}
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
          <p>Manage role and permission overrides for this user at this store</p>
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
              <span class="info-label">Created</span>
              <span class="info-value">${new Date(this.user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </wa-card>
      </div>
    `;
  }

  private renderOwnerReadOnlyState() {
    return html`
      <div class="section">
        <h3 class="section-title">Role & Permissions</h3>
        <wa-callout variant="warning">
          <wa-icon slot="icon" name="shield-halved"></wa-icon>
          Owner permissions cannot be changed through this interface. To transfer or revoke ownership, use direct
          database administration or a dedicated ownership-transfer process.
        </wa-callout>
      </div>
    `;
  }

  private renderManagerProtectedState() {
    return html`
      <div class="section">
        <h3 class="section-title">Role & Permissions</h3>
        <wa-callout variant="warning">
          <wa-icon slot="icon" name="shield-halved"></wa-icon>
          You do not have permission to edit this user's role or permissions. Only owners can modify managers and other
          privileged roles.
        </wa-callout>
      </div>
    `;
  }

  private renderNotMemberState() {
    return html`
      <div class="not-member-state">
        <wa-icon name="user-xmark"></wa-icon>
        <h3>Not a Member of This Store</h3>
        <p>
          This user is not assigned to the currently selected store. Go back to the users list and assign them first.
        </p>
        <wa-button variant="brand" href="/users">
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
              ${when(this.isOwner, () => html`<wa-option value="owner">Owner</wa-option>`)}
              ${when(this.isOwner, () => html`<wa-option value="manager">Store Manager</wa-option>`)}
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
                  Using default permissions for the ${roleLabel(this.selectedBaseRole, 'Custom')} role.
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
        <wa-button variant="neutral" href="/users">Cancel</wa-button>
        <wa-button variant="brand" ?loading="${this.saving}" @click="${this.handleSave}">
          <wa-icon slot="start" name="floppy-disk"></wa-icon>
          Save Changes
        </wa-button>
      </div>
    `;
  }
}
