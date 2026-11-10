import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { PlatformLinks } from "@/lib/registration-2027";

/* Who may do what. `member` is everyone who has signed in; `admin` reviews
   applications; `superadmin` also manages roles. The first superadmin is set
   by hand: update users set role = 'superadmin' where email = '...'. */
export const userRole = pgEnum("user_role", ["member", "admin", "superadmin"]);

/* draft → submitted → accepted | rejected | waitlisted. An applicant may
   edit while draft or submitted, and withdraw from either. Admins may move
   a submitted application between the three decisions, or back to
   submitted. */
export const applicationStatus = pgEnum("application_status", [
  "draft",
  "submitted",
  "accepted",
  "rejected",
  "waitlisted",
  "withdrawn",
]);

/* One row of the mailing ledger (application_notifications) moves
   sending → sent | failed | uncertain. `uncertain` is a send whose outcome
   nobody knows (a timeout, a crash mid-call): it is never retried on its
   own, an admin settles it. */
export const notificationState = pgEnum("notification_state", ["sending", "sent", "failed", "uncertain"]);

/* `decision` tells an applicant a decision they have not been told;
   `resend` repeats the mail they already had, on an admin's say-so. */
export const notificationKind = pgEnum("notification_kind", ["decision", "resend"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Auth0's `sub`, e.g. "google-oauth2|1234". */
    auth0Sub: text("auth0_sub").notNull(),
    /** Lower-cased. Only verified emails get this far (lib/auth.ts). */
    email: text("email").notNull(),
    name: text("name"),
    picture: text("picture"),
    role: userRole("role").default("member").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_auth0_sub_idx").on(table.auth0Sub),
    uniqueIndex("users_email_idx").on(table.email),
  ],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conventionYear: integer("convention_year").default(2027).notNull(),
    status: applicationStatus("status").default("draft").notNull(),

    // Personal details. Email lives on the user, not here.
    fullName: text("full_name"),
    organization: text("organization"),
    // Names from lib/countries.ts: a listed country and one of its states.
    country: text("country"),
    state: text("state"),

    // Content creation journey. Multi-choice answers hold option slugs
    // (lib/registration-2027.ts); "other" pairs with its free-text field.
    contentTopics: text("content_topics").array(),
    contentTopicsOther: text("content_topics_other"),
    targetAudience: text("target_audience").array(),
    targetAudienceOther: text("target_audience_other"),
    audienceRegion: text("audience_region").array(),
    audienceRegionOther: text("audience_region_other"),
    audienceLanguage: text("audience_language").array(),
    audienceLanguageOther: text("audience_language_other"),
    platforms: text("platforms").array(),
    platformsOther: text("platforms_other"),
    /** The profile link for each chosen platform, keyed by its slug. */
    platformLinks: jsonb("platform_links").$type<PlatformLinks>().default({}).notNull(),

    // The intro video: a private S3 object, served through presigned URLs.
    videoKey: text("video_key"),
    videoSizeBytes: integer("video_size_bytes"),
    videoMime: text("video_mime"),
    videoUploadedAt: timestamp("video_uploaded_at", { withTimezone: true }),

    // Review.
    reviewNote: text("review_note"),
    decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    /** The decision the applicant was last emailed, and when. Written only
        by the mailing step (lib/notifications.ts), never by a status
        change: an applicant is owed an email while `status` is a decision
        that differs from `notifiedStatus`. */
    notifiedStatus: applicationStatus("notified_status"),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    // One application per person. Widen to (user_id, convention_year) if a
    // later convention reuses the table.
    uniqueIndex("applications_user_id_idx").on(table.userId),
    check(
      "applications_notified_status_check",
      sql`${table.notifiedStatus} is null or ${table.notifiedStatus} in ('accepted', 'rejected', 'waitlisted')`,
    ),
    check(
      "applications_notified_pair_check",
      sql`(${table.notifiedStatus} is null) = (${table.notifiedAt} is null)`,
    ),
  ],
);

/* Every status change, so the dashboard can show history and the mailing
   step can see what was decided and when. */
export const applicationEvents = pgTable("application_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  fromStatus: applicationStatus("from_status"),
  toStatus: applicationStatus("to_status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* The mailing ledger: one row per attempt to email a decision. The partial
   unique index is the lock, at most one unsettled attempt per application,
   so two admins (or a double click) cannot mail the same person twice. */
export const applicationNotifications = pgTable(
  "application_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    /** The decision this mail announces. */
    status: applicationStatus("status").notNull(),
    kind: notificationKind("kind").default("decision").notNull(),
    state: notificationState("state").default("sending").notNull(),
    // Captured when the attempt starts: the address on the user can change
    // at their next sign-in.
    recipientEmail: text("recipient_email").notNull(),
    recipientName: text("recipient_name"),
    templateVersion: text("template_version"),
    subject: text("subject"),
    sesMessageId: text("ses_message_id"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    sentBy: uuid("sent_by").references(() => users.id, { onDelete: "set null" }),
    /** Groups the rows of one bulk run. */
    batchId: uuid("batch_id"),
    // Who settled an uncertain attempt, and when.
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    /** When the attempt started. */
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("application_notifications_in_flight_idx")
      .on(table.applicationId)
      .where(sql`${table.state} in ('sending', 'uncertain')`),
    index("application_notifications_application_idx").on(table.applicationId, table.createdAt),
    check(
      "application_notifications_status_check",
      sql`${table.status} in ('accepted', 'rejected', 'waitlisted')`,
    ),
  ],
);

export const usersRelations = relations(users, ({ one }) => ({
  application: one(applications, {
    fields: [users.id],
    references: [applications.userId],
  }),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  decider: one(users, { fields: [applications.decidedBy], references: [users.id] }),
  events: many(applicationEvents),
  notifications: many(applicationNotifications),
}));

export const applicationNotificationsRelations = relations(applicationNotifications, ({ one }) => ({
  application: one(applications, {
    fields: [applicationNotifications.applicationId],
    references: [applications.id],
  }),
  sender: one(users, { fields: [applicationNotifications.sentBy], references: [users.id] }),
}));

export const applicationEventsRelations = relations(applicationEvents, ({ one }) => ({
  application: one(applications, {
    fields: [applicationEvents.applicationId],
    references: [applications.id],
  }),
  actor: one(users, { fields: [applicationEvents.actorId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type UserRole = User["role"];
export type Application = typeof applications.$inferSelect;
export type ApplicationStatus = Application["status"];
export type ApplicationEvent = typeof applicationEvents.$inferSelect;
export type ApplicationNotification = typeof applicationNotifications.$inferSelect;
export type NotificationState = ApplicationNotification["state"];
export type NotificationKind = ApplicationNotification["kind"];
