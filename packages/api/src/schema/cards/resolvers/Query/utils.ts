export function createFakeInventory(marketPrice: number | null, midPrice: number | null) {
  const price = marketPrice || midPrice || 0;
  return {
    NM: {
      quantity: Math.floor(Math.random() * 101),
      price: price,
    },
    LP: {
      quantity: Math.floor(Math.random() * 101),
      price: 0,
    },
    MP: {
      quantity: Math.floor(Math.random() * 101),
      price: 0,
    },
    HP: {
      quantity: Math.floor(Math.random() * 101),
      price: 0,
    },
    D: {
      quantity: Math.floor(Math.random() * 101),
      price: 0,
    },
  };
}
