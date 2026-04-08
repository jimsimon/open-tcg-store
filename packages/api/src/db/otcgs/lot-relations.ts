import { relations } from 'drizzle-orm/relations';
import { lot } from './lot-schema';
import { lotItem } from './lot-item-schema';
import { inventoryItemStock } from './inventory-stock-schema';
import { user } from './auth-schema';

export const lotRelations = relations(lot, ({ one, many }) => ({
  items: many(lotItem),
  stocks: many(inventoryItemStock),
  createdByUser: one(user, {
    fields: [lot.createdBy],
    references: [user.id],
    relationName: 'lotCreatedBy',
  }),
  updatedByUser: one(user, {
    fields: [lot.updatedBy],
    references: [user.id],
    relationName: 'lotUpdatedBy',
  }),
}));
