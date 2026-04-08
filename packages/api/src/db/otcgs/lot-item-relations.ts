import { relations } from 'drizzle-orm/relations';
import { lotItem } from './lot-item-schema';
import { lot } from './lot-schema';
import { inventoryItemStock } from './inventory-stock-schema';

// NOTE: lotItem.productId references the `product` table in the tcg-data database.
// Cross-database Drizzle relations are NOT supported by the `.query` API (e.g.,
// `otcgs.query.lotItem.findMany({ with: { product: true } })` would fail at runtime).
// Use raw `.select()` + `.innerJoin()` for cross-database joins instead — see lot-service.ts.

export const lotItemRelations = relations(lotItem, ({ one }) => ({
  lot: one(lot, {
    fields: [lotItem.lotId],
    references: [lot.id],
  }),
  inventoryItemStock: one(inventoryItemStock, {
    fields: [lotItem.inventoryItemStockId],
    references: [inventoryItemStock.id],
  }),
}));
