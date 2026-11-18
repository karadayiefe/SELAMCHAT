ALTER TABLE `messages` ADD `clientId` varchar(36);--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `uq_messages_sender_client` UNIQUE(`senderId`,`clientId`);