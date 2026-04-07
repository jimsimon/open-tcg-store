import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getBuyRates as getBuyRatesService } from '../../../../services/buy-rate-service';
import type { QueryResolvers } from './../../../types.generated';

export const getBuyRates: NonNullable<QueryResolvers['getBuyRates']> = async (_parent, args, ctx: GraphqlContext) => {
  await assertPermission(ctx, { companySettings: ['read'] });
  const orgId = getOrganizationId(ctx);
  return await getBuyRatesService(orgId, args.categoryId);
};
