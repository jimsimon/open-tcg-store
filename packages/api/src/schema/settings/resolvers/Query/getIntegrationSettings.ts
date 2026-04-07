import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { getIntegrationSettings as getIntegrationSettingsService } from '../../../../services/settings-service';
import type { QueryResolvers } from './../../../types.generated';

export const getIntegrationSettings: NonNullable<QueryResolvers['getIntegrationSettings']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['read'] });
  return await getIntegrationSettingsService();
};
