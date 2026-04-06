import { relations } from 'drizzle-orm/relations';
import { buyRate } from './buy-rate-schema';
import { category } from '../tcg-data/schema';

export const buyRateRelations = relations(buyRate, ({ one }) => ({
  category: one(category, {
    fields: [buyRate.categoryId],
    references: [category.id],
  }),
}));
