CREATE TYPE "public"."notification_kind" AS ENUM('decision', 'resend');--> statement-breakpoint
CREATE TYPE "public"."notification_state" AS ENUM('sending', 'sent', 'failed', 'uncertain');--> statement-breakpoint
CREATE TABLE "application_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"status" "application_status" NOT NULL,
	"kind" "notification_kind" DEFAULT 'decision' NOT NULL,
	"state" "notification_state" DEFAULT 'sending' NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"template_version" text,
	"subject" text,
	"ses_message_id" text,
	"error_code" text,
	"error_message" text,
	"sent_by" uuid,
	"batch_id" uuid,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "application_notifications_status_check" CHECK ("application_notifications"."status" in ('accepted', 'rejected', 'waitlisted'))
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "notified_status" "application_status";--> statement-breakpoint
-- Written by hand. Nothing set "notified_at" before this migration, but if a
-- row carries one, keep what it meant (told the decision it holds) so the
-- pair check below can be added; a stamp on an undecided row is dropped.
UPDATE "applications" SET "notified_status" = "status" WHERE "notified_at" IS NOT NULL AND "status" IN ('accepted', 'rejected', 'waitlisted');--> statement-breakpoint
UPDATE "applications" SET "notified_at" = NULL WHERE "notified_at" IS NOT NULL AND "notified_status" IS NULL;--> statement-breakpoint
ALTER TABLE "application_notifications" ADD CONSTRAINT "application_notifications_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_notifications" ADD CONSTRAINT "application_notifications_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_notifications" ADD CONSTRAINT "application_notifications_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "application_notifications_in_flight_idx" ON "application_notifications" USING btree ("application_id") WHERE "application_notifications"."state" in ('sending', 'uncertain');--> statement-breakpoint
CREATE INDEX "application_notifications_application_idx" ON "application_notifications" USING btree ("application_id","created_at");--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_notified_status_check" CHECK ("applications"."notified_status" is null or "applications"."notified_status" in ('accepted', 'rejected', 'waitlisted'));--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_notified_pair_check" CHECK (("applications"."notified_status" is null) = ("applications"."notified_at" is null));