import { signal } from "@lit-labs/signals";

export interface CartItem {
  inventoryItemId: number;
  productId: number;
  productName: string;
  condition: string;
  quantity: number;
  unitPrice: number;
  maxAvailable: number;
}

export interface Cart {
  items: CartItem[];
}

export const cartState = signal<Cart>({ items: [] });
