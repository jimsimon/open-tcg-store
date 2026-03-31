import type { GraphqlContext } from '../../../../server';
import { deleteInventoryItem as deleteInventoryItemService } from '../../../../services/inventory-service';
import type { MutationResolvers } from './../../../types.generated';

function assertInventoryAccess(ctx: GraphqlContext) {
  const role = ctx.auth?.user?.role;
  if (role !== 'admin' && role !== 'employee') {
    throw new Error('Unauthorized: Inventory access requires admin or employee role');
  }
}

export const deleteInventoryItem: NonNullable<MutationResolvers['deleteInventoryItem']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  assertInventoryAccess(ctx);
  return await deleteInventoryItemService(args.id);
};
