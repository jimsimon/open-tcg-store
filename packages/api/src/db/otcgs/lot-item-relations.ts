import { relations } from 'drizzle-orm/relations';
import { lotItem } from './lot-item-schema';
import { lot } from './lot-schema';
import { inventoryItemStock } from './inventory-stock-schema';
import { product } from '../tcg-data/schema';

export const lotItemRelations = relations(lotItem, ({ one }) => ({
  lot: one(lot, {
    fields: [lotItem.lotId],
    references: [lot.id],
  }),
  inventoryItemStock: one(inventoryItemStock, {
    fields: [lotItem.inventoryItemStockId],
    references: [inventoryItemStock.id],
  }),
  product: one(product, {
    fields: [lotItem.productId],
    references: [product.id],
  }),
}));
