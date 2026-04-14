import { isSetupPending as isSetupPendingService } from '../../../../services/setup-service';
import type { QueryResolvers } from '../../../types.generated';

export const isSetupPending: NonNullable<QueryResolvers['isSetupPending']> = async (_parent, _arg, _ctx) => {
  return await isSetupPendingService();
};
