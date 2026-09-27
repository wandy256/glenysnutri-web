CREATE TABLE `instagram_connections` (
	`id` integer PRIMARY KEY NOT NULL,
	`instagram_user_id` text DEFAULT '' NOT NULL,
	`username` text DEFAULT '' NOT NULL,
	`token_ciphertext` text DEFAULT '' NOT NULL,
	`token_iv` text DEFAULT '' NOT NULL,
	`token_expires_at` text,
	`status` text DEFAULT 'disconnected' NOT NULL,
	`last_synced_at` text,
	`last_error` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `instagram_posts` ADD `source` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `instagram_posts` ADD `external_id` text;--> statement-breakpoint
ALTER TABLE `instagram_posts` ADD `caption` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `instagram_posts` ADD `media_type` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `instagram_posts` ADD `published_at` text;--> statement-breakpoint
ALTER TABLE `instagram_posts` ADD `synced_at` text;--> statement-breakpoint
CREATE UNIQUE INDEX `instagram_posts_external_id_idx` ON `instagram_posts` (`external_id`);