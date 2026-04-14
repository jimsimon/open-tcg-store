import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getBestSellers } from '../../../../services/dashboard-service';
import type { QueryResolvers } from './../../../types.generated';

export const getDashboardBestSellers: NonNullable<QueryResolvers['getDashboardBestSellers']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { order: ['read'] });
  // Always use the session's organization — never trust client-supplied organizationId
  const organizationId = getOrganizationId(ctx);
  return getBestSellers(
    organizationId,
    _arg.dateRange.startDate,
    _arg.dateRange.endDate,
    _arg.sortBy,
    _arg.limit ?? 10,
  );
};
