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
  // Always use the session's organization — never trust client-supplied organizationId
  const organizationId = getOrganizationId(ctx);
  return getInventorySummary(organizationId);
};
