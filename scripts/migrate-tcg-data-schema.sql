-- One-time migration for tcg-data.sqlite to support name-based upserts.
--
-- Changes applied:
--   - group.category_id: nullable -> NOT NULL
--   - product.category_id: nullable -> NOT NULL
--   - product.group_id: nullable -> NOT NULL
--   - category_name_idx -> category_name_unique_idx (unique)
--   - group_name_idx -> group_category_id_name_unique_idx (composite unique)
--   - product_name_idx -> product_group_id_name_unique_idx (composite unique)
--
-- SQLite cannot ALTER COLUMN, so we recreate affected tables. Rows with NULL
-- in the now-NOT-NULL columns are dropped (these would be orphaned data).
--
-- This script is idempotent — safe to run on databases that already have the
-- new schema (every DROP IF EXISTS / CREATE IF NOT EXISTS guards against that).

PRAGMA foreign_keys=OFF;

-- Migrate group table --------------------------------------------------------

DROP INDEX IF EXISTS group_tcgp_group_id_unique;
DROP INDEX IF EXISTS group_name_idx;
DROP INDEX IF EXISTS group_abbreviation_idx;
DROP INDEX IF EXISTS group_is_supplemental_idx;
DROP INDEX IF EXISTS group_category_id_idx;
DROP INDEX IF EXISTS group_published_on_idx;
DROP INDEX IF EXISTS group_category_id_name_unique_idx;

CREATE TABLE IF NOT EXISTS `__group_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `tcgp_group_id` integer NOT NULL,
  `name` text NOT NULL,
  `abbreviation` text NOT NULL,
  `is_supplemental` integer NOT NULL,
  `published_on` integer,
  `modified_on` integer,
  `tcgp_category_id` integer NOT NULL,
  `category_id` integer NOT NULL,
  FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT OR IGNORE INTO `__group_new` SELECT * FROM `group` WHERE `category_id` IS NOT NULL;
DROP TABLE `group`;
ALTER TABLE `__group_new` RENAME TO `group`;

CREATE UNIQUE INDEX `group_tcgp_group_id_unique` ON `group` (`tcgp_group_id`);
CREATE UNIQUE INDEX `group_category_id_name_unique_idx` ON `group` (`category_id`, `name`);
CREATE INDEX `group_abbreviation_idx` ON `group` (`abbreviation`);
CREATE INDEX `group_is_supplemental_idx` ON `group` (`is_supplemental`);
CREATE INDEX `group_category_id_idx` ON `group` (`category_id`);
CREATE INDEX `group_published_on_idx` ON `group` (`published_on`);

-- Migrate product table ------------------------------------------------------

DROP INDEX IF EXISTS product_tcgp_product_id_unique;
DROP INDEX IF EXISTS product_name_idx;
DROP INDEX IF EXISTS product_clean_name_idx;
DROP INDEX IF EXISTS product_category_group_idx;
DROP INDEX IF EXISTS product_tcgp_product_id_idx;
DROP INDEX IF EXISTS product_tcgp_category_id_idx;
DROP INDEX IF EXISTS product_modified_on_idx;
DROP INDEX IF EXISTS product_image_count_idx;
DROP INDEX IF EXISTS product_group_id_name_unique_idx;

CREATE TABLE IF NOT EXISTS `__product_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `tcgp_product_id` integer NOT NULL,
  `tcgp_group_id` integer NOT NULL,
  `tcgp_category_id` integer NOT NULL,
  `name` text NOT NULL,
  `clean_name` text,
  `image_url` text,
  `url` text,
  `modified_on` integer,
  `image_count` integer DEFAULT 0 NOT NULL,
  `category_id` integer NOT NULL,
  `group_id` integer NOT NULL,
  FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT OR IGNORE INTO `__product_new` SELECT * FROM `product` WHERE `category_id` IS NOT NULL AND `group_id` IS NOT NULL;
DROP TABLE `product`;
ALTER TABLE `__product_new` RENAME TO `product`;

CREATE UNIQUE INDEX `product_tcgp_product_id_unique` ON `product` (`tcgp_product_id`);
CREATE UNIQUE INDEX `product_group_id_name_unique_idx` ON `product` (`group_id`, `name`);
CREATE INDEX `product_clean_name_idx` ON `product` (`clean_name`);
CREATE INDEX `product_category_group_idx` ON `product` (`category_id`, `group_id`);
CREATE INDEX `product_tcgp_product_id_idx` ON `product` (`tcgp_product_id`);
CREATE INDEX `product_tcgp_category_id_idx` ON `product` (`tcgp_category_id`);
CREATE INDEX `product_modified_on_idx` ON `product` (`modified_on`);
CREATE INDEX `product_image_count_idx` ON `product` (`image_count`);

-- Migrate category index -----------------------------------------------------

DROP INDEX IF EXISTS category_name_idx;
-- Use CREATE IF NOT EXISTS to be idempotent
CREATE UNIQUE INDEX IF NOT EXISTS `category_name_unique_idx` ON `category` (`name`);

PRAGMA foreign_keys=ON;
