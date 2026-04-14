import { getOrganizationIdOptional } from '../../../../lib/assert-permission';
import { getProductById } from '../../../../services/card-service';
import type { GraphqlContext } from '../../../../server';
import type { QueryResolvers } from '../../../types.generated';

export const getProduct: NonNullable<QueryResolvers['getProduct']> = async (
  _parent,
  { productId },
  ctx: GraphqlContext,
) => {
  const id = Number.parseInt(productId, 10);
  if (Number.isNaN(id)) {
    throw new Error(`Invalid product id: ${productId}`);
  }
  const organizationId = getOrganizationIdOptional(ctx);
  return await getProductById(id, organizationId);
};
