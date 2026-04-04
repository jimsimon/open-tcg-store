import { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { cancelOrder as cancelOrderService } from '../../../../services/order-service';
import type { MutationResolvers } from './../../../types.generated';

export const cancelOrder: NonNullable<MutationResolvers['cancelOrder']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { order: ['cancel'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return cancelOrderService(_arg.orderId, organizationId, userId);
};
