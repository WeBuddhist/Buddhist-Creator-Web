"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { InvalidTransition, REVIEWABLE, setApplicationStatus } from "@/lib/applications";
import { assertRole, Unauthorized } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/db/schema";
import { DECISIONS } from "@/lib/decisions";
import {
  resendDecisionEmail,
  resolveNotification,
  sendDecisionEmail,
  type SendOutcome,
} from "@/lib/notifications";

export type DecisionState = { ok: boolean; message?: string; at?: string };

const schema = z.object({
  applicationId: z.uuid(),
  status: z.enum(REVIEWABLE as [ApplicationStatus, ...ApplicationStatus[]]),
  note: z.string().trim().max(4000).optional(),
});

export async function setStatusAction(_prev: DecisionState, formData: FormData): Promise<DecisionState> {
  let actor;
  try {
    actor = await assertRole("admin");
  } catch (error) {
    if (error instanceof Unauthorized) return { ok: false, message: "You are not allowed to do that." };
    throw error;
  }
  const parsed = schema.safeParse({
    applicationId: formData.get("applicationId"),
    status: formData.get("status"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return { ok: false, message: "That decision could not be read." };

  try {
    await setApplicationStatus({
      applicationId: parsed.data.applicationId,
      actorId: actor.id,
      status: parsed.data.status,
      note: parsed.data.note || null,
    });
  } catch (error) {
    if (error instanceof InvalidTransition) {
      return { ok: false, message: "Only a submitted application can be decided." };
    }
    throw error;
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/applications/${parsed.data.applicationId}`);
  return { ok: true, at: new Date().toISOString() };
}

/* ---------------------------------------------------------------------- */
/* The decision email                                                      */
/* ---------------------------------------------------------------------- */

export type EmailState = { ok: boolean; message?: string };

const NOT_ALLOWED: EmailState = { ok: false, message: "You are not allowed to do that." };

function emailState(result: SendOutcome): EmailState {
  if (result.outcome === "sent") return { ok: true, message: `Sent to ${result.to}.` };
  return { ok: false, message: result.message };
}

function revalidateApplication(applicationId: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/applications/${applicationId}`);
}

const sendSchema = z.object({
  applicationId: z.uuid(),
  // The decision on the page when the button was pressed. If it has moved
  // since, nothing is sent.
  expectedStatus: z.enum(DECISIONS),
});

/** Email this applicant the decision they have not been told. */
export async function sendDecisionEmailAction(_prev: EmailState, formData: FormData): Promise<EmailState> {
  let actor;
  try {
    actor = await assertRole("admin");
  } catch (error) {
    if (error instanceof Unauthorized) return NOT_ALLOWED;
    throw error;
  }
  const parsed = sendSchema.safeParse({
    applicationId: formData.get("applicationId"),
    expectedStatus: formData.get("expectedStatus"),
  });
  if (!parsed.success) return { ok: false, message: "That request could not be read." };

  const result = await sendDecisionEmail({ ...parsed.data, actorId: actor.id });
  revalidateApplication(parsed.data.applicationId);
  return emailState(result);
}

const resendSchema = sendSchema.extend({
  // When the page says the email last went out. A second press carries
  // the same value, finds a newer one stored, and is refused.
  expectedNotifiedAt: z.iso.datetime(),
});

/** Email this applicant, again, the decision they were already told. */
export async function resendDecisionEmailAction(_prev: EmailState, formData: FormData): Promise<EmailState> {
  let actor;
  try {
    actor = await assertRole("admin");
  } catch (error) {
    if (error instanceof Unauthorized) return NOT_ALLOWED;
    throw error;
  }
  const parsed = resendSchema.safeParse({
    applicationId: formData.get("applicationId"),
    expectedStatus: formData.get("expectedStatus"),
    expectedNotifiedAt: formData.get("expectedNotifiedAt"),
  });
  if (!parsed.success) return { ok: false, message: "That request could not be read." };

  const result = await resendDecisionEmail({
    applicationId: parsed.data.applicationId,
    expectedStatus: parsed.data.expectedStatus,
    expectedNotifiedAt: new Date(parsed.data.expectedNotifiedAt),
    actorId: actor.id,
  });
  revalidateApplication(parsed.data.applicationId);
  return emailState(result);
}

const resolveSchema = z.object({
  notificationId: z.uuid(),
  outcome: z.enum(["sent", "not_sent"]),
});

/** Settle a send whose outcome nobody knows. */
export async function resolveNotificationAction(_prev: EmailState, formData: FormData): Promise<EmailState> {
  let actor;
  try {
    actor = await assertRole("admin");
  } catch (error) {
    if (error instanceof Unauthorized) return NOT_ALLOWED;
    throw error;
  }
  const parsed = resolveSchema.safeParse({
    notificationId: formData.get("notificationId"),
    outcome: formData.get("outcome"),
  });
  if (!parsed.success) return { ok: false, message: "That request could not be read." };

  const result = await resolveNotification({ ...parsed.data, actorId: actor.id });
  if (!result.ok) return { ok: false, message: result.message };
  revalidateApplication(result.applicationId);
  return {
    ok: true,
    message: parsed.data.outcome === "sent" ? "Recorded as sent." : "Recorded as not sent. It can be sent again.",
  };
}
