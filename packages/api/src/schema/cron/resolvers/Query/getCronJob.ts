import type { QueryResolvers } from './../../../types.generated';
import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { getJob } from '../../../../services/cron-service';
import { formatCronJob } from '../format';

export const getCronJob: NonNullable<QueryResolvers['getCronJob']> = async (_parent, arg, ctx: GraphqlContext) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  const job = await getJob(arg.id);
  if (!job) return null;
  return formatCronJob(job);
};
