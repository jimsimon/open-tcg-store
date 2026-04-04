import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getTransactionLogs as getTransactionLogsService } from '../../../../services/transaction-log-service';
import type { QueryResolvers } from './../../../types.generated';

export const getTransactionLogs: NonNullable<QueryResolvers['getTransactionLogs']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { transactionLog: ['read'] });
  const organizationId = getOrganizationId(ctx);
  const pagination = _arg.pagination
    ? {
        page: _arg.pagination.page ?? undefined,
        pageSize: _arg.pagination.pageSize ?? undefined,
      }
    : null;
  const filters = _arg.filters
    ? {
        month: _arg.filters.month ?? undefined,
        year: _arg.filters.year ?? undefined,
        searchTerm: _arg.filters.searchTerm ?? undefined,
        action: _arg.filters.action ?? undefined,
        resourceType: _arg.filters.resourceType ?? undefined,
      }
    : null;
  return getTransactionLogsService(organizationId, filters, pagination);
};
