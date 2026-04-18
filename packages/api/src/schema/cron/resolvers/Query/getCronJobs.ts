import type { QueryResolvers } from './../../../types.generated';
import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { getJobs } from '../../../../services/cron-service';
import { formatCronJob } from '../format';

export const getCronJobs: NonNullable<QueryResolvers['getCronJobs']> = async (_parent, _arg, ctx: GraphqlContext) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  const jobs = await getJobs();
  return jobs.map(formatCronJob);
};
