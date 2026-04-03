import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getInventoryItemDetails as getInventoryItemDetailsService } from '../../../../services/inventory-service';
import type { QueryResolvers } from './../../../types.generated';

export const getInventoryItemDetails: NonNullable<QueryResolvers['getInventoryItemDetails']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['read'] });
  const organizationId = getOrganizationId(ctx);
  return await getInventoryItemDetailsService(organizationId, args.inventoryItemId, args.pagination);
};
