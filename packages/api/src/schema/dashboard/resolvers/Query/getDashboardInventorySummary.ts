import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getInventorySummary } from '../../../../services/dashboard-service';
import type { QueryResolvers } from './../../../types.generated';

export const getDashboardInventorySummary: NonNullable<QueryResolvers['getDashboardInventorySummary']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['read'] });
  const organizationId = _arg.organizationId || getOrganizationId(ctx);
  return getInventorySummary(organizationId);
};
