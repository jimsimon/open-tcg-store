import type { MutationResolvers } from './../../../types.generated';
import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { updateJobSchedule } from '../../../../services/cron-service';
import { formatCronJob } from '../format';

export const updateCronJobSchedule: NonNullable<MutationResolvers['updateCronJobSchedule']> = async (
  _parent,
  arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  const job = await updateJobSchedule(arg.id, arg.cronExpression);
  return formatCronJob(job);
};
