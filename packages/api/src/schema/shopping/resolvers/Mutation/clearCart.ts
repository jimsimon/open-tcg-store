import { getOrganizationId } from '../../../../lib/assert-permission';
import { clearAllCartItems } from '../../../../services/shopping-cart-service';
import type { MutationResolvers } from './../../../types.generated';

export const clearCart: NonNullable<MutationResolvers['clearCart']> = async (_parent, _arg, ctx) => {
  const organizationId = getOrganizationId(ctx);
  return await clearAllCartItems(organizationId, ctx.auth.user.id);
};
