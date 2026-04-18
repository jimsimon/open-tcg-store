import { auth } from '../../../../auth';
import type { GraphqlContext } from '../../../../server';
import type { QueryResolvers } from '../../../types.generated';

async function checkPerm(ctx: GraphqlContext, permissions: Record<string, string[]>): Promise<boolean> {
  try {
    const result = await auth.api.hasPermission({
      headers: ctx.req.headers as Record<string, string>,
      body: { permissions },
    });
    return result.success;
  } catch {
    return false;
  }
}

export const userPermissions: NonNullable<QueryResolvers['userPermissions']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  // Run all permission checks in parallel — auth.api.hasPermission is in-process,
  // so there is no HTTP overhead per call.
  const [
    canManageInventory,
    canManageLots,
    canViewTransactionLog,
    canAccessSettings,
    canManageStoreLocations,
    canManageUsers,
    canUsePOS,
    canManageEvents,
  ] = await Promise.all([
    checkPerm(ctx, { inventory: ['read'] }),
    checkPerm(ctx, { lot: ['read'] }),
    checkPerm(ctx, { transactionLog: ['read'] }),
    checkPerm(ctx, { companySettings: ['read'] }),
    checkPerm(ctx, { storeLocations: ['read'] }),
    checkPerm(ctx, { userManagement: ['read'] }),
    checkPerm(ctx, { order: ['create'] }),
    checkPerm(ctx, { event: ['read'] }),
  ]);

  // Dashboard is visible to anyone who can view the transaction log (manager+)
  const canViewDashboard = canViewTransactionLog;

  return {
    canManageInventory,
    canManageLots,
    canViewDashboard,
    canAccessSettings,
    canManageStoreLocations,
    canManageUsers,
    canViewTransactionLog,
    canUsePOS,
    canManageEvents,
  };
};
