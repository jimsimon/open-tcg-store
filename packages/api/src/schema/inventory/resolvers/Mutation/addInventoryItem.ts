import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { addInventoryItem as addInventoryItemService } from '../../../../services/inventory-service';
import type { MutationResolvers } from './../../../types.generated';

export const addInventoryItem: NonNullable<MutationResolvers['addInventoryItem']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['create'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await addInventoryItemService(organizationId, args.input, userId);
};
