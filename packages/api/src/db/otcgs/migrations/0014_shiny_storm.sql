DROP INDEX `event_registration_event_id_idx`;--> statement-breakpoint
CREATE INDEX `event_registration_event_status_idx` ON `event_registration` (`event_id`,`status`);--> statement-breakpoint
CREATE INDEX `event_category_id_idx` ON `event` (`category_id`);--> statement-breakpoint
CREATE INDEX `event_event_type_idx` ON `event` (`event_type`);--> statement-breakpoint
CREATE INDEX `event_is_recurrence_template_idx` ON `event` (`is_recurrence_template`);