import { GraphqlContext } from '../../../../server';
import { getOrganizationId } from '../../../../lib/assert-permission';
import { submitOrder as submitOrderService } from '../../../../services/order-service';
import type { MutationResolvers } from './../../../types.generated';

export const submitOrder: NonNullable<MutationResolvers['submitOrder']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  const organizationId = getOrganizationId(ctx);
  const result = await submitOrderService(organizationId, ctx.auth.user.id, _arg.input.customerName);
  return result;
};
