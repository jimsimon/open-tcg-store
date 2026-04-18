import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { updateEvent as updateEventService } from '../../../../services/event-service';
import type { MutationResolvers } from './../../../types.generated';

export const updateEvent: NonNullable<MutationResolvers['updateEvent']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { event: ['update'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await updateEventService(args.id, organizationId, args.input, userId);
};
