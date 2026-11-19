CREATE TYPE "public"."follower_check_status" AS ENUM('ok', 'not_found', 'unreadable', 'error');--> statement-breakpoint
CREATE TABLE "creator_follower_checks" (
	"card_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"week" date NOT NULL,
	"link_key" text NOT NULL,
	"status" "follower_check_status" NOT NULL,
	"followers" integer,
	"external_id" text,
	"handle" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creator_follower_checks_pk" PRIMARY KEY("card_id","platform","week"),
	CONSTRAINT "creator_follower_checks_platform_check" CHECK ("creator_follower_checks"."platform" in ('youtube', 'instagram', 'tiktok', 'facebook')),
	CONSTRAINT "creator_follower_checks_week_check" CHECK (extract(isodow from "creator_follower_checks"."week") = 1),
	CONSTRAINT "creator_follower_checks_followers_check" CHECK (("creator_follower_checks"."status" = 'ok') = ("creator_follower_checks"."followers" is not null) and "creator_follower_checks"."followers" >= 0)
);
--> statement-breakpoint
ALTER TABLE "creator_follower_checks" ADD CONSTRAINT "creator_follower_checks_card_id_creator_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."creator_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "creator_follower_checks_week_idx" ON "creator_follower_checks" USING btree ("week");