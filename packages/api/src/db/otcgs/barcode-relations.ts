import { relations } from 'drizzle-orm/relations';
import { barcode } from './barcode-schema';
import { inventoryItem } from './inventory-schema';
import { user } from './auth-schema';

export const barcodeRelations = relations(barcode, ({ one }) => ({
  inventoryItem: one(inventoryItem, {
    fields: [barcode.inventoryItemId],
    references: [inventoryItem.id],
  }),
  createdByUser: one(user, {
    fields: [barcode.createdBy],
    references: [user.id],
    relationName: 'barcodeCreatedBy',
  }),
  updatedByUser: one(user, {
    fields: [barcode.updatedBy],
    references: [user.id],
    relationName: 'barcodeUpdatedBy',
  }),
}));
