import { GraphqlContext } from '../../../../server';
import { getOrganizationId } from '../../../../lib/assert-permission';
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
  const result = await getOrCreateCart(organizationId, ctx.auth.user.id);
  return await mapToGraphqlShoppingCart(result);
};
