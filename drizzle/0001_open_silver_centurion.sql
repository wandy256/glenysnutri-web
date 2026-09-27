CREATE TABLE `instagram_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`label` text DEFAULT 'Instagram' NOT NULL,
	`media_key` text,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instagram_posts_url_idx` ON `instagram_posts` (`url`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`alt_text` text DEFAULT '' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`purpose` text DEFAULT 'library' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`uploader_email` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_object_key_idx` ON `media` (`object_key`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'Pediatría' NOT NULL,
	`cover_key` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`author_email` text DEFAULT '' NOT NULL,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_idx` ON `posts` (`slug`);--> statement-breakpoint
CREATE INDEX `posts_status_published_idx` ON `posts` (`status`,`published_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`display_name` text DEFAULT '' NOT NULL,
	`role` text DEFAULT 'editor' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `comments` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
UPDATE `comments` SET `status` = 'approved';--> statement-breakpoint
INSERT OR IGNORE INTO `posts` (`slug`,`title`,`excerpt`,`content`,`category`,`status`,`published_at`) VALUES ('alimentacion-complementaria','Alimentación complementaria sin estrés','Señales, texturas y hábitos para acompañar este momento con calma y seguridad.','La alimentación complementaria es una etapa de exploración. Observa las señales de preparación de tu bebé, ofrece texturas adecuadas y permite que el proceso avance sin comparaciones. La consulta individual ayuda a adaptar cada recomendación a sus necesidades.','Nutrición infantil','published','2026-07-12 09:00:00');--> statement-breakpoint
INSERT OR IGNORE INTO `posts` (`slug`,`title`,`excerpt`,`content`,`category`,`status`,`published_at`) VALUES ('hidratacion-saludable','Hidratación real: más agua, menos azúcar','Cómo elegir bebidas y alimentos que sí aportan hidratación durante los días de calor.','El agua debe ser la principal fuente de hidratación. Las frutas y los vegetales también aportan líquidos, fibra y micronutrientes. Los jugos y bebidas azucaradas no reemplazan el agua y deben limitarse.','Vida saludable','published','2026-07-05 09:00:00');--> statement-breakpoint
INSERT OR IGNORE INTO `posts` (`slug`,`title`,`excerpt`,`content`,`category`,`status`,`published_at`) VALUES ('hierro-en-la-infancia','Hierro en la infancia: pequeñas decisiones, gran impacto','Una guía clara sobre fuentes de hierro y combinaciones que favorecen su absorción.','Carnes magras, legumbres y otros alimentos ricos en hierro pueden formar parte de una alimentación variada. Combinarlos con fuentes de vitamina C favorece su absorción. Cada niño debe evaluarse de manera individual.','Crecimiento','published','2026-06-28 09:00:00');
