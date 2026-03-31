import type { GraphqlContext } from '../../../../server';
import { getInventoryItems } from '../../../../services/inventory-service';
import type { QueryResolvers } from './../../../types.generated';

function assertInventoryAccess(ctx: GraphqlContext) {
  const role = ctx.auth?.user?.role;
  if (role !== 'admin' && role !== 'employee') {
    throw new Error('Unauthorized: Inventory access requires admin or employee role');
  }
}

export const getInventory: NonNullable<QueryResolvers['getInventory']> = async (_parent, args, ctx: GraphqlContext) => {
  assertInventoryAccess(ctx);
  return await getInventoryItems(args.filters, args.pagination);
};
