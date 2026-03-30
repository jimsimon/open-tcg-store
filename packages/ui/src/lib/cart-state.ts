import { signal } from "@lit-labs/signals";

export interface CartItem {
  productId: number;
  productName: string;
  condition: string;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
}

export const cartState = signal<Cart>({ items: [] });
