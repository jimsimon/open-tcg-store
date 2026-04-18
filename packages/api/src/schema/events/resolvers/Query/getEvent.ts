import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getEvent as getEventService } from '../../../../services/event-service';
import type { QueryResolvers } from './../../../types.generated';

export const getEvent: NonNullable<QueryResolvers['getEvent']> = async (_parent, args, ctx: GraphqlContext) => {
  await assertPermission(ctx, { event: ['read'] });
  const organizationId = getOrganizationId(ctx);
  return await getEventService(args.id, organizationId);
};
