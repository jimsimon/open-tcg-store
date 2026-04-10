#!/usr/bin/env -S npx tsx

import { SQL, getTableColumns, sql, inArray } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { tcgData } from '../packages/api/src/db/tcg-data/index';
import {
  category as dbCategory,
  group as dbGroup,
  product as dbProduct,
  productPresaleInfo,
  productExtendedData,
  price,
} from '../packages/api/src/db/tcg-data/schema';
import { mapRarity } from './lib/rarity';

// ---------------------------------------------------------------------------
// Types for the API responses
// ---------------------------------------------------------------------------

interface Category {
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

interface Group {
  groupId: number;
  name: string;
  abbreviation: string | null;
  isSupplemental: boolean;
  publishedOn: string;
  modifiedOn: string;
  categoryId: number;
}

interface Product {
  productId: number;
  name: string;
  cleanName: string;
  imageUrl: string;
  categoryId: number;
  groupId: number;
  url: string;
  modifiedOn: string;
  imageCount: number;
  presaleInfo: {
    isPresale: boolean;
    releasedOn: string;
    note: string;
  };
  extendedData: ExtendedData[] | null;
}

interface ExtendedData {
  name: string;
  displayName: string;
  value: string;
}

interface Price {
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

const MAGIC_CATEGORY_ID = 1;
const BATCH_SIZE = 500;

/**
 * Per //tcgcsv.com/faq#missing-categories:
 *
 * Category 21 is My Little Pony, but Category 28 is My Little Pony CCG. Category 21 does not have any groups and has been mostly removed from TCGplayer's side. You want Category 28 instead.
 *
 * Categories 69 and 70 indicate that TCGplayer attempted to categorize comic books at one point... and then stopped. Unlike category 21, these two categories have 1000's of groups available, however every group is empty (no products). These empty product-lists are not available to save on processing time.
 *
 * For these reasons, I would strongly suggest skipping categories 21, 69, and 70 when processing all categories.
 */
const categoryIdsToSkip = [21, 69, 70];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Split an array into batches of a given size. */
function batchify<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

/**
 * Build an object that maps each column key to `excluded.<column_name>`,
 * for use as the `set` in `onConflictDoUpdate`.
 */
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

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
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
]);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function populateTcgData() {
  const isFresh = process.argv.includes('--fresh');

  if (isFresh) {
    console.log('--fresh flag detected: truncating all tables before inserting');
    // Delete child tables first to respect foreign key constraints
    await tcgData.delete(productExtendedData);
    await tcgData.delete(productPresaleInfo);
    await tcgData.delete(price);
    await tcgData.delete(dbProduct);
    await tcgData.delete(dbGroup);
    await tcgData.delete(dbCategory);
    console.log('All tables truncated');
  }

  // --- Fetch and upsert categories ------------------------------------------

  const categoriesUrl = 'https://tcgcsv.com/tcgplayer/categories';
  console.log(`Fetching categories: ${categoriesUrl}`);
  const categoriesData = await fetchJson<ApiResponse<Category>>(categoriesUrl);
  const categories = categoriesData.results.filter((c) => !categoryIdsToSkip.includes(c.categoryId));

  console.log(`Upserting ${categories.length} categories`);
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

  // Build tcgpCategoryId -> internal ID map
  const categoryIdMap = new Map<number, number>();
  const categoryRows = await tcgData
    .select({ id: dbCategory.id, tcgpCategoryId: dbCategory.tcgpCategoryId })
    .from(dbCategory);
  for (const row of categoryRows) {
    categoryIdMap.set(row.tcgpCategoryId, row.id);
  }

  // --- Process each category's groups and products --------------------------

  for (const category of categories) {
    const { categoryId: tcgpCategoryId } = category;
    const internalCategoryId = categoryIdMap.get(tcgpCategoryId);
    if (internalCategoryId == null) {
      throw new Error(
        `No internal ID found for category "${category.name}" (tcgpCategoryId=${tcgpCategoryId}). This should not happen.`,
      );
    }

    const groupsUrl = `https://tcgcsv.com/tcgplayer/${tcgpCategoryId}/groups`;
    console.log(`Fetching groups for ${category.name}: ${groupsUrl}`);
    const groupsData = await fetchJson<ApiResponse<Group>>(groupsUrl);
    const groups = groupsData.results;

    console.log(`Upserting ${groups.length} groups`);
    for (const batch of batchify(groups, BATCH_SIZE)) {
      await tcgData
        .insert(dbGroup)
        .values(
          batch.map((g) => ({
            tcgpGroupId: g.groupId,
            tcgpCategoryId: g.categoryId,
            name: g.name,
            abbreviation: g.abbreviation ?? '',
            isSupplemental: g.isSupplemental,
            publishedOn: new Date(g.publishedOn),
            modifiedOn: new Date(g.modifiedOn),
            categoryId: internalCategoryId,
          })),
        )
        .onConflictDoUpdate({
          target: dbGroup.tcgpGroupId,
          set: groupUpdateColumns,
        });
    }

    // Build tcgpGroupId -> internal ID map for this category's groups
    const groupIdMap = new Map<number, number>();
    const groupRows = await tcgData
      .select({ id: dbGroup.id, tcgpGroupId: dbGroup.tcgpGroupId })
      .from(dbGroup)
      .where(sql`${dbGroup.categoryId} = ${internalCategoryId}`);
    for (const row of groupRows) {
      groupIdMap.set(row.tcgpGroupId, row.id);
    }

    // --- Process each group's products and prices ---------------------------

    for (const group of groups) {
      const tcgpGroupId = group.groupId;
      const internalGroupId = groupIdMap.get(tcgpGroupId);
      if (internalGroupId == null) {
        throw new Error(
          `No internal ID found for group "${group.name}" (tcgpGroupId=${tcgpGroupId}). This should not happen.`,
        );
      }

      // Fetch products
      const productsUrl = `https://tcgcsv.com/tcgplayer/${tcgpCategoryId}/${tcgpGroupId}/products`;
      console.log(`Fetching products for group ${group.name}: ${productsUrl}`);
      const productsData = await fetchJson<ApiResponse<Product>>(productsUrl);
      const products = productsData.results;

      if (products.length === 0) {
        console.log('No products found');
        continue;
      }

      // Upsert products
      console.log(`Upserting ${products.length} products`);
      for (const batch of batchify(products, BATCH_SIZE)) {
        await tcgData
          .insert(dbProduct)
          .values(
            batch.map((p) => ({
              tcgpProductId: p.productId,
              tcgpGroupId: tcgpGroupId,
              tcgpCategoryId: tcgpCategoryId,
              name: p.name,
              cleanName: p.cleanName,
              imageUrl: p.imageUrl,
              categoryId: internalCategoryId,
              groupId: internalGroupId,
              url: p.url,
              modifiedOn: new Date(p.modifiedOn),
              imageCount: p.imageCount,
            })),
          )
          .onConflictDoUpdate({
            target: dbProduct.tcgpProductId,
            set: productUpdateColumns,
          });
      }

      // Build tcgpProductId -> internal product ID map for this group
      const tcgpProductIdToInternalId = new Map<number, number>();
      const productRows = await tcgData
        .select({ id: dbProduct.id, tcgpProductId: dbProduct.tcgpProductId })
        .from(dbProduct)
        .where(sql`${dbProduct.groupId} = ${internalGroupId}`);
      for (const row of productRows) {
        tcgpProductIdToInternalId.set(row.tcgpProductId, row.id);
      }

      // Collect internal IDs for products we just upserted
      const internalIds = products
        .map((p) => tcgpProductIdToInternalId.get(p.productId))
        .filter((id): id is number => id != null);

      // Fetch prices before deleting any child records so a fetch failure
      // doesn't cause data loss in the incremental upsert case.
      const pricesUrl = `https://tcgcsv.com/tcgplayer/${tcgpCategoryId}/${tcgpGroupId}/prices`;
      console.log(`Fetching prices: ${pricesUrl}`);
      const pricesData = await fetchJson<ApiResponse<Price>>(pricesUrl);
      const groupPrices = pricesData.results;

      // Prepare child record values before the transaction
      const presaleInfoValues = products
        .map((p) => {
          const internalId = tcgpProductIdToInternalId.get(p.productId);
          if (internalId == null) return null;
          return {
            productId: internalId,
            isPresale: p.presaleInfo.isPresale,
            releasedOn: p.presaleInfo.releasedOn ? new Date(p.presaleInfo.releasedOn) : null,
            note: p.presaleInfo.note,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v != null);

      const extendedDataValues: (typeof productExtendedData.$inferInsert)[] = [];
      for (const p of products) {
        const internalId = tcgpProductIdToInternalId.get(p.productId);
        if (internalId == null) continue;
        for (const ed of p.extendedData ?? []) {
          const value = ed.name === 'Rarity' && tcgpCategoryId === MAGIC_CATEGORY_ID ? mapRarity(ed.value)! : ed.value;
          extendedDataValues.push({
            productId: internalId,
            name: ed.name,
            displayName: ed.displayName,
            value,
          });
        }
      }

      const priceValues = groupPrices
        .map((p) => {
          const internalId = tcgpProductIdToInternalId.get(p.productId);
          if (internalId == null) return null;
          return {
            tcgpProductId: p.productId,
            productId: internalId,
            lowPrice: p.lowPrice,
            midPrice: p.midPrice,
            highPrice: p.highPrice,
            marketPrice: p.marketPrice,
            directLowPrice: p.directLowPrice,
            subTypeName: p.subTypeName,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v != null);

      // Delete and re-insert child records atomically so a mid-process
      // crash can't leave products without their child data.
      await tcgData.transaction(async (tx) => {
        for (const idBatch of batchify(internalIds, BATCH_SIZE)) {
          await tx.delete(price).where(inArray(price.productId, idBatch));
          await tx.delete(productPresaleInfo).where(inArray(productPresaleInfo.productId, idBatch));
          await tx.delete(productExtendedData).where(inArray(productExtendedData.productId, idBatch));
        }

        for (const batch of batchify(presaleInfoValues, BATCH_SIZE)) {
          await tx.insert(productPresaleInfo).values(batch);
        }

        for (const batch of batchify(extendedDataValues, BATCH_SIZE)) {
          await tx.insert(productExtendedData).values(batch);
        }

        if (priceValues.length > 0) {
          console.log(`Inserting ${groupPrices.length} prices`);
          for (const batch of batchify(priceValues, BATCH_SIZE)) {
            await tx.insert(price).values(batch);
          }
        } else {
          console.log('No prices found');
        }
      });
    }
  }

  console.log('\nDone!');
}

// Run the script
populateTcgData().catch((error) => {
  console.error('Error populating TCG data:', error);
  process.exit(1);
});
