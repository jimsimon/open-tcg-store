CREATE TABLE `store_supported_game` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`category_id` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `store_supported_game_org_category_idx` ON `store_supported_game` (`organization_id`,`category_id`);--> statement-breakpoint
CREATE INDEX `store_supported_game_org_id_idx` ON `store_supported_game` (`organization_id`);--> statement-breakpoint
CREATE INDEX `store_supported_game_category_id_idx` ON `store_supported_game` (`category_id`);--> statement-breakpoint
CREATE TABLE `buy_rate` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`category_id` integer NOT NULL,
	`description` text NOT NULL,
	`rate` real NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `buy_rate_org_category_idx` ON `buy_rate` (`organization_id`,`category_id`);--> statement-breakpoint
CREATE INDEX `buy_rate_org_id_idx` ON `buy_rate` (`organization_id`);--> statement-breakpoint
CREATE INDEX `buy_rate_category_id_idx` ON `buy_rate` (`category_id`);--> statement-breakpoint
CREATE INDEX `buy_rate_sort_order_idx` ON `buy_rate` (`sort_order`);