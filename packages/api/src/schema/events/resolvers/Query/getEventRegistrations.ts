import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getEventRegistrations as getEventRegistrationsService } from '../../../../services/event-service';
import type { QueryResolvers } from './../../../types.generated';

export const getEventRegistrations: NonNullable<QueryResolvers['getEventRegistrations']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { event: ['read'] });
  const organizationId = getOrganizationId(ctx);
  return await getEventRegistrationsService(args.eventId, organizationId);
};
