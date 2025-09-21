import { relations } from "drizzle-orm/relations";
import { cart, cartItem } from "./shopping-schema";
import { user } from "./auth-schema";
import { product } from "../tcg-data/schema";

export const cartRelations = relations(cart, ({ one, many }) => ({
  user: one(user, {
    fields: [cart.userId],
    references: [user.id],
  }),
  cartItems: many(cartItem),
}));

export const cartItemRelations = relations(cartItem, ({ one, many }) => ({
  cart: one(cart, {
    fields: [cartItem.cartId],
    references: [cart.id],
  }),
  product: one(product, {
    fields: [cartItem.productId],
    references: [product.id]
  }),
}));
