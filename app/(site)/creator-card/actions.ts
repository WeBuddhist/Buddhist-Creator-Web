"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  CARD_PATH,
  CARD_PHOTO_MAX_BYTES,
  cardFieldErrors,
  cardFormValues,
  cardPhotoType,
  cardSchema,
  type CardFieldErrors,
  type CardValues,
} from "@/lib/creator-card";
import { cardPhotoKey, submitMyCard, type PhotoChange, type SubmitOutcome } from "@/lib/creator-cards";
import { forLog } from "@/lib/log-error";
import { deleteObjectQuietly, uploadBytes } from "@/lib/s3";

/** What came of a save. A good one says what it did and hands back the
    card as stored, so the form shows links the way they were kept; a
    refused one says why, field by field. `signedOut` is a session that
    ended while the form was open: the form asks the creator to sign in
    again and keeps what they typed. */
export type CardSaveResult =
  | { ok: true; outcome: SubmitOutcome; saved: CardValues }
  | { ok: false; errors: CardFieldErrors; signedOut?: true };

const NOT_SAVED: CardSaveResult = {
  ok: false,
  errors: { form: ["We could not save your card. Please try again in a moment."] },
};

/* What the form says to do about the photo: `photoAction` is "replace"
   with the picture in `photo`, "remove" to go back to the sign-in
   account's picture, or anything else to leave it alone. The browser has
   already cropped and compressed a new picture; what is checked here is
   only that one small WebP or JPEG arrived, read from its own bytes. */
async function readPhoto(
  formData: FormData,
): Promise<{ kind: "keep" } | { kind: "remove" } | { kind: "replace"; bytes: Uint8Array } | { kind: "invalid"; message: string }> {
  const action = formData.get("photoAction");
  if (action === "remove") return { kind: "remove" };
  if (action !== "replace") return { kind: "keep" };
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { kind: "invalid", message: "That picture did not arrive. Choose it again." };
  }
  if (file.size > CARD_PHOTO_MAX_BYTES) return { kind: "invalid", message: "That picture is too large. Try another one." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!cardPhotoType(bytes)) return { kind: "invalid", message: "We could not read that picture. Try a JPG or PNG." };
  return { kind: "replace", bytes };
}

/* The creator's one action: save the card and send it for review. The
   form calls it as a React Query mutation, with its own FormData. The
   session is re-read here; nothing from the browser says whose card this
   is. A failed write is reported rather than thrown, so the form can say
   what happened: a card that was not kept must not look sent. It is
   logged without the query's values, which are the creator's own words.

   A new photo goes to S3 first and the card is pointed at it second, so
   the card never names an object that is not there. Whichever object ends
   up unused, the new one after a failed save or the old one after a good
   save, is deleted. */
export async function submitCardAction(formData: FormData): Promise<CardSaveResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, errors: {}, signedOut: true };

  const parsed = cardSchema.safeParse(cardFormValues(formData));
  const photo = await readPhoto(formData);
  const errors: CardFieldErrors = parsed.success ? {} : cardFieldErrors(parsed.error);
  if (photo.kind === "invalid") errors.photo = [photo.message];
  if (!parsed.success || photo.kind === "invalid") return { ok: false, errors };

  let change: PhotoChange = photo.kind === "replace" ? { kind: "keep" } : photo;
  if (photo.kind === "replace") {
    const type = cardPhotoType(photo.bytes)!;
    const key = cardPhotoKey(user.id, type.extension);
    try {
      await uploadBytes({ key, body: photo.bytes, contentType: type.contentType });
    } catch (error) {
      console.error("[creator-card] photo upload failed", error);
      return {
        ok: false,
        errors: { photo: ["We could not store your photo. Please try again in a moment."] },
      };
    }
    change = { kind: "replace", key };
  }

  let outcome: SubmitOutcome;
  try {
    const saved = await submitMyCard(user.id, parsed.data, change);
    outcome = saved.outcome;
    await deleteObjectQuietly(saved.replacedPhotoKey);
  } catch (error) {
    if (change.kind === "replace") await deleteObjectQuietly(change.key);
    console.error("[creator-card] could not save", forLog(error));
    return NOT_SAVED;
  }
  if (outcome !== "unchanged") {
    revalidatePath(CARD_PATH);
    revalidatePath("/admin/creator-cards", "layout");
  }
  return { ok: true, outcome, saved: parsed.data };
}
