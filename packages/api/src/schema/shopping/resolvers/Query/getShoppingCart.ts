import { GraphqlContext } from '../../../../server';
import { getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import {
  getOrCreateShoppingCart as getOrCreateCart,
  mapToGraphqlShoppingCart,
} from '../../../../services/shopping-cart-service';
import type { QueryResolvers } from './../../../types.generated';

export const getShoppingCart: NonNullable<QueryResolvers['getShoppingCart']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  const result = await getOrCreateCart(organizationId, userId);
  return await mapToGraphqlShoppingCart(result);
};
