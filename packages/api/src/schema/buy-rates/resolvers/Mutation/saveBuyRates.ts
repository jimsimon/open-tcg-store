import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { saveBuyRates as saveBuyRatesService } from '../../../../services/buy-rate-service';
import type { MutationResolvers } from './../../../types.generated';

export const saveBuyRates: NonNullable<MutationResolvers['saveBuyRates']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  const orgId = getOrganizationId(ctx);
  return await saveBuyRatesService(orgId, args.input.categoryId, args.input.entries);
};
