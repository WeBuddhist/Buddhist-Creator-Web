ALTER TABLE "nominations" ALTER COLUMN "link" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "nominations" ADD COLUMN "image_key" text;--> statement-breakpoint
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_link_or_image_check" CHECK ("nominations"."link" is not null or "nominations"."image_key" is not null);