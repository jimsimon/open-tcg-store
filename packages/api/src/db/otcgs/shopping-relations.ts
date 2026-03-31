import { relations } from 'drizzle-orm/relations';
import { cart, cartItem } from './shopping-schema';
import { user } from './auth-schema';
import { inventoryItem } from './inventory-schema';

export const cartRelations = relations(cart, ({ one, many }) => ({
  user: one(user, {
    fields: [cart.userId],
    references: [user.id],
  }),
  cartItems: many(cartItem),
}));

export const cartItemRelations = relations(cartItem, ({ one }) => ({
  cart: one(cart, {
    fields: [cartItem.cartId],
    references: [cart.id],
  }),
  inventoryItem: one(inventoryItem, {
    fields: [cartItem.inventoryItemId],
    references: [inventoryItem.id],
  }),
}));
