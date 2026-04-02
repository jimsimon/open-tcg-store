import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { deleteInventoryItem as deleteInventoryItemService } from '../../../../services/inventory-service';
import type { MutationResolvers } from './../../../types.generated';

export const deleteInventoryItem: NonNullable<MutationResolvers['deleteInventoryItem']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['delete'] });
  return await deleteInventoryItemService(args.id);
};
