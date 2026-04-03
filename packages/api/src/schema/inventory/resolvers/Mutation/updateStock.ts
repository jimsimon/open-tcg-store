import type { GraphqlContext } from '../../../../server';
import { assertPermission, getUserId } from '../../../../lib/assert-permission';
import { updateStock as updateStockService } from '../../../../services/inventory-service';
import type { MutationResolvers } from './../../../types.generated';

export const updateStock: NonNullable<MutationResolvers['updateStock']> = async (_parent, args, ctx: GraphqlContext) => {
  await assertPermission(ctx, { inventory: ['update'] });
  const userId = getUserId(ctx);
  return await updateStockService(args.input, userId);
};
