import { relations } from 'drizzle-orm/relations';
import {
  category,
  group,
  product,
  price,
  productPresaleInfo,
  manapoolPrice,
  sku,
  cardtraderBlueprint,
  priceHistory,
  skuHistory,
} from './schema';

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
  manapoolPrices: many(manapoolPrice),
  skus: many(sku),
  cardtraderBlueprints: many(cardtraderBlueprint),
  priceHistory: many(priceHistory),
  skuHistory: many(skuHistory),
}));

export const productPresaleInfoRelations = relations(productPresaleInfo, ({ one }) => ({
  product: one(product, {
    fields: [productPresaleInfo.productId],
    references: [product.id],
  }),
}));

export const priceRelations = relations(price, ({ one }) => ({
  product: one(product, {
    fields: [price.productId],
    references: [product.id],
  }),
}));

export const manapoolPriceRelations = relations(manapoolPrice, ({ one }) => ({
  product: one(product, {
    fields: [manapoolPrice.productId],
    references: [product.id],
  }),
}));

export const skuRelations = relations(sku, ({ one, many }) => ({
  product: one(product, {
    fields: [sku.productId],
    references: [product.id],
  }),
  history: many(skuHistory),
}));

export const cardtraderBlueprintRelations = relations(cardtraderBlueprint, ({ one }) => ({
  product: one(product, {
    fields: [cardtraderBlueprint.productId],
    references: [product.id],
  }),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  product: one(product, {
    fields: [priceHistory.productId],
    references: [product.id],
  }),
}));

export const skuHistoryRelations = relations(skuHistory, ({ one }) => ({
  sku: one(sku, {
    fields: [skuHistory.skuId],
    references: [sku.id],
  }),
  product: one(product, {
    fields: [skuHistory.productId],
    references: [product.id],
  }),
}));
