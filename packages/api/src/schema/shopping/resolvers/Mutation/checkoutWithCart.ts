import { getOrganizationId } from '../../../../lib/assert-permission';
import { getOrCreateShoppingCart, mapToGraphqlShoppingCart } from '../../../../services/shopping-cart-service';
import type { MutationResolvers } from './../../../types.generated';

export const checkoutWithCart: NonNullable<MutationResolvers['checkoutWithCart']> = async (_parent, _arg, ctx) => {
  const organizationId = getOrganizationId(ctx);
  const cart = await getOrCreateShoppingCart(organizationId, ctx.auth.user.id);
  /* TODO: Implement checkout logic */
  return await mapToGraphqlShoppingCart(cart);
};
