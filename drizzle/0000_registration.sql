CREATE TYPE "public"."application_status" AS ENUM('draft', 'submitted', 'accepted', 'rejected', 'waitlisted', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('member', 'admin', 'superadmin');--> statement-breakpoint
CREATE TABLE "application_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"actor_id" uuid,
	"from_status" "application_status",
	"to_status" "application_status" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"convention_year" integer DEFAULT 2027 NOT NULL,
	"status" "application_status" DEFAULT 'draft' NOT NULL,
	"full_name" text,
	"organization" text,
	"location" text,
	"content_topics" text[],
	"content_topics_other" text,
	"target_audience" text,
	"target_audience_other" text,
	"audience_region" text,
	"audience_region_other" text,
	"audience_language" text,
	"audience_language_other" text,
	"platforms" text[],
	"platforms_other" text,
	"social_links" text,
	"video_key" text,
	"video_size_bytes" integer,
	"video_mime" text,
	"video_uploaded_at" timestamp with time zone,
	"award_audience_choice_url" text,
	"award_creative_video_url" text,
	"award_viral_content_url" text,
	"review_note" text,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"notified_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth0_sub" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"picture" text,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "applications_user_id_idx" ON "applications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_auth0_sub_idx" ON "users" USING btree ("auth0_sub");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");