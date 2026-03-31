import type { GraphqlContext } from '../../../../server';
import { getIntegrationSettings as getIntegrationSettingsService } from '../../../../services/settings-service';
import type { QueryResolvers } from './../../../types.generated';

function assertAdminAccess(ctx: GraphqlContext) {
  const role = ctx.auth?.user?.role;
  if (role !== 'admin') {
    throw new Error('Unauthorized: Settings access requires admin role');
  }
}

export const getIntegrationSettings: NonNullable<QueryResolvers['getIntegrationSettings']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  assertAdminAccess(ctx);
  return await getIntegrationSettingsService();
};
