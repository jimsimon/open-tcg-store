CREATE TABLE `cardtrader_blueprint` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cardtrader_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`name` text,
	`match_type` text,
	`match_confidence` integer,
	`expansion` text,
	`expansion_code` text,
	`collector_number` text,
	`rarity` text,
	`finishes` text,
	`languages` text,
	`properties` text,
	`cardmarket_ids` text,
	`image_url` text,
	`scryfall_id` text,
	`tcg_player_id` integer,
	`game_id` integer,
	`ct_category_id` integer,
	`ct_category_name` text,
	`product_type` text,
	`ct_group_id` integer,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ct_blueprint_cardtrader_product_idx` ON `cardtrader_blueprint` (`cardtrader_id`,`product_id`);--> statement-breakpoint
CREATE INDEX `ct_blueprint_product_id_idx` ON `cardtrader_blueprint` (`product_id`);--> statement-breakpoint
CREATE INDEX `ct_blueprint_cardtrader_id_idx` ON `cardtrader_blueprint` (`cardtrader_id`);--> statement-breakpoint
CREATE TABLE `category` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tcgp_category_id` integer NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`seo_category_name` text NOT NULL,
	`category_description` text,
	`category_page_title` text,
	`sealed_label` text,
	`non_sealed_label` text,
	`condition_guide_url` text,
	`is_scannable` integer NOT NULL,
	`popularity` integer DEFAULT 0 NOT NULL,
	`is_direct` integer NOT NULL,
	`modified_on` integer,
	`product_count` integer DEFAULT 0 NOT NULL,
	`set_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_tcgp_category_id_unique` ON `category` (`tcgp_category_id`);--> statement-breakpoint
CREATE INDEX `category_name_idx` ON `category` (`name`);--> statement-breakpoint
CREATE INDEX `category_display_name_idx` ON `category` (`display_name`);--> statement-breakpoint
CREATE INDEX `category_seo_category_name_idx` ON `category` (`seo_category_name`);--> statement-breakpoint
CREATE INDEX `category_is_scannable_idx` ON `category` (`is_scannable`);--> statement-breakpoint
CREATE INDEX `category_popularity_idx` ON `category` (`popularity`);--> statement-breakpoint
CREATE TABLE `group` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `group_tcgp_group_id_unique` ON `group` (`tcgp_group_id`);--> statement-breakpoint
CREATE INDEX `group_name_idx` ON `group` (`name`);--> statement-breakpoint
CREATE INDEX `group_abbreviation_idx` ON `group` (`abbreviation`);--> statement-breakpoint
CREATE INDEX `group_is_supplemental_idx` ON `group` (`is_supplemental`);--> statement-breakpoint
CREATE INDEX `group_category_id_idx` ON `group` (`category_id`);--> statement-breakpoint
CREATE INDEX `group_published_on_idx` ON `group` (`published_on`);--> statement-breakpoint
CREATE TABLE `manapool_price` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`variant` text NOT NULL,
	`price` integer,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `manapool_price_product_variant_idx` ON `manapool_price` (`product_id`,`variant`);--> statement-breakpoint
CREATE INDEX `manapool_price_product_id_idx` ON `manapool_price` (`product_id`);--> statement-breakpoint
CREATE TABLE `metadata` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `price` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tcgp_product_id` integer NOT NULL,
	`low_price` integer,
	`mid_price` integer,
	`high_price` integer,
	`market_price` integer,
	`direct_low_price` integer,
	`sub_type_name` text NOT NULL,
	`product_id` integer,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `price_product_sub_type_idx` ON `price` (`product_id`,`sub_type_name`);--> statement-breakpoint
CREATE INDEX `price_product_id_idx` ON `price` (`product_id`);--> statement-breakpoint
CREATE INDEX `price_tcgp_product_id_idx` ON `price` (`tcgp_product_id`);--> statement-breakpoint
CREATE INDEX `price_market_price_idx` ON `price` (`market_price`);--> statement-breakpoint
CREATE INDEX `price_low_price_idx` ON `price` (`low_price`);--> statement-breakpoint
CREATE INDEX `price_sub_type_name_idx` ON `price` (`sub_type_name`);--> statement-breakpoint
CREATE TABLE `price_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`sub_type_name` text NOT NULL,
	`low_price` integer,
	`mid_price` integer,
	`high_price` integer,
	`market_price` integer,
	`direct_low_price` integer,
	`date` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `price_history_product_sub_type_date_idx` ON `price_history` (`product_id`,`sub_type_name`,`date`);--> statement-breakpoint
CREATE TABLE `price_history_log` (
	`date` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product` (
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
	`number` text,
	`rarity` text,
	`rarity_display` text,
	`product_type` text DEFAULT 'sealed' NOT NULL,
	`tcgplayer_url` text,
	`manapool_url` text,
	`scryfall_id` text,
	`mtgjson_uuid` text,
	`cardmarket_id` integer,
	`cardtrader_id` integer,
	`colors` text,
	`mana_value` real,
	`finishes` text,
	`card_type` text,
	`sub_type` text,
	`oracle_text` text,
	`card_text` text,
	`flavor_text` text,
	`description` text,
	`upc` text,
	`power` text,
	`toughness` text,
	`hp` text,
	`stage` text,
	`weakness` text,
	`resistance` text,
	`retreat_cost` text,
	`attack_1` text,
	`attack_2` text,
	`attack` text,
	`attribute` text,
	`defense` text,
	`monster_type` text,
	`link_arrows` text,
	`link_rating` text,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_tcgp_product_id_unique` ON `product` (`tcgp_product_id`);--> statement-breakpoint
CREATE INDEX `product_name_idx` ON `product` (`name`);--> statement-breakpoint
CREATE INDEX `product_clean_name_idx` ON `product` (`clean_name`);--> statement-breakpoint
CREATE INDEX `product_category_group_idx` ON `product` (`category_id`,`group_id`);--> statement-breakpoint
CREATE INDEX `product_tcgp_product_id_idx` ON `product` (`tcgp_product_id`);--> statement-breakpoint
CREATE INDEX `product_tcgp_category_id_idx` ON `product` (`tcgp_category_id`);--> statement-breakpoint
CREATE INDEX `product_modified_on_idx` ON `product` (`modified_on`);--> statement-breakpoint
CREATE INDEX `product_image_count_idx` ON `product` (`image_count`);--> statement-breakpoint
CREATE INDEX `product_product_type_idx` ON `product` (`product_type`);--> statement-breakpoint
CREATE INDEX `product_rarity_idx` ON `product` (`rarity`);--> statement-breakpoint
CREATE INDEX `product_rarity_display_idx` ON `product` (`rarity_display`);--> statement-breakpoint
CREATE INDEX `product_number_idx` ON `product` (`number`);--> statement-breakpoint
CREATE INDEX `product_scryfall_id_idx` ON `product` (`scryfall_id`);--> statement-breakpoint
CREATE INDEX `product_cardtrader_id_idx` ON `product` (`cardtrader_id`);--> statement-breakpoint
CREATE INDEX `product_upc_idx` ON `product` (`upc`);--> statement-breakpoint
CREATE TABLE `product_presale_info` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`is_presale` integer NOT NULL,
	`released_on` integer,
	`note` text,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `product_presale_info_product_id_idx` ON `product_presale_info` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_presale_info_is_presale_idx` ON `product_presale_info` (`is_presale`);--> statement-breakpoint
CREATE TABLE `sku` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tcgp_sku_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`condition` text NOT NULL,
	`variant` text NOT NULL,
	`language` text NOT NULL,
	`market_price` integer,
	`low_price` integer,
	`high_price` integer,
	`listing_count` integer,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sku_tcgp_sku_id_unique` ON `sku` (`tcgp_sku_id`);--> statement-breakpoint
CREATE INDEX `sku_product_id_idx` ON `sku` (`product_id`);--> statement-breakpoint
CREATE INDEX `sku_product_condition_variant_idx` ON `sku` (`product_id`,`condition`,`variant`);--> statement-breakpoint
CREATE TABLE `sku_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sku_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`condition` text NOT NULL,
	`variant` text NOT NULL,
	`language` text NOT NULL,
	`market_price` integer,
	`low_price` integer,
	`high_price` integer,
	`listing_count` integer,
	`date` text NOT NULL,
	FOREIGN KEY (`sku_id`) REFERENCES `sku`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sku_history_sku_date_idx` ON `sku_history` (`sku_id`,`date`);--> statement-breakpoint
CREATE INDEX `sku_history_product_date_idx` ON `sku_history` (`product_id`,`date`);--> statement-breakpoint
CREATE INDEX `sku_history_product_condition_date_idx` ON `sku_history` (`product_id`,`condition`,`date`);