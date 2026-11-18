ALTER TABLE `messages` ADD `deliveredAt` timestamp;--> statement-breakpoint
ALTER TABLE `messages` ADD `readAt` timestamp;--> statement-breakpoint
ALTER TABLE `rooms` ADD `publicCode` varchar(12);--> statement-breakpoint
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_public_code_unique` UNIQUE(`publicCode`);