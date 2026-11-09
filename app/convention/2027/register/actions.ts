"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  ApplicationLocked,
  getMyApplication,
  saveMyApplication,
  submitMyApplication,
  withdrawMyApplication,
} from "@/lib/applications";
import { getCurrentUser } from "@/lib/auth";
import { loginUrl } from "@/lib/auth0";
import type { ApplicationStatus } from "@/lib/db/schema";
import { FORM, draftSchema, formValues, submitSchema, type FieldErrors } from "@/lib/registration-2027";

const PATH = "/convention/2027/register";

export type FormState = {
  ok: boolean;
  intent?: "draft" | "submit";
  status?: ApplicationStatus;
  errors?: FieldErrors;
  savedAt?: string;
  /** True when this submission moved the application out of draft. */
  firstSubmission?: boolean;
};

/* The applicant hears about a decision by email, so a locked application
   says only that it is locked, never why. */
const LOCKED: FieldErrors = {
  form: [`Your application can no longer be changed. If something needs updating, write to ${FORM.contact}.`],
};

/* One action for both buttons: the submitter's `intent` says whether this
   is a draft save (anything goes) or a submission (everything required,
   video attached). The session is re-read here; nothing from the client
   says who is saving. */
export async function saveApplicationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(PATH));

  const intent = formData.get("intent") === "submit" ? "submit" : "draft";
  const raw = formValues(formData);

  if (intent === "draft") {
    const parsed = draftSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, intent, errors: z.flattenError(parsed.error).fieldErrors as FieldErrors };
    }
    try {
      const saved = await saveMyApplication(user.id, parsed.data);
      revalidatePath(PATH);
      return { ok: true, intent, status: saved.status, savedAt: new Date().toISOString() };
    } catch (error) {
      if (error instanceof ApplicationLocked) return { ok: false, intent, errors: LOCKED };
      throw error;
    }
  }

  const parsed = submitSchema.safeParse(raw);
  const errors: FieldErrors = parsed.success ? {} : (z.flattenError(parsed.error).fieldErrors as FieldErrors);
  const current = await getMyApplication(user.id);
  if (!current?.videoKey) {
    errors.video = ["Upload your intro video before submitting."];
  }
  if (!parsed.success || Object.keys(errors).length > 0) {
    // Keep what they typed even though the submission did not go through.
    const draft = draftSchema.safeParse(raw);
    if (draft.success) {
      try {
        await saveMyApplication(user.id, draft.data);
        revalidatePath(PATH);
      } catch (error) {
        if (!(error instanceof ApplicationLocked)) throw error;
      }
    }
    return { ok: false, intent, errors, savedAt: new Date().toISOString() };
  }

  try {
    const saved = await submitMyApplication(user.id, parsed.data);
    revalidatePath(PATH);
    return {
      ok: true,
      intent,
      status: saved.status,
      savedAt: new Date().toISOString(),
      firstSubmission: current?.status === "draft",
    };
  } catch (error) {
    if (error instanceof ApplicationLocked) return { ok: false, intent, errors: LOCKED };
    throw error;
  }
}

export async function withdrawApplicationAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(PATH));
  try {
    await withdrawMyApplication(user.id);
  } catch (error) {
    if (!(error instanceof ApplicationLocked)) throw error;
  }
  revalidatePath(PATH);
}
