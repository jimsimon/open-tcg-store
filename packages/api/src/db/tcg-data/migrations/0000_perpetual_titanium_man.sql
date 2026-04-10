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
	`modified_on` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_tcgp_category_id_unique` ON `category` (`tcgp_category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `category_name_unique_idx` ON `category` (`name`);--> statement-breakpoint
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
CREATE UNIQUE INDEX `group_category_id_name_unique_idx` ON `group` (`category_id`,`name`);--> statement-breakpoint
CREATE INDEX `group_abbreviation_idx` ON `group` (`abbreviation`);--> statement-breakpoint
CREATE INDEX `group_is_supplemental_idx` ON `group` (`is_supplemental`);--> statement-breakpoint
CREATE INDEX `group_category_id_idx` ON `group` (`category_id`);--> statement-breakpoint
CREATE INDEX `group_published_on_idx` ON `group` (`published_on`);--> statement-breakpoint
CREATE TABLE `price` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tcgp_product_id` integer NOT NULL,
	`low_price` real,
	`mid_price` real,
	`high_price` real,
	`market_price` real,
	`direct_low_price` real,
	`sub_type_name` text NOT NULL,
	`product_id` integer,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `price_product_id_idx` ON `price` (`product_id`);--> statement-breakpoint
CREATE INDEX `price_tcgp_product_id_idx` ON `price` (`tcgp_product_id`);--> statement-breakpoint
CREATE INDEX `price_market_price_idx` ON `price` (`market_price`);--> statement-breakpoint
CREATE INDEX `price_low_price_idx` ON `price` (`low_price`);--> statement-breakpoint
CREATE INDEX `price_sub_type_name_idx` ON `price` (`sub_type_name`);--> statement-breakpoint
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
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_tcgp_product_id_unique` ON `product` (`tcgp_product_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_group_id_name_unique_idx` ON `product` (`group_id`,`name`);--> statement-breakpoint
CREATE INDEX `product_clean_name_idx` ON `product` (`clean_name`);--> statement-breakpoint
CREATE INDEX `product_category_group_idx` ON `product` (`category_id`,`group_id`);--> statement-breakpoint
CREATE INDEX `product_tcgp_product_id_idx` ON `product` (`tcgp_product_id`);--> statement-breakpoint
CREATE INDEX `product_tcgp_category_id_idx` ON `product` (`tcgp_category_id`);--> statement-breakpoint
CREATE INDEX `product_modified_on_idx` ON `product` (`modified_on`);--> statement-breakpoint
CREATE INDEX `product_image_count_idx` ON `product` (`image_count`);--> statement-breakpoint
CREATE TABLE `product_extended_data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `product_extended_data_product_id_idx` ON `product_extended_data` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_extended_data_name_idx` ON `product_extended_data` (`name`);--> statement-breakpoint
CREATE INDEX `product_extended_data_display_name_idx` ON `product_extended_data` (`display_name`);--> statement-breakpoint
CREATE INDEX `product_extended_data_value_idx` ON `product_extended_data` (`value`);--> statement-breakpoint
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
CREATE INDEX `product_presale_info_is_presale_idx` ON `product_presale_info` (`is_presale`);