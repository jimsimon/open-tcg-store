import type { MutationResolvers } from './../../../types.generated';
import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { updateJobConfig } from '../../../../services/cron-service';
import { formatCronJob } from '../format';

export const updateCronJobConfig: NonNullable<MutationResolvers['updateCronJobConfig']> = async (
  _parent,
  arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  const job = await updateJobConfig(arg.id, arg.config);
  return formatCronJob(job);
};
