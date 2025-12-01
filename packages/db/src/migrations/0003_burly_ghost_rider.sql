CREATE TABLE `album_images` (
	`album_id` text NOT NULL,
	`caption` text,
	`created_at` integer NOT NULL,
	`file_size` integer,
	`height` integer,
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`url` text NOT NULL,
	`width` integer,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `album_models` (
	`album_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`model_id` text NOT NULL,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `album_tags` (
	`album_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `albums` (
	`cover_image_url` text,
	`created_at` integer NOT NULL,
	`description` text,
	`id` text PRIMARY KEY NOT NULL,
	`published_at` integer,
	`title` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `models` (
	`alias` text,
	`avatar_url` text,
	`bio` text,
	`created_at` integer NOT NULL,
	`homepage_url` text,
	`id` text PRIMARY KEY NOT NULL,
	`instagram_url` text,
	`name` text NOT NULL,
	`updated_at` integer NOT NULL,
	`weibo_url` text,
	`x_url` text,
	`youtube_url` text
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`created_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);