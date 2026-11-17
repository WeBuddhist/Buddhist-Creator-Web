"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertRole, Unauthorized } from "@/lib/auth";
import { CARD_PATH } from "@/lib/creator-card";
import {
  CARD_STATUSES,
  CardChanged,
  CardNotFound,
  reviewCard,
  reviewClaim,
  undoClaimApproval,
} from "@/lib/creator-cards";
import { CREATORS_PATH } from "@/lib/creators";
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

const claimSchema = z.object({
  claimId: z.uuid(),
  decision: z.enum(["approved", "rejected"]),
  note: z
    .string()
    .max(2000)
    .transform((value) => value.replaceAll("\0", "").trim() || null),
});

/* An admin's decision on a claim: approving it is what gives a card the
   team made its owner. The role is checked here again, as for a card
   review. Whatever came of it, the pages that show the claim are read
   again, so a decision somebody else made in the meantime shows. */
export async function reviewClaimAction(formData: FormData): Promise<ReviewResult> {
  let actor;
  try {
    actor = await assertRole("admin");
  } catch (error) {
    if (error instanceof Unauthorized) return { ok: false, message: "You are not allowed to do that." };
    throw error;
  }
  const parsed = claimSchema.safeParse({
    claimId: formData.get("claimId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { ok: false, message: "That decision could not be read." };

  const { outcome } = await reviewClaim({ ...parsed.data, actorId: actor.id });
  revalidatePath("/admin/creator-cards", "layout");
  // The claimant's own page shows where the claim stands, and the
  // directory stops offering a card that now has an owner.
  revalidatePath(CARD_PATH);
  revalidatePath(CREATORS_PATH);
  switch (outcome) {
    case "approved":
    case "rejected":
      return { ok: true, at: new Date().toISOString() };
    case "decided":
      return { ok: false, message: "This claim has already been decided." };
    case "card-taken":
      return { ok: false, message: "This card already has an owner, so the claim cannot be approved. Reject it instead." };
    case "claimant-has-card":
      return {
        ok: false,
        message: "This person has made a card of their own since, and can have only one. Reject the claim, or ask them which card to keep.",
      };
    case "missing":
      return { ok: false, message: "That claim is no longer there. The claimant may have withdrawn it." };
  }
}

/** What came of undoing an approval: what it did, in a line for the
    admin, or why it could not be done. */
export type UndoResult = { ok: true; message: string } | { ok: false; message: string };

const undoSchema = z.object({
  claimId: z.uuid(),
  note: z
    .string()
    .max(2000)
    .transform((value) => value.replaceAll("\0", "").trim() || null),
});

/* Take back an approved claim: for the approval that was a mistake. The
   card loses the owner that claim gave it (undoClaimApproval). The answer
   says everything it did, since some of it happens out of the admin's
   sight: other claims reopened, a changed card sent back for review. */
export async function undoClaimAction(formData: FormData): Promise<UndoResult> {
  let actor;
  try {
    actor = await assertRole("admin");
  } catch (error) {
    if (error instanceof Unauthorized) return { ok: false, message: "You are not allowed to do that." };
    throw error;
  }
  const parsed = undoSchema.safeParse({ claimId: formData.get("claimId"), note: formData.get("note") ?? "" });
  if (!parsed.success) return { ok: false, message: "That request could not be read." };

  const { outcome, edited, reopened } = await undoClaimApproval({ ...parsed.data, actorId: actor.id });
  revalidatePath("/admin/creator-cards", "layout");
  revalidatePath(CARD_PATH);
  revalidatePath(CREATORS_PATH);
  switch (outcome) {
    case "undone":
      return {
        ok: true,
        message: [
          "The card has no owner again.",
          edited
            ? "They changed it while it was theirs, so it is out of the directory until you have reviewed it."
            : "It can be claimed again.",
          reopened === 1
            ? "1 other claim on it is waiting again."
            : reopened > 1
              ? `${reopened} other claims on it are waiting again.`
              : "",
        ]
          .filter(Boolean)
          .join(" "),
      };
    case "not-approved":
      return { ok: false, message: "This claim is not an approved one any more." };
    case "moved-on":
      return { ok: false, message: "This card is no longer theirs through this claim, so there is nothing to undo." };
    case "missing":
      return { ok: false, message: "That claim is no longer there." };
  }
}
