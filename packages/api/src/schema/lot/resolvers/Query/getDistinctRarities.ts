import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { getDistinctRarities as getDistinctRaritiesService } from '../../../../services/lot-service';
import type { QueryResolvers } from './../../../types.generated';

export const getDistinctRarities: NonNullable<QueryResolvers['getDistinctRarities']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { lot: ['read'] });
  return await getDistinctRaritiesService(args.categoryId);
};
