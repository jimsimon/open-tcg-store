import { relations } from 'drizzle-orm/relations';
import { inventoryItemStock } from './inventory-stock-schema';
import { inventoryItem } from './inventory-schema';
import { user } from './auth-schema';
import { lot } from './lot-schema';

export const inventoryItemStockRelations = relations(inventoryItemStock, ({ one }) => ({
  inventoryItem: one(inventoryItem, {
    fields: [inventoryItemStock.inventoryItemId],
    references: [inventoryItem.id],
  }),
  lot: one(lot, {
    fields: [inventoryItemStock.lotId],
    references: [lot.id],
  }),
  createdByUser: one(user, {
    fields: [inventoryItemStock.createdBy],
    references: [user.id],
    relationName: 'stockCreatedBy',
  }),
  updatedByUser: one(user, {
    fields: [inventoryItemStock.updatedBy],
    references: [user.id],
    relationName: 'stockUpdatedBy',
  }),
}));
