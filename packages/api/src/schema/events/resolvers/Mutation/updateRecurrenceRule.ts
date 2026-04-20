import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { updateRecurrenceRule as updateRecurrenceRuleService } from '../../../../services/event-service';
import type { MutationResolvers } from './../../../types.generated';

export const updateRecurrenceRule: NonNullable<MutationResolvers['updateRecurrenceRule']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { event: ['update'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await updateRecurrenceRuleService(args.recurrenceGroupId, organizationId, args.frequency, userId);
};
