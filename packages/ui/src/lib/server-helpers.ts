import type { RouterContext } from '@koa/router';
import { graphql } from '../graphql';
import { executeWithHeaders } from './graphql';
import { escapeHtml } from './html-escape';

const UserPermissionsQuery = graphql(`
  query UserPermissions {
    userPermissions {
      canManageInventory
      canManageLots
      canViewDashboard
      canAccessSettings
      canManageStoreLocations
      canManageUsers
      canViewTransactionLog
    }
  }
`);

interface PageAttributes {
  isAnonymous: boolean;
  userName: string;
  canManageInventory: boolean;
  canManageLots: boolean;
  canViewDashboard: boolean;
  canAccessSettings: boolean;
  canManageStoreLocations: boolean;
  canManageUsers: boolean;
  canViewTransactionLog: boolean;
  activeOrganizationId: string;
  showStoreSelector?: boolean;
}

const NO_PERMISSIONS = {
  canManageInventory: false,
  canManageLots: false,
  canViewDashboard: false,
  canAccessSettings: false,
  canManageStoreLocations: false,
  canManageUsers: false,
  canViewTransactionLog: false,
};

/**
 * Extract common page attributes from the Koa router context.
 * Permissions are resolved in a single GraphQL call to userPermissions,
 * which checks all flags server-side via auth.api.hasPermission (in-process,
 * no HTTP overhead per check), correctly respecting DAC overrides.
 */
export async function getPageAttributes(ctx: RouterContext): Promise<PageAttributes> {
  const isAnonymous = ctx.state.auth?.user?.isAnonymous === true;
  const userName = ctx.state.auth?.user?.name ?? '';
  const activeOrganizationId =
    ((ctx.state.auth?.session as Record<string, unknown> | undefined)?.activeOrganizationId as string) ?? '';

  // No active organization — no org-based permissions
  if (!activeOrganizationId) {
    return { isAnonymous, userName, activeOrganizationId, ...NO_PERMISSIONS };
  }

  try {
    const result = await executeWithHeaders(UserPermissionsQuery, {
      Cookie: (ctx.headers.cookie as string) ?? '',
    });
    const perms = result.data?.userPermissions ?? NO_PERMISSIONS;
    return { isAnonymous, userName, activeOrganizationId, ...perms };
  } catch {
    return { isAnonymous, userName, activeOrganizationId, ...NO_PERMISSIONS };
  }
}

/**
 * Render common attributes for a page element.
 */
export async function renderPageAttributes(
  ctx: RouterContext,
  extras: Record<string, string | boolean> = {},
): Promise<string> {
  const attrs = await getPageAttributes(ctx);
  const parts: string[] = [
    attrs.isAnonymous ? 'isAnonymous' : '',
    `userName="${escapeHtml(attrs.userName)}"`,
    // Always show the user menu so users can sign in/out from any page
    'showUserMenu',
    attrs.canManageInventory ? 'canManageInventory' : '',
    attrs.canManageLots ? 'canManageLots' : '',
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
