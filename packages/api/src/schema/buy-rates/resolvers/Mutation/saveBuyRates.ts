import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { saveBuyRates as saveBuyRatesService } from '../../../../services/buy-rate-service';
import type { MutationResolvers } from './../../../types.generated';

export const saveBuyRates: NonNullable<MutationResolvers['saveBuyRates']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  const entries = args.input.entries.map((e) => ({
    ...e,
    hidden: e.hidden ?? undefined,
  }));
  return await saveBuyRatesService(args.input.categoryId, entries);
};
