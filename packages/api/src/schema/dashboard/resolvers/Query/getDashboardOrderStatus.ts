import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getOrderStatusBreakdown } from '../../../../services/dashboard-service';
import type { QueryResolvers } from './../../../types.generated';

export const getDashboardOrderStatus: NonNullable<QueryResolvers['getDashboardOrderStatus']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { order: ['read'] });
  // Always use the session's organization — never trust client-supplied organizationId
  const organizationId = getOrganizationId(ctx);
  return getOrderStatusBreakdown(organizationId, _arg.dateRange.startDate, _arg.dateRange.endDate);
};
