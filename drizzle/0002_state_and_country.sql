-- "Current location and country" becomes two answers: state and country.
ALTER TABLE "applications" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "country" text;--> statement-breakpoint
-- Carry over what was typed: the part after the last comma is the country, the rest the state.
UPDATE "applications" SET
	"country" = NULLIF(btrim(substring("location" from '[^,]*$')), ''),
	"state" = NULLIF(btrim(regexp_replace("location", ',?[^,]*$', '')), '')
WHERE "location" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "location";
