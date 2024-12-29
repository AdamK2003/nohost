CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`postId` integer,
	`author` text,
	`authorId` integer,
	`json` text
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY NOT NULL,
	`project` text,
	`projectId` text,
	`tags` text,
	`cwTags` text,
	`isAdultContent` integer,
	`json` text
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY NOT NULL,
	`handle` text,
	`json` text
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`tag` text PRIMARY KEY NOT NULL,
	`json` text
);
