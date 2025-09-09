#!/usr/bin/env -S npx tsx

import fs from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { pokemon } from "../src/db/index.js";
import {
  sets,
  setLegalities,
  setImages,
  cards,
  cardSubtypes,
  cardTypes,
  cardEvolvesTo,
  cardAbilities,
  cardAttacks,
  cardAttackCosts,
  cardWeaknesses,
  cardResistances,
  cardRetreatCosts,
  cardNationalPokedexNumbers,
  cardLegalities,
  cardImages,
  cardRules,
  decks,
  deckTypes,
  deckCards,
} from "../src/db/pokemon/schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, "../sqlite-data/pokemon-data/PokemonTCG-pokemon-tcg-data-a6a5579");

async function main() {
  console.log("Starting Pokemon database population...");

  // Process sets first as they're referenced by cards
  console.log("Processing sets...");
  await processSets();

  // Process cards
  console.log("Processing cards...");
  await processCards();

  // Process decks last as they reference cards
  console.log("Processing decks...");
  await processDecks();

  console.log("Database population completed!");
}

async function processSets() {
  const setsDir = join(dataDir, "sets");
  const setsFiles = (await fs.readdir(setsDir)).filter((file) => file.endsWith(".json"));

  const setsData: any[] = [];
  const setLegalitiesData: any[] = [];
  const setImagesData: any[] = [];

  // Read all set files in parallel
  const readPromises = setsFiles.map(async (file) => {
    const filePath = join(setsDir, file);
    const fileContent = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    if (Array.isArray(data)) {
      setsData.push(...data);
    } else {
      setsData.push(data);
    }
  });

  await Promise.all(readPromises);

  // Prepare batch data
  for (const setData of setsData) {
    // Insert set
    await pokemon.insert(sets).values({
      id: setData.id,
      name: setData.name,
      series: setData.series,
      printedTotal: setData.printedTotal,
      total: setData.total,
      ptcgoCode: setData.ptcgoCode,
      releaseDate: setData.releaseDate,
      updatedAt: setData.updatedAt,
    });

    // Collect set legalities for batch insert
    if (setData.legalities) {
      for (const [format, status] of Object.entries(setData.legalities as Record<string, string>)) {
        setLegalitiesData.push({
          setId: setData.id,
          format,
          status,
        });
      }
    }

    // Collect set images for batch insert
    if (setData.images) {
      for (const [imageType, url] of Object.entries(setData.images as Record<string, string>)) {
        setImagesData.push({
          setId: setData.id,
          imageType,
          url: url as string,
        });
      }
    }
  }

  // Batch insert set legalities
  if (setLegalitiesData.length > 0) {
    await pokemon.insert(setLegalities).values(setLegalitiesData);
  }

  // Batch insert set images
  if (setImagesData.length > 0) {
    await pokemon.insert(setImages).values(setImagesData);
  }

  console.log(`Processed ${setsData.length} sets`);
}

async function processCards() {
  const cardsDir = join(dataDir, "cards");
  const languageDirs = await fs.readdir(cardsDir);

  let totalCards = 0;
  const allCards: any[] = [];
  const cardSubtypesData: any[] = [];
  const cardTypesData: any[] = [];
  const cardEvolvesToData: any[] = [];
  const cardNationalPokedexNumbersData: any[] = [];
  const cardLegalitiesData: any[] = [];
  const cardImagesData: any[] = [];
  const cardRulesData: any[] = [];
  const cardAttacksData: any[] = [];
  const cardAttackCostsData: any[] = [];
  const cardAbilitiesData: any[] = [];
  const cardWeaknessesData: any[] = [];
  const cardResistancesData: any[] = [];
  const cardRetreatCostsData: any[] = [];

  // Read all card files in parallel
  const readPromises = languageDirs.map(async (langDir) => {
    const langPath = join(cardsDir, langDir);
    const stats = await fs.stat(langPath);
    if (!stats.isDirectory()) return;

    const setFiles = (await fs.readdir(langPath)).filter((file) => file.endsWith(".json"));

    const fileReadPromises = setFiles.map(async (file) => {
      const filePath = join(langPath, file);
      const fileContent = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(fileContent);

      if (!Array.isArray(data)) return;

      allCards.push(...data);
    });

    await Promise.all(fileReadPromises);
  });

  await Promise.all(readPromises);

  // Process all cards in batches
  const batchSize = 2000;
  for (let i = 0; i < allCards.length; i += batchSize) {
    const batch = allCards.slice(i, i + batchSize);

    // Process batch of cards
    for (const cardData of batch) {
      // Insert card first (no foreign key dependencies)
      const cardId = cardData.id;
      const setPrefix = cardId.split("-")[0];
      const [insertedCard] = await pokemon
        .insert(cards)
        .values({
          id: cardId,
          name: cardData.name,
          supertype: cardData.supertype,
          level: cardData.level,
          hp: cardData.hp,
          evolvesFrom: cardData.evolvesFrom,
          convertedRetreatCost: cardData.convertedRetreatCost,
          number: cardData.number,
          artist: cardData.artist,
          rarity: cardData.rarity,
          flavorText: cardData.flavorText,
          setId: setPrefix,
        })
        .returning();

      if (!insertedCard) {
        throw new Error(`Failed to insert card:\n${JSON.stringify(cardData)}`);
      }

      totalCards++;

      // Collect related data for batch insert
      if (cardData.subtypes && Array.isArray(cardData.subtypes)) {
        for (const subtype of cardData.subtypes) {
          cardSubtypesData.push({
            cardId: insertedCard.id,
            subtype,
          });
        }
      }

      if (cardData.types && Array.isArray(cardData.types)) {
        for (const type of cardData.types) {
          cardTypesData.push({
            cardId: insertedCard.id,
            type,
          });
        }
      }

      if (cardData.evolvesTo && Array.isArray(cardData.evolvesTo)) {
        for (const evolvesTo of cardData.evolvesTo) {
          cardEvolvesToData.push({
            cardId: insertedCard.id,
            evolvesTo,
          });
        }
      }

      if (cardData.nationalPokedexNumbers && Array.isArray(cardData.nationalPokedexNumbers)) {
        for (const pokedexNumber of cardData.nationalPokedexNumbers) {
          cardNationalPokedexNumbersData.push({
            cardId: insertedCard.id,
            pokedexNumber,
          });
        }
      }

      if (cardData.legalities) {
        for (const [format, status] of Object.entries(cardData.legalities as Record<string, string>)) {
          cardLegalitiesData.push({
            cardId: insertedCard.id,
            format,
            status,
          });
        }
      }

      if (cardData.images) {
        for (const [imageType, url] of Object.entries(cardData.images as Record<string, string>)) {
          cardImagesData.push({
            cardId: insertedCard.id,
            imageType,
            url: url as string,
          });
        }
      }

      if (cardData.rules && Array.isArray(cardData.rules)) {
        for (let index = 0; index < cardData.rules.length; index++) {
          cardRulesData.push({
            cardId: insertedCard.id,
            ruleText: cardData.rules[index],
            ruleIndex: index,
          });
        }
      }

      // Process attacks
      if (cardData.attacks && Array.isArray(cardData.attacks)) {
        for (let index = 0; index < cardData.attacks.length; index++) {
          const attack = cardData.attacks[index];
          const [insertedAttack] = await pokemon
            .insert(cardAttacks)
            .values({
              cardId: insertedCard.id,
              name: attack.name,
              convertedEnergyCost: attack.convertedEnergyCost,
              damage: attack.damage,
              text: attack.text,
              attackIndex: index,
            })
            .returning();

          // Collect attack costs
          if (attack.cost && Array.isArray(attack.cost)) {
            for (let i = 0; i < attack.cost.length; i++) {
              cardAttackCostsData.push({
                attackId: insertedAttack.id,
                energyType: attack.cost[i],
                costIndex: i,
              });
            }
          }
        }
      }

      // Process abilities
      if (cardData.abilities && Array.isArray(cardData.abilities)) {
        for (const ability of cardData.abilities) {
          cardAbilitiesData.push({
            cardId: insertedCard.id,
            name: ability.name,
            text: ability.text,
            type: ability.type,
          });
        }
      }

      // Process weaknesses
      if (cardData.weaknesses && Array.isArray(cardData.weaknesses)) {
        for (const weakness of cardData.weaknesses) {
          cardWeaknessesData.push({
            cardId: insertedCard.id,
            type: weakness.type,
            value: weakness.value,
          });
        }
      }

      // Process resistances
      if (cardData.resistances && Array.isArray(cardData.resistances)) {
        for (const resistance of cardData.resistances) {
          cardResistancesData.push({
            cardId: insertedCard.id,
            type: resistance.type,
            value: resistance.value,
          });
        }
      }

      // Process retreat costs
      if (cardData.retreatCost && Array.isArray(cardData.retreatCost)) {
        for (let index = 0; index < cardData.retreatCost.length; index++) {
          const cost = cardData.retreatCost[index];
          cardRetreatCostsData.push({
            cardId: insertedCard.id,
            energyType: cost,
            costIndex: index,
          });
        }
      }
    }

    // Batch insert all related data for this batch of cards in dependency order

    // 1. Direct card dependencies (reference cards.id)
    if (cardSubtypesData.length > 0) {
      await pokemon.insert(cardSubtypes).values(cardSubtypesData.splice(0, cardSubtypesData.length));
    }

    if (cardTypesData.length > 0) {
      await pokemon.insert(cardTypes).values(cardTypesData.splice(0, cardTypesData.length));
    }

    if (cardEvolvesToData.length > 0) {
      await pokemon.insert(cardEvolvesTo).values(cardEvolvesToData.splice(0, cardEvolvesToData.length));
    }

    if (cardNationalPokedexNumbersData.length > 0) {
      await pokemon
        .insert(cardNationalPokedexNumbers)
        .values(cardNationalPokedexNumbersData.splice(0, cardNationalPokedexNumbersData.length));
    }

    if (cardLegalitiesData.length > 0) {
      await pokemon.insert(cardLegalities).values(cardLegalitiesData.splice(0, cardLegalitiesData.length));
    }

    if (cardImagesData.length > 0) {
      await pokemon.insert(cardImages).values(cardImagesData.splice(0, cardImagesData.length));
    }

    if (cardRulesData.length > 0) {
      await pokemon.insert(cardRules).values(cardRulesData.splice(0, cardRulesData.length));
    }

    if (cardAbilitiesData.length > 0) {
      await pokemon.insert(cardAbilities).values(cardAbilitiesData.splice(0, cardAbilitiesData.length));
    }

    if (cardWeaknessesData.length > 0) {
      await pokemon.insert(cardWeaknesses).values(cardWeaknessesData.splice(0, cardWeaknessesData.length));
    }

    if (cardResistancesData.length > 0) {
      await pokemon.insert(cardResistances).values(cardResistancesData.splice(0, cardResistancesData.length));
    }

    if (cardRetreatCostsData.length > 0) {
      await pokemon.insert(cardRetreatCosts).values(cardRetreatCostsData.splice(0, cardRetreatCostsData.length));
    }

    // 2. Attack dependencies (reference cardAttacks.id)
    if (cardAttacksData.length > 0) {
      await pokemon.insert(cardAttacks).values(cardAttacksData.splice(0, cardAttacksData.length));
    }

    // 3. Attack cost dependencies (reference cardAttacks.id)
    if (cardAttackCostsData.length > 0) {
      await pokemon.insert(cardAttackCosts).values(cardAttackCostsData.splice(0, cardAttackCostsData.length));
    }

    console.log(`Processed ${totalCards} cards`);
  }
}

async function processDecks() {
  const decksDir = join(dataDir, "decks");
  const cardsDir = join(dataDir, "cards");
  const languageDirs = await fs.readdir(decksDir);

  let totalDecks = 0;
  const allDecks: any[] = [];
  const deckTypesData: any[] = [];
  const deckCardsData: any[] = [];

  // Create a card lookup map to avoid repeated file searches
  const cardDetailsMap = new Map<string, any>();

  // First, build a comprehensive card lookup map
  console.log("Building card lookup map...");
  const cardDirs = await fs.readdir(cardsDir);

  const cardMapPromises = cardDirs.map(async (langDir) => {
    const langPath = join(cardsDir, langDir);
    const stats = await fs.stat(langPath);
    if (!stats.isDirectory()) return;

    const setFiles = (await fs.readdir(langPath)).filter((file) => file.endsWith(".json"));

    const fileReadPromises = setFiles.map(async (file) => {
      const filePath = join(langPath, file);
      const fileContent = await fs.readFile(filePath, "utf-8");
      const cardsData = JSON.parse(fileContent);

      if (Array.isArray(cardsData)) {
        for (const card of cardsData) {
          cardDetailsMap.set(card.id, {
            name: card.name,
            rarity: card.rarity || "Unknown",
          });
        }
      }
    });

    await Promise.all(fileReadPromises);
  });

  await Promise.all(cardMapPromises);
  console.log(`Built card lookup map with ${cardDetailsMap.size} cards`);

  // Read all deck files in parallel
  const readPromises = languageDirs.map(async (langDir) => {
    const langPath = join(decksDir, langDir);
    const stats = await fs.stat(langPath);
    if (!stats.isDirectory()) return;

    const deckFiles = (await fs.readdir(langPath)).filter((file) => file.endsWith(".json"));

    const fileReadPromises = deckFiles.map(async (file) => {
      const filePath = join(langPath, file);
      const fileContent = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(fileContent);

      if (Array.isArray(data)) {
        allDecks.push(...data);
      }
    });

    await Promise.all(fileReadPromises);
  });

  await Promise.all(readPromises);

  // Process all decks
  for (const deckData of allDecks) {
    // Insert deck first (no foreign key dependencies)
    const [insertedDeck] = await pokemon
      .insert(decks)
      .values({
        id: deckData.id,
        name: deckData.name,
      })
      .returning();

    if (!insertedDeck) {
      throw new Error(`Failed to insert deck:\n${JSON.stringify(deckData)}`);
    }

    totalDecks++;

    // Collect deck types
    if (deckData.types && Array.isArray(deckData.types)) {
      for (const type of deckData.types) {
        deckTypesData.push({
          deckId: insertedDeck.id,
          type,
        });
      }
    }

    // Collect deck cards
    if (deckData.cards && Array.isArray(deckData.cards)) {
      for (const deckCard of deckData.cards) {
        const cardDetails = cardDetailsMap.get(deckCard.id);

        deckCardsData.push({
          deckId: insertedDeck.id,
          cardId: deckCard.id,
          cardName: deckCard.name || cardDetails?.name || 'Unknown Card',
          rarity: deckCard.rarity || cardDetails?.rarity,
          count: deckCard.count,
        });
      }
    }
  }

  // Batch insert deck types (depends on decks.id)
  if (deckTypesData.length > 0) {
    await pokemon.insert(deckTypes).values(deckTypesData);
  }

  // Batch insert deck cards (depends on decks.id and cards.id)
  if (deckCardsData.length > 0) {
    await pokemon.insert(deckCards).values(deckCardsData);
  }

  console.log(`Processed ${totalDecks} decks`);
}

await main();
