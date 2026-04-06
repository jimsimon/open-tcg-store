CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`inviter_id` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `invitation_organizationId_idx` ON `invitation` (`organization_id`);--> statement-breakpoint
CREATE INDEX `invitation_email_idx` ON `invitation` (`email`);--> statement-breakpoint
CREATE TABLE `member` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `member_organizationId_idx` ON `member` (`organization_id`);--> statement-breakpoint
CREATE INDEX `member_userId_idx` ON `member` (`user_id`);--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo` text,
	`created_at` integer NOT NULL,
	`metadata` text,
	`street1` text NOT NULL,
	`street2` text,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`zip` text NOT NULL,
	`phone` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_uidx` ON `organization` (`slug`);--> statement-breakpoint
CREATE TABLE `organization_role` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`role` text NOT NULL,
	`permission` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `organizationRole_organizationId_idx` ON `organization_role` (`organization_id`);--> statement-breakpoint
CREATE INDEX `organizationRole_role_idx` ON `organization_role` (`role`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`active_organization_id` text,
	`impersonated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`role` text,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer,
	`is_anonymous` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `cart` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`last_updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`last_accessed_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cart_id_idx` ON `cart` (`id`);--> statement-breakpoint
CREATE INDEX `cart_org_id_idx` ON `cart` (`organization_id`);--> statement-breakpoint
CREATE INDEX `cart_user_id_idx` ON `cart` (`user_id`);--> statement-breakpoint
CREATE INDEX `cart_created_at_idx` ON `cart` (`created_at`);--> statement-breakpoint
CREATE INDEX `cart_last_updated_at_idx` ON `cart` (`last_updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `cart_user_org_uniq` ON `cart` (`user_id`,`organization_id`);--> statement-breakpoint
CREATE TABLE `cartItem` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cart_id` integer NOT NULL,
	`inventory_item_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`cart_id`) REFERENCES `cart`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cart_item_id_idx` ON `cartItem` (`id`);--> statement-breakpoint
CREATE INDEX `cart_item_inventory_item_id_idx` ON `cartItem` (`inventory_item_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `cart_item_inventory_item_uniq` ON `cartItem` (`cart_id`,`inventory_item_id`);--> statement-breakpoint
CREATE TABLE `inventory_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`product_id` integer NOT NULL,
	`condition` text NOT NULL,
	`price` real NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_item_org_product_condition_idx` ON `inventory_item` (`organization_id`,`product_id`,`condition`);--> statement-breakpoint
CREATE INDEX `inventory_item_org_id_idx` ON `inventory_item` (`organization_id`);--> statement-breakpoint
CREATE INDEX `inventory_item_product_id_idx` ON `inventory_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `inventory_item_condition_idx` ON `inventory_item` (`condition`);--> statement-breakpoint
CREATE INDEX `inventory_item_price_idx` ON `inventory_item` (`price`);--> statement-breakpoint
CREATE INDEX `inventory_item_created_at_idx` ON `inventory_item` (`created_at`);--> statement-breakpoint
CREATE TABLE `inventory_item_stock` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inventory_item_id` integer NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`cost_basis` real DEFAULT 0 NOT NULL,
	`acquisition_date` text NOT NULL,
	`notes` text(1000),
	`deleted_at` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_stock_item_cost_acqdate_idx` ON `inventory_item_stock` (`inventory_item_id`,`cost_basis`,`acquisition_date`);--> statement-breakpoint
CREATE INDEX `inventory_stock_item_id_idx` ON `inventory_item_stock` (`inventory_item_id`);--> statement-breakpoint
CREATE INDEX `inventory_stock_cost_basis_idx` ON `inventory_item_stock` (`cost_basis`);--> statement-breakpoint
CREATE INDEX `inventory_stock_acq_date_idx` ON `inventory_item_stock` (`acquisition_date`);--> statement-breakpoint
CREATE INDEX `inventory_stock_deleted_at_idx` ON `inventory_item_stock` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `inventory_stock_created_at_idx` ON `inventory_item_stock` (`created_at`);--> statement-breakpoint
CREATE TABLE `order` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`order_number` text NOT NULL,
	`customer_name` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`total_amount` real NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_org_number_idx` ON `order` (`organization_id`,`order_number`);--> statement-breakpoint
CREATE INDEX `order_org_id_idx` ON `order` (`organization_id`);--> statement-breakpoint
CREATE INDEX `order_user_id_idx` ON `order` (`user_id`);--> statement-breakpoint
CREATE INDEX `order_created_at_idx` ON `order` (`created_at`);--> statement-breakpoint
CREATE INDEX `order_status_idx` ON `order` (`status`);--> statement-breakpoint
CREATE TABLE `order_item` (
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
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inventory_item_stock_id`) REFERENCES `inventory_item_stock`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `order_item_order_id_idx` ON `order_item` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_item_product_id_idx` ON `order_item` (`product_id`);--> statement-breakpoint
CREATE INDEX `order_item_inventory_item_id_idx` ON `order_item` (`inventory_item_id`);--> statement-breakpoint
CREATE INDEX `order_item_stock_id_idx` ON `order_item` (`inventory_item_stock_id`);--> statement-breakpoint
CREATE TABLE `store_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_name` text,
	`ein` text,
	`backup_provider` text,
	`backup_frequency` text,
	`last_backup_at` integer,
	`stripe_enabled` integer DEFAULT false,
	`stripe_api_key` text,
	`shopify_enabled` integer DEFAULT false,
	`shopify_api_key` text,
	`shopify_shop_domain` text,
	`google_drive_access_token` text,
	`google_drive_refresh_token` text,
	`dropbox_access_token` text,
	`dropbox_refresh_token` text,
	`onedrive_access_token` text,
	`onedrive_refresh_token` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_by` text
);
--> statement-breakpoint
CREATE TABLE `store_hours` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`open_time` text,
	`close_time` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `store_hours_org_day_uniq` ON `store_hours` (`organization_id`,`day_of_week`);--> statement-breakpoint
CREATE INDEX `store_hours_organization_id_idx` ON `store_hours` (`organization_id`);--> statement-breakpoint
CREATE TABLE `transaction_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`details` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `txn_log_org_id_idx` ON `transaction_log` (`organization_id`);--> statement-breakpoint
CREATE INDEX `txn_log_created_at_idx` ON `transaction_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `txn_log_action_idx` ON `transaction_log` (`action`);--> statement-breakpoint
CREATE INDEX `txn_log_resource_type_idx` ON `transaction_log` (`resource_type`);--> statement-breakpoint
CREATE INDEX `txn_log_user_id_idx` ON `transaction_log` (`user_id`);