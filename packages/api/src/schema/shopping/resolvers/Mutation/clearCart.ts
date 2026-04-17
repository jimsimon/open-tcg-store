import { getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { clearAllCartItems } from '../../../../services/shopping-cart-service';
import type { MutationResolvers } from './../../../types.generated';

export const clearCart: NonNullable<MutationResolvers['clearCart']> = async (_parent, _arg, ctx) => {
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await clearAllCartItems(organizationId, userId);
};
