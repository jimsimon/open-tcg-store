import { relations } from 'drizzle-orm';
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
} from './schema';

// ===== SET RELATIONS =====

export const setsRelations = relations(sets, ({ many }) => ({
  legalities: many(setLegalities),
  images: many(setImages),
  cards: many(cards),
}));

export const setLegalitiesRelations = relations(setLegalities, ({ one }) => ({
  set: one(sets, { fields: [setLegalities.setId], references: [sets.id] }),
}));

export const setImagesRelations = relations(setImages, ({ one }) => ({
  set: one(sets, { fields: [setImages.setId], references: [sets.id] }),
}));

// ===== CARD RELATIONS =====

export const cardsRelations = relations(cards, ({ one, many }) => ({
  set: one(sets, { fields: [cards.setId], references: [sets.id] }),
  subtypes: many(cardSubtypes),
  types: many(cardTypes),
  evolvesTo: many(cardEvolvesTo),
  abilities: many(cardAbilities),
  attacks: many(cardAttacks),
  weaknesses: many(cardWeaknesses),
  resistances: many(cardResistances),
  retreatCosts: many(cardRetreatCosts),
  nationalPokedexNumbers: many(cardNationalPokedexNumbers),
  legalities: many(cardLegalities),
  images: many(cardImages),
  rules: many(cardRules),
  deckCards: many(deckCards),
}));

export const cardSubtypesRelations = relations(cardSubtypes, ({ one }) => ({
  card: one(cards, { fields: [cardSubtypes.cardId], references: [cards.id] }),
}));

export const cardTypesRelations = relations(cardTypes, ({ one }) => ({
  card: one(cards, { fields: [cardTypes.cardId], references: [cards.id] }),
}));

export const cardEvolvesToRelations = relations(cardEvolvesTo, ({ one }) => ({
  card: one(cards, { fields: [cardEvolvesTo.cardId], references: [cards.id] }),
}));

export const cardAbilitiesRelations = relations(cardAbilities, ({ one }) => ({
  card: one(cards, { fields: [cardAbilities.cardId], references: [cards.id] }),
}));

export const cardAttacksRelations = relations(cardAttacks, ({ one, many }) => ({
  card: one(cards, { fields: [cardAttacks.cardId], references: [cards.id] }),
  costs: many(cardAttackCosts),
}));

export const cardAttackCostsRelations = relations(cardAttackCosts, ({ one }) => ({
  attack: one(cardAttacks, { fields: [cardAttackCosts.attackId], references: [cardAttacks.id] }),
}));

export const cardWeaknessesRelations = relations(cardWeaknesses, ({ one }) => ({
  card: one(cards, { fields: [cardWeaknesses.cardId], references: [cards.id] }),
}));

export const cardResistancesRelations = relations(cardResistances, ({ one }) => ({
  card: one(cards, { fields: [cardResistances.cardId], references: [cards.id] }),
}));

export const cardRetreatCostsRelations = relations(cardRetreatCosts, ({ one }) => ({
  card: one(cards, { fields: [cardRetreatCosts.cardId], references: [cards.id] }),
}));

export const cardNationalPokedexNumbersRelations = relations(cardNationalPokedexNumbers, ({ one }) => ({
  card: one(cards, { fields: [cardNationalPokedexNumbers.cardId], references: [cards.id] }),
}));

export const cardLegalitiesRelations = relations(cardLegalities, ({ one }) => ({
  card: one(cards, { fields: [cardLegalities.cardId], references: [cards.id] }),
}));

export const cardImagesRelations = relations(cardImages, ({ one }) => ({
  card: one(cards, { fields: [cardImages.cardId], references: [cards.id] }),
}));

export const cardRulesRelations = relations(cardRules, ({ one }) => ({
  card: one(cards, { fields: [cardRules.cardId], references: [cards.id] }),
}));

// ===== DECK RELATIONS =====

export const decksRelations = relations(decks, ({ many }) => ({
  types: many(deckTypes),
  cards: many(deckCards),
}));

export const deckTypesRelations = relations(deckTypes, ({ one }) => ({
  deck: one(decks, { fields: [deckTypes.deckId], references: [decks.id] }),
}));

export const deckCardsRelations = relations(deckCards, ({ one }) => ({
  deck: one(decks, { fields: [deckCards.deckId], references: [decks.id] }),
  card: one(cards, { fields: [deckCards.cardId], references: [cards.id] }),
}));