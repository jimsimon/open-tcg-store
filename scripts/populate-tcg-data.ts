#!/usr/bin/env -S npx tsx

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SQL, getTableColumns, sql, eq, and, inArray } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { tcgData } from '../packages/api/src/db/tcg-data/index';
import {
  category as dbCategory,
  group as dbGroup,
  product as dbProduct,
  productPresaleInfo,
  price,
  manapoolPrice,
  sku as dbSku,
  cardtraderBlueprint,
  priceHistory,
  skuHistory,
  priceHistoryLog,
  metadata,
} from '../packages/api/src/db/tcg-data/schema';
import { mapRarity } from './lib/rarity';

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

const args = new Set(process.argv.slice(2));
const skipSupplemental = args.has('--skip-supplemental');
const skipSkus = args.has('--skip-skus');
const skipHistory = args.has('--skip-history');
const historyOnly = args.has('--history-only');

// ---------------------------------------------------------------------------
// Types — tcgtracking.com API responses
// ---------------------------------------------------------------------------

interface TcgTrackingCategory {
  id: number;
  name: string;
  display_name: string;
  product_count: number;
  set_count: number;
}

interface TcgTrackingCategoriesResponse {
  categories: TcgTrackingCategory[];
}

interface TcgTrackingSet {
  id: number;
  name: string;
  abbreviation: string;
  is_supplemental: boolean;
  published_on: string;
  modified_on: string;
  product_count: number;
  sku_count: number;
  products_modified: string | null;
  pricing_modified: string | null;
  skus_modified: string | null;
  api_url: string;
  pricing_url: string;
  skus_url: string;
}

interface TcgTrackingSetsResponse {
  category_id: number;
  category_name: string;
  sets: TcgTrackingSet[];
}

interface TcgTrackingCardTraderEntry {
  id: number;
  name: string;
  match_type: string;
  match_confidence: number;
  expansion: string;
  expansion_code: string;
  collector_number: string | null;
  rarity: string | null;
  finishes: string[];
  languages: string[];
  properties: { name: string; type: string; default_value: string; possible_values: (string | boolean)[] }[];
  cardmarket_ids: number[];
  image_url: string;
  scryfall_id: string | null;
  tcg_player_id: number;
  game_id: number;
  category_id: number;
  category_name: string;
  product_type: string;
  group_id: number;
}

interface TcgTrackingProduct {
  id: number;
  name: string;
  clean_name: string;
  number: string | null;
  rarity: string | null;
  image_url: string;
  image_count: number;
  tcgplayer_url: string;
  manapool_url: string | null;
  scryfall_id: string | null;
  mtgjson_uuid: string | null;
  cardmarket_id: number | null;
  cardtrader_id: number | null;
  cardtrader?: TcgTrackingCardTraderEntry[] | null;
  // Card-specific (absent on sealed products)
  colors?: string[];
  color_identity?: string[];
  mana_value?: number;
  border_color?: string;
  finishes?: string[];
}

interface TcgTrackingSetProductsResponse {
  set_id: number;
  set_name: string;
  set_abbr: string;
  products: TcgTrackingProduct[];
  pricing_url: string;
}

interface TcgTrackingPricingResponse {
  set_id: number;
  updated: string;
  prices: Record<
    string,
    {
      tcg?: Record<string, { low?: number; market?: number }>;
      manapool?: Record<string, number>;
      mp_qty?: number;
    }
  >;
}

interface TcgTrackingSkusResponse {
  set_id: number;
  updated: string;
  sku_count: number;
  product_count: number;
  products: Record<string, Record<string, { cnd: string; var: string; lng: string }>>;
}

// ---------------------------------------------------------------------------
// Types — tcgcsv.com API responses
// ---------------------------------------------------------------------------

interface TcgCsvCategory {
  categoryId: number;
  name: string;
  modifiedOn: string;
  displayName: string;
  seoCategoryName: string;
  categoryDescription: string;
  categoryPageTitle: string;
  sealedLabel: string;
  nonSealedLabel: string;
  conditionGuideUrl: string;
  isScannable: boolean;
  popularity: number;
  isDirect: boolean;
}

interface TcgCsvGroup {
  groupId: number;
  name: string;
  abbreviation: string | null;
  isSupplemental: boolean;
  publishedOn: string;
  modifiedOn: string;
  categoryId: number;
}

interface TcgCsvProduct {
  productId: number;
  name: string;
  cleanName: string;
  imageUrl: string;
  categoryId: number;
  groupId: number;
  url: string;
  modifiedOn: string;
  imageCount: number;
  presaleInfo: { isPresale: boolean; releasedOn: string; note: string };
  extendedData: { name: string; displayName: string; value: string }[] | null;
}

interface TcgCsvPrice {
  productId: number;
  midPrice: number | null;
  lowPrice: number | null;
  highPrice: number | null;
  marketPrice: number | null;
  directLowPrice: number | null;
  subTypeName: string;
}

interface ApiResponse<T> {
  results: T[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BATCH_SIZE = 500;
const TCGTRACKING_BASE = 'https://tcgtracking.com/tcgapi/v1';
const TCGCSV_BASE = 'https://tcgcsv.com/tcgplayer';
const TCGCSV_ARCHIVE_BASE = 'https://tcgcsv.com/archive/tcgplayer';
const EARLIEST_ARCHIVE_DATE = '2024-02-08';

/**
 * Per tcgcsv.com/faq — these categories should be skipped.
 */
const TCGCSV_CATEGORY_IDS_TO_SKIP = [21, 69, 70];

/**
 * Maps extendedData `name` values from tcgcsv.com to product column names.
 * Rarity and Number are skipped — they come from tcgtracking.com.
 */
const EXTENDED_DATA_COLUMN_MAP: Record<string, string> = {
  'Card Type': 'cardType',
  SubType: 'subType',
  OracleText: 'oracleText',
  CardText: 'cardText',
  FlavorText: 'flavorText',
  Description: 'description',
  UPC: 'upc',
  P: 'power',
  T: 'toughness',
  HP: 'hp',
  Stage: 'stage',
  Weakness: 'weakness',
  Resistance: 'resistance',
  RetreatCost: 'retreatCost',
  'Attack 1': 'attack1',
  'Attack 2': 'attack2',
  Attack: 'attack',
  Attribute: 'attribute',
  Defense: 'defense',
  MonsterType: 'monsterType',
  LinkArrows: 'linkArrows',
  LinkRating: 'linkRating',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function batchify<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

function buildConflictUpdateColumns<T extends SQLiteTable, Q extends keyof T['_']['columns']>(table: T, columns: Q[]) {
  const cls = getTableColumns(table);
  return columns.reduce(
    (acc, column) => {
      const colName = cls[column].name;
      acc[column] = sql.raw(`excluded.${colName}`);
      return acc;
    },
    {} as Record<Q, SQL>,
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'OpenTCGStore/2.0.0' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/** Get all dates between start and end (inclusive) as YYYY-MM-DD strings. */
function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ---------------------------------------------------------------------------
// Pre-built conflict update column sets
// ---------------------------------------------------------------------------

const categoryUpdateColumns = buildConflictUpdateColumns(dbCategory, [
  'name',
  'displayName',
  'seoCategoryName',
  'categoryDescription',
  'categoryPageTitle',
  'sealedLabel',
  'nonSealedLabel',
  'conditionGuideUrl',
  'isScannable',
  'popularity',
  'isDirect',
  'modifiedOn',
  'productCount',
  'setCount',
]);

const groupUpdateColumns = buildConflictUpdateColumns(dbGroup, [
  'tcgpCategoryId',
  'name',
  'abbreviation',
  'isSupplemental',
  'publishedOn',
  'modifiedOn',
  'categoryId',
]);

const productUpdateColumns = buildConflictUpdateColumns(dbProduct, [
  'tcgpGroupId',
  'tcgpCategoryId',
  'categoryId',
  'groupId',
  'name',
  'cleanName',
  'imageUrl',
  'url',
  'modifiedOn',
  'imageCount',
  'number',
  'rarity',
  'rarityDisplay',
  'productType',
  'tcgplayerUrl',
  'manapoolUrl',
  'scryfallId',
  'mtgjsonUuid',
  'cardmarketId',
  'cardtraderId',
  'colors',
  'colorIdentity',
  'manaValue',
  'borderColor',
  'finishes',
]);

// =========================================================================
// Stage 1: tcgtracking.com (primary source)
// =========================================================================

async function stage1_tcgtracking() {
  console.log('\n=== Stage 1: tcgtracking.com (primary source) ===\n');

  // --- Fetch and upsert categories ---
  const categoriesUrl = `${TCGTRACKING_BASE}/categories`;
  console.log(`Fetching categories: ${categoriesUrl}`);
  const categoriesData = await fetchJson<TcgTrackingCategoriesResponse>(categoriesUrl);
  const categories = categoriesData.categories.sort((a, b) => a.id - b.id);

  console.log(`Upserting ${categories.length} categories`);
  for (const batch of batchify(categories, BATCH_SIZE)) {
    await tcgData
      .insert(dbCategory)
      .values(
        batch.map((c) => ({
          tcgpCategoryId: c.id,
          name: c.name,
          displayName: c.display_name,
          seoCategoryName: c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          isScannable: false,
          isDirect: false,
          productCount: c.product_count,
          setCount: c.set_count,
        })),
      )
      .onConflictDoUpdate({
        target: dbCategory.tcgpCategoryId,
        set: {
          name: sql.raw('excluded.name'),
          displayName: sql.raw('excluded.display_name'),
          productCount: sql.raw('excluded.product_count'),
          setCount: sql.raw('excluded.set_count'),
        },
      });
  }

  // Build tcgpCategoryId → internal ID map
  const categoryIdMap = new Map<number, number>();
  const categoryRows = await tcgData
    .select({ id: dbCategory.id, tcgpCategoryId: dbCategory.tcgpCategoryId })
    .from(dbCategory);
  for (const row of categoryRows) {
    categoryIdMap.set(row.tcgpCategoryId, row.id);
  }

  // --- Process each category's sets and products ---
  for (const cat of categories) {
    const internalCategoryId = categoryIdMap.get(cat.id);
    if (internalCategoryId == null) continue;

    const setsUrl = `${TCGTRACKING_BASE}/${cat.id}/sets`;
    console.log(`Fetching sets for ${cat.name}: ${setsUrl}`);
    const setsData = await fetchJson<TcgTrackingSetsResponse>(setsUrl);
    const sets = setsData.sets.sort((a, b) => a.id - b.id);

    console.log(`Upserting ${sets.length} sets`);
    for (const batch of batchify(sets, BATCH_SIZE)) {
      await tcgData
        .insert(dbGroup)
        .values(
          batch.map((s) => ({
            tcgpGroupId: s.id,
            tcgpCategoryId: cat.id,
            name: s.name,
            abbreviation: s.abbreviation || '',
            isSupplemental: s.is_supplemental,
            publishedOn: s.published_on ? new Date(s.published_on) : null,
            modifiedOn: s.modified_on ? new Date(s.modified_on) : null,
            categoryId: internalCategoryId,
          })),
        )
        .onConflictDoUpdate({
          target: dbGroup.tcgpGroupId,
          set: groupUpdateColumns,
        });
    }

    // Build tcgpGroupId → internal ID map for this category
    const groupIdMap = new Map<number, number>();
    const groupRows = await tcgData
      .select({ id: dbGroup.id, tcgpGroupId: dbGroup.tcgpGroupId })
      .from(dbGroup)
      .where(eq(dbGroup.categoryId, internalCategoryId));
    for (const row of groupRows) {
      groupIdMap.set(row.tcgpGroupId, row.id);
    }

    // --- Process each set's products, pricing, and SKUs ---
    for (const set of sets) {
      if (set.product_count === 0) continue;

      const internalGroupId = groupIdMap.get(set.id);
      if (internalGroupId == null) continue;

      // --- Products ---
      const productsUrl = `${TCGTRACKING_BASE}/${cat.id}/sets/${set.id}`;
      console.log(`Fetching products for ${set.name}: ${productsUrl}`);
      const productsData = await fetchJson<TcgTrackingSetProductsResponse>(productsUrl);
      const products = productsData.products;

      if (products.length === 0) continue;

      console.log(`Upserting ${products.length} products`);
      for (const batch of batchify(products, BATCH_SIZE)) {
        await tcgData
          .insert(dbProduct)
          .values(
            batch.map((p) => ({
              tcgpProductId: p.id,
              tcgpGroupId: set.id,
              tcgpCategoryId: cat.id,
              name: p.name,
              cleanName: p.clean_name,
              imageUrl: p.image_url,
              imageCount: p.image_count,
              categoryId: internalCategoryId,
              groupId: internalGroupId,
              number: p.number,
              rarity: p.rarity,
              rarityDisplay: mapRarity(p.rarity),
              productType: p.rarity != null || p.number != null ? 'single' : 'sealed',
              tcgplayerUrl: p.tcgplayer_url,
              manapoolUrl: p.manapool_url,
              scryfallId: p.scryfall_id,
              mtgjsonUuid: p.mtgjson_uuid,
              cardmarketId: p.cardmarket_id,
              cardtraderId: p.cardtrader_id,
              colors: p.colors ? JSON.stringify(p.colors) : null,
              colorIdentity: p.color_identity ? JSON.stringify(p.color_identity) : null,
              manaValue: p.mana_value ?? null,
              borderColor: p.border_color ?? null,
              finishes: p.finishes ? JSON.stringify(p.finishes) : null,
            })),
          )
          .onConflictDoUpdate({
            target: dbProduct.tcgpProductId,
            set: productUpdateColumns,
          });
      }

      // Build tcgpProductId → internal ID map for this group
      const productIdMap = new Map<number, number>();
      const productRows = await tcgData
        .select({ id: dbProduct.id, tcgpProductId: dbProduct.tcgpProductId })
        .from(dbProduct)
        .where(eq(dbProduct.groupId, internalGroupId));
      for (const row of productRows) {
        productIdMap.set(row.tcgpProductId, row.id);
      }

      // --- CardTrader Blueprints ---
      const blueprintValues: (typeof cardtraderBlueprint.$inferInsert)[] = [];
      for (const p of products) {
        const internalProductId = productIdMap.get(p.id);
        if (internalProductId == null || !p.cardtrader) continue;
        for (const ct of p.cardtrader) {
          blueprintValues.push({
            cardtraderId: ct.id,
            productId: internalProductId,
            name: ct.name,
            matchType: ct.match_type,
            matchConfidence: ct.match_confidence,
            expansion: ct.expansion,
            expansionCode: ct.expansion_code,
            collectorNumber: ct.collector_number,
            rarity: ct.rarity,
            finishes: JSON.stringify(ct.finishes),
            languages: JSON.stringify(ct.languages),
            properties: JSON.stringify(ct.properties),
            cardmarketIds: JSON.stringify(ct.cardmarket_ids),
            imageUrl: ct.image_url,
            scryfallId: ct.scryfall_id,
            tcgPlayerId: ct.tcg_player_id,
            gameId: ct.game_id,
            ctCategoryId: ct.category_id,
            ctCategoryName: ct.category_name,
            productType: ct.product_type,
            ctGroupId: ct.group_id,
          });
        }
      }

      if (blueprintValues.length > 0) {
        const bpUpdateCols = buildConflictUpdateColumns(cardtraderBlueprint, [
          'name',
          'matchType',
          'matchConfidence',
          'expansion',
          'expansionCode',
          'collectorNumber',
          'rarity',
          'finishes',
          'languages',
          'properties',
          'cardmarketIds',
          'imageUrl',
          'scryfallId',
          'tcgPlayerId',
          'gameId',
          'ctCategoryId',
          'ctCategoryName',
          'productType',
          'ctGroupId',
        ]);
        for (const batch of batchify(blueprintValues, BATCH_SIZE)) {
          await tcgData
            .insert(cardtraderBlueprint)
            .values(batch)
            .onConflictDoUpdate({
              target: [cardtraderBlueprint.cardtraderId, cardtraderBlueprint.productId],
              set: bpUpdateCols,
            });
        }
      }

      // --- Pricing ---
      const pricingUrl = `${TCGTRACKING_BASE}/${cat.id}/sets/${set.id}/pricing`;
      console.log(`Fetching pricing: ${pricingUrl}`);
      const pricingData = await fetchJson<TcgTrackingPricingResponse>(pricingUrl);

      const priceValues: (typeof price.$inferInsert)[] = [];
      const mpValues: (typeof manapoolPrice.$inferInsert)[] = [];

      for (const [tcgpIdStr, pdata] of Object.entries(pricingData.prices)) {
        const tcgpId = Number(tcgpIdStr);
        const internalProductId = productIdMap.get(tcgpId);
        if (internalProductId == null) continue;

        // TCG prices (per subtype: Normal, Foil, etc.)
        // Some products only have manapool data with no tcg prices
        if (pdata.tcg) {
          for (const [subType, priceData] of Object.entries(pdata.tcg)) {
            priceValues.push({
              tcgpProductId: tcgpId,
              productId: internalProductId,
              subTypeName: subType,
              lowPrice: priceData.low != null ? Math.round(priceData.low * 100) : null,
              marketPrice: priceData.market != null ? Math.round(priceData.market * 100) : null,
            });
          }
        }

        // Manapool prices (per variant: normal, foil, etched)
        if (pdata.manapool) {
          for (const [variant, mpPrice] of Object.entries(pdata.manapool)) {
            mpValues.push({
              productId: internalProductId,
              variant,
              price: mpPrice != null ? Math.round(mpPrice * 100) : null,
            });
          }
        }
      }

      if (priceValues.length > 0) {
        console.log(`Upserting ${priceValues.length} prices`);
        for (const batch of batchify(priceValues, BATCH_SIZE)) {
          await tcgData
            .insert(price)
            .values(batch)
            .onConflictDoUpdate({
              target: [price.productId, price.subTypeName],
              set: {
                lowPrice: sql.raw('excluded.low_price'),
                marketPrice: sql.raw('excluded.market_price'),
                tcgpProductId: sql.raw('excluded.tcgp_product_id'),
              },
            });
        }
      }

      if (mpValues.length > 0) {
        for (const batch of batchify(mpValues, BATCH_SIZE)) {
          await tcgData
            .insert(manapoolPrice)
            .values(batch)
            .onConflictDoUpdate({
              target: [manapoolPrice.productId, manapoolPrice.variant],
              set: { price: sql.raw('excluded.price') },
            });
        }
      }

      // --- SKUs ---
      if (!skipSkus) {
        const skusUrl = `${TCGTRACKING_BASE}/${cat.id}/sets/${set.id}/skus`;
        console.log(`Fetching SKUs: ${skusUrl}`);
        const skusData = await fetchJson<TcgTrackingSkusResponse>(skusUrl);

        const skuValues: (typeof dbSku.$inferInsert)[] = [];
        for (const [tcgpIdStr, skuMap] of Object.entries(skusData.products)) {
          const tcgpId = Number(tcgpIdStr);
          const internalProductId = productIdMap.get(tcgpId);
          if (internalProductId == null) continue;

          for (const [skuIdStr, skuData] of Object.entries(skuMap)) {
            skuValues.push({
              tcgpSkuId: Number(skuIdStr),
              productId: internalProductId,
              condition: skuData.cnd,
              variant: skuData.var,
              language: skuData.lng,
            });
          }
        }

        if (skuValues.length > 0) {
          console.log(`Upserting ${skuValues.length} SKUs`);
          const skuUpdateCols = buildConflictUpdateColumns(dbSku, ['productId', 'condition', 'variant', 'language']);
          for (const batch of batchify(skuValues, BATCH_SIZE)) {
            await tcgData.insert(dbSku).values(batch).onConflictDoUpdate({
              target: dbSku.tcgpSkuId,
              set: skuUpdateCols,
            });
          }
        }
      }
    }
  }
}

// =========================================================================
// Stage 2: tcgcsv.com (supplemental data)
// =========================================================================

async function stage2_tcgcsv() {
  console.log('\n=== Stage 2: tcgcsv.com (supplemental data) ===\n');

  const unmappedKeys = new Set<string>();

  // --- Fetch and update categories ---
  const categoriesUrl = `${TCGCSV_BASE}/categories`;
  console.log(`Fetching categories: ${categoriesUrl}`);
  const categoriesData = await fetchJson<ApiResponse<TcgCsvCategory>>(categoriesUrl);
  const categories = categoriesData.results
    .filter((c) => !TCGCSV_CATEGORY_IDS_TO_SKIP.includes(c.categoryId))
    .sort((a, b) => a.categoryId - b.categoryId);

  console.log(`Updating ${categories.length} categories with supplemental data`);
  for (const batch of batchify(categories, BATCH_SIZE)) {
    await tcgData
      .insert(dbCategory)
      .values(
        batch.map((c) => ({
          tcgpCategoryId: c.categoryId,
          name: c.name,
          displayName: c.displayName,
          seoCategoryName: c.seoCategoryName,
          categoryDescription: c.categoryDescription,
          categoryPageTitle: c.categoryPageTitle,
          sealedLabel: c.sealedLabel,
          nonSealedLabel: c.nonSealedLabel,
          conditionGuideUrl: c.conditionGuideUrl,
          isScannable: c.isScannable,
          popularity: c.popularity,
          isDirect: c.isDirect,
          modifiedOn: new Date(c.modifiedOn),
        })),
      )
      .onConflictDoUpdate({
        target: dbCategory.tcgpCategoryId,
        set: categoryUpdateColumns,
      });
  }

  // Build tcgpCategoryId → internal ID map
  const categoryIdMap = new Map<number, number>();
  const categoryRows = await tcgData
    .select({ id: dbCategory.id, tcgpCategoryId: dbCategory.tcgpCategoryId })
    .from(dbCategory);
  for (const row of categoryRows) {
    categoryIdMap.set(row.tcgpCategoryId, row.id);
  }

  // --- Process each category ---
  for (const cat of categories) {
    const tcgpCategoryId = cat.categoryId;
    const internalCategoryId = categoryIdMap.get(tcgpCategoryId);
    if (internalCategoryId == null) continue;

    // Fetch groups
    const groupsUrl = `${TCGCSV_BASE}/${tcgpCategoryId}/groups`;
    console.log(`Fetching groups for ${cat.name}: ${groupsUrl}`);
    const groupsData = await fetchJson<ApiResponse<TcgCsvGroup>>(groupsUrl);
    const groups = groupsData.results.sort((a, b) => a.groupId - b.groupId);

    // Build group ID map
    const groupIdMap = new Map<number, number>();
    const groupRows = await tcgData
      .select({ id: dbGroup.id, tcgpGroupId: dbGroup.tcgpGroupId })
      .from(dbGroup)
      .where(eq(dbGroup.categoryId, internalCategoryId));
    for (const row of groupRows) {
      groupIdMap.set(row.tcgpGroupId, row.id);
    }

    for (const grp of groups) {
      const tcgpGroupId = grp.groupId;
      const internalGroupId = groupIdMap.get(tcgpGroupId);
      if (internalGroupId == null) continue;

      // --- Products ---
      const productsUrl = `${TCGCSV_BASE}/${tcgpCategoryId}/${tcgpGroupId}/products`;
      console.log(`Fetching products for ${grp.name}: ${productsUrl}`);
      const productsData = await fetchJson<ApiResponse<TcgCsvProduct>>(productsUrl);
      const products = productsData.results;

      if (products.length === 0) continue;

      // Build tcgpProductId → internal ID map
      const productIdMap = new Map<number, number>();
      const productRows = await tcgData
        .select({ id: dbProduct.id, tcgpProductId: dbProduct.tcgpProductId })
        .from(dbProduct)
        .where(eq(dbProduct.groupId, internalGroupId));
      for (const row of productRows) {
        productIdMap.set(row.tcgpProductId, row.id);
      }

      // Update products with supplemental fields + flatten extendedData
      for (const p of products) {
        const internalProductId = productIdMap.get(p.productId);
        if (internalProductId == null) continue;

        const updateData: Record<string, unknown> = {
          url: p.url,
          modifiedOn: new Date(p.modifiedOn),
          imageCount: p.imageCount,
        };

        // Flatten extendedData
        if (p.extendedData) {
          for (const ed of p.extendedData) {
            if (ed.name === 'Rarity' || ed.name === 'Number') continue;
            const col = EXTENDED_DATA_COLUMN_MAP[ed.name];
            if (col) {
              updateData[col] = ed.value;
            } else {
              unmappedKeys.add(ed.name);
            }
          }
        }

        await tcgData.update(dbProduct).set(updateData).where(eq(dbProduct.id, internalProductId));
      }

      // --- Presale Info ---
      const presaleInfoValues = products
        .map((p) => {
          const internalId = productIdMap.get(p.productId);
          if (internalId == null) return null;
          return {
            productId: internalId,
            isPresale: p.presaleInfo.isPresale,
            releasedOn: p.presaleInfo.releasedOn ? new Date(p.presaleInfo.releasedOn) : null,
            note: p.presaleInfo.note,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v != null);

      // Delete + reinsert presale info
      const internalIds = products.map((p) => productIdMap.get(p.productId)).filter((id): id is number => id != null);

      if (internalIds.length > 0) {
        for (const idBatch of batchify(internalIds, BATCH_SIZE)) {
          await tcgData.delete(productPresaleInfo).where(inArray(productPresaleInfo.productId, idBatch));
        }
        for (const batch of batchify(presaleInfoValues, BATCH_SIZE)) {
          await tcgData.insert(productPresaleInfo).values(batch);
        }
      }

      // --- Supplemental pricing (mid, high, directLow) ---
      const pricesUrl = `${TCGCSV_BASE}/${tcgpCategoryId}/${tcgpGroupId}/prices`;
      console.log(`Fetching supplemental prices: ${pricesUrl}`);
      const pricesData = await fetchJson<ApiResponse<TcgCsvPrice>>(pricesUrl);

      for (const p of pricesData.results) {
        const internalProductId = productIdMap.get(p.productId);
        if (internalProductId == null) continue;

        await tcgData
          .update(price)
          .set({
            midPrice: p.midPrice != null ? Math.round(p.midPrice * 100) : null,
            highPrice: p.highPrice != null ? Math.round(p.highPrice * 100) : null,
            directLowPrice: p.directLowPrice != null ? Math.round(p.directLowPrice * 100) : null,
          })
          .where(and(eq(price.productId, internalProductId), eq(price.subTypeName, p.subTypeName)));
      }
    }
  }

  // --- Report unmapped extendedData keys ---
  if (unmappedKeys.size > 0) {
    console.log(`\nUnmapped extendedData keys encountered: ${[...unmappedKeys].sort().join(', ')}`);
  } else {
    console.log('\nAll extendedData keys are mapped.');
  }
}

// =========================================================================
// Stage 3: Historical price backfill (TCGCSV archives)
// =========================================================================

async function stage3_historyBackfill() {
  console.log('\n=== Stage 3: Historical price backfill (TCGCSV archives) ===\n');

  // Check for 7z
  try {
    execFileSync('7z', ['--help'], { stdio: 'pipe' });
  } catch {
    throw new Error(
      '7z (p7zip) is required for historical price backfill. Install with:\n' +
        '  Ubuntu/Debian: sudo apt install p7zip-full\n' +
        '  macOS: brew install p7zip\n' +
        '  Alpine: apk add p7zip',
    );
  }

  // Build tcgpProductId → internal product.id map
  const productMap = new Map<number, number>();
  const productRows = await tcgData
    .select({ id: dbProduct.id, tcgpProductId: dbProduct.tcgpProductId })
    .from(dbProduct);
  for (const row of productRows) {
    productMap.set(row.tcgpProductId, row.id);
  }

  // Determine missing dates
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const completedRows = await tcgData.select({ date: priceHistoryLog.date }).from(priceHistoryLog);
  const completedDates = new Set(completedRows.map((r) => r.date));

  const allDates = getDateRange(EARLIEST_ARCHIVE_DATE, yesterdayStr);
  const missingDates = allDates.filter((d) => !completedDates.has(d));

  if (missingDates.length === 0) {
    console.log('No missing dates to backfill.');
    return;
  }

  console.log(`Backfilling ${missingDates.length} missing dates...`);

  // In-memory change-tracking map: (productId, subTypeName) → latest prices
  const latestPrices = new Map<
    string,
    { low: number | null; mid: number | null; high: number | null; market: number | null; directLow: number | null }
  >();

  // Seed the map from existing price_history (most recent entry per product+subtype)
  // This is only needed if we have some history already
  if (completedDates.size > 0) {
    const existingHistory = await tcgData
      .select({
        productId: priceHistory.productId,
        subTypeName: priceHistory.subTypeName,
        lowPrice: priceHistory.lowPrice,
        midPrice: priceHistory.midPrice,
        highPrice: priceHistory.highPrice,
        marketPrice: priceHistory.marketPrice,
        directLowPrice: priceHistory.directLowPrice,
        date: priceHistory.date,
      })
      .from(priceHistory)
      .orderBy(priceHistory.date);

    for (const row of existingHistory) {
      const key = `${row.productId}:${row.subTypeName}`;
      latestPrices.set(key, {
        low: row.lowPrice,
        mid: row.midPrice,
        high: row.highPrice,
        market: row.marketPrice,
        directLow: row.directLowPrice,
      });
    }
  }

  const tmpDir = join(process.cwd(), 'sqlite-data', 'tmp');
  mkdirSync(tmpDir, { recursive: true });

  let backfilledCount = 0;
  let changesRecorded = 0;

  for (const date of missingDates) {
    const archiveUrl = `${TCGCSV_ARCHIVE_BASE}/prices-${date}.ppmd.7z`;
    const archivePath = join(tmpDir, `prices-${date}.ppmd.7z`);
    const extractDir = join(tmpDir, date);

    try {
      // Download archive
      const response = await fetch(archiveUrl, {
        headers: { 'User-Agent': 'OpenTCGStore/2.0.0' },
      });
      if (!response.ok) {
        console.log(`Skipping ${date}: HTTP ${response.status}`);
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      writeFileSync(archivePath, Buffer.from(arrayBuffer));

      // Extract
      execFileSync('7z', ['x', archivePath, `-o${extractDir}`, '-y'], { stdio: 'pipe' });

      // Process all price files in the extracted archive
      const dateDirPath = join(extractDir, date);
      if (!existsSync(dateDirPath)) {
        console.log(`Skipping ${date}: no data directory in archive`);
        rmSync(extractDir, { recursive: true, force: true });
        try {
          rmSync(archivePath, { force: true });
        } catch {
          /* ignore */
        }
        continue;
      }

      const historyBatch: (typeof priceHistory.$inferInsert)[] = [];

      const catDirs = readdirSync(dateDirPath);
      for (const catDir of catDirs) {
        const catPath = join(dateDirPath, catDir);
        const groupDirs = readdirSync(catPath);
        for (const groupDir of groupDirs) {
          const pricesFilePath = join(catPath, groupDir, 'prices');
          if (!existsSync(pricesFilePath)) continue;

          const content = readFileSync(pricesFilePath, 'utf-8');
          const data = JSON.parse(content) as ApiResponse<TcgCsvPrice>;

          for (const entry of data.results) {
            const internalProductId = productMap.get(entry.productId);
            if (internalProductId == null) continue;

            const key = `${internalProductId}:${entry.subTypeName}`;
            const prev = latestPrices.get(key);

            const low = entry.lowPrice != null ? Math.round(entry.lowPrice * 100) : null;
            const mid = entry.midPrice != null ? Math.round(entry.midPrice * 100) : null;
            const high = entry.highPrice != null ? Math.round(entry.highPrice * 100) : null;
            const market = entry.marketPrice != null ? Math.round(entry.marketPrice * 100) : null;
            const directLow = entry.directLowPrice != null ? Math.round(entry.directLowPrice * 100) : null;

            const changed =
              !prev ||
              prev.low !== low ||
              prev.mid !== mid ||
              prev.high !== high ||
              prev.market !== market ||
              prev.directLow !== directLow;

            if (changed) {
              historyBatch.push({
                productId: internalProductId,
                subTypeName: entry.subTypeName,
                lowPrice: low,
                midPrice: mid,
                highPrice: high,
                marketPrice: market,
                directLowPrice: directLow,
                date,
              });
              latestPrices.set(key, { low, mid, high, market, directLow });
            }
          }
        }
      }

      // Insert history batch
      if (historyBatch.length > 0) {
        for (const batch of batchify(historyBatch, BATCH_SIZE)) {
          await tcgData.insert(priceHistory).values(batch).onConflictDoNothing();
        }
        changesRecorded += historyBatch.length;
      }

      // Mark date as complete
      await tcgData.insert(priceHistoryLog).values({ date, source: 'tcgcsv_archive' }).onConflictDoNothing();
      backfilledCount++;

      // Cleanup temp files for this date
      rmSync(extractDir, { recursive: true, force: true });
      try {
        rmSync(archivePath, { force: true });
      } catch {
        /* ignore */
      }
    } catch (err) {
      // Parse/DB errors are fatal — clean up and re-throw
      rmSync(extractDir, { recursive: true, force: true });
      try {
        rmSync(archivePath, { force: true });
      } catch {
        /* ignore */
      }
      throw err;
    }
  }

  // Clean up tmp directory
  rmSync(tmpDir, { recursive: true, force: true });

  console.log(`Backfilled ${backfilledCount} dates, ${changesRecorded} price changes recorded`);
}

// =========================================================================
// Stage 4: Daily snapshot capture
// =========================================================================

async function stage4_dailyCapture() {
  console.log('\n=== Stage 4: Daily snapshot capture ===\n');

  const today = todayDateString();

  // Check if today is already captured
  const existing = await tcgData
    .select({ date: priceHistoryLog.date })
    .from(priceHistoryLog)
    .where(eq(priceHistoryLog.date, today));

  if (existing.length > 0) {
    console.log(`${today} already captured, skipping.`);
    return;
  }

  // --- Price history ---
  console.log('Capturing price history...');

  const allCurrentPrices = await tcgData
    .select({
      productId: price.productId,
      subTypeName: price.subTypeName,
      lowPrice: price.lowPrice,
      midPrice: price.midPrice,
      highPrice: price.highPrice,
      marketPrice: price.marketPrice,
      directLowPrice: price.directLowPrice,
    })
    .from(price);

  // Get only the most recent history entry per (productId, subTypeName)
  // Uses a correlated subquery to find the max date per group
  const recentHistoryRows = await tcgData
    .select({
      productId: priceHistory.productId,
      subTypeName: priceHistory.subTypeName,
      lowPrice: priceHistory.lowPrice,
      midPrice: priceHistory.midPrice,
      highPrice: priceHistory.highPrice,
      marketPrice: priceHistory.marketPrice,
      directLowPrice: priceHistory.directLowPrice,
    })
    .from(priceHistory)
    .where(
      sql`${priceHistory.date} = (
        SELECT MAX(ph2.date) FROM ${priceHistory} ph2
        WHERE ph2.product_id = ${priceHistory.productId}
          AND ph2.sub_type_name = ${priceHistory.subTypeName}
      )`,
    );

  // Build the latest history map (now only one row per key)
  const latestHistoryMap = new Map<string, (typeof recentHistoryRows)[0]>();
  for (const row of recentHistoryRows) {
    const key = `${row.productId}:${row.subTypeName}`;
    latestHistoryMap.set(key, row);
  }

  const priceHistoryBatch: (typeof priceHistory.$inferInsert)[] = [];
  for (const p of allCurrentPrices) {
    if (p.productId == null) continue;
    const key = `${p.productId}:${p.subTypeName}`;
    const prev = latestHistoryMap.get(key);

    const changed =
      !prev ||
      prev.lowPrice !== p.lowPrice ||
      prev.midPrice !== p.midPrice ||
      prev.highPrice !== p.highPrice ||
      prev.marketPrice !== p.marketPrice ||
      prev.directLowPrice !== p.directLowPrice;

    if (changed) {
      priceHistoryBatch.push({
        productId: p.productId,
        subTypeName: p.subTypeName,
        lowPrice: p.lowPrice,
        midPrice: p.midPrice,
        highPrice: p.highPrice,
        marketPrice: p.marketPrice,
        directLowPrice: p.directLowPrice,
        date: today,
      });
    }
  }

  if (priceHistoryBatch.length > 0) {
    console.log(`Inserting ${priceHistoryBatch.length} price history changes`);
    for (const batch of batchify(priceHistoryBatch, BATCH_SIZE)) {
      await tcgData.insert(priceHistory).values(batch).onConflictDoNothing();
    }
  }

  // --- SKU history ---
  if (!skipSkus) {
    console.log('Capturing SKU history...');

    const allSkus = await tcgData
      .select({
        id: dbSku.id,
        productId: dbSku.productId,
        condition: dbSku.condition,
        variant: dbSku.variant,
        language: dbSku.language,
        marketPrice: dbSku.marketPrice,
        lowPrice: dbSku.lowPrice,
        highPrice: dbSku.highPrice,
        listingCount: dbSku.listingCount,
      })
      .from(dbSku);

    // Get only the most recent sku_history entry per sku_id
    const recentSkuHistory = await tcgData
      .select({
        skuId: skuHistory.skuId,
        marketPrice: skuHistory.marketPrice,
        lowPrice: skuHistory.lowPrice,
        highPrice: skuHistory.highPrice,
        listingCount: skuHistory.listingCount,
      })
      .from(skuHistory)
      .where(
        sql`${skuHistory.date} = (
          SELECT MAX(sh2.date) FROM ${skuHistory} sh2
          WHERE sh2.sku_id = ${skuHistory.skuId}
        )`,
      );

    const latestSkuMap = new Map<number, (typeof recentSkuHistory)[0]>();
    for (const row of recentSkuHistory) {
      latestSkuMap.set(row.skuId, row);
    }

    const skuHistoryBatch: (typeof skuHistory.$inferInsert)[] = [];
    for (const s of allSkus) {
      const prev = latestSkuMap.get(s.id);
      const changed =
        !prev ||
        prev.marketPrice !== s.marketPrice ||
        prev.lowPrice !== s.lowPrice ||
        prev.highPrice !== s.highPrice ||
        prev.listingCount !== s.listingCount;

      if (changed) {
        skuHistoryBatch.push({
          skuId: s.id,
          productId: s.productId,
          condition: s.condition,
          variant: s.variant,
          language: s.language,
          marketPrice: s.marketPrice,
          lowPrice: s.lowPrice,
          highPrice: s.highPrice,
          listingCount: s.listingCount,
          date: today,
        });
      }
    }

    if (skuHistoryBatch.length > 0) {
      console.log(`Inserting ${skuHistoryBatch.length} SKU history changes`);
      for (const batch of batchify(skuHistoryBatch, BATCH_SIZE)) {
        await tcgData.insert(skuHistory).values(batch).onConflictDoNothing();
      }
    }
  }

  // Mark today as complete (commit marker for the entire date)
  await tcgData.insert(priceHistoryLog).values({ date: today, source: 'tcgcsv_api' }).onConflictDoNothing();
  console.log(`Daily capture complete for ${today}`);
}

// =========================================================================
// Main
// =========================================================================

async function main() {
  if (!historyOnly) {
    await stage1_tcgtracking();

    if (!skipSupplemental) {
      await stage2_tcgcsv();
    }
  }

  if (!skipHistory) {
    await stage3_historyBackfill();
    await stage4_dailyCapture();
  }

  // Record creation timestamp
  const createdAt = new Date().toISOString();
  await tcgData
    .insert(metadata)
    .values({ key: 'created_at', value: createdAt })
    .onConflictDoUpdate({ target: metadata.key, set: { value: createdAt } });
  console.log(`Recorded created_at: ${createdAt}`);

  // Finalize for xdelta3 compatibility: ensure no WAL/SHM files
  await tcgData.run(sql`PRAGMA journal_mode=DELETE`);

  console.log('\nDone!');
}

main().catch((error) => {
  console.error('Error populating TCG data:', error);
  process.exit(1);
});
