import { getOrganizationIdOptional } from '../../../../lib/assert-permission';
import { getProductListings as getProductListingsService } from '../../../../services/card-service';
import type { GraphqlContext } from '../../../../server';
import type { QueryResolvers } from '../../../types.generated';

export const getProductListings: NonNullable<QueryResolvers['getProductListings']> = async (
  _parent,
  { filters, pagination },
  ctx: GraphqlContext,
) => {
  const organizationId = getOrganizationIdOptional(ctx);
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  return await getProductListingsService(filters, { page, pageSize }, organizationId);
};
