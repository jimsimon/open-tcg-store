import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { updateInventoryItem as updateInventoryItemService } from '../../../../services/inventory-service';
import type { MutationResolvers } from './../../../types.generated';

export const updateInventoryItem: NonNullable<MutationResolvers['updateInventoryItem']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['update'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await updateInventoryItemService(args.input, userId, organizationId);
};
