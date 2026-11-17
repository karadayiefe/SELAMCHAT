CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`senderId` int NOT NULL,
	`body` varchar(600) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`animalKey` varchar(32) NOT NULL,
	`displayName` varchar(40) NOT NULL,
	`emoji` varchar(16) NOT NULL,
	`color` varchar(16) NOT NULL,
	`status` enum('idle','waiting','chatting','partner_left') NOT NULL DEFAULT 'idle',
	`roomId` int,
	`queuedAt` timestamp,
	`typingAt` timestamp,
	`lastSeen` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `participants_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('active','closed') NOT NULL DEFAULT 'active',
	`lastActivity` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_messages_room` ON `messages` (`roomId`,`id`);--> statement-breakpoint
CREATE INDEX `idx_participants_last_seen` ON `participants` (`lastSeen`);--> statement-breakpoint
CREATE INDEX `idx_participants_status` ON `participants` (`status`,`queuedAt`);--> statement-breakpoint
CREATE INDEX `idx_participants_room` ON `participants` (`roomId`);