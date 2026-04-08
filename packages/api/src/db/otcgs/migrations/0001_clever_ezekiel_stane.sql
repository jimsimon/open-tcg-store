CREATE TABLE `lot` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text(2000),
	`amount_paid` real NOT NULL,
	`acquisition_date` text NOT NULL,
	`use_buy_list_for_cost` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `lot_org_id_idx` ON `lot` (`organization_id`);--> statement-breakpoint
CREATE INDEX `lot_created_at_idx` ON `lot` (`created_at`);--> statement-breakpoint
CREATE TABLE `lot_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lot_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`condition` text,
	`quantity` integer NOT NULL,
	`cost_basis` real NOT NULL,
	`cost_overridden` integer DEFAULT 0 NOT NULL,
	`inventory_item_stock_id` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`lot_id`) REFERENCES `lot`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_item_stock_id`) REFERENCES `inventory_item_stock`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `lot_item_lot_id_idx` ON `lot_item` (`lot_id`);--> statement-breakpoint
CREATE INDEX `lot_item_stock_id_idx` ON `lot_item` (`inventory_item_stock_id`);--> statement-breakpoint
ALTER TABLE `inventory_item_stock` ADD `lot_id` integer REFERENCES lot(id);--> statement-breakpoint
CREATE INDEX `inventory_stock_lot_id_idx` ON `inventory_item_stock` (`lot_id`);--> statement-breakpoint
ALTER TABLE `order_item` ADD `lot_id` integer;--> statement-breakpoint
ALTER TABLE `buy_rate` ADD `type` text DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE `buy_rate` ADD `rarity` text;