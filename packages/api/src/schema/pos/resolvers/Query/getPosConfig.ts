import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { getPosConfig as getPosConfigService } from '../../../../services/pos-service';
import type { QueryResolvers } from './../../../types.generated';

export const getPosConfig: NonNullable<QueryResolvers['getPosConfig']> = async (_parent, args, ctx: GraphqlContext) => {
  await assertPermission(ctx, { order: ['create'] });
  return await getPosConfigService(args.stateCode ?? undefined);
};
