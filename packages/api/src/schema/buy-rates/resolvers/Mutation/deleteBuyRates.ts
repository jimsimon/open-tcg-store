import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { deleteBuyRates as deleteBuyRatesService } from '../../../../services/buy-rate-service';
import type { MutationResolvers } from './../../../types.generated';

export const deleteBuyRates: NonNullable<MutationResolvers['deleteBuyRates']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  return await deleteBuyRatesService(args.categoryId);
};
