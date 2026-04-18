import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getEvents as getEventsService } from '../../../../services/event-service';
import type { QueryResolvers } from './../../../types.generated';

export const getEvents: NonNullable<QueryResolvers['getEvents']> = async (_parent, args, ctx: GraphqlContext) => {
  await assertPermission(ctx, { event: ['read'] });
  const organizationId = getOrganizationId(ctx);
  return await getEventsService(organizationId, args.filters, args.pagination);
};
