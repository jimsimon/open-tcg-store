import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { getLot as getLotService } from '../../../../services/lot-service';
import type { QueryResolvers } from './../../../types.generated';

export const getLot: NonNullable<QueryResolvers['getLot']> = async (_parent, args, ctx: GraphqlContext) => {
  await assertPermission(ctx, { lot: ['read'] });
  return await getLotService(args.id);
};
