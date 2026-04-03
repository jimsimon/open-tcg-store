import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { bulkDeleteStock as bulkDeleteStockService } from '../../../../services/inventory-service';
import type { MutationResolvers } from './../../../types.generated';

export const bulkDeleteStock: NonNullable<MutationResolvers['bulkDeleteStock']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['delete'] });
  return await bulkDeleteStockService(args.input.ids);
};
