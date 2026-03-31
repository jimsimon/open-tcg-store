import type { GraphqlContext } from '../../../../server';
import { getStoreSettings as getStoreSettingsService } from '../../../../services/settings-service';
import type { QueryResolvers } from './../../../types.generated';

function assertAdminAccess(ctx: GraphqlContext) {
  const role = ctx.auth?.user?.role;
  if (role !== 'admin') {
    throw new Error('Unauthorized: Settings access requires admin role');
  }
}

export const getStoreSettings: NonNullable<QueryResolvers['getStoreSettings']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  assertAdminAccess(ctx);
  return await getStoreSettingsService();
};
