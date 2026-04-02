import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { bulkDeleteInventoryItems } from '../../../../services/inventory-service';
import type { MutationResolvers } from './../../../types.generated';

export const bulkDeleteInventory: NonNullable<MutationResolvers['bulkDeleteInventory']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['delete'] });
  return await bulkDeleteInventoryItems(args.input.ids);
};
