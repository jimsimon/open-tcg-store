PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cart` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`last_updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`last_accessed_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
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
CREATE TABLE `__new_cartItem` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cart_id` integer NOT NULL,
	`inventory_item_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`cart_id`) REFERENCES `cart`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_cartItem`("id", "cart_id", "inventory_item_id", "quantity") SELECT "id", "cart_id", "inventory_item_id", "quantity" FROM `cartItem`;--> statement-breakpoint
DROP TABLE `cartItem`;--> statement-breakpoint
ALTER TABLE `__new_cartItem` RENAME TO `cartItem`;--> statement-breakpoint
CREATE INDEX `cart_item_id_idx` ON `cartItem` (`id`);--> statement-breakpoint
CREATE INDEX `cart_item_inventory_item_id_idx` ON `cartItem` (`inventory_item_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `cart_item_inventory_item_uniq` ON `cartItem` (`cart_id`,`inventory_item_id`);--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`role` text,
	`banned` integer DEFAULT false NOT NULL,
	`ban_reason` text,
	`ban_expires` integer,
	`is_anonymous` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "name", "email", "email_verified", "image", "created_at", "updated_at", "role", "banned", "ban_reason", "ban_expires", "is_anonymous") SELECT "id", "name", "email", "email_verified", "image", "created_at", "updated_at", "role", "banned", "ban_reason", "ban_expires", "is_anonymous" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `__new_order_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`inventory_item_id` integer,
	`inventory_item_stock_id` integer,
	`product_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`condition` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` real NOT NULL,
	`cost_basis` real,
	`lot_id` integer,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_item_stock_id`) REFERENCES `inventory_item_stock`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lot_id`) REFERENCES `lot`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_order_item`("id", "order_id", "inventory_item_id", "inventory_item_stock_id", "product_id", "product_name", "condition", "quantity", "unit_price", "cost_basis", "lot_id") SELECT "id", "order_id", "inventory_item_id", "inventory_item_stock_id", "product_id", "product_name", "condition", "quantity", "unit_price", "cost_basis", "lot_id" FROM `order_item`;--> statement-breakpoint
DROP TABLE `order_item`;--> statement-breakpoint
ALTER TABLE `__new_order_item` RENAME TO `order_item`;--> statement-breakpoint
CREATE INDEX `order_item_order_id_idx` ON `order_item` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_item_product_id_idx` ON `order_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `order_item_inventory_item_id_idx` ON `order_item` (`inventory_item_id`);--> statement-breakpoint
CREATE INDEX `order_item_stock_id_idx` ON `order_item` (`inventory_item_stock_id`);