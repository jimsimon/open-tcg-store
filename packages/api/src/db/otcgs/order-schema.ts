import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, foreignKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './auth-schema';
import { inventoryItemStock } from './inventory-stock-schema';

export const order = sqliteTable(
  'order',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    organizationId: text('organization_id').notNull(),
    orderNumber: text('order_number').notNull(),
    customerName: text('customer_name').notNull(),
    userId: text('user_id').notNull(),
    status: text('status').notNull().default('open'),
    totalAmount: real('total_amount').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('order_org_number_idx').on(table.organizationId, table.orderNumber),
    index('order_org_id_idx').on(table.organizationId),
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
    inventoryItemStockId: integer('inventory_item_stock_id'),
    productId: integer('product_id').notNull(),
    productName: text('product_name').notNull(),
    condition: text('condition').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: real('unit_price').notNull(),
    costBasis: real('cost_basis'),
    lotId: integer('lot_id'),
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
    index('order_item_stock_id_idx').on(table.inventoryItemStockId),
    foreignKey({
      columns: [table.inventoryItemStockId],
      foreignColumns: [inventoryItemStock.id],
      name: 'order_item_stock_id_fkey',
    }),
  ],
);
