import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ===== SETS TABLES =====

export const sets = sqliteTable('sets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  series: text('series').notNull(),
  printedTotal: integer('printed_total').notNull(),
  total: integer('total').notNull(),
  ptcgoCode: text('ptcgo_code'),
  releaseDate: text('release_date').notNull(), // ISO date string
  updatedAt: text('updated_at').notNull(), // ISO datetime string
}, (table) => [
  index('sets_series_idx').on(table.series),
  index('sets_release_date_idx').on(table.releaseDate),
]);

export const setLegalities = sqliteTable('set_legalities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  setId: text('set_id').notNull().references(() => sets.id, { onDelete: 'cascade' }),
  format: text('format').notNull(), // unlimited, standard, expanded, etc.
  status: text('status').notNull(), // Legal, Banned, etc.
}, (table) => [
  uniqueIndex('set_legalities_set_format_idx').on(table.setId, table.format),
]);

export const setImages = sqliteTable('set_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  setId: text('set_id').notNull().references(() => sets.id, { onDelete: 'cascade' }),
  imageType: text('image_type').notNull(), // symbol, logo
  url: text('url').notNull(),
}, (table) => [
  uniqueIndex('set_images_set_type_idx').on(table.setId, table.imageType),
]);

// ===== CARDS TABLES =====

export const cards = sqliteTable('cards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  supertype: text('supertype').notNull(), // Pokémon, Trainer, Energy
  level: text('level'),
  hp: text('hp'),
  evolvesFrom: text('evolves_from'),
  convertedRetreatCost: integer('converted_retreat_cost'),
  number: text('number'),
  artist: text('artist'),
  rarity: text('rarity'),
  flavorText: text('flavor_text'),
  setId: text('set_id').references(() => sets.id, { onDelete: 'cascade' }),
}, (table) => [
  index('cards_name_idx').on(table.name),
  index('cards_supertype_idx').on(table.supertype),
  index('cards_set_id_idx').on(table.setId),
  index('cards_rarity_idx').on(table.rarity),
]);

export const cardSubtypes = sqliteTable('card_subtypes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  subtype: text('subtype').notNull(), // Stage 1, Stage 2, Basic, etc.
}, (table) => [
  uniqueIndex('card_subtypes_card_subtype_idx').on(table.cardId, table.subtype),
]);

export const cardTypes = sqliteTable('card_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // Fire, Water, Grass, etc.
}, (table) => [
  uniqueIndex('card_types_card_type_idx').on(table.cardId, table.type),
]);

export const cardEvolvesTo = sqliteTable('card_evolves_to', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  evolvesTo: text('evolves_to').notNull(),
}, (table) => [
  uniqueIndex('card_evolves_to_card_evolution_idx').on(table.cardId, table.evolvesTo),
]);

export const cardAbilities = sqliteTable('card_abilities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  text: text('text').notNull(),
  type: text('type').notNull(), // Pokémon Power, Ability, etc.
}, (table) => [
  index('card_abilities_card_idx').on(table.cardId),
]);

export const cardAttacks = sqliteTable('card_attacks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  convertedEnergyCost: integer('converted_energy_cost'),
  damage: text('damage'),
  text: text('text'),
  attackIndex: integer('attack_index').notNull(), // Order of attacks on the card
}, (table) => [
  index('card_attacks_card_idx').on(table.cardId),
  uniqueIndex('card_attacks_card_index_idx').on(table.cardId, table.attackIndex),
]);

export const cardAttackCosts = sqliteTable('card_attack_costs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  attackId: integer('attack_id').notNull().references(() => cardAttacks.id, { onDelete: 'cascade' }),
  energyType: text('energy_type').notNull(), // Fire, Water, Colorless, etc.
  costIndex: integer('cost_index').notNull(), // Order of costs in the array
}, (table) => [
  index('card_attack_costs_attack_idx').on(table.attackId),
  uniqueIndex('card_attack_costs_attack_index_idx').on(table.attackId, table.costIndex),
]);

export const cardWeaknesses = sqliteTable('card_weaknesses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  value: text('value').notNull(), // ×2, +10, etc.
}, (table) => [
  uniqueIndex('card_weaknesses_card_type_idx').on(table.cardId, table.type),
]);

export const cardResistances = sqliteTable('card_resistances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  value: text('value').notNull(), // -30, -20, etc.
}, (table) => [
  uniqueIndex('card_resistances_card_type_idx').on(table.cardId, table.type),
]);

export const cardRetreatCosts = sqliteTable('card_retreat_costs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  energyType: text('energy_type').notNull(),
  costIndex: integer('cost_index').notNull(),
}, (table) => [
  index('card_retreat_costs_card_idx').on(table.cardId),
  uniqueIndex('card_retreat_costs_card_index_idx').on(table.cardId, table.costIndex),
]);

export const cardNationalPokedexNumbers = sqliteTable('card_national_pokedex_numbers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  pokedexNumber: integer('pokedex_number').notNull(),
}, (table) => [
  uniqueIndex('card_pokedex_card_number_idx').on(table.cardId, table.pokedexNumber),
]);

export const cardLegalities = sqliteTable('card_legalities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  format: text('format').notNull(),
  status: text('status').notNull(),
}, (table) => [
  uniqueIndex('card_legalities_card_format_idx').on(table.cardId, table.format),
]);

export const cardImages = sqliteTable('card_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  imageType: text('image_type').notNull(), // small, large
  url: text('url').notNull(),
}, (table) => [
  uniqueIndex('card_images_card_type_idx').on(table.cardId, table.imageType),
]);

export const cardRules = sqliteTable('card_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  ruleText: text('rule_text').notNull(),
  ruleIndex: integer('rule_index').notNull(),
}, (table) => [
  index('card_rules_card_idx').on(table.cardId),
  uniqueIndex('card_rules_card_index_idx').on(table.cardId, table.ruleIndex),
]);

// ===== DECKS TABLES =====

export const decks = sqliteTable('decks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
}, (table) => [
  index('decks_name_idx').on(table.name),
]);

export const deckTypes = sqliteTable('deck_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deckId: text('deck_id').notNull().references(() => decks.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
}, (table) => [
  uniqueIndex('deck_types_deck_type_idx').on(table.deckId, table.type),
]);

export const deckCards = sqliteTable('deck_cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deckId: text('deck_id').notNull().references(() => decks.id, { onDelete: 'cascade' }),
  cardId: text('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  cardName: text('card_name').notNull(), // Stored for reference since card may not exist in cards table
  rarity: text('rarity').notNull(),
  count: integer('count').notNull(),
}, (table) => [
  index('deck_cards_deck_idx').on(table.deckId),
  index('deck_cards_card_idx').on(table.cardId),
  uniqueIndex('deck_cards_deck_card_rarity_idx').on(table.deckId, table.cardId, table.rarity),
]);
