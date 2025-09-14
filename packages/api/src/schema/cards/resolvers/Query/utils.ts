export function buildMagicImages(scryfallId: string | null, multiverseId: string | null) {
  return {
    small: scryfallId
      ? buildScryfallImageUrl(scryfallId, "small")
      : multiverseId
        ? buildGathererImageUrl(multiverseId, "small")
        : null,
    large: scryfallId
      ? buildScryfallImageUrl(scryfallId, "large")
      : multiverseId
        ? buildGathererImageUrl(multiverseId, "large")
        : null,
  };
}

function buildScryfallImageUrl(scryfallId: string, type: "small" | "large") {
  const fileFace = "front";
  const fileFormat = "jpg";
  const fileName = scryfallId;
  const dir1 = fileName.charAt(0);
  const dir2 = fileName.charAt(1);
  return `https://cards.scryfall.io/${type}/${fileFace}/${dir1}/${dir2}/${fileName}.${fileFormat}`;
}

function buildGathererImageUrl(multiverseId: string, type: "small" | "large") {
  return `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${multiverseId}&type=${type}`;
}

export function createFakeInventory() {
  return {
    NM: {
      quantity: Math.floor(Math.random() * 101),
      price: getRandomDollarAmount(1.0, 100.0),
    },
    LP: {
      quantity: Math.floor(Math.random() * 101),
      price: getRandomDollarAmount(1.0, 100.0),
    },
    MP: {
      quantity: Math.floor(Math.random() * 101),
      price: getRandomDollarAmount(1.0, 100.0),
    },
    HP: {
      quantity: Math.floor(Math.random() * 101),
      price: getRandomDollarAmount(1.0, 100.0),
    },
    D: {
      quantity: Math.floor(Math.random() * 101),
      price: getRandomDollarAmount(1.0, 100.0),
    },
  };
}

function getRandomDollarAmount(min: number, max: number) {
  // Generate a random number between min and max
  let randomNumber = Math.random() * (max - min) + min;
  // Round to two decimal places and convert to a fixed-point string
  return Number(randomNumber.toFixed(2));
}
