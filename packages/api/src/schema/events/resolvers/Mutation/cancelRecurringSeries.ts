import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { cancelRecurringSeries as cancelRecurringSeriesService } from '../../../../services/event-service';
import type { MutationResolvers } from './../../../types.generated';

export const cancelRecurringSeries: NonNullable<MutationResolvers['cancelRecurringSeries']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { event: ['cancel'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await cancelRecurringSeriesService(args.recurrenceGroupId, organizationId, userId);
};
