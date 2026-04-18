import type { GraphqlContext } from '../../../../server';
import { assertAuthenticated } from '../../../../lib/assert-permission';
import { getPublicEvent as getPublicEventService } from '../../../../services/event-service';
import type { QueryResolvers } from './../../../types.generated';

export const getPublicEvent: NonNullable<QueryResolvers['getPublicEvent']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  assertAuthenticated(ctx);
  return await getPublicEventService(args.id);
};
