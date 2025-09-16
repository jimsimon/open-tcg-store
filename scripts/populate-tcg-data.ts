#!/usr/bin/env -S npx tsx

import {
  otcgs,
  category as dbCategory,
  group as dbGroup,
  product as dbProduct,
  productPresaleInfo,
  productExtendedData,
  price,
} from "../packages/api/src/db/index";

// Types for the API responses
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
  abbreviation: string;
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
  extendedData: ExtendedData[];
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

const MAGIC_CATEGORY_ID = 1;
const POKEMON_CATEGORY_ID = 3;

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
const categoryIdsToProcess = [MAGIC_CATEGORY_ID, POKEMON_CATEGORY_ID];

async function fetchTcgData() {
  try {
    const categoriesUrl = "https://tcgcsv.com/tcgplayer/categories";
    console.log(`Fetching categories: ${categoriesUrl}`);
    const categoriesResponse = await fetch(categoriesUrl);
    if (!categoriesResponse.ok) {
      throw new Error(`Failed to fetch categories: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
    }
    const categoriesData: ApiResponse<Category> = await categoriesResponse.json();
    const allCategories = categoriesData.results;
    const categoriesToProcess = allCategories.filter(
      (c) => !categoryIdsToSkip.includes(c.categoryId) && categoryIdsToProcess.includes(c.categoryId),
    );

    for (const category of categoriesToProcess) {
      const { categoryId } = category;
      console.log(`Creating category for: ${category.name}`);
      const [{ insertedCategoryId }] = await otcgs
        .insert(dbCategory)
        .values({
          tcgpCategoryId: category.categoryId,
          name: category.name,
          modifiedOn: new Date(category.modifiedOn),
          displayName: category.displayName,
          seoCategoryName: category.seoCategoryName,
          categoryDescription: category.categoryDescription,
          categoryPageTitle: category.categoryPageTitle,
          sealedLabel: category.sealedLabel,
          nonSealedLabel: category.nonSealedLabel,
          conditionGuideUrl: category.conditionGuideUrl,
          isScannable: category.isScannable,
          popularity: category.popularity,
          isDirect: category.isDirect,
        })
        .returning({ insertedCategoryId: dbCategory.id });

      const groupsUrl = `https://tcgcsv.com/tcgplayer/${categoryId}/groups`;
      console.log(`Fetching groups for ${category.name}: ${groupsUrl}`);
      const groupsResponse = await fetch(groupsUrl);

      if (!groupsResponse.ok) {
        throw new Error(`Failed to fetch groups: ${groupsResponse.status} ${groupsResponse.statusText}`);
      }

      const groupsData: ApiResponse<Group> = await groupsResponse.json();
      const allGroups = groupsData.results;

      console.log(`Processing ${allGroups.length} groups`);

      for (const group of allGroups) {
        const groupId = group.groupId;

        console.log(`Creating group: ${group.name}`);
        const [{ insertedGroupId }] = await otcgs
          .insert(dbGroup)
          .values({
            tcgpGroupId: group.groupId,
            tcgpCategoryId: group.categoryId,
            name: group.name,
            abbreviation: group.abbreviation,
            isSupplemental: group.isSupplemental,
            publishedOn: new Date(group.publishedOn),
            modifiedOn: new Date(group.modifiedOn),
            categoryId: insertedCategoryId,
          })
          .returning({ insertedGroupId: dbGroup.id });

        // Fetch products for this group
        const productsUrl = `https://tcgcsv.com/tcgplayer/${categoryId}/${groupId}/products`;
        console.log(`Fetching products for group ${group.name}: ${productsUrl}`);
        const productsResponse = await fetch(productsUrl);

        if (!productsResponse.ok) {
          console.error(`Failed to fetch products for group ${groupId}: ${productsResponse.status}`);
          continue;
        }

        const productsData: ApiResponse<Product> = await productsResponse.json();
        const products = productsData.results;

        if (products.length === 0) {
          console.log("No products found");
          continue;
        }
        console.log(`Creating ${products.length} products`);
        const insertableProducts = products.map<typeof dbProduct.$inferInsert>((p) => {
          return {
            tcgpCategoryId: insertedCategoryId,
            tcgpGroupId: insertedGroupId,
            tcgpProductId: p.productId,
            name: p.name,
            cleanName: p.cleanName,
            imageUrl: p.imageUrl,
            categoryId: insertedCategoryId,
            groupId: insertedGroupId,
            url: p.url,
            modifiedOn: new Date(p.modifiedOn),
            imageCount: p.imageCount,
            isPresale: p.presaleInfo.isPresale,
            releasedOn: p.presaleInfo.releasedOn ? new Date(p.presaleInfo.releasedOn) : null,
            presaleNote: p.presaleInfo.note,
          };
        });

        const tcgpProductIdToProductIdMap: Record<number, number> = {};
        let insertedProductCount = 0;
        while (insertedProductCount < insertableProducts.length) {
          const insertableProductBatch = insertableProducts.slice(insertedProductCount, insertedProductCount + 1000);
          const insertedProductDetails = await otcgs.insert(dbProduct).values(insertableProductBatch).returning({
            insertedProductId: dbProduct.id,
            tcgpProductId: dbProduct.tcgpProductId,
          });
          insertedProductCount += insertedProductDetails.length;

          insertedProductDetails.forEach((product) => {
            tcgpProductIdToProductIdMap[product.tcgpProductId] = product.insertedProductId;
          });
        }

        const insertablePresaleInfo = products.map<typeof productPresaleInfo.$inferInsert>((p) => {
          return {
            productId: tcgpProductIdToProductIdMap[p.productId],
            isPresale: p.presaleInfo.isPresale,
            releasedOn: p.presaleInfo.releasedOn ? new Date(p.presaleInfo.releasedOn) : null,
            note: p.presaleInfo.note,
          };
        });
        await otcgs.insert(productPresaleInfo).values(insertablePresaleInfo);

        const insertableExtendedData = products.reduce(
          (array, product) => {
            const extendedData = product.extendedData.map<typeof productExtendedData.$inferInsert>((ed) => {
              return {
                productId: tcgpProductIdToProductIdMap[product.productId],
                name: ed.name,
                displayName: ed.displayName,
                value: ed.value,
              };
            });
            array.push(...extendedData);
            return array;
          },
          [] as (typeof productExtendedData.$inferInsert)[],
        );

        let insertedExtendedDataCount = 0;
        while (insertedExtendedDataCount < insertableExtendedData.length) {
          const insertableExtendedDataBatch = insertableExtendedData.slice(
            insertedExtendedDataCount,
            insertedExtendedDataCount + 1000,
          );
          await otcgs.insert(productExtendedData).values(insertableExtendedDataBatch);
          insertedExtendedDataCount += insertableExtendedDataBatch.length;
        }

        // Fetch prices for this group
        const pricesUrl = `https://tcgcsv.com/tcgplayer/${categoryId}/${groupId}/prices`;
        console.log(`Fetching prices: ${pricesUrl}`);
        const pricesResponse = await fetch(`https://tcgcsv.com/tcgplayer/${categoryId}/${groupId}/prices`);

        if (!pricesResponse.ok) {
          console.error(`Failed to fetch prices for group ${groupId}: ${pricesResponse.status}`);
          continue;
        }

        const pricesData: ApiResponse<Price> = await pricesResponse.json();
        const prices = pricesData.results;

        if (prices.length > 0) {
          console.log(`Creating ${prices.length} prices`);
          const insertablePrices = prices.map<typeof price.$inferInsert>((p) => {
            return {
              tcgpProductId: p.productId,
              lowPrice: p.lowPrice,
              midPrice: p.midPrice,
              highPrice: p.highPrice,
              productId: tcgpProductIdToProductIdMap[p.productId],
              marketPrice: p.marketPrice,
              directLowPrice: p.directLowPrice,
              subTypeName: p.subTypeName,
            };
          });
          let insertedPricesCount = 0;
          while (insertedPricesCount < insertablePrices.length) {
            const insertablePricesBatch = insertablePrices.slice(insertedPricesCount, insertedPricesCount + 1000);
            await otcgs.insert(price).values(insertablePricesBatch);
            insertedPricesCount += insertablePricesBatch.length;
          }
        } else {
          console.log(`No prices found`);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching TCG data:", error);
    process.exit(1);
  }
}

// Run the script
fetchTcgData();
