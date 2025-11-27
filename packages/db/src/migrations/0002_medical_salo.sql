CREATE TABLE `short_video` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`original_url` text NOT NULL,
	`r2_key` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `short_video_created_at_idx` ON `short_video` (`created_at`);--> statement-breakpoint
CREATE TABLE `short_video_to_topic` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`topic_id` text NOT NULL,
	`video_id` text NOT NULL,
	PRIMARY KEY(`video_id`, `topic_id`),
	FOREIGN KEY (`topic_id`) REFERENCES `short_video_topic`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`video_id`) REFERENCES `short_video`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `short_video_to_topic_video_id_idx` ON `short_video_to_topic` (`video_id`);--> statement-breakpoint
CREATE INDEX `short_video_to_topic_topic_id_idx` ON `short_video_to_topic` (`topic_id`);--> statement-breakpoint
CREATE TABLE `short_video_topic` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`description` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL
);
