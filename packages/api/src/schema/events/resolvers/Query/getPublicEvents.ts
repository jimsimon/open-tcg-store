import type { GraphqlContext } from '../../../../server';
import { assertAuthenticated } from '../../../../lib/assert-permission';
import { getPublicEvents as getPublicEventsService } from '../../../../services/event-service';
import type { QueryResolvers } from './../../../types.generated';

export const getPublicEvents: NonNullable<QueryResolvers['getPublicEvents']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  assertAuthenticated(ctx);
  return await getPublicEventsService(args.organizationId, args.dateFrom, args.dateTo);
};
