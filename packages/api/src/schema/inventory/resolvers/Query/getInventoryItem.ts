import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { getInventoryItemById } from '../../../../services/inventory-service';
import type { QueryResolvers } from './../../../types.generated';

export const getInventoryItem: NonNullable<QueryResolvers['getInventoryItem']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['read'] });
  return await getInventoryItemById(args.id);
};
