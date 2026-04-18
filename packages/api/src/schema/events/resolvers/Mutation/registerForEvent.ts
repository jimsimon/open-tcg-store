import type { GraphqlContext } from '../../../../server';
import { assertAuthenticated } from '../../../../lib/assert-permission';
import { registerForEvent as registerForEventService } from '../../../../services/event-service';
import type { MutationResolvers } from './../../../types.generated';

export const registerForEvent: NonNullable<MutationResolvers['registerForEvent']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  assertAuthenticated(ctx);
  return await registerForEventService(args.eventId, args.input);
};
