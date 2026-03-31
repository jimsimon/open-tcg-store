import { getOrders as getOrdersService } from '../../../../services/order-service';
import type { QueryResolvers } from './../../../types.generated';

export const getOrders: NonNullable<QueryResolvers['getOrders']> = async (_parent, _arg, _ctx) => {
  const pagination = _arg.pagination
    ? {
        page: _arg.pagination.page ?? undefined,
        pageSize: _arg.pagination.pageSize ?? undefined,
      }
    : null;
  const filters = _arg.filters
    ? {
        status: _arg.filters.status ?? undefined,
        searchTerm: _arg.filters.searchTerm ?? undefined,
      }
    : null;
  return getOrdersService(pagination, filters);
};
