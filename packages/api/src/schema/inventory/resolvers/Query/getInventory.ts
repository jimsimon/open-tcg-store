import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getInventoryItems } from '../../../../services/inventory-service';
import type { QueryResolvers } from './../../../types.generated';

export const getInventory: NonNullable<QueryResolvers['getInventory']> = async (_parent, args, ctx: GraphqlContext) => {
  await assertPermission(ctx, { inventory: ['read'] });
  const organizationId = getOrganizationId(ctx);
  return await getInventoryItems(organizationId, args.filters, args.pagination);
};
