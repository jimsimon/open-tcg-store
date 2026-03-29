import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, foreignKey, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export const inventoryItem = sqliteTable(
  "inventory_item",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id").notNull(),
    condition: text("condition").notNull(), // NM, LP, MP, HP, D
    quantity: integer("quantity").notNull().default(0),
    price: real("price").notNull(),
    costBasis: real("cost_basis"),
    acquisitionDate: integer("acquisition_date", { mode: "timestamp" }),
    notes: text("notes", { length: 1000 }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
  },
  (table) => [
    uniqueIndex("inventory_item_product_condition_cost_idx").on(table.productId, table.condition, table.costBasis),
    index("inventory_item_product_id_idx").on(table.productId),
    index("inventory_item_condition_idx").on(table.condition),
    index("inventory_item_price_idx").on(table.price),
    index("inventory_item_cost_basis_idx").on(table.costBasis),
    index("inventory_item_created_at_idx").on(table.createdAt),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "inventory_item_created_by_fkey",
    }),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [user.id],
      name: "inventory_item_updated_by_fkey",
    }),
  ],
);
