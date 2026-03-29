CREATE TABLE `inventory_item` (
	`id` text PRIMARY KEY NOT NULL,
	`manager_id` text NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`category` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`rented_count` integer DEFAULT 0 NOT NULL,
	`unit_price` integer DEFAULT 0 NOT NULL,
	`reorder_level` integer DEFAULT 5 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`manager_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `inventory_manager_id_idx` ON `inventory_item` (`manager_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_manager_sku_unique` ON `inventory_item` (`manager_id`,`sku`);