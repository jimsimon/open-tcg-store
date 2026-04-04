import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, foreignKey, index } from 'drizzle-orm/sqlite-core';
import { user } from './auth-schema';

export const transactionLog = sqliteTable(
  'transaction_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    organizationId: text('organization_id').notNull(),
    userId: text('user_id').notNull(),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id'),
    details: text('details').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index('txn_log_org_id_idx').on(table.organizationId),
    index('txn_log_created_at_idx').on(table.createdAt),
    index('txn_log_action_idx').on(table.action),
    index('txn_log_resource_type_idx').on(table.resourceType),
    index('txn_log_user_id_idx').on(table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'txn_log_user_id_fkey',
    }),
  ],
);
