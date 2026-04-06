import { relations } from 'drizzle-orm/relations';
import { storeSupportedGame } from './store-supported-game-schema';
import { category } from '../tcg-data/schema';

export const storeSupportedGameRelations = relations(storeSupportedGame, ({ one }) => ({
  category: one(category, {
    fields: [storeSupportedGame.categoryId],
    references: [category.id],
  }),
}));
