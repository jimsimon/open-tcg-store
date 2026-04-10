DROP INDEX `category_name_unique_idx`;--> statement-breakpoint
CREATE INDEX `category_name_idx` ON `category` (`name`);--> statement-breakpoint
DROP INDEX `group_category_id_name_unique_idx`;--> statement-breakpoint
CREATE INDEX `group_name_idx` ON `group` (`name`);--> statement-breakpoint
DROP INDEX `product_group_id_name_unique_idx`;--> statement-breakpoint
CREATE INDEX `product_name_idx` ON `product` (`name`);