import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getOpenOrders } from '../../../../services/dashboard-service';
import type { QueryResolvers } from './../../../types.generated';

export const getDashboardOpenOrders: NonNullable<QueryResolvers['getDashboardOpenOrders']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { order: ['read'] });
  // Always use the session's organization — never trust client-supplied organizationId
  const organizationId = getOrganizationId(ctx);
  return getOpenOrders(organizationId, _arg.limit ?? 10);
};
