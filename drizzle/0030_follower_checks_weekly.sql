-- Follower counts are read every week now, not every month: Instagram,
-- TikTok, Facebook and YouTube each week, Douyin (six SocialCrawl credits
-- an account) every three months, in December, March, June and September.
-- So a reading's slot is the week it was taken in, named by its Monday
-- (UTC).
--
-- Every row so far is November's, one per card and place, so each moves
-- to the week it was read in without meeting another.
ALTER TABLE "creator_follower_checks" DROP CONSTRAINT "creator_follower_checks_month_check";--> statement-breakpoint
ALTER TABLE "creator_follower_checks" RENAME COLUMN "month" TO "week";--> statement-breakpoint
ALTER INDEX "creator_follower_checks_month_idx" RENAME TO "creator_follower_checks_week_idx";--> statement-breakpoint
UPDATE "creator_follower_checks" SET "week" = date_trunc('week', "checked_at" AT TIME ZONE 'UTC')::date;--> statement-breakpoint
ALTER TABLE "creator_follower_checks" ADD CONSTRAINT "creator_follower_checks_week_check" CHECK (extract(isodow from "creator_follower_checks"."week") = 1);
