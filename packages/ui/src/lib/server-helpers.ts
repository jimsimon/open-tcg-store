import type { RouterContext } from '@koa/router';
import { escapeHtml } from './html-escape';

interface PageAttributes {
  isAnonymous: boolean;
  userName: string;
  canManageInventory: boolean;
  canViewDashboard: boolean;
  canAccessSettings: boolean;
  canManageStoreLocations: boolean;
  canManageUsers: boolean;
  canViewTransactionLog: boolean;
  activeOrganizationId: string;
  showStoreSelector?: boolean;
}

/**
 * Extract common page attributes from the Koa router context.
 * These are passed as HTML attributes on page custom elements.
 *
 * During the migration period, permissions are derived from the global user.role field.
 * Once all users are migrated to org-based roles, this should use
 * authClient.organization.hasPermission() instead.
 */
export function getPageAttributes(ctx: RouterContext): PageAttributes {
  const userRole = ctx.state.auth?.user?.role ?? '';
  const isAnonymous = ctx.state.auth?.user?.isAnonymous === true;
  const userName = ctx.state.auth?.user?.name ?? '';
  const activeOrganizationId =
    ((ctx.state.auth?.session as Record<string, unknown> | undefined)?.activeOrganizationId as string) ?? '';

  // Derive permissions from role.
  // owner: full access (Settings, Dashboard, Transaction Log, Inventory, Orders)
  // manager (Store Manager): Dashboard, Inventory, Orders
  // member (Employee): Inventory, Orders only
  const isOwner = userRole === 'owner';
  const isManagerOrAbove = userRole === 'owner' || userRole === 'manager';
  const isEmployee = userRole === 'member';
  const isAuthenticated = isOwner || isManagerOrAbove || isEmployee;

  return {
    isAnonymous,
    userName,
    canManageInventory: isAuthenticated,
    canViewDashboard: isManagerOrAbove,
    canAccessSettings: isOwner,
    canManageStoreLocations: isOwner,
    canManageUsers: isOwner,
    canViewTransactionLog: isManagerOrAbove,
    activeOrganizationId,
  };
}

/**
 * Render common attributes for a page element.
 */
export function renderPageAttributes(ctx: RouterContext, extras: Record<string, string | boolean> = {}): string {
  const attrs = getPageAttributes(ctx);
  const parts: string[] = [
    attrs.isAnonymous ? 'isAnonymous' : '',
    `userName="${escapeHtml(attrs.userName)}"`,
    // Always show the user menu so users can sign in/out from any page
    'showUserMenu',
    attrs.canManageInventory ? 'canManageInventory' : '',
    attrs.canViewDashboard ? 'canViewDashboard' : '',
    attrs.canAccessSettings ? 'canAccessSettings' : '',
    attrs.canManageStoreLocations ? 'canManageStoreLocations' : '',
    attrs.canManageUsers ? 'canManageUsers' : '',
    attrs.canViewTransactionLog ? 'canViewTransactionLog' : '',
    attrs.activeOrganizationId ? `activeOrganizationId="${escapeHtml(attrs.activeOrganizationId)}"` : '',
  ];

  for (const [key, value] of Object.entries(extras)) {
    if (typeof value === 'boolean') {
      if (value) parts.push(key);
    } else {
      parts.push(`${key}="${escapeHtml(value)}"`);
    }
  }

  return parts.filter(Boolean).join(' ');
}
