import { sqliteTable, text, integer, real, foreignKey, index } from "drizzle-orm/sqlite-core";
export * from "./relations"

export const category = sqliteTable(
  "category",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tcgpCategoryId: integer("tcgp_category_id").notNull().unique(),
    name: text("name").notNull(),
    displayName: text("display_name").notNull(),
    seoCategoryName: text("seo_category_name").notNull(),
    categoryDescription: text("category_description"),
    categoryPageTitle: text("category_page_title"),
    sealedLabel: text("sealed_label"),
    nonSealedLabel: text("non_sealed_label"),
    conditionGuideUrl: text("condition_guide_url"),
    isScannable: integer("is_scannable", { mode: "boolean" }).notNull(),
    popularity: integer("popularity").notNull().default(0),
    isDirect: integer("is_direct", { mode: "boolean" }).notNull(),
    modifiedOn: integer("modified_on", { mode: "timestamp" }),
  },
  (table) => [
    index("category_name_idx").on(table.name),
    index("category_display_name_idx").on(table.displayName),
    index("category_seo_category_name_idx").on(table.seoCategoryName),
    index("category_is_scannable_idx").on(table.isScannable),
    index("category_popularity_idx").on(table.popularity),
  ],
);

export const group = sqliteTable(
  "group",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tcgpGroupId: integer("tcgp_group_id").notNull().unique(),
    name: text("name").notNull(),
    abbreviation: text("abbreviation").notNull(),
    isSupplemental: integer("is_supplemental", { mode: "boolean" }).notNull(),
    publishedOn: integer("published_on", { mode: "timestamp" }),
    modifiedOn: integer("modified_on", { mode: "timestamp" }),
    tcgpCategoryId: integer("tcgp_category_id").notNull(),
    categoryId: integer("category_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [category.id],
      name: "group_category_id_fkey",
    }),
    index("group_name_idx").on(table.name),
    index("group_abbreviation_idx").on(table.abbreviation),
    index("group_is_supplemental_idx").on(table.isSupplemental),
    index("group_category_id_idx").on(table.categoryId),
    index("group_published_on_idx").on(table.publishedOn),
  ],
);

export const product = sqliteTable(
  "product",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tcgpProductId: integer("tcgp_product_id").notNull().unique(),
    tcgpGroupId: integer("tcgp_group_id").notNull(),
    tcgpCategoryId: integer("tcgp_category_id").notNull(),
    name: text("name").notNull(),
    cleanName: text("clean_name"),
    imageUrl: text("image_url"),
    url: text("url"),
    modifiedOn: integer("modified_on", { mode: "timestamp" }),
    imageCount: integer("image_count").notNull().default(0),
    categoryId: integer("category_id"),
    groupId: integer("group_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [category.id],
      name: "product_category_id_fkey",
    }),
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [group.id],
      name: "product_group_id_fkey",
    }),
    index("product_name_idx").on(table.name),
    index("product_clean_name_idx").on(table.cleanName),
    index("product_category_group_idx").on(table.categoryId, table.groupId),
    index("product_tcgp_product_id_idx").on(table.tcgpProductId),
    index("product_tcgp_category_id_idx").on(table.tcgpCategoryId),
    index("product_modified_on_idx").on(table.modifiedOn),
    index("product_image_count_idx").on(table.imageCount),
  ],
);

export const price = sqliteTable(
  "price",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tcgpProductId: integer("tcgp_product_id").notNull(),
    lowPrice: real("low_price"),
    midPrice: real("mid_price"),
    highPrice: real("high_price"),
    marketPrice: real("market_price"),
    directLowPrice: real("direct_low_price"),
    subTypeName: text("sub_type_name").notNull(),
    productId: integer("product_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: "price_product_id_fkey",
    }),
    index("price_product_id_idx").on(table.productId),
    index("price_tcgp_product_id_idx").on(table.tcgpProductId),
    index("price_market_price_idx").on(table.marketPrice),
    index("price_low_price_idx").on(table.lowPrice),
    index("price_sub_type_name_idx").on(table.subTypeName),
  ],
);

export const productPresaleInfo = sqliteTable(
  "product_presale_info",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id").notNull(),
    isPresale: integer("is_presale", { mode: "boolean" }).notNull(),
    releasedOn: integer("released_on", { mode: "timestamp" }),
    note: text("note"),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: "product_presale_info_product_id_fkey",
    }),
    index("product_presale_info_product_id_idx").on(table.productId),
    index("product_presale_info_is_presale_idx").on(table.isPresale),
  ],
);

export const productExtendedData = sqliteTable(
  "product_extended_data",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id").notNull(),
    name: text("name").notNull(),
    displayName: text("display_name").notNull(),
    value: text("value").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [product.id],
      name: "product_extended_data_product_id_fkey",
    }),
    index("product_extended_data_product_id_idx").on(table.productId),
    index("product_extended_data_name_idx").on(table.name),
    index("product_extended_data_display_name_idx").on(table.displayName),
    index("product_extended_data_value_idx").on(table.value),
  ],
);
