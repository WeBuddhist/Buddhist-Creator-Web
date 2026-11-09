"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { InvalidTransition, REVIEWABLE, setApplicationStatus } from "@/lib/applications";
import { assertRole, Unauthorized } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/db/schema";

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
