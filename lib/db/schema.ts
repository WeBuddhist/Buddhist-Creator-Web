import { relations, sql, type SQL } from "drizzle-orm";
import {
  bigint,
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
import type { CardSocials } from "@/lib/creator-card";
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

/* A creator card is read by the team before it counts: pending → approved
   | rejected. An admin may change a decision or take it back to pending.
   Whenever the creator changes their card it goes back to pending, so
   nothing on an approved card is ever unread. */
export const creatorCardStatus = pgEnum("creator_card_status", ["pending", "approved", "rejected"]);

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

/* The homepage suggestion box (components/home/feedback.tsx). Anyone may
   write, signed in or not, and a row is never tied to a user: the email is
   there only when the writer asked for a reply. The limits are the form's
   `maxLength`s and the checks below. */
export const SUGGESTION_MAX_LENGTH = 2000;
export const SUGGESTION_EMAIL_MAX_LENGTH = 254;

export const suggestions = pgTable(
  "suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    body: text("body").notNull(),
    /** As typed. Nothing mails it; a person reads it and writes back. */
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "suggestions_body_check",
      sql`char_length(${table.body}) between 1 and ${sql.raw(String(SUGGESTION_MAX_LENGTH))}`,
    ),
    check(
      "suggestions_email_check",
      sql`char_length(${table.email}) between 1 and ${sql.raw(String(SUGGESTION_EMAIL_MAX_LENGTH))}`,
    ),
  ],
);

/* Creator cards: who a creator is, what they make and where to find it.
   A signed-in creator fills one in (app/(site)/creator-card) and the team
   reviews it (app/admin/creator-cards).

   Only the name is required here. The team also makes cards for creators
   it knows, from details it only partly has (drizzle/0009 holds the first
   of them). Those are approved as they are made and have no owner: the
   first person to claim one becomes its owner, and `userId` is null until
   then. What
   a creator must fill in to send their own card is lib/creator-card.ts's
   business. The limits repeat that file's CARD_NAME_MAX and
   CARD_TAGLINE_MAX; drizzle-kit reads this file on its own, so they are
   written out here. */
export const creatorCards = pgTable(
  "creator_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** The creator the card belongs to. Null for a card nobody has claimed. */
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    /** When its owner claimed a card the team had made. Null for a card
        nobody has claimed, and for one its creator made themselves. */
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    status: creatorCardStatus("status").default("pending").notNull(),
    /** Counts the versions of the card's content. A review names the
        version it read, and is refused if the card has moved on. */
    revision: integer("revision").default(1).notNull(),

    displayName: text("display_name").notNull(),
    // A name from lib/countries.ts.
    country: text("country"),
    // Option slugs from lib/creator-card.ts; "other" pairs with its text.
    creatorType: text("creator_type"),
    languages: text("languages").array(),
    languagesOther: text("languages_other"),
    contentTypes: text("content_types").array(),
    contentTypesOther: text("content_types_other"),
    /** One line about the creator's work, shown on the card. */
    tagline: text("tagline"),
    /** The S3 key of the card's photo: one the creator uploaded, or, on a
        card the team made, the picture from the creator's public profile
        (PROFILE_PICTURE_PREFIX in lib/creator-card.ts). Null means the
        card shows the picture from its owner's sign-in account
        (users.picture), as the backend's avatar_url does for a social
        login. */
    photoKey: text("photo_key"),
    /** The link for each place the creator publishes, keyed by its slug. */
    socials: jsonb("socials").$type<CardSocials>().default({}).notNull(),
    /* How many people follow the creator in each place a count is kept
       for (COUNTED_SOCIALS in lib/creator-card.ts). The creator types
       them in for now; null is a figure the card does not have. They are
       columns rather than keys of `socials` so creators can be ranked in
       SQL, on one place or on all of them. They are not part of what a
       review reads: changing one moves neither `status` nor `revision`. */
    youtubeFollowers: integer("youtube_followers"),
    instagramFollowers: integer("instagram_followers"),
    tiktokFollowers: integer("tiktok_followers"),
    facebookFollowers: integer("facebook_followers"),
    /** The counts added together, kept by the database so it cannot fall
        out of step with them. A card with no count has 0. */
    totalFollowers: bigint("total_followers", { mode: "number" })
      .generatedAlwaysAs(
        (): SQL =>
          sql`coalesce(${creatorCards.youtubeFollowers}, 0)::bigint + coalesce(${creatorCards.instagramFollowers}, 0) + coalesce(${creatorCards.tiktokFollowers}, 0) + coalesce(${creatorCards.facebookFollowers}, 0)`,
      )
      .notNull(),

    // Review. The note is for the creator: they see it with a rejection.
    reviewNote: text("review_note"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    /** When the creator last sent the card for review. */
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    // One card per person. Any number of cards may have no owner: a unique
    // index does not compare nulls.
    uniqueIndex("creator_cards_user_id_idx").on(table.userId),
    index("creator_cards_status_idx").on(table.status, table.submittedAt),
    check("creator_cards_display_name_check", sql`char_length(${table.displayName}) between 1 and 80`),
    check("creator_cards_tagline_check", sql`char_length(${table.tagline}) <= 140`),
    check(
      "creator_cards_followers_check",
      sql`${table.youtubeFollowers} >= 0 and ${table.instagramFollowers} >= 0 and ${table.tiktokFollowers} >= 0 and ${table.facebookFollowers} >= 0`,
    ),
  ],
);

export const usersRelations = relations(users, ({ one }) => ({
  application: one(applications, {
    fields: [users.id],
    references: [applications.userId],
  }),
}));

export const creatorCardsRelations = relations(creatorCards, ({ one }) => ({
  user: one(users, { fields: [creatorCards.userId], references: [users.id] }),
  reviewer: one(users, { fields: [creatorCards.reviewedBy], references: [users.id] }),
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
export type Suggestion = typeof suggestions.$inferSelect;
export type CreatorCard = typeof creatorCards.$inferSelect;
export type CreatorCardStatus = CreatorCard["status"];
