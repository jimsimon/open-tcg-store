export function createFakeInventory(marketPrice: number | null, midPrice: number | null) {
  const price = marketPrice || midPrice || 0;
  return {
    NM: {
      quantity: Math.floor(Math.random() * 101),
      price: price.toFixed(2),
    },
    LP: {
      quantity: Math.floor(Math.random() * 101),
      price: (price * 0.8).toFixed(2),
    },
    MP: {
      quantity: Math.floor(Math.random() * 101),
      price: (price * 0.5).toFixed(2),
    },
    HP: {
      quantity: Math.floor(Math.random() * 101),
      price: (price * 0.3).toFixed(2),
    },
    D: {
      quantity: Math.floor(Math.random() * 101),
      price: (price * 0.2).toFixed(2),
    },
  };
}
