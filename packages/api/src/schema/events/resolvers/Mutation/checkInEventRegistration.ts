import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { checkInRegistration } from '../../../../services/event-service';
import type { MutationResolvers } from './../../../types.generated';

export const checkInEventRegistration: NonNullable<MutationResolvers['checkInEventRegistration']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { event: ['update'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await checkInRegistration(args.registrationId, organizationId, userId);
};
