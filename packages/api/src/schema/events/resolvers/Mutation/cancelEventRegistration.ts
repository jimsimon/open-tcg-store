import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { cancelRegistration } from '../../../../services/event-service';
import type { MutationResolvers } from './../../../types.generated';

export const cancelEventRegistration: NonNullable<MutationResolvers['cancelEventRegistration']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { event: ['cancel'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await cancelRegistration(args.registrationId, organizationId, userId);
};
