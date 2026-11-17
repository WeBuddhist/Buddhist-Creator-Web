ALTER TABLE "creator_cards" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "creator_cards" ADD COLUMN "facebook_followers" integer;--> statement-breakpoint
ALTER TABLE "creator_cards" DROP CONSTRAINT "creator_cards_followers_check";--> statement-breakpoint
ALTER TABLE "creator_cards" drop column "total_followers";--> statement-breakpoint
ALTER TABLE "creator_cards" ADD COLUMN "total_followers" bigint GENERATED ALWAYS AS (coalesce("creator_cards"."youtube_followers", 0)::bigint + coalesce("creator_cards"."instagram_followers", 0) + coalesce("creator_cards"."tiktok_followers", 0) + coalesce("creator_cards"."facebook_followers", 0)) STORED NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_cards" ADD CONSTRAINT "creator_cards_followers_check" CHECK ("creator_cards"."youtube_followers" >= 0 and "creator_cards"."instagram_followers" >= 0 and "creator_cards"."tiktok_followers" >= 0 and "creator_cards"."facebook_followers" >= 0);
