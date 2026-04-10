PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_product` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tcgp_product_id` integer NOT NULL,
	`tcgp_group_id` integer NOT NULL,
	`tcgp_category_id` integer NOT NULL,
	`name` text NOT NULL,
	`clean_name` text NOT NULL,
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
INSERT INTO `__new_product`("id", "tcgp_product_id", "tcgp_group_id", "tcgp_category_id", "name", "clean_name", "image_url", "url", "modified_on", "image_count", "category_id", "group_id") SELECT "id", "tcgp_product_id", "tcgp_group_id", "tcgp_category_id", "name", "clean_name", "image_url", "url", "modified_on", "image_count", "category_id", "group_id" FROM `product`;--> statement-breakpoint
DROP TABLE `product`;--> statement-breakpoint
ALTER TABLE `__new_product` RENAME TO `product`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `product_tcgp_product_id_unique` ON `product` (`tcgp_product_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `product_group_id_clean_name_unique_idx` ON `product` (`group_id`,`clean_name`);--> statement-breakpoint
CREATE INDEX `product_category_group_idx` ON `product` (`category_id`,`group_id`);--> statement-breakpoint
CREATE INDEX `product_tcgp_product_id_idx` ON `product` (`tcgp_product_id`);--> statement-breakpoint
CREATE INDEX `product_tcgp_category_id_idx` ON `product` (`tcgp_category_id`);--> statement-breakpoint
CREATE INDEX `product_modified_on_idx` ON `product` (`modified_on`);--> statement-breakpoint
CREATE INDEX `product_image_count_idx` ON `product` (`image_count`);