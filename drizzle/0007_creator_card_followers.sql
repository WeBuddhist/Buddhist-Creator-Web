ALTER TABLE "creator_cards" ADD COLUMN "youtube_followers" integer;--> statement-breakpoint
ALTER TABLE "creator_cards" ADD COLUMN "instagram_followers" integer;--> statement-breakpoint
ALTER TABLE "creator_cards" ADD COLUMN "tiktok_followers" integer;--> statement-breakpoint
ALTER TABLE "creator_cards" ADD COLUMN "total_followers" bigint GENERATED ALWAYS AS (coalesce("creator_cards"."youtube_followers", 0)::bigint + coalesce("creator_cards"."instagram_followers", 0) + coalesce("creator_cards"."tiktok_followers", 0)) STORED NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_cards" ADD CONSTRAINT "creator_cards_followers_check" CHECK ("creator_cards"."youtube_followers" >= 0 and "creator_cards"."instagram_followers" >= 0 and "creator_cards"."tiktok_followers" >= 0);