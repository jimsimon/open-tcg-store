import { sqliteTable, text, integer, real, foreignKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ---------------------------------------------------------------------------
// category
// ---------------------------------------------------------------------------

export const category = sqliteTable(
  'category',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tcgpCategoryId: integer('tcgp_category_id').notNull().unique(),
    name: text('name').notNull(),
    displayName: text('display_name').notNull(),
    seoCategoryName: text('seo_category_name').notNull(),
    categoryDescription: text('category_description'),
    categoryPageTitle: text('category_page_title'),
    sealedLabel: text('sealed_label'),
    nonSealedLabel: text('non_sealed_label'),
    conditionGuideUrl: text('condition_guide_url'),
    isScannable: integer('is_scannable', { mode: 'boolean' }).notNull(),
    popularity: integer('popularity').notNull().default(0),
    isDirect: integer('is_direct', { mode: 'boolean' }).notNull(),
    modifiedOn: integer('modified_on', { mode: 'timestamp' }),
    // New from tcgtracking.com
    productCount: integer('product_count').notNull().default(0),
    setCount: integer('set_count').notNull().default(0),
  },
  (table) => [
    index('category_name_idx').on(table.name),
    index('category_display_name_idx').on(table.displayName),
    index('category_seo_category_name_idx').on(table.seoCategoryName),
    index('category_is_scannable_idx').on(table.isScannable),
    index('category_popularity_idx').on(table.popularity),
  ],
);

// ---------------------------------------------------------------------------
// group (set)
// ---------------------------------------------------------------------------

export const group = sqliteTable(
  'group',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tcgpGroupId: integer('tcgp_group_id').notNull().unique(),
    name: text('name').notNull(),
    abbreviation: text('abbreviation').notNull(),
    isSupplemental: integer('is_supplemental', { mode: 'boolean' }).notNull(),
    publishedOn: integer('published_on', { mode: 'timestamp' }),
    modifiedOn: integer('modified_on', { mode: 'timestamp' }),
    tcgpCategoryId: integer('tcgp_category_id').notNull(),
    categoryId: integer('category_id').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [category.id],
      name: 'group_category_id_fkey',
    }),
    index('group_name_idx').on(table.name),
    index('group_abbreviation_idx').on(table.abbreviation),
    index('group_is_supplemental_idx').on(table.isSupplemental),
    index('group_category_id_idx').on(table.categoryId),
    index('group_published_on_idx').on(table.publishedOn),
  ],
);

// ---------------------------------------------------------------------------
// product
// ---------------------------------------------------------------------------

export const product = sqliteTable(
  'product',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tcgpProductId: integer('tcgp_product_id').notNull().unique(),
    tcgpGroupId: integer('tcgp_group_id').notNull(),
    tcgpCategoryId: integer('tcgp_category_id').notNull(),
    name: text('name').notNull(),
    cleanName: text('clean_name'),
    imageUrl: text('image_url'),
    url: text('url'),
    modifiedOn: integer('modified_on', { mode: 'timestamp' }),
    imageCount: integer('image_count').notNull().default(0),
    categoryId: integer('category_id').notNull(),
    groupId: integer('group_id').notNull(),

    // --- New from tcgtracking.com (primary source) ---
    number: text('number'), // collector number
    rarity: text('rarity'), // short code: M/R/U/C/S/T/L/P
    rarityDisplay: text('rarity_display'), // human-readable: "Mythic Rare", etc.
    productType: text('product_type').notNull().default('sealed'), // 'single' or 'sealed'
    tcgplayerUrl: text('tcgplayer_url'), // affiliate TCGPlayer URL
    manapoolUrl: text('manapool_url'),
    scryfallId: text('scryfall_id'), // Magic only
    mtgjsonUuid: text('mtgjson_uuid'), // Magic only
    cardmarketId: integer('cardmarket_id'),
    cardtraderId: integer('cardtrader_id'), // CardTrader Blueprint ID
    colors: text('colors'), // JSON array, Magic only (e.g. '["G","W"]')
    colorIdentity: text('color_identity'), // JSON array, Magic only (e.g. '["W"]')
    manaValue: real('mana_value'), // Magic only
    borderColor: text('border_color'), // Magic only (e.g. "black")
    finishes: text('finishes'), // JSON array (e.g. '["nonfoil","foil"]')

    // --- Flattened extendedData columns (from tcgcsv.com supplemental) ---
    // Cross-game
    cardType: text('card_type'), // Pokemon, Yu-Gi-Oh: "Card Type"
    subType: text('sub_type'), // Magic: "SubType" (creature type)
    oracleText: text('oracle_text'), // Magic: "OracleText" (rules text)
    cardText: text('card_text'), // Pokemon: "CardText"
    flavorText: text('flavor_text'), // Magic: "FlavorText"
    description: text('description'), // Yu-Gi-Oh: "Description"
    upc: text('upc'), // Pokemon, Yu-Gi-Oh: "UPC"
    // Magic-specific
    power: text('power'), // "P"
    toughness: text('toughness'), // "T"
    // Pokemon-specific
    hp: text('hp'), // "HP"
    stage: text('stage'), // "Stage"
    weakness: text('weakness'), // "Weakness"
    resistance: text('resistance'), // "Resistance"
    retreatCost: text('retreat_cost'), // "RetreatCost"
    attack1: text('attack_1'), // "Attack 1"
    attack2: text('attack_2'), // "Attack 2"
    // Yu-Gi-Oh-specific
    attack: text('attack'), // "Attack" (ATK value)
    attribute: text('attribute'), // "Attribute"
    defense: text('defense'), // "Defense" (DEF value)
    monsterType: text('monster_type'), // "MonsterType"
    linkArrows: text('link_arrows'), // "LinkArrows"
    linkRating: text('link_rating'), // "LinkRating"
  },
  (table) => [
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [category.id],
      name: 'product_category_id_fkey',
    }),
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [group.id],
      name: 'product_group_id_fkey',
    }),
    index('product_name_idx').on(table.name),
    index('product_clean_name_idx').on(table.cleanName),
    index('product_category_group_idx').on(table.categoryId, table.groupId),
    index('product_tcgp_product_id_idx').on(table.tcgpProductId),
    index('product_tcgp_category_id_idx').on(table.tcgpCategoryId),
    index('product_modified_on_idx').on(table.modifiedOn),
    index('product_image_count_idx').on(table.imageCount),
    // New indexes
    index('product_product_type_idx').on(table.productType),
    index('product_rarity_idx').on(table.rarity),
    index('product_rarity_display_idx').on(table.rarityDisplay),
    index('product_number_idx').on(table.number),
    index('product_scryfall_id_idx').on(table.scryfallId),
    index('product_cardtrader_id_idx').on(table.cardtraderId),
    index('product_upc_idx').on(table.upc),
  ],
);

// ---------------------------------------------------------------------------
// price (current pricing — both tcgtracking + tcgcsv fields)
// ---------------------------------------------------------------------------

export const price = sqliteTable(
  'price',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tcgpProductId: integer('tcgp_product_id').notNull(),
    lowPrice: integer('low_price'), // cents
    midPrice: integer('mid_price'), // cents
    highPrice: integer('high_price'), // cents
    marketPrice: integer('market_price'), // cents
    directLowPrice: integer('direct_low_price'), // cents
    subTypeName: text('sub_type_name').notNull(),
    productId: integer('product_id'),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: 'price_product_id_fkey',
    }),
    uniqueIndex('price_product_sub_type_idx').on(table.productId, table.subTypeName),
    index('price_product_id_idx').on(table.productId),
    index('price_tcgp_product_id_idx').on(table.tcgpProductId),
    index('price_market_price_idx').on(table.marketPrice),
    index('price_low_price_idx').on(table.lowPrice),
    index('price_sub_type_name_idx').on(table.subTypeName),
  ],
);

// ---------------------------------------------------------------------------
// productPresaleInfo (from tcgcsv.com)
// ---------------------------------------------------------------------------

export const productPresaleInfo = sqliteTable(
  'product_presale_info',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id').notNull(),
    isPresale: integer('is_presale', { mode: 'boolean' }).notNull(),
    releasedOn: integer('released_on', { mode: 'timestamp' }),
    note: text('note'),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: 'product_presale_info_product_id_fkey',
    }),
    index('product_presale_info_product_id_idx').on(table.productId),
    index('product_presale_info_is_presale_idx').on(table.isPresale),
  ],
);

// ---------------------------------------------------------------------------
// metadata
// ---------------------------------------------------------------------------

export const metadata = sqliteTable('metadata', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// ---------------------------------------------------------------------------
// manapoolPrice (from tcgtracking.com)
// ---------------------------------------------------------------------------

export const manapoolPrice = sqliteTable(
  'manapool_price',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id').notNull(),
    variant: text('variant').notNull(), // "normal", "foil", "etched"
    price: integer('price'), // cents
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: 'manapool_price_product_id_fkey',
    }),
    uniqueIndex('manapool_price_product_variant_idx').on(table.productId, table.variant),
    index('manapool_price_product_id_idx').on(table.productId),
  ],
);

// ---------------------------------------------------------------------------
// sku (from tcgtracking.com — per condition/variant/language)
// ---------------------------------------------------------------------------

export const sku = sqliteTable(
  'sku',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tcgpSkuId: integer('tcgp_sku_id').notNull().unique(),
    productId: integer('product_id').notNull(),
    condition: text('condition').notNull(), // NM/LP/MP/HP/DMG
    variant: text('variant').notNull(), // N/F (Normal/Foil)
    language: text('language').notNull(), // EN/JP/FR/DE/IT/ES/PT/RU/KO/CS/CT
    marketPrice: integer('market_price'), // cents
    lowPrice: integer('low_price'), // cents
    highPrice: integer('high_price'), // cents
    listingCount: integer('listing_count'),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: 'sku_product_id_fkey',
    }),
    index('sku_product_id_idx').on(table.productId),
    index('sku_product_condition_variant_idx').on(table.productId, table.condition, table.variant),
  ],
);

// ---------------------------------------------------------------------------
// cardtraderBlueprint (from tcgtracking.com — CardTrader marketplace data)
// ---------------------------------------------------------------------------

export const cardtraderBlueprint = sqliteTable(
  'cardtrader_blueprint',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cardtraderId: integer('cardtrader_id').notNull(), // CardTrader Blueprint ID
    productId: integer('product_id').notNull(),
    name: text('name'),
    matchType: text('match_type'), // "scryfall", "tcgplayer"
    matchConfidence: integer('match_confidence'),
    expansion: text('expansion'),
    expansionCode: text('expansion_code'),
    collectorNumber: text('collector_number'),
    rarity: text('rarity'),
    finishes: text('finishes'), // JSON array
    languages: text('languages'), // JSON array
    properties: text('properties'), // JSON array of property objects
    cardmarketIds: text('cardmarket_ids'), // JSON array of integers
    imageUrl: text('image_url'),
    scryfallId: text('scryfall_id'),
    tcgPlayerId: integer('tcg_player_id'),
    gameId: integer('game_id'),
    ctCategoryId: integer('ct_category_id'), // CardTrader's internal category
    ctCategoryName: text('ct_category_name'),
    productType: text('product_type'),
    ctGroupId: integer('ct_group_id'),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: 'cardtrader_blueprint_product_id_fkey',
    }),
    uniqueIndex('ct_blueprint_cardtrader_product_idx').on(table.cardtraderId, table.productId),
    index('ct_blueprint_product_id_idx').on(table.productId),
    index('ct_blueprint_cardtrader_id_idx').on(table.cardtraderId),
  ],
);

// ---------------------------------------------------------------------------
// priceHistory (changes-only daily price snapshots)
// ---------------------------------------------------------------------------

export const priceHistory = sqliteTable(
  'price_history',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id').notNull(),
    subTypeName: text('sub_type_name').notNull(),
    lowPrice: integer('low_price'), // cents
    midPrice: integer('mid_price'), // cents
    highPrice: integer('high_price'), // cents
    marketPrice: integer('market_price'), // cents
    directLowPrice: integer('direct_low_price'), // cents
    date: text('date').notNull(), // YYYY-MM-DD
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: 'price_history_product_id_fkey',
    }),
    uniqueIndex('price_history_product_sub_type_date_idx').on(table.productId, table.subTypeName, table.date),
  ],
);

// ---------------------------------------------------------------------------
// skuHistory (changes-only daily SKU snapshots — per-condition pricing)
// ---------------------------------------------------------------------------

export const skuHistory = sqliteTable(
  'sku_history',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    skuId: integer('sku_id').notNull(),
    productId: integer('product_id').notNull(),
    condition: text('condition').notNull(), // NM/LP/MP/HP/DMG
    variant: text('variant').notNull(), // N/F
    language: text('language').notNull(), // EN/JP/FR/etc.
    marketPrice: integer('market_price'), // cents
    lowPrice: integer('low_price'), // cents
    highPrice: integer('high_price'), // cents
    listingCount: integer('listing_count'),
    date: text('date').notNull(), // YYYY-MM-DD
  },
  (table) => [
    foreignKey({
      columns: [table.skuId],
      foreignColumns: [sku.id],
      name: 'sku_history_sku_id_fkey',
    }),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: 'sku_history_product_id_fkey',
    }),
    uniqueIndex('sku_history_sku_date_idx').on(table.skuId, table.date),
    index('sku_history_product_date_idx').on(table.productId, table.date),
    index('sku_history_product_condition_date_idx').on(table.productId, table.condition, table.date),
  ],
);

// ---------------------------------------------------------------------------
// priceHistoryLog (tracks which dates have been fully processed)
// ---------------------------------------------------------------------------

export const priceHistoryLog = sqliteTable('price_history_log', {
  date: text('date').primaryKey(), // YYYY-MM-DD
  source: text('source').notNull(), // 'tcgcsv_archive', 'tcgcsv_api', 'tcgtracking'
});
