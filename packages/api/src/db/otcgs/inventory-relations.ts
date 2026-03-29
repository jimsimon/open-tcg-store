import { relations } from "drizzle-orm/relations";
import { inventoryItem } from "./inventory-schema";
import { user } from "./auth-schema";
import { product } from "../tcg-data/schema";

export const inventoryItemRelations = relations(inventoryItem, ({ one }) => ({
  product: one(product, {
    fields: [inventoryItem.productId],
    references: [product.id],
  }),
  createdByUser: one(user, {
    fields: [inventoryItem.createdBy],
    references: [user.id],
    relationName: "inventoryCreatedBy",
  }),
  updatedByUser: one(user, {
    fields: [inventoryItem.updatedBy],
    references: [user.id],
    relationName: "inventoryUpdatedBy",
  }),
}));
