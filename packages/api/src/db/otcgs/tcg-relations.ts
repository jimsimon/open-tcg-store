import { relations } from "drizzle-orm/relations";
import { category, group, product, price, productPresaleInfo, productExtendedData } from "./tcg-schema";

export const categoryRelations = relations(category, ({ many }) => ({
  groups: many(group, {
    relationName: 'category',
  }),
  products: many(product, {
    relationName: 'category',
  }),
}));

export const groupRelations = relations(group, ({ one, many }) => ({
  category: one(category, {
    fields: [group.categoryId],
    references: [category.id],
    relationName: 'group',
  }),
  products: many(product, {
    relationName: 'group',
  }),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  category: one(category, {
    fields: [product.categoryId],
    references: [category.id],
    relationName: 'product',
  }),
  group: one(group, {
    fields: [product.groupId],
    references: [group.id],
    relationName: 'product',
  }),
  prices: many(price, {
    relationName: 'product',
  }),
  presaleInfo: one(productPresaleInfo, {
    fields: [product.id],
    references: [productPresaleInfo.productId],
    relationName: 'product',
  }),
  extendedData: many(productExtendedData, {
    relationName: 'product',
  }),
}));

export const productPresaleInfoRelations = relations(productPresaleInfo, ({ one }) => ({
  product: one(product, {
    fields: [productPresaleInfo.productId],
    references: [product.id],
    relationName: 'presaleInfo',
  }),
}));

export const productExtendedDataRelations = relations(productExtendedData, ({ one }) => ({
  product: one(product, {
    fields: [productExtendedData.productId],
    references: [product.id],
    relationName: 'extendedData',
  }),
}));

export const priceRelations = relations(price, ({ one }) => ({
  product: one(product, {
    fields: [price.productId],
    references: [product.id],
    relationName: 'price',
  }),
}));