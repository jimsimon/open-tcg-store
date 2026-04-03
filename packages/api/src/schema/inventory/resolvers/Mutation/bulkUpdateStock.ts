import type { GraphqlContext } from '../../../../server';
import { assertPermission, getUserId } from '../../../../lib/assert-permission';
import { bulkUpdateStock as bulkUpdateStockService } from '../../../../services/inventory-service';
import type { MutationResolvers } from './../../../types.generated';

export const bulkUpdateStock: NonNullable<MutationResolvers['bulkUpdateStock']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['update'] });
  const userId = getUserId(ctx);
  return await bulkUpdateStockService(args.input, userId);
};
