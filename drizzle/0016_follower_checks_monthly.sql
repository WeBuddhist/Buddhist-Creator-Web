-- Follower counts are read once a month, not once a week: each account
-- read through SocialCrawl costs a credit. So a reading's slot is the
-- month it was taken in, named by the month's first day.
--
-- The table has held no row yet (nothing has been read), so there is
-- nothing to carry over. Were a weekly row there, the new check would
-- refuse it and this would stop, which is the right thing to happen.
ALTER TABLE "creator_follower_checks" DROP CONSTRAINT "creator_follower_checks_week_check";--> statement-breakpoint
ALTER TABLE "creator_follower_checks" RENAME COLUMN "week" TO "month";--> statement-breakpoint
ALTER INDEX "creator_follower_checks_week_idx" RENAME TO "creator_follower_checks_month_idx";--> statement-breakpoint
ALTER TABLE "creator_follower_checks" ADD CONSTRAINT "creator_follower_checks_month_check" CHECK (extract(day from "creator_follower_checks"."month") = 1);
