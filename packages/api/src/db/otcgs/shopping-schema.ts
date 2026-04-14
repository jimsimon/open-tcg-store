import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, foreignKey, index, unique } from 'drizzle-orm/sqlite-core';
import { user } from './auth-schema';
import { inventoryItem } from './inventory-schema';

export const cartItem = sqliteTable(
  'cartItem',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cartId: integer('cart_id').notNull(),
    inventoryItemId: integer('inventory_item_id').notNull(),
    quantity: integer('quantity').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.cartId],
      foreignColumns: [cart.id],
      name: 'cart_item_cart_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.inventoryItemId],
      foreignColumns: [inventoryItem.id],
      name: 'cart_item_inventory_item_id_fkey',
    }),
    unique('cart_item_inventory_item_uniq').on(table.cartId, table.inventoryItemId),
    index('cart_item_id_idx').on(table.id),
    index('cart_item_inventory_item_id_idx').on(table.inventoryItemId),
  ],
);

export const cart = sqliteTable(
  'cart',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    organizationId: text('organization_id').notNull(),
    userId: text('user_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    lastUpdatedAt: integer('last_updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'cart_user_id_fkey',
    }).onDelete('cascade'),
    unique('cart_user_org_uniq').on(table.userId, table.organizationId),
    index('cart_id_idx').on(table.id),
    index('cart_org_id_idx').on(table.organizationId),
    index('cart_user_id_idx').on(table.userId),
    index('cart_created_at_idx').on(table.createdAt),
    index('cart_last_updated_at_idx').on(table.lastUpdatedAt),
  ],
);
