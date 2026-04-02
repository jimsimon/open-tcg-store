import type { GraphqlContext } from '../../../../server';
import { assertPermission, getUserId } from '../../../../lib/assert-permission';
import { bulkUpdateInventoryItems } from '../../../../services/inventory-service';
import type { MutationResolvers } from './../../../types.generated';

export const bulkUpdateInventory: NonNullable<MutationResolvers['bulkUpdateInventory']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['update'] });
  const userId = getUserId(ctx);
  return await bulkUpdateInventoryItems(args.input, userId);
};
