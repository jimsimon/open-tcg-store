import { css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { when } from 'lit/directives/when.js';
import { OgsPageBase } from '../../components/ogs-page-base.ts';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { activeStoreId } from '../../lib/store-context';
import { getAuthClient } from '../../lib/auth';
import { roleLabel } from '../../lib/labels';
import { storeUrl } from '../../lib/store-url';

if (typeof globalThis.document !== 'undefined') {
  import('@awesome.me/webawesome/dist/components/dialog/dialog.js');
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
  };
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
export class OgsSettingsUsersPage extends SignalWatcher(OgsPageBase) {
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
        font-size: var(--wa-font-size-m);
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
        font-size: var(--wa-font-size-s);
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
        font-size: var(--wa-font-size-m);
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
        font-size: var(--wa-font-size-m);
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

      /* --- Assign User Form --- */

      .assign-form {
        display: flex;
        align-items: flex-end;
        gap: 0.75rem;
        padding: 1.25rem;
      }

      .assign-form wa-input {
        flex: 1;
        min-width: 200px;
      }

      .assign-form-error {
        padding: 0 1.25rem 1.25rem;
      }
    `,
  ];

  @state() private assignedMembers: OrgMember[] = [];
  @state() private loading = true;
  @state() private successMessage = '';
  @state() private errorMessage = '';
  /** The current user's role in the active store (to enable manager guards) */
  @state() private currentUserRole: string | null = null;

  /** Assign-by-email form state */
  @state() private assignEmail = '';
  @state() private assigning = false;
  @state() private assignError = '';

  /** Remove-member confirmation dialog state */
  @state() private memberToRemove: OrgMember | null = null;

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

  /** The effective store ID — uses the signal if set, otherwise falls back to the
   *  server-provided prop. On initial page load the signal may not be populated yet
   *  (ogs-page sets it asynchronously), but the session already has the active org. */
  private get effectiveStoreId(): string {
    return activeStoreId.get() || this.activeOrganizationId;
  }

  async loadData() {
    const storeId = this.effectiveStoreId;
    if (!storeId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    try {
      await this.loadAssignedMembers();
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

      // Determine the current user's role in this store.
      // NOTE: getSession() is also called in settings-user-edit. Ideally the session
      // would be passed from a higher level, but each page loads independently so the
      // extra round-trip is an acceptable trade-off for now.
      const currentUserId = (await authClient.getSession())?.data?.user?.id;
      if (currentUserId) {
        const myMember = this.assignedMembers.find((m) => m.userId === currentUserId);
        this.currentUserRole = myMember?.role ?? null;
      }
    }
  }

  /** Whether the current user is an owner (can edit managers, etc.) */
  private get isOwner(): boolean {
    return this.currentUserRole === 'owner';
  }

  /** Check whether the current user can manage (edit/remove) a given member. */
  private canManageMember(member: OrgMember): boolean {
    // Owners can manage anyone except other owners
    if (this.isOwner) return member.role !== 'owner';
    // Managers can only manage standard members. Custom roles may carry elevated
    // permissions set by an owner, so managers cannot modify those users.
    return member.role === 'member';
  }

  async handleAssignByEmail() {
    const storeId = this.effectiveStoreId;
    const email = this.assignEmail.trim();
    if (!storeId || !email) return;

    this.assigning = true;
    this.assignError = '';
    this.successMessage = '';
    this.errorMessage = '';

    try {
      // Look up user by email
      const lookupRes = await fetch('/api/users/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!lookupRes.ok) {
        const err = (await lookupRes.json()) as { error?: string };
        this.assignError = err.error ?? 'User not found';
        return;
      }

      const user = (await lookupRes.json()) as { id: string; name: string; email: string };

      // Check if the user is already assigned to this store
      if (this.assignedMembers.some((m) => m.userId === user.id)) {
        this.assignError = `${user.name} is already assigned to this store.`;
        return;
      }

      // Assign the user to the store
      const assignRes = await fetch('/api/users/store-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id, organizationId: storeId, role: 'member' }),
      });

      if (!assignRes.ok) {
        const err = (await assignRes.json()) as { error?: string };
        this.assignError = err.error ?? 'Failed to assign user';
        return;
      }

      this.successMessage = `${user.name} assigned to this store`;
      this.assignEmail = '';
      this.assignError = '';
      await this.loadData();
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (e) {
      this.assignError = e instanceof Error ? e.message : 'Failed to assign user';
    } finally {
      this.assigning = false;
    }
  }

  /** Opens the confirmation dialog for removing a member. */
  private confirmRemoveMember(member: OrgMember) {
    this.memberToRemove = member;
  }

  /** Executes the removal after the user confirms via the dialog. */
  async handleRemoveMember() {
    const member = this.memberToRemove;
    if (!member) return;

    const storeId = this.effectiveStoreId;
    if (!storeId) return;

    this.memberToRemove = null;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      const res = await fetch('/api/users/store-membership/remove', {
        method: 'POST',
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

  render() {
    return this.renderPage(
      html`
        ${this.renderPageHeader()}
        ${when(
          !this.effectiveStoreId,
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
        ${this.renderRemoveConfirmDialog()}
      `,
      { activePage: 'users', showUserMenu: true, showStoreSelector: this.showStoreSelector },
    );
  }

  private renderRemoveConfirmDialog() {
    const member = this.memberToRemove;
    return html`
      <wa-dialog
        label="Remove User"
        ?open="${!!member}"
        @wa-after-hide="${(e: Event) => {
          if (e.target === e.currentTarget) this.memberToRemove = null;
        }}"
      >
        <p>
          Are you sure you want to remove <strong>${member?.user.name}</strong> from this store? They will lose access
          until reassigned.
        </p>
        <wa-button
          slot="footer"
          variant="neutral"
          @click="${() => {
            this.memberToRemove = null;
          }}"
          >Cancel</wa-button
        >
        <wa-button slot="footer" variant="danger" @click="${this.handleRemoveMember}">
          <wa-icon slot="start" name="xmark"></wa-icon>
          Remove
        </wa-button>
      </wa-dialog>
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
    return html`
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-icon success">
            <wa-icon name="user-check"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Assigned</span>
            <span class="stat-value">${this.assignedMembers.length}</span>
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
      ${this.renderStatsBar()} ${this.renderAssignedSection()} ${this.renderAssignSection()}
    `;
  }

  private renderAssignedSection() {
    return html`
      <div class="section-header">
        <h3 class="section-title">Assigned Users</h3>
      </div>
      <wa-card appearance="outline">
        ${this.assignedMembers.length === 0
          ? html`
              <div class="empty-state">
                <wa-icon name="users"></wa-icon>
                <h3>No Assigned Users</h3>
                <p>
                  No users are assigned to this store yet. Use the form below to assign a user by their email address.
                </p>
              </div>
            `
          : html`
              <div class="table-container">
                <table class="wa-table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Role</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.assignedMembers.map((member) => this.renderAssignedRow(member))}
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
        <td class="actions-cell">
          <div class="actions-cell-inner">
            ${canManage
              ? html`
                  <wa-button
                    size="small"
                    variant="neutral"
                    appearance="outlined"
                    href="${storeUrl(`/users/${encodeURIComponent(member.userId)}`)}"
                  >
                    <wa-icon slot="start" name="pen-to-square"></wa-icon>
                    Edit
                  </wa-button>
                  <wa-button
                    size="small"
                    variant="danger"
                    appearance="outlined"
                    @click="${() => this.confirmRemoveMember(member)}"
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

  private renderAssignSection() {
    return html`
      <div class="section-header" style="margin-top: 2rem;">
        <h3 class="section-title">Assign a User</h3>
      </div>
      <wa-card appearance="outline">
        <div class="assign-form">
          <wa-input
            type="email"
            label="User Email"
            placeholder="Enter the email of a registered user"
            .value="${this.assignEmail}"
            @input="${(e: Event) => {
              this.assignEmail = (e.target as HTMLInputElement).value;
              this.assignError = '';
            }}"
            @keydown="${(e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                this.handleAssignByEmail();
              }
            }}"
          >
            <wa-icon slot="prefix" name="envelope"></wa-icon>
          </wa-input>
          <wa-button
            variant="brand"
            ?loading="${this.assigning}"
            ?disabled="${!this.assignEmail.trim()}"
            @click="${this.handleAssignByEmail}"
          >
            <wa-icon slot="start" name="user-plus"></wa-icon>
            Assign
          </wa-button>
        </div>
        ${this.assignError
          ? html`
              <div class="assign-form-error">
                <wa-callout variant="danger" size="small">
                  <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                  ${this.assignError}
                </wa-callout>
              </div>
            `
          : nothing}
      </wa-card>
    `;
  }
}
