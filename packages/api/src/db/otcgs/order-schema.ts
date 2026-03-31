import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, foreignKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './auth-schema';

export const order = sqliteTable(
  'order',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderNumber: text('order_number').notNull(),
    customerName: text('customer_name').notNull(),
    userId: text('user_id').notNull(),
    status: text('status').notNull().default('open'),
    totalAmount: real('total_amount').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('order_number_idx').on(table.orderNumber),
    index('order_user_id_idx').on(table.userId),
    index('order_created_at_idx').on(table.createdAt),
    index('order_status_idx').on(table.status),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'order_user_id_fkey',
    }),
  ],
);

export const orderItem = sqliteTable(
  'order_item',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: integer('order_id').notNull(),
    inventoryItemId: integer('inventory_item_id'),
    productId: integer('product_id').notNull(),
    productName: text('product_name').notNull(),
    condition: text('condition').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: real('unit_price').notNull(),
    costBasis: real('cost_basis'),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [order.id],
      name: 'order_item_order_id_fkey',
    }),
    index('order_item_order_id_idx').on(table.orderId),
    index('order_item_product_id_idx').on(table.productId),
    index('order_item_inventory_item_id_idx').on(table.inventoryItemId),
  ],
);
