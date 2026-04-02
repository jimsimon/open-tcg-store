import type { RouterContext } from '@koa/router';
import { escapeHtml } from './html-escape';

interface PageAttributes {
  userRole: string;
  isAnonymous: boolean;
  userName: string;
  canManageInventory: boolean;
  canAccessSettings: boolean;
  canManageStoreLocations: boolean;
  canManageUsers: boolean;
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
    (ctx.state.auth?.session as Record<string, unknown> | undefined)?.activeOrganizationId as string ?? '';

  // Derive permissions from role during migration period
  // owner (admin) gets everything, admin (store manager) gets inventory+orders+settings read,
  // member (employee) gets inventory+orders only
  const isOwner = userRole === 'admin' || userRole === 'owner';
  const isManager = userRole === 'admin' || userRole === 'owner' || userRole === 'employee';

  return {
    userRole,
    isAnonymous,
    userName,
    canManageInventory: isManager,
    canAccessSettings: isOwner,
    canManageStoreLocations: isOwner,
    canManageUsers: isOwner,
    activeOrganizationId,
  };
}

/**
 * Render common attributes for a page element.
 */
export function renderPageAttributes(ctx: RouterContext, extras: Record<string, string | boolean> = {}): string {
  const attrs = getPageAttributes(ctx);
  const parts: string[] = [
    `userRole="${escapeHtml(attrs.userRole)}"`,
    attrs.isAnonymous ? 'isAnonymous' : '',
    `userName="${escapeHtml(attrs.userName)}"`,
    // Always show the user menu so users can sign in/out from any page
    'showUserMenu',
    attrs.canManageInventory ? 'canManageInventory' : '',
    attrs.canAccessSettings ? 'canAccessSettings' : '',
    attrs.canManageStoreLocations ? 'canManageStoreLocations' : '',
    attrs.canManageUsers ? 'canManageUsers' : '',
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
