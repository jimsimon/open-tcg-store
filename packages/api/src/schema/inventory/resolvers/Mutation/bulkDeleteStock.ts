import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { bulkDeleteStock as bulkDeleteStockService } from '../../../../services/inventory-service';
import type { MutationResolvers } from './../../../types.generated';

export const bulkDeleteStock: NonNullable<MutationResolvers['bulkDeleteStock']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['delete'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await bulkDeleteStockService(args.input.ids, organizationId, userId);
};
