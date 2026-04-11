import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getLotStats as getLotStatsService } from '../../../../services/lot-service';
import type { QueryResolvers } from './../../../types.generated';

export const getLotStats: NonNullable<QueryResolvers['getLotStats']> = async (_parent, _args, ctx: GraphqlContext) => {
  await assertPermission(ctx, { lot: ['read'] });
  const organizationId = getOrganizationId(ctx);
  return await getLotStatsService(organizationId);
};
