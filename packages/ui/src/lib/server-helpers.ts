import type { RouterContext } from '@koa/router';
import { authClient } from '../auth-client';
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

function cookieHeaders(ctx: RouterContext): Record<string, string> {
  return { Cookie: (ctx.headers.cookie as string) ?? '' };
}

async function checkPermission(
  permissions: Record<string, string[]>,
  fetchOptions: { headers: Record<string, string> },
): Promise<boolean> {
  try {
    const result = await authClient.organization.hasPermission({ permissions, fetchOptions });
    return result.data?.success ?? false;
  } catch {
    return false;
  }
}

/**
 * Extract common page attributes from the Koa router context.
 * Permissions are checked via authClient.organization.hasPermission, which
 * respects the user's role in their active organization.
 */
export async function getPageAttributes(ctx: RouterContext): Promise<PageAttributes> {
  const isAnonymous = ctx.state.auth?.user?.isAnonymous === true;
  const userName = ctx.state.auth?.user?.name ?? '';
  const activeOrganizationId =
    ((ctx.state.auth?.session as Record<string, unknown> | undefined)?.activeOrganizationId as string) ?? '';

  // No active organization session — no org-based permissions
  if (!activeOrganizationId) {
    return {
      isAnonymous,
      userName,
      canManageInventory: false,
      canViewDashboard: false,
      canAccessSettings: false,
      canManageStoreLocations: false,
      canManageUsers: false,
      canViewTransactionLog: false,
      activeOrganizationId,
    };
  }

  const fetchOptions = { headers: cookieHeaders(ctx) };

  // Run all permission checks in parallel to avoid sequential round trips
  const [canManageInventory, canViewTransactionLog, canAccessSettings, canManageStoreLocations, canManageUsers] =
    await Promise.all([
      checkPermission({ inventory: ['read'] }, fetchOptions),
      checkPermission({ transactionLog: ['read'] }, fetchOptions),
      checkPermission({ storeSettings: ['read'] }, fetchOptions),
      checkPermission({ storeLocations: ['read'] }, fetchOptions),
      checkPermission({ userManagement: ['read'] }, fetchOptions),
    ]);

  // Dashboard is visible to anyone who can view the transaction log (manager+)
  const canViewDashboard = canViewTransactionLog;

  return {
    isAnonymous,
    userName,
    canManageInventory,
    canViewDashboard,
    canAccessSettings,
    canManageStoreLocations,
    canManageUsers,
    canViewTransactionLog,
    activeOrganizationId,
  };
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
