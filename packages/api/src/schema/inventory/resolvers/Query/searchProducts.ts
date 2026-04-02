import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { searchProducts as searchProductsService } from '../../../../services/inventory-service';
import type { QueryResolvers } from './../../../types.generated';

export const searchProducts: NonNullable<QueryResolvers['searchProducts']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['read'] });
  return await searchProductsService(args.searchTerm, args.game);
};
