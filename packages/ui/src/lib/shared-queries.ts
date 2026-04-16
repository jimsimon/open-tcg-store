import { graphql } from '../graphql/index.ts';

export const GetSupportedGamesQuery = graphql(`
  query GetSupportedGames {
    getSupportedGames {
      categoryId
      name
      displayName
    }
  }
`);

export const AddToCartMutation = graphql(`
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
`);
