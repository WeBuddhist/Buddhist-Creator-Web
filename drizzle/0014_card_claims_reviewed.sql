CREATE TYPE "public"."card_claim_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "creator_card_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "card_claim_status" DEFAULT 'pending' NOT NULL,
	"code" text NOT NULL,
	"note" text,
	"review_note" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creator_card_claims_note_check" CHECK (char_length("creator_card_claims"."note") <= 1000)
);
--> statement-breakpoint
ALTER TABLE "creator_card_claims" ADD CONSTRAINT "creator_card_claims_card_id_creator_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."creator_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_card_claims" ADD CONSTRAINT "creator_card_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_card_claims" ADD CONSTRAINT "creator_card_claims_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "creator_card_claims_pending_user_idx" ON "creator_card_claims" USING btree ("user_id") WHERE "creator_card_claims"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "creator_card_claims_card_idx" ON "creator_card_claims" USING btree ("card_id","created_at");--> statement-breakpoint
CREATE INDEX "creator_card_claims_status_idx" ON "creator_card_claims" USING btree ("status","created_at");