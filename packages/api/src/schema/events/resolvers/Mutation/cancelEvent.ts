import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { cancelEvent as cancelEventService } from '../../../../services/event-service';
import type { MutationResolvers } from './../../../types.generated';

export const cancelEvent: NonNullable<MutationResolvers['cancelEvent']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { event: ['cancel'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await cancelEventService(args.id, organizationId, userId);
};
