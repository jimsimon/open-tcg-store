import type { GraphqlContext } from '../../../../server';
import { getOrganizationIdOptional } from '../../../../lib/assert-permission';
import { getPublicBuyRates as getPublicBuyRatesService } from '../../../../services/buy-rate-service';
import type { QueryResolvers } from './../../../types.generated';

export const getPublicBuyRates: NonNullable<QueryResolvers['getPublicBuyRates']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  // Use explicit organizationId if provided, otherwise try to get from session
  const orgId = args.organizationId ?? getOrganizationIdOptional(ctx);
  if (!orgId) {
    return { games: [] };
  }
  return await getPublicBuyRatesService(orgId);
};
