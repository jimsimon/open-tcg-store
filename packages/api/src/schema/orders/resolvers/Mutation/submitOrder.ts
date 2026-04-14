import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { submitOrder as submitOrderService } from '../../../../services/order-service';
import type { MutationResolvers } from './../../../types.generated';

export const submitOrder: NonNullable<MutationResolvers['submitOrder']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { order: ['create'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  const result = await submitOrderService(organizationId, userId, _arg.input.customerName);
  return result;
};
