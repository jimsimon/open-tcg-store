import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getSalesBreakdown } from '../../../../services/dashboard-service';
import type { QueryResolvers } from './../../../types.generated';

export const getDashboardSales: NonNullable<QueryResolvers['getDashboardSales']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { order: ['read'] });
  // Always use the session's organization — never trust client-supplied organizationId
  const organizationId = getOrganizationId(ctx);
  return getSalesBreakdown(organizationId, _arg.dateRange.startDate, _arg.dateRange.endDate);
};
