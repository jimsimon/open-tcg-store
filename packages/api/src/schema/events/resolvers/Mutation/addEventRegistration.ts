import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { addRegistration } from '../../../../services/event-service';
import type { MutationResolvers } from './../../../types.generated';

export const addEventRegistration: NonNullable<MutationResolvers['addEventRegistration']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { event: ['update'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await addRegistration(args.eventId, organizationId, args.input, userId);
};
