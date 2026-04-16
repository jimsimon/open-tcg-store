import { TypedDocumentString } from '../graphql/graphql';

export interface SupportedGame {
  categoryId: number;
  name: string;
  displayName: string;
}

export const GetSupportedGamesQuery = new TypedDocumentString(`
  query GetSupportedGames {
    getSupportedGames {
      categoryId
      name
      displayName
    }
  }
`) as unknown as TypedDocumentString<
  {
    getSupportedGames: Array<SupportedGame>;
  },
  Record<string, never>
>;

export interface CartItemResult {
  inventoryItemId: number;
  productId: number;
  productName: string;
  condition: string;
  quantity: number;
  unitPrice: number;
  maxAvailable: number;
}

export const AddToCartMutation = new TypedDocumentString(`
  mutation AddToCart($cartItem: CartItemInput!) {
    addToCart(cartItem: $cartItem) {
      items {
        inventoryItemId
        productId
        productName
        condition
        quantity
        unitPrice
        maxAvailable
      }
    }
  }
`) as unknown as TypedDocumentString<
  {
    addToCart: {
      items: CartItemResult[];
    };
  },
  { cartItem: { inventoryItemId: number; quantity: number } }
>;
