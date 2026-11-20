CREATE TABLE "nomination_ballots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"award_year" integer DEFAULT 2027 NOT NULL,
	"nominator_name" text NOT NULL,
	"nominator_country" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nomination_ballots_name_check" CHECK (char_length("nomination_ballots"."nominator_name") between 1 and 200),
	CONSTRAINT "nomination_ballots_country_check" CHECK (char_length("nomination_ballots"."nominator_country") between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "nominations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ballot_id" uuid NOT NULL,
	"category" text NOT NULL,
	"nominee_name" text NOT NULL,
	"account" text,
	"link" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nominations_nominee_name_check" CHECK (char_length("nominations"."nominee_name") between 1 and 200),
	CONSTRAINT "nominations_account_check" CHECK (char_length("nominations"."account") between 1 and 200),
	CONSTRAINT "nominations_link_check" CHECK (char_length("nominations"."link") between 1 and 1000),
	CONSTRAINT "nominations_reason_check" CHECK (char_length("nominations"."reason") between 1 and 2000)
);
--> statement-breakpoint
ALTER TABLE "nomination_ballots" ADD CONSTRAINT "nomination_ballots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_ballot_id_nomination_ballots_id_fk" FOREIGN KEY ("ballot_id") REFERENCES "public"."nomination_ballots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "nomination_ballots_user_year_idx" ON "nomination_ballots" USING btree ("user_id","award_year");--> statement-breakpoint
CREATE UNIQUE INDEX "nominations_ballot_category_idx" ON "nominations" USING btree ("ballot_id","category");--> statement-breakpoint
CREATE INDEX "nominations_category_idx" ON "nominations" USING btree ("category");