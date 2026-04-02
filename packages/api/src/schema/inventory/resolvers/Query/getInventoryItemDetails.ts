import type { GraphqlContext } from '../../../../server';
import { getInventoryItemDetails as getInventoryItemDetailsService } from '../../../../services/inventory-service';
import type { QueryResolvers } from './../../../types.generated';

function assertInventoryAccess(ctx: GraphqlContext) {
  const role = ctx.auth?.user?.role;
  if (role !== 'admin' && role !== 'employee') {
    throw new Error('Unauthorized: Inventory access requires admin or employee role');
  }
}

export const getInventoryItemDetails: NonNullable<QueryResolvers['getInventoryItemDetails']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  assertInventoryAccess(ctx);
  return await getInventoryItemDetailsService(args.productId, args.condition, args.pagination);
};
