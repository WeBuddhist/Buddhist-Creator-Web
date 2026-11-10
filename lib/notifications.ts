import "server-only";
import { and, asc, eq, inArray, isNotNull, isNull, not, or, sql } from "drizzle-orm";
import type { EmailFilter } from "@/lib/applications-view";
import { db, schema } from "@/lib/db";
import type { NotificationState } from "@/lib/db/schema";
import { DECISIONS, isDecision, type Decision } from "@/lib/decisions";
import { renderDecisionEmail, templateReady } from "@/lib/emails";
import { delivery, EmailSendError, sendEmail, type HaltCode } from "@/lib/ses";

/* The mailing step: telling applicants what was decided.

   An applicant is owed an email while their status is a decision and
   differs from `notified_status`, the decision they were last emailed. A
   status change never sends and never touches the notified columns; only
   this file writes them, and it always writes what was actually sent.

   Every attempt is a row in application_notifications. SES has no
   idempotency key, so the row is also the lock: it is inserted as
   `sending` before the call, and a partial unique index allows one
   unsettled row per application. A second click, a second admin or a
   second tab finds the row and sends nothing.

   An attempt whose outcome is unknown (the call timed out, or the process
   died mid-call) becomes `uncertain` and stays in the way until an admin
   says whether the mail arrived. Nothing here retries on its own. */

const { applications, applicationNotifications: notifications, users } = schema;

/* How long a `sending` row may sit before it counts as abandoned. A send
   takes at most the SES client's ten-second timeout. */
const STALE_MINUTES = 5;
const staleBefore = sql`now() - interval '${sql.raw(String(STALE_MINUTES))} minutes'`;

const owed = sql`${applications.notifiedStatus} is distinct from ${applications.status}`;
const unsettled = inArray(notifications.state, ["sending", "uncertain"]);
/** An unsettled row that somebody has to look at. */
const needsReview = sql`(${notifications.state} = 'uncertain' or (${notifications.state} = 'sending' and ${notifications.createdAt} < ${staleBefore}))`;
const applicantName = sql<string | null>`coalesce(nullif(btrim(${applications.fullName}), ''), nullif(btrim(${users.name}), ''))`;

/** What an unsettled attempt means for the applicant's row: mid-send, or
    waiting for an admin. */
export type InFlight = "sending" | "review";

export const inFlightColumn = sql<InFlight | null>`case
  when ${notifications.id} is null then null
  when ${needsReview} then 'review'
  else 'sending'
end`;

/** The join that brings an application's one unsettled attempt, if any. */
export const unsettledJoin = and(eq(notifications.applicationId, applications.id), unsettled);

/** The rows whose Email cell shows a given state: the SQL twin of
    emailStatus() in components/admin/email-status.tsx, in the same order
    of precedence, so the four states split the list with no overlap. The
    query needs `unsettledJoin`. A send still in flight counts by what was
    true before it started. */
export function emailStateWhere(state: EmailFilter) {
  const review = and(isNotNull(notifications.id), needsReview);
  if (state === "review") return review;
  const noReview = or(isNull(notifications.id), not(needsReview));
  const decided = inArray(applications.status, [...DECISIONS]);
  if (state === "none") return and(noReview, not(decided));
  return and(noReview, decided, state === "sent" ? not(owed) : owed);
}

/* ---------------------------------------------------------------------- */
/* Reading                                                                 */
/* ---------------------------------------------------------------------- */

export type OwedSummary = {
  /** Applicants owed each email and free to be sent it now. */
  owed: Record<Decision, number>;
  total: number;
  /** Attempts waiting for an admin, whatever the applicant's status. */
  review: { applicationId: string; name: string }[];
  reviewCount: number;
};

export async function owedSummary(scope: readonly Decision[]): Promise<OwedSummary> {
  const everyDecision = scope.length === DECISIONS.length;
  const reviewWhere = everyDecision ? needsReview : and(needsReview, inArray(applications.status, [...scope]));
  const [counts, review, [{ reviewCount }]] = await Promise.all([
    db()
      .select({ status: applications.status, count: sql<number>`count(*)::int` })
      .from(applications)
      .leftJoin(notifications, unsettledJoin)
      .where(and(inArray(applications.status, [...scope]), owed, isNull(notifications.id)))
      .groupBy(applications.status),
    db()
      .select({ applicationId: applications.id, name: applicantName, email: users.email })
      .from(notifications)
      .innerJoin(applications, eq(applications.id, notifications.applicationId))
      .innerJoin(users, eq(users.id, applications.userId))
      .where(reviewWhere)
      .orderBy(asc(notifications.createdAt))
      .limit(5),
    db()
      .select({ reviewCount: sql<number>`count(*)::int` })
      .from(notifications)
      .innerJoin(applications, eq(applications.id, notifications.applicationId))
      .where(reviewWhere),
  ]);
  const byDecision: Record<Decision, number> = { accepted: 0, rejected: 0, waitlisted: 0 };
  for (const row of counts) if (isDecision(row.status)) byDecision[row.status] = row.count;
  return {
    owed: byDecision,
    total: byDecision.accepted + byDecision.rejected + byDecision.waitlisted,
    review: review.map((row) => ({ applicationId: row.applicationId, name: row.name ?? row.email })),
    reviewCount,
  };
}

/** The one send to this applicant that has not settled, if any, and
    whether it is still mid-call or waiting for an admin. */
export async function unsettledAttempt(applicationId: string) {
  const [row] = await db()
    .select({ id: notifications.id, inFlight: inFlightColumn })
    .from(notifications)
    .where(and(eq(notifications.applicationId, applicationId), unsettled));
  return row?.inFlight ? { id: row.id, inFlight: row.inFlight } : null;
}

export type Recipient = {
  id: string;
  status: Decision;
  name: string | null;
  email: string;
  /** A different decision they were emailed before, if any. */
  previouslyTold: Decision | null;
};

/** Everyone owed an email in `scope`: those who can be sent it now, and
    those held back by an unsettled attempt. Oldest decision first. */
export async function listOwed(scope: readonly Decision[]) {
  const rows = await db()
    .select({
      id: applications.id,
      status: applications.status,
      notifiedStatus: applications.notifiedStatus,
      name: applicantName,
      email: users.email,
      inFlight: inFlightColumn,
    })
    .from(applications)
    .innerJoin(users, eq(users.id, applications.userId))
    .leftJoin(notifications, unsettledJoin)
    .where(and(inArray(applications.status, [...scope]), owed))
    .orderBy(asc(applications.decidedAt), asc(applications.id));

  const recipients: Recipient[] = [];
  const blocked: { id: string; name: string | null; email: string; inFlight: InFlight }[] = [];
  for (const row of rows) {
    if (!isDecision(row.status)) continue;
    if (row.inFlight) {
      blocked.push({ id: row.id, name: row.name, email: row.email, inFlight: row.inFlight });
    } else {
      recipients.push({
        id: row.id,
        status: row.status,
        name: row.name,
        email: row.email,
        previouslyTold: isDecision(row.notifiedStatus) ? row.notifiedStatus : null,
      });
    }
  }
  return { recipients, blocked };
}

/* ---------------------------------------------------------------------- */
/* Sending                                                                 */
/* ---------------------------------------------------------------------- */

export type SkipReason = "not_found" | "status_changed" | "already_sent" | "in_flight" | "needs_review" | "not_owed";

export type SendOutcome =
  | { outcome: "sent"; to: string; at: Date }
  /** Nothing was attempted: the applicant is not, or no longer, owed this. */
  | { outcome: "skipped"; reason: SkipReason; message: string }
  /** SES refused; nothing was sent. `halt` means the next would fail too. */
  | { outcome: "failed"; message: string; halt: HaltCode | null }
  /** Nobody knows whether it was sent. An admin has to settle it. */
  | { outcome: "uncertain"; message: string }
  /** Sending is switched off here. */
  | { outcome: "off"; message: string };

type Attempt = {
  applicationId: string;
  /** The decision the admin was looking at. A status that has moved since
      is never mailed on a stale click. */
  expectedStatus: Decision;
  actorId: string;
  batchId?: string | null;
} & ({ kind: "decision" } | { kind: "resend"; expectedNotifiedAt: Date });

type Claim = { id: string; status: Decision; email: string; name: string | null };

/** Abandoned `sending` rows become `uncertain`, so they show for review. */
async function sweepStale() {
  await db()
    .update(notifications)
    .set({ state: "uncertain", errorCode: "ABANDONED", errorMessage: "The send did not finish. It may or may not have gone out." })
    .where(and(eq(notifications.state, "sending"), sql`${notifications.createdAt} < ${staleBefore}`));
}

/* One statement, committed on its own so no transaction is held across the
   call to SES. The application row is locked while the ledger row goes in:
   a concurrent claim waits, then re-reads the row and sees it is no longer
   owed. `ON CONFLICT` names the partial unique index; an unsettled attempt
   for this application means nothing is inserted. */
async function claim(attempt: Attempt): Promise<Claim | null> {
  const stillOwed =
    attempt.kind === "decision"
      ? sql`a.notified_status is distinct from a.status`
      : // A resend repeats the mail they have, and only the one the admin was
        // shown: a second click finds a newer notified_at and stops.
        sql`a.notified_status = a.status and date_trunc('milliseconds', a.notified_at) = date_trunc('milliseconds', ${attempt.expectedNotifiedAt.toISOString()}::timestamptz)`;
  const result = await db().execute(sql`
    with target as (
      select a.id, a.status, u.email,
             coalesce(nullif(btrim(a.full_name), ''), nullif(btrim(u.name), '')) as name
      from applications a
      join users u on u.id = a.user_id
      where a.id = ${attempt.applicationId}::uuid
        and a.status = ${attempt.expectedStatus}::application_status
        and a.status in ('accepted', 'rejected', 'waitlisted')
        and ${stillOwed}
      for update of a
    )
    insert into application_notifications
      (application_id, status, kind, state, recipient_email, recipient_name, sent_by, batch_id)
    select id, status, ${attempt.kind}::notification_kind, 'sending', email, name,
           ${attempt.actorId}::uuid, ${attempt.batchId ?? null}::uuid
    from target
    on conflict (application_id) where state in ('sending', 'uncertain') do nothing
    returning id, status, recipient_email, recipient_name
  `);
  const row = result.rows[0] as
    | { id: string; status: Decision; recipient_email: string; recipient_name: string | null }
    | undefined;
  return row ? { id: row.id, status: row.status, email: row.recipient_email, name: row.recipient_name } : null;
}

/** Why a claim came back empty, in words an admin can act on. */
async function explainSkip(attempt: Attempt): Promise<SendOutcome> {
  const [row] = await db()
    .select({ status: applications.status, notifiedStatus: applications.notifiedStatus, inFlight: inFlightColumn })
    .from(applications)
    .leftJoin(notifications, unsettledJoin)
    .where(eq(applications.id, attempt.applicationId));
  const skipped = (reason: SkipReason, message: string): SendOutcome => ({ outcome: "skipped", reason, message });
  if (!row) return skipped("not_found", "That application no longer exists.");
  if (row.inFlight === "review") {
    return skipped("needs_review", "An earlier send to this applicant needs review before another can go out.");
  }
  if (row.inFlight === "sending") return skipped("in_flight", "An email to this applicant is being sent right now.");
  if (row.status !== attempt.expectedStatus) {
    return skipped("status_changed", "The decision changed since this page loaded. Reload and check it.");
  }
  if (attempt.kind === "decision" && row.notifiedStatus === row.status) {
    return skipped("already_sent", "This email has already been sent.");
  }
  if (attempt.kind === "resend") {
    return skipped("already_sent", "This email was sent again a moment ago. Reload to see it.");
  }
  return skipped("not_owed", "There is no decision email to send for this applicant.");
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* The mail went out; say so in both places at once. The application row is
   locked first, the same order a claim takes its locks, so the two cannot
   deadlock. `notified_status` is what was sent, which is not always the
   status now: a decision changed mid-send is still owed afterwards. */
async function recordSent(claimed: Claim, applicationId: string, sent: { messageId: string; subject: string; version: string }) {
  const now = new Date();
  await db().transaction(async (tx) => {
    await tx.execute(sql`select id from applications where id = ${applicationId}::uuid for update`);
    await tx
      .update(notifications)
      .set({
        state: "sent",
        sesMessageId: sent.messageId,
        subject: sent.subject,
        templateVersion: sent.version,
        errorCode: null,
        errorMessage: null,
        sentAt: now,
      })
      .where(eq(notifications.id, claimed.id));
    // Not `updated_at`: the dashboard shows that as when the applicant
    // last edited their answers.
    await tx
      .update(applications)
      .set({ notifiedStatus: claimed.status, notifiedAt: now })
      .where(eq(applications.id, applicationId));
  });
  return now;
}

async function recordProblem(claimId: string, state: Extract<NotificationState, "failed" | "uncertain">, error: EmailSendError) {
  await db()
    .update(notifications)
    .set({ state, errorCode: error.code, errorMessage: error.message.slice(0, 500) })
    .where(eq(notifications.id, claimId));
}

async function attemptSend(attempt: Attempt): Promise<SendOutcome> {
  const { mode, note } = delivery();
  if (mode !== "live" && mode !== "simulate") {
    return { outcome: "off", message: note ?? "Email sending is switched off in this environment." };
  }
  // Placeholder wording never reaches an applicant. Checked before the
  // claim, so a refusal leaves no row behind.
  if (mode === "live" && !templateReady(attempt.expectedStatus)) {
    return {
      outcome: "failed",
      message: `The ${attempt.expectedStatus} email still has placeholder wording. Approve it in lib/emails before sending.`,
      halt: "config",
    };
  }

  await sweepStale();
  const claimed = await claim(attempt);
  if (!claimed) return explainSkip(attempt);

  const email = renderDecisionEmail(claimed.status, { name: claimed.name });
  let messageId: string;
  try {
    ({ messageId } = await sendEmail(
      {
        to: claimed.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
        tags: { notification: claimed.id, decision: claimed.status },
      },
      { simulate: mode === "simulate" },
    ));
  } catch (raw) {
    const error =
      raw instanceof EmailSendError ? raw : new EmailSendError("uncertain", "Error", String((raw as Error)?.message ?? raw));
    await recordProblem(claimed.id, error.kind, error);
    if (error.kind === "failed") return { outcome: "failed", message: error.message, halt: error.halt };
    return {
      outcome: "uncertain",
      message: "The send did not confirm, so it may or may not have gone out. It is waiting for review.",
    };
  }

  // SES has the message. If the database cannot be told, the row stays
  // `sending`, turns `uncertain` on its own and waits for an admin; the
  // message id in the log is how they can check.
  for (let tries = 1; ; tries += 1) {
    try {
      const at = await recordSent(claimed, attempt.applicationId, {
        messageId,
        subject: email.subject,
        version: email.version,
      });
      return { outcome: "sent", to: claimed.email, at };
    } catch (error) {
      if (tries < 3) {
        await wait(300 * tries);
        continue;
      }
      console.error(`Decision email sent but not recorded: notification ${claimed.id}, SES message ${messageId}`, error);
      return {
        outcome: "uncertain",
        message: "The email went out but could not be recorded. It is waiting for review; mark it as sent.",
      };
    }
  }
}

/** Email an applicant the decision they have not been told. */
export function sendDecisionEmail(args: {
  applicationId: string;
  expectedStatus: Decision;
  actorId: string;
  batchId?: string | null;
}) {
  return attemptSend({ ...args, kind: "decision" });
}

/** Email an applicant, again, the decision they were already told. */
export function resendDecisionEmail(args: {
  applicationId: string;
  expectedStatus: Decision;
  expectedNotifiedAt: Date;
  actorId: string;
}) {
  return attemptSend({ ...args, kind: "resend" });
}

/** An admin settles an attempt nobody knows the outcome of. "sent" records
    the mail as delivered at the time it was tried; "not_sent" clears the
    way for another attempt. */
export async function resolveNotification(args: {
  notificationId: string;
  outcome: "sent" | "not_sent";
  actorId: string;
}): Promise<{ ok: true; applicationId: string } | { ok: false; message: string }> {
  await sweepStale();
  const row = await db().query.applicationNotifications.findFirst({
    where: eq(notifications.id, args.notificationId),
  });
  if (!row) return { ok: false, message: "That send no longer exists." };
  if (row.state !== "uncertain") return { ok: false, message: "That send has already been settled." };
  const decision = row.status;
  if (!isDecision(decision)) return { ok: false, message: "That send has no decision to record." };

  const now = new Date();
  const settled = await db().transaction(async (tx) => {
    await tx.execute(sql`select id from applications where id = ${row.applicationId}::uuid for update`);
    const [updated] = await tx
      .update(notifications)
      .set(
        args.outcome === "sent"
          ? { state: "sent", sentAt: row.createdAt, resolvedBy: args.actorId, resolvedAt: now }
          : { state: "failed", errorCode: "RESOLVED_NOT_SENT", resolvedBy: args.actorId, resolvedAt: now },
      )
      .where(and(eq(notifications.id, row.id), eq(notifications.state, "uncertain")))
      .returning({ id: notifications.id });
    if (!updated) return false;
    if (args.outcome === "sent") {
      await tx
        .update(applications)
        .set({ notifiedStatus: decision, notifiedAt: row.createdAt })
        .where(eq(applications.id, row.applicationId));
    }
    return true;
  });
  if (!settled) return { ok: false, message: "That send has already been settled." };
  return { ok: true, applicationId: row.applicationId };
}

/** One of the three emails, to the admin asking. Nothing is recorded and
    no applicant is involved, so it also works with placeholder wording
    and outside production. */
export async function sendTestEmail(args: {
  decision: Decision;
  to: string;
  name: string | null;
}): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const { mode, note } = delivery();
  if (mode === "off") return { ok: false, message: note ?? "Email sending is switched off in this environment." };
  const email = renderDecisionEmail(args.decision, { name: args.name });
  try {
    await sendEmail(
      { to: args.to, subject: `[Test] ${email.subject}`, text: email.text, html: email.html, tags: { test: args.decision } },
      { simulate: mode === "simulate" },
    );
  } catch (raw) {
    const message = raw instanceof EmailSendError ? raw.message : String((raw as Error)?.message ?? raw);
    return { ok: false, message };
  }
  return {
    ok: true,
    message: mode === "simulate" ? `Simulated a test to ${args.to}.` : `Test sent to ${args.to}.`,
  };
}
