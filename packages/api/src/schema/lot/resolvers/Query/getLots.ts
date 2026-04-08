import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getLots as getLotsService } from '../../../../services/lot-service';
import type { QueryResolvers } from './../../../types.generated';

export const getLots: NonNullable<QueryResolvers['getLots']> = async (_parent, args, ctx: GraphqlContext) => {
  await assertPermission(ctx, { lot: ['read'] });
  const organizationId = getOrganizationId(ctx);
  return await getLotsService(organizationId, args.filters, args.pagination);
};
