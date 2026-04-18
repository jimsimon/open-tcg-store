CREATE TABLE `cron_job` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text,
	`cron_expression` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`last_run_at` integer,
	`last_run_status` text,
	`last_run_duration_ms` integer,
	`last_run_error` text,
	`next_run_at` integer,
	`config` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cron_job_name_uniq` ON `cron_job` (`name`);--> statement-breakpoint
CREATE TABLE `cron_job_run` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cron_job_id` integer NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`duration_ms` integer,
	`status` text NOT NULL,
	`error` text,
	`summary` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`cron_job_id`) REFERENCES `cron_job`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cron_job_run_cron_job_id_idx` ON `cron_job_run` (`cron_job_id`);--> statement-breakpoint
CREATE INDEX `cron_job_run_started_at_idx` ON `cron_job_run` (`started_at`);--> statement-breakpoint
CREATE TABLE `event` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`event_type` text NOT NULL,
	`category_id` integer,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`capacity` integer,
	`entry_fee_in_cents` integer,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`recurrence_rule` text,
	`recurrence_group_id` text,
	`is_recurrence_template` integer DEFAULT false,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_by` text
);
--> statement-breakpoint
CREATE INDEX `event_organization_id_idx` ON `event` (`organization_id`);--> statement-breakpoint
CREATE INDEX `event_start_time_idx` ON `event` (`start_time`);--> statement-breakpoint
CREATE INDEX `event_status_idx` ON `event` (`status`);--> statement-breakpoint
CREATE INDEX `event_recurrence_group_id_idx` ON `event` (`recurrence_group_id`);--> statement-breakpoint
CREATE TABLE `event_registration` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`registrant_name` text NOT NULL,
	`registrant_email` text,
	`registrant_phone` text,
	`status` text DEFAULT 'registered' NOT NULL,
	`checked_in` integer DEFAULT false,
	`checked_in_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_by` text,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `event_registration_event_id_idx` ON `event_registration` (`event_id`);
