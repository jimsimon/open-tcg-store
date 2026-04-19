ALTER TABLE `order` ADD `tax_amount` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `order` ADD `payment_method` text;--> statement-breakpoint
ALTER TABLE `order` ADD `stripe_payment_intent_id` text;--> statement-breakpoint
CREATE INDEX `order_payment_method_idx` ON `order` (`payment_method`);
