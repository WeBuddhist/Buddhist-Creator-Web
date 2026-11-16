"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole, Unauthorized } from "@/lib/auth";
import { CARD_PATH } from "@/lib/creator-card";
import { CARD_STATUSES, CardChanged, CardNotFound, reviewCard } from "@/lib/creator-cards";
import type { CreatorCardStatus } from "@/lib/db/schema";

/** What came of a review: when it was saved, or why it was not. */
export type ReviewResult = { ok: true; at: string } | { ok: false; message: string };

const schema = z.object({
  cardId: z.uuid(),
  status: z.enum(CARD_STATUSES as [CreatorCardStatus, ...CreatorCardStatus[]]),
  // The version of the card on the page when the button was pressed.
  revision: z.coerce.number().int().positive(),
  note: z
    .string()
    .max(2000)
    .transform((value) => value.replaceAll("\0", "").trim() || null),
});

/* Admins and superadmins review. The form calls this as a React Query
   mutation, with its own FormData. The role is checked here again: the
   page that rendered the form is not a guard. */
export async function reviewCardAction(formData: FormData): Promise<ReviewResult> {
  let actor;
  try {
    actor = await assertRole("admin");
  } catch (error) {
    if (error instanceof Unauthorized) return { ok: false, message: "You are not allowed to do that." };
    throw error;
  }
  const parsed = schema.safeParse({
    cardId: formData.get("cardId"),
    status: formData.get("status"),
    revision: formData.get("revision"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { ok: false, message: "That review could not be read." };

  try {
    await reviewCard({ ...parsed.data, actorId: actor.id });
  } catch (error) {
    if (error instanceof CardChanged) {
      // Show the reviewer the version that is there now.
      revalidatePath(`/admin/creator-cards/${parsed.data.cardId}`);
      return {
        ok: false,
        message: "The creator changed this card after you opened it. Read the new version, then decide.",
      };
    }
    if (error instanceof CardNotFound) return { ok: false, message: "That card no longer exists." };
    throw error;
  }
  revalidatePath("/admin/creator-cards", "layout");
  // The creator's own page shows where the card stands.
  revalidatePath(CARD_PATH);
  return { ok: true, at: new Date().toISOString() };
}
