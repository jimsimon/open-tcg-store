PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_price` (
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
INSERT INTO `__new_price`("id", "tcgp_product_id", "low_price", "mid_price", "high_price", "market_price", "direct_low_price", "sub_type_name", "product_id") SELECT "id", "tcgp_product_id", ROUND("low_price" * 100), ROUND("mid_price" * 100), ROUND("high_price" * 100), ROUND("market_price" * 100), ROUND("direct_low_price" * 100), "sub_type_name", "product_id" FROM `price`;--> statement-breakpoint
DROP TABLE `price`;--> statement-breakpoint
ALTER TABLE `__new_price` RENAME TO `price`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `price_product_id_idx` ON `price` (`product_id`);--> statement-breakpoint
CREATE INDEX `price_tcgp_product_id_idx` ON `price` (`tcgp_product_id`);--> statement-breakpoint
CREATE INDEX `price_market_price_idx` ON `price` (`market_price`);--> statement-breakpoint
CREATE INDEX `price_low_price_idx` ON `price` (`low_price`);--> statement-breakpoint
CREATE INDEX `price_sub_type_name_idx` ON `price` (`sub_type_name`);