import "server-only";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Application, ApplicationStatus, UserRole } from "@/lib/db/schema";
import type { DraftValues } from "@/lib/registration-2027";

/* Everything that reads or writes applications. Callers pass the current
   user in; the functions decide what that user may do. Status transitions
   live here, not in the UI. */

const { applications, applicationEvents, users } = schema;

export const EDITABLE: readonly ApplicationStatus[] = ["draft", "submitted"];
export const DECISIONS: readonly ApplicationStatus[] = ["accepted", "rejected", "waitlisted"];
export const REVIEWABLE: readonly ApplicationStatus[] = ["submitted", ...DECISIONS];

export function isEditable(status: ApplicationStatus) {
  return EDITABLE.includes(status);
}

export class ApplicationLocked extends Error {
  constructor() {
    super("APPLICATION_LOCKED");
    this.name = "ApplicationLocked";
  }
}

export class InvalidTransition extends Error {
  constructor(from: ApplicationStatus, to: ApplicationStatus) {
    super(`INVALID_TRANSITION:${from}->${to}`);
    this.name = "InvalidTransition";
  }
}

/* ---------------------------------------------------------------------- */
/* Applicant                                                               */
/* ---------------------------------------------------------------------- */

export async function getMyApplication(userId: string): Promise<Application | null> {
  const row = await db().query.applications.findFirst({ where: eq(applications.userId, userId) });
  return row ?? null;
}

/** The user's application, creating an empty draft the first time. */
export async function getOrCreateMyApplication(userId: string): Promise<Application> {
  const existing = await getMyApplication(userId);
  if (existing) return existing;
  const [created] = await db()
    .insert(applications)
    .values({ userId })
    .onConflictDoNothing({ target: applications.userId })
    .returning();
  // A concurrent first save may have won the insert.
  return created ?? (await getMyApplication(userId))!;
}

/** Save answers. A submitted application stays submitted; a draft stays a
    draft. Anything decided is locked. */
export async function saveMyApplication(userId: string, values: DraftValues): Promise<Application> {
  const current = await getOrCreateMyApplication(userId);
  if (!isEditable(current.status)) throw new ApplicationLocked();
  const [updated] = await db()
    .update(applications)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(applications.id, current.id))
    .returning();
  return updated;
}

/** Save and mark submitted. The caller has already validated `values`
    against the submit schema and checked that a video is attached. */
export async function submitMyApplication(userId: string, values: DraftValues): Promise<Application> {
  return db().transaction(async (tx) => {
    const current = await tx.query.applications.findFirst({ where: eq(applications.userId, userId) });
    if (!current) throw new ApplicationLocked();
    if (!isEditable(current.status)) throw new ApplicationLocked();
    const now = new Date();
    const firstTime = current.status === "draft";
    const [updated] = await tx
      .update(applications)
      .set({
        ...values,
        status: "submitted",
        submittedAt: firstTime ? now : current.submittedAt,
        updatedAt: now,
      })
      .where(eq(applications.id, current.id))
      .returning();
    if (firstTime) {
      await tx.insert(applicationEvents).values({
        applicationId: current.id,
        actorId: userId,
        fromStatus: current.status,
        toStatus: "submitted",
      });
    }
    return updated;
  });
}

export async function withdrawMyApplication(userId: string): Promise<Application> {
  return db().transaction(async (tx) => {
    const current = await tx.query.applications.findFirst({ where: eq(applications.userId, userId) });
    if (!current || !isEditable(current.status)) throw new ApplicationLocked();
    const [updated] = await tx
      .update(applications)
      .set({ status: "withdrawn", updatedAt: new Date() })
      .where(eq(applications.id, current.id))
      .returning();
    await tx.insert(applicationEvents).values({
      applicationId: current.id,
      actorId: userId,
      fromStatus: current.status,
      toStatus: "withdrawn",
    });
    return updated;
  });
}

/** The applicant takes a withdrawal back. Withdrawing keeps the row and
    its submitted date, so a submitted application returns to submitted
    and an unsent one to draft. Only a withdrawn application can be
    reopened; anything else is left as it is. */
export async function reopenMyApplication(userId: string): Promise<Application> {
  return db().transaction(async (tx) => {
    const current = await tx.query.applications.findFirst({ where: eq(applications.userId, userId) });
    if (!current) throw new ApplicationLocked();
    if (current.status !== "withdrawn") throw new InvalidTransition(current.status, "submitted");
    const status: ApplicationStatus = current.submittedAt ? "submitted" : "draft";
    const [updated] = await tx
      .update(applications)
      .set({ status, updatedAt: new Date() })
      .where(eq(applications.id, current.id))
      .returning();
    await tx.insert(applicationEvents).values({
      applicationId: current.id,
      actorId: userId,
      fromStatus: current.status,
      toStatus: status,
    });
    return updated;
  });
}

/** Record a newly uploaded video. Returns the key it replaced, if any, so
    the caller can delete that object once the row is safe. */
export async function setMyVideo(
  userId: string,
  video: { key: string; sizeBytes: number; mime: string },
): Promise<{ application: Application; previousKey: string | null }> {
  return db().transaction(async (tx) => {
    const current = await tx.query.applications.findFirst({ where: eq(applications.userId, userId) });
    if (!current || !isEditable(current.status)) throw new ApplicationLocked();
    const [updated] = await tx
      .update(applications)
      .set({
        videoKey: video.key,
        videoSizeBytes: video.sizeBytes,
        videoMime: video.mime,
        videoUploadedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(applications.id, current.id))
      .returning();
    return { application: updated, previousKey: current.videoKey };
  });
}

export async function clearMyVideo(userId: string): Promise<string | null> {
  return db().transaction(async (tx) => {
    const current = await tx.query.applications.findFirst({ where: eq(applications.userId, userId) });
    if (!current || !isEditable(current.status)) throw new ApplicationLocked();
    await tx
      .update(applications)
      .set({ videoKey: null, videoSizeBytes: null, videoMime: null, videoUploadedAt: null, updatedAt: new Date() })
      .where(eq(applications.id, current.id));
    return current.videoKey;
  });
}

/* ---------------------------------------------------------------------- */
/* Admin                                                                   */
/* ---------------------------------------------------------------------- */

export type ApplicationListRow = {
  id: string;
  status: ApplicationStatus;
  fullName: string | null;
  organization: string | null;
  location: string | null;
  platforms: string[] | null;
  submittedAt: Date | null;
  updatedAt: Date;
  email: string;
  userName: string | null;
};

export type ListFilter = "all" | ApplicationStatus;

export const PAGE_SIZE = 50;

export async function listApplications(filter: ListFilter, page = 1) {
  const where = filter === "all" ? ne(applications.status, "draft") : eq(applications.status, filter);
  const offset = Math.max(0, page - 1) * PAGE_SIZE;
  const [rows, [{ total }]] = await Promise.all([
    db()
      .select({
        id: applications.id,
        status: applications.status,
        fullName: applications.fullName,
        organization: applications.organization,
        location: applications.location,
        platforms: applications.platforms,
        submittedAt: applications.submittedAt,
        updatedAt: applications.updatedAt,
        email: users.email,
        userName: users.name,
      })
      .from(applications)
      .innerJoin(users, eq(users.id, applications.userId))
      .where(where)
      .orderBy(desc(applications.submittedAt), desc(applications.updatedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db().select({ total: sql<number>`count(*)::int` }).from(applications).where(where),
  ]);
  return { rows: rows as ApplicationListRow[], total, page, pageSize: PAGE_SIZE };
}

export async function countByStatus() {
  const rows = await db()
    .select({ status: applications.status, count: sql<number>`count(*)::int` })
    .from(applications)
    .groupBy(applications.status);
  const counts: Partial<Record<ApplicationStatus, number>> = {};
  for (const row of rows) counts[row.status] = row.count;
  return counts;
}

export async function getApplication(id: string) {
  return db().query.applications.findFirst({
    where: eq(applications.id, id),
    with: {
      user: true,
      decider: true,
      events: { orderBy: [asc(applicationEvents.createdAt)], with: { actor: true } },
    },
  });
}

/** An admin's decision. Only something submitted can be decided, and a
    decision can be changed or undone (back to submitted). */
export async function setApplicationStatus(args: {
  applicationId: string;
  actorId: string;
  status: ApplicationStatus;
  note?: string | null;
}) {
  if (!REVIEWABLE.includes(args.status)) {
    throw new InvalidTransition("submitted", args.status);
  }
  return db().transaction(async (tx) => {
    const current = await tx.query.applications.findFirst({ where: eq(applications.id, args.applicationId) });
    if (!current) throw new Error("NOT_FOUND");
    if (!REVIEWABLE.includes(current.status)) throw new InvalidTransition(current.status, args.status);
    const decided = DECISIONS.includes(args.status);
    const now = new Date();
    const [updated] = await tx
      .update(applications)
      .set({
        status: args.status,
        reviewNote: args.note ?? current.reviewNote,
        decidedBy: decided ? args.actorId : null,
        decidedAt: decided ? now : null,
        // A changed decision has not been sent yet.
        notifiedAt: current.status === args.status ? current.notifiedAt : null,
        updatedAt: now,
      })
      .where(eq(applications.id, current.id))
      .returning();
    if (current.status !== args.status || args.note) {
      await tx.insert(applicationEvents).values({
        applicationId: current.id,
        actorId: args.actorId,
        fromStatus: current.status,
        toStatus: args.status,
        note: args.note || null,
      });
    }
    return updated;
  });
}

/* ---------------------------------------------------------------------- */
/* Users (superadmin)                                                      */
/* ---------------------------------------------------------------------- */

export async function listUsers() {
  return db()
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      applicationStatus: applications.status,
    })
    .from(users)
    .leftJoin(applications, eq(applications.userId, users.id))
    .orderBy(desc(users.role), asc(users.email));
}

export async function setUserRole(args: { actorId: string; userId: string; role: UserRole }) {
  // Nobody demotes themself: it is the one change that can lock everyone out.
  if (args.actorId === args.userId) throw new Error("CANNOT_CHANGE_OWN_ROLE");
  const [updated] = await db()
    .update(users)
    .set({ role: args.role, updatedAt: new Date() })
    .where(eq(users.id, args.userId))
    .returning();
  if (!updated) throw new Error("NOT_FOUND");
  return updated;
}

/** Applications in the given statuses, for a bulk action. */
export async function applicationsIn(statuses: ApplicationStatus[]) {
  if (statuses.length === 0) return [];
  return db()
    .select({ id: applications.id, status: applications.status, email: users.email })
    .from(applications)
    .innerJoin(users, eq(users.id, applications.userId))
    .where(and(inArray(applications.status, statuses)));
}
