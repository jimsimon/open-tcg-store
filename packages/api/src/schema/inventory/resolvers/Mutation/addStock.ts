import type { GraphqlContext } from '../../../../server';
import { assertPermission, getUserId } from '../../../../lib/assert-permission';
import { addStock as addStockService } from '../../../../services/inventory-service';
import type { MutationResolvers } from './../../../types.generated';

export const addStock: NonNullable<MutationResolvers['addStock']> = async (_parent, args, ctx: GraphqlContext) => {
  await assertPermission(ctx, { inventory: ['create'] });
  const userId = getUserId(ctx);
  return await addStockService(args.input, userId);
};
