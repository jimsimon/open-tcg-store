import type { MutationResolvers } from './../../../types.generated';
import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { executeJob } from '../../../../services/cron-service';
import { formatCronJobRun } from '../format';

export const triggerCronJob: NonNullable<MutationResolvers['triggerCronJob']> = async (
  _parent,
  arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  const run = await executeJob(arg.id);
  return formatCronJobRun(run);
};
