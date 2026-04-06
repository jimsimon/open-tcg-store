import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { deleteBuyRates as deleteBuyRatesService } from '../../../../services/buy-rate-service';
import type { MutationResolvers } from './../../../types.generated';

export const deleteBuyRates: NonNullable<MutationResolvers['deleteBuyRates']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { storeSettings: ['update'] });
  const orgId = getOrganizationId(ctx);
  return await deleteBuyRatesService(orgId, args.categoryId);
};
