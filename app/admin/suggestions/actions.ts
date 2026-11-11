"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole, Unauthorized } from "@/lib/auth";
import { deleteSuggestion } from "@/lib/suggestions";

export type RemoveState = { ok: boolean; message?: string };

const schema = z.object({ suggestionId: z.uuid() });

/* Superadmins only: admins read the suggestion box, they do not empty it.
   One that somebody else has already removed counts as removed. */
export async function removeSuggestionAction(_previous: RemoveState, formData: FormData): Promise<RemoveState> {
  try {
    await assertRole("superadmin");
  } catch (error) {
    if (error instanceof Unauthorized) return { ok: false, message: "You are not allowed to do that." };
    throw error;
  }
  const parsed = schema.safeParse({ suggestionId: formData.get("suggestionId") });
  if (!parsed.success) return { ok: false, message: "That suggestion could not be found." };

  await deleteSuggestion(parsed.data.suggestionId);
  revalidatePath("/admin/suggestions");
  return { ok: true };
}
