import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { deleteStock as deleteStockService } from '../../../../services/inventory-service';
import type { MutationResolvers } from './../../../types.generated';

export const deleteStock: NonNullable<MutationResolvers['deleteStock']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['delete'] });
  return await deleteStockService(args.id);
};
