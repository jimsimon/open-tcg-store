import type { MutationResolvers } from './../../../types.generated';
import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { enableJob } from '../../../../services/cron-service';
import { formatCronJob } from '../format';

export const enableCronJob: NonNullable<MutationResolvers['enableCronJob']> = async (
  _parent,
  arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  const job = await enableJob(arg.id);
  return formatCronJob(job);
};
