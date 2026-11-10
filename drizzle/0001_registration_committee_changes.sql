-- The committee's changes to the registration form.
-- 1. The three audience questions take several answers: one slug becomes a list of one.
ALTER TABLE "applications" ALTER COLUMN "target_audience" SET DATA TYPE text[] USING CASE WHEN "target_audience" IS NULL THEN NULL ELSE ARRAY["target_audience"] END;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "audience_region" SET DATA TYPE text[] USING CASE WHEN "audience_region" IS NULL THEN NULL ELSE ARRAY["audience_region"] END;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "audience_language" SET DATA TYPE text[] USING CASE WHEN "audience_language" IS NULL THEN NULL ELSE ARRAY["audience_language"] END;--> statement-breakpoint
-- 2. Each chosen platform carries its own link, in place of one free-text box.
ALTER TABLE "applications" ADD COLUMN "platform_links" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
-- Carry over what the free text held: the first link on each chosen platform's own domain.
UPDATE "applications" SET "platform_links" = jsonb_strip_nulls(jsonb_build_object(
	'instagram', CASE WHEN 'instagram' = ANY("platforms") THEN substring("social_links" from '(?i)https?://[^\s,;]*instagram\.com[^\s,;]*') END,
	'youtube', CASE WHEN 'youtube' = ANY("platforms") THEN substring("social_links" from '(?i)https?://[^\s,;]*(?:youtube\.com|youtu\.be)[^\s,;]*') END,
	'facebook', CASE WHEN 'facebook' = ANY("platforms") THEN substring("social_links" from '(?i)https?://[^\s,;]*(?:facebook\.com|fb\.com|fb\.me)[^\s,;]*') END,
	'tiktok', CASE WHEN 'tiktok' = ANY("platforms") THEN substring("social_links" from '(?i)https?://[^\s,;]*tiktok\.com[^\s,;]*') END
)) WHERE "social_links" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "social_links";--> statement-breakpoint
-- 3. The award submissions section is gone.
ALTER TABLE "applications" DROP COLUMN "award_audience_choice_url";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "award_creative_video_url";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "award_viral_content_url";
