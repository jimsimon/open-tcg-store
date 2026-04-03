import { relations } from 'drizzle-orm/relations';
import { order, orderItem } from './order-schema';
import { user } from './auth-schema';
import { product } from '../tcg-data/schema';
import { inventoryItem } from './inventory-schema';
import { inventoryItemStock } from './inventory-stock-schema';

export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(user, {
    fields: [order.userId],
    references: [user.id],
  }),
  orderItems: many(orderItem),
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  product: one(product, {
    fields: [orderItem.productId],
    references: [product.id],
  }),
  inventoryItem: one(inventoryItem, {
    fields: [orderItem.inventoryItemId],
    references: [inventoryItem.id],
  }),
  inventoryItemStock: one(inventoryItemStock, {
    fields: [orderItem.inventoryItemStockId],
    references: [inventoryItemStock.id],
  }),
}));
