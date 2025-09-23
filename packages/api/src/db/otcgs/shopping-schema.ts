import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, foreignKey, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export const cartItem = sqliteTable(
  "cartItem",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cartId: integer("cart_id").notNull(),
    productId: integer("product_id").notNull().unique(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.cartId],
      foreignColumns: [cart.id],
      name: "cart_item_cart_id_fkey",
    }),
    index("cart_item_id_idx").on(table.id),
    index("cart_item_product_id_idx").on(table.productId),
  ],
);

export const cart = sqliteTable(
  "cart",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    lastUpdatedAt: integer("last_updated_at", { mode: "timestamp" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    lastAccessedAt: integer("last_accessed_at", { mode: "timestamp" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "product_category_id_fkey",
    }),
    index("cart_id_idx").on(table.id),
    index("cart_user_id_idx").on(table.userId),
    index("cart_created_at_idx").on(table.createdAt),
    index("cart_last_updated_at_idx").on(table.lastUpdatedAt),
  ],
);
