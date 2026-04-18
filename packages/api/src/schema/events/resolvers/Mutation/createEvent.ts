import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { createEvent as createEventService } from '../../../../services/event-service';
import type { MutationResolvers } from './../../../types.generated';

export const createEvent: NonNullable<MutationResolvers['createEvent']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { event: ['create'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await createEventService(organizationId, args.input, userId);
};
