import { relations } from 'drizzle-orm/relations';
import { transactionLog } from './transaction-log-schema';
import { user } from './auth-schema';

export const transactionLogRelations = relations(transactionLog, ({ one }) => ({
  user: one(user, {
    fields: [transactionLog.userId],
    references: [user.id],
    relationName: 'transactionLogUser',
  }),
}));
