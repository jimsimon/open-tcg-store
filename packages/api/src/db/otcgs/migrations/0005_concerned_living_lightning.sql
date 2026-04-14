PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cart` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`last_updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`last_accessed_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_cart`("id", "organization_id", "user_id", "created_at", "last_updated_at", "last_accessed_at") SELECT "id", "organization_id", "user_id", "created_at", "last_updated_at", "last_accessed_at" FROM `cart`;--> statement-breakpoint
DROP TABLE `cart`;--> statement-breakpoint
ALTER TABLE `__new_cart` RENAME TO `cart`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `cart_id_idx` ON `cart` (`id`);--> statement-breakpoint
CREATE INDEX `cart_org_id_idx` ON `cart` (`organization_id`);--> statement-breakpoint
CREATE INDEX `cart_user_id_idx` ON `cart` (`user_id`);--> statement-breakpoint
CREATE INDEX `cart_created_at_idx` ON `cart` (`created_at`);--> statement-breakpoint
CREATE INDEX `cart_last_updated_at_idx` ON `cart` (`last_updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `cart_user_org_uniq` ON `cart` (`user_id`,`organization_id`);--> statement-breakpoint
CREATE TABLE `__new_inventory_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`product_id` integer NOT NULL,
	`condition` text NOT NULL,
	`price` real NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_inventory_item`("id", "organization_id", "product_id", "condition", "price", "created_at", "updated_at", "created_by", "updated_by") SELECT "id", "organization_id", "product_id", "condition", "price", "created_at", "updated_at", "created_by", "updated_by" FROM `inventory_item`;--> statement-breakpoint
DROP TABLE `inventory_item`;--> statement-breakpoint
ALTER TABLE `__new_inventory_item` RENAME TO `inventory_item`;--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_item_org_product_condition_idx` ON `inventory_item` (`organization_id`,`product_id`,`condition`);--> statement-breakpoint
CREATE INDEX `inventory_item_org_id_idx` ON `inventory_item` (`organization_id`);--> statement-breakpoint
CREATE INDEX `inventory_item_product_id_idx` ON `inventory_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `inventory_item_condition_idx` ON `inventory_item` (`condition`);--> statement-breakpoint
CREATE INDEX `inventory_item_price_idx` ON `inventory_item` (`price`);--> statement-breakpoint
CREATE INDEX `inventory_item_created_at_idx` ON `inventory_item` (`created_at`);--> statement-breakpoint
CREATE TABLE `__new_inventory_item_stock` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inventory_item_id` integer NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`cost_basis` real DEFAULT 0 NOT NULL,
	`acquisition_date` text NOT NULL,
	`notes` text(1000),
	`lot_id` integer,
	`deleted_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lot_id`) REFERENCES `lot`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_inventory_item_stock`("id", "inventory_item_id", "quantity", "cost_basis", "acquisition_date", "notes", "lot_id", "deleted_at", "created_at", "updated_at", "created_by", "updated_by") SELECT "id", "inventory_item_id", "quantity", "cost_basis", "acquisition_date", "notes", "lot_id", "deleted_at", "created_at", "updated_at", "created_by", "updated_by" FROM `inventory_item_stock`;--> statement-breakpoint
DROP TABLE `inventory_item_stock`;--> statement-breakpoint
ALTER TABLE `__new_inventory_item_stock` RENAME TO `inventory_item_stock`;--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_stock_item_cost_acqdate_idx` ON `inventory_item_stock` (`inventory_item_id`,`cost_basis`,`acquisition_date`);--> statement-breakpoint
CREATE INDEX `inventory_stock_item_id_idx` ON `inventory_item_stock` (`inventory_item_id`);--> statement-breakpoint
CREATE INDEX `inventory_stock_cost_basis_idx` ON `inventory_item_stock` (`cost_basis`);--> statement-breakpoint
CREATE INDEX `inventory_stock_acq_date_idx` ON `inventory_item_stock` (`acquisition_date`);--> statement-breakpoint
CREATE INDEX `inventory_stock_deleted_at_idx` ON `inventory_item_stock` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `inventory_stock_created_at_idx` ON `inventory_item_stock` (`created_at`);--> statement-breakpoint
CREATE INDEX `inventory_stock_lot_id_idx` ON `inventory_item_stock` (`lot_id`);--> statement-breakpoint
CREATE TABLE `__new_order` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`order_number` text NOT NULL,
	`customer_name` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`total_amount` real NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_order`("id", "organization_id", "order_number", "customer_name", "user_id", "status", "total_amount", "created_at") SELECT "id", "organization_id", "order_number", "customer_name", "user_id", "status", "total_amount", "created_at" FROM `order`;--> statement-breakpoint
DROP TABLE `order`;--> statement-breakpoint
ALTER TABLE `__new_order` RENAME TO `order`;--> statement-breakpoint
CREATE UNIQUE INDEX `order_org_number_idx` ON `order` (`organization_id`,`order_number`);--> statement-breakpoint
CREATE INDEX `order_org_id_idx` ON `order` (`organization_id`);--> statement-breakpoint
CREATE INDEX `order_user_id_idx` ON `order` (`user_id`);--> statement-breakpoint
CREATE INDEX `order_created_at_idx` ON `order` (`created_at`);--> statement-breakpoint
CREATE INDEX `order_status_idx` ON `order` (`status`);--> statement-breakpoint
CREATE TABLE `__new_transaction_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`details` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transaction_log`("id", "organization_id", "user_id", "action", "resource_type", "resource_id", "details", "created_at") SELECT "id", "organization_id", "user_id", "action", "resource_type", "resource_id", "details", "created_at" FROM `transaction_log`;--> statement-breakpoint
DROP TABLE `transaction_log`;--> statement-breakpoint
ALTER TABLE `__new_transaction_log` RENAME TO `transaction_log`;--> statement-breakpoint
CREATE INDEX `txn_log_org_id_idx` ON `transaction_log` (`organization_id`);--> statement-breakpoint
CREATE INDEX `txn_log_created_at_idx` ON `transaction_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `txn_log_action_idx` ON `transaction_log` (`action`);--> statement-breakpoint
CREATE INDEX `txn_log_resource_type_idx` ON `transaction_log` (`resource_type`);--> statement-breakpoint
CREATE INDEX `txn_log_user_id_idx` ON `transaction_log` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_lot` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text(2000),
	`amount_paid` real NOT NULL,
	`acquisition_date` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_lot`("id", "organization_id", "name", "description", "amount_paid", "acquisition_date", "created_at", "updated_at", "created_by", "updated_by") SELECT "id", "organization_id", "name", "description", "amount_paid", "acquisition_date", "created_at", "updated_at", "created_by", "updated_by" FROM `lot`;--> statement-breakpoint
DROP TABLE `lot`;--> statement-breakpoint
ALTER TABLE `__new_lot` RENAME TO `lot`;--> statement-breakpoint
CREATE INDEX `lot_org_id_idx` ON `lot` (`organization_id`);--> statement-breakpoint
CREATE INDEX `lot_created_at_idx` ON `lot` (`created_at`);--> statement-breakpoint
CREATE TABLE `__new_lot_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lot_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`condition` text,
	`quantity` integer NOT NULL,
	`cost_basis` real NOT NULL,
	`cost_overridden` integer DEFAULT 0 NOT NULL,
	`inventory_item_stock_id` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`lot_id`) REFERENCES `lot`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_item_stock_id`) REFERENCES `inventory_item_stock`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_lot_item`("id", "lot_id", "product_id", "condition", "quantity", "cost_basis", "cost_overridden", "inventory_item_stock_id", "created_at", "updated_at") SELECT "id", "lot_id", "product_id", "condition", "quantity", "cost_basis", "cost_overridden", "inventory_item_stock_id", "created_at", "updated_at" FROM `lot_item`;--> statement-breakpoint
DROP TABLE `lot_item`;--> statement-breakpoint
ALTER TABLE `__new_lot_item` RENAME TO `lot_item`;--> statement-breakpoint
CREATE INDEX `lot_item_lot_id_idx` ON `lot_item` (`lot_id`);--> statement-breakpoint
CREATE INDEX `lot_item_stock_id_idx` ON `lot_item` (`inventory_item_stock_id`);