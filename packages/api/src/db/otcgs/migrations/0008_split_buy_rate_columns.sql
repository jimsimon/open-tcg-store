-- Split the dual-purpose `rate` column into `fixed_rate_cents` (integer) and
-- `percentage_rate` (real). Existing fixed rates are converted to cents;
-- existing percentage rates are preserved as-is.
ALTER TABLE `buy_rate` ADD COLUMN `fixed_rate_cents` integer;--> statement-breakpoint
ALTER TABLE `buy_rate` ADD COLUMN `percentage_rate` real;--> statement-breakpoint
UPDATE `buy_rate` SET `fixed_rate_cents` = ROUND(`rate` * 100) WHERE `type` != 'percentage';--> statement-breakpoint
UPDATE `buy_rate` SET `percentage_rate` = `rate` WHERE `type` = 'percentage';--> statement-breakpoint
ALTER TABLE `buy_rate` DROP COLUMN `rate`;
