import { getOrganizationIdOptional } from '../../../../lib/assert-permission';
import { resolveCategoryId, getCardById } from '../../../../services/card-service';
import type { GraphqlContext } from '../../../../server';
import type { QueryResolvers } from '../../../types.generated';

export const getCard: NonNullable<QueryResolvers['getCard']> = async (
  _parent,
  { game, cardId },
  ctx: GraphqlContext,
) => {
  if (cardId === null) {
    throw new Error(`Invalid card id: ${cardId}`);
  }
  const organizationId = getOrganizationIdOptional(ctx);
  const categoryId = await resolveCategoryId(game);
  return await getCardById(Number.parseInt(cardId, 10), categoryId, organizationId);
};
