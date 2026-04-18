import type { MutationResolvers } from './../../../types.generated';
import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { disableJob } from '../../../../services/cron-service';
import { formatCronJob } from '../format';

export const disableCronJob: NonNullable<MutationResolvers['disableCronJob']> = async (
  _parent,
  arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  const job = await disableJob(arg.id);
  return formatCronJob(job);
};
