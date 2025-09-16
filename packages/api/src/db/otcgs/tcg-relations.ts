import { relations } from "drizzle-orm/relations";
import { category, group, product, price, productPresaleInfo, productExtendedData } from "./tcg-schema";

export const categoryRelations = relations(category, ({ many }) => ({
  groups: many(group),
  products: many(product),
}));

export const groupRelations = relations(group, ({ one, many }) => ({
  category: one(category, {
    fields: [group.categoryId],
    references: [category.id],
  }),
  products: many(product),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  category: one(category, {
    fields: [product.categoryId],
    references: [category.id],
  }),
  group: one(group, {
    fields: [product.groupId],
    references: [group.id],
  }),
  prices: many(price),
  presaleInfo: one(productPresaleInfo, {
    fields: [product.id],
    references: [productPresaleInfo.productId],
  }),
  extendedData: many(productExtendedData),
}));

export const productPresaleInfoRelations = relations(productPresaleInfo, ({ one }) => ({
  product: one(product, {
    fields: [productPresaleInfo.productId],
    references: [product.id],
  }),
}));

export const productExtendedDataRelations = relations(productExtendedData, ({ one }) => ({
  product: one(product, {
    fields: [productExtendedData.productId],
    references: [product.id],
  }),
}));

export const priceRelations = relations(price, ({ one }) => ({
  product: one(product, {
    fields: [price.productId],
    references: [product.id],
  }),
}));
