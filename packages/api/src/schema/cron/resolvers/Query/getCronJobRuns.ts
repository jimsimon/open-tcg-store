import type { QueryResolvers } from './../../../types.generated';
import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { getJobRuns } from '../../../../services/cron-service';
import { formatCronJobRun } from '../format';

export const getCronJobRuns: NonNullable<QueryResolvers['getCronJobRuns']> = async (
  _parent,
  arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  const result = await getJobRuns(arg.cronJobId, arg.pagination);
  return {
    ...result,
    items: result.items.map(formatCronJobRun),
  };
};
