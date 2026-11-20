ALTER TABLE "nominations" DROP CONSTRAINT "nominations_account_check";--> statement-breakpoint
ALTER TABLE "nominations" ADD COLUMN "video_link" text;--> statement-breakpoint
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_video_link_check" CHECK (char_length("nominations"."video_link") between 1 and 1000);--> statement-breakpoint
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_account_check" CHECK (char_length("nominations"."account") between 1 and 1000);