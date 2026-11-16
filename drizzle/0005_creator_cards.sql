CREATE TYPE "public"."creator_card_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "creator_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"status" "creator_card_status" DEFAULT 'pending' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"display_name" text NOT NULL,
	"country" text,
	"creator_type" text,
	"languages" text[],
	"languages_other" text,
	"content_types" text[],
	"content_types_other" text,
	"tagline" text,
	"socials" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"review_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creator_cards_display_name_check" CHECK (char_length("creator_cards"."display_name") between 1 and 80),
	CONSTRAINT "creator_cards_tagline_check" CHECK (char_length("creator_cards"."tagline") <= 140)
);
--> statement-breakpoint
ALTER TABLE "creator_cards" ADD CONSTRAINT "creator_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_cards" ADD CONSTRAINT "creator_cards_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "creator_cards_user_id_idx" ON "creator_cards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "creator_cards_status_idx" ON "creator_cards" USING btree ("status","submitted_at");