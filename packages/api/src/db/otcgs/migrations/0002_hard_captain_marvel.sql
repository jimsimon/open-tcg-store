DROP INDEX `store_supported_game_org_category_idx`;--> statement-breakpoint
DROP INDEX `store_supported_game_org_id_idx`;--> statement-breakpoint
DROP INDEX `store_supported_game_category_id_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `store_supported_game_category_idx` ON `store_supported_game` (`category_id`);--> statement-breakpoint
ALTER TABLE `store_supported_game` DROP COLUMN `organization_id`;--> statement-breakpoint
DROP INDEX `buy_rate_org_category_idx`;--> statement-breakpoint
DROP INDEX `buy_rate_org_id_idx`;--> statement-breakpoint
ALTER TABLE `buy_rate` DROP COLUMN `organization_id`;