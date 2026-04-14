import { getOrganizationIdOptional } from '../../../../lib/assert-permission';
import {
  resolveCategoryId,
  getSingleCardInventory as getSingleCardInventoryService,
} from '../../../../services/card-service';
import type { GraphqlContext } from '../../../../server';
import type { QueryResolvers } from '../../../types.generated';

export const getSingleCardInventory: NonNullable<QueryResolvers['getSingleCardInventory']> = async (
  _parent,
  { game, filters },
  ctx: GraphqlContext,
) => {
  const organizationId = getOrganizationIdOptional(ctx);
  const categoryId = await resolveCategoryId(game);
  return await getSingleCardInventoryService(categoryId, filters, organizationId);
};
