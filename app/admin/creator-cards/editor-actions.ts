"use server";

import { revalidatePath } from "next/cache";
import { assertRole, Unauthorized } from "@/lib/auth";
import { readCardPhoto } from "@/lib/card-photo-form";
import {
  CARD_PATH,
  CARD_SOCIALS,
  cardFieldErrors,
  cardPhotoType,
  teamCardFormValues,
  teamCardSchema,
  type CardFieldErrors,
  type CountedSocial,
} from "@/lib/creator-card";
import {
  CardNotFound,
  CardOwned,
  cardsSharingLinks,
  createTeamCard,
  deleteTeamCard,
  giveTeamCardPhoto,
  teamPhotoKey,
  updateTeamCard,
  type PhotoChange,
} from "@/lib/creator-cards";
import { CREATORS_PATH } from "@/lib/creators";
import { readCardLinks } from "@/lib/follower-refresh";
import { forLog } from "@/lib/log-error";
import { deleteObjectQuietly, uploadBytes } from "@/lib/s3";
import { storeProfilePicture } from "@/lib/team-card-photo";

/* The dashboard's own way of keeping creator cards: an admin makes a card
   for a creator the team knows, changes one nobody owns, or (a superadmin)
   takes one off the list. The role is checked here, in every action: the
   page that showed the form is not a guard. A card with an owner is the
   creator's and is refused. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** What became of one link's count when the card was saved. `stopped`: the
    service could not be asked (no key on this server, or no credits), and
    the daily reading will try. */
export type SavedReading = {
  platform: CountedSocial;
  status: "ok" | "not_found" | "unreadable" | "error" | "stopped";
  followers: number | null;
};

export type TeamCardResult =
  | {
      ok: true;
      cardId: string;
      created: boolean;
      /** The links read by this save: the new and the changed ones. */
      readings: SavedReading[];
      /** The card had no photo and took the creator's profile picture. */
      photoTaken: boolean;
    }
  | { ok: false; errors: CardFieldErrors; signedOut?: true };

const refused = (message: string): TeamCardResult => ({ ok: false, errors: { form: [message] } });

function refreshPages() {
  revalidatePath("/admin/creator-cards", "layout");
  revalidatePath(CREATORS_PATH);
  revalidatePath("/");
  revalidatePath(CARD_PATH);
}

/* Save a card the team keeps: a new one when the form names no card,
   otherwise a change to the one it names. Then, for an approved card, the
   links that are new or changed are read at once, so the count is there
   when the admin looks, and a card with no photo takes the profile picture
   the first of those readings brought.

   A new photo goes to S3 first and the card is pointed at it second, so
   the card never names an object that is not there; whichever object ends
   up unused is deleted. */
export async function saveTeamCardAction(formData: FormData): Promise<TeamCardResult> {
  let actor;
  try {
    actor = await assertRole("admin");
  } catch (error) {
    if (error instanceof Unauthorized) {
      return error.message === "UNAUTHENTICATED"
        ? { ok: false, errors: {}, signedOut: true }
        : refused("You are not allowed to do that.");
    }
    throw error;
  }

  const given = formData.get("cardId");
  const cardId = typeof given === "string" && given ? given : null;
  if (cardId && !UUID.test(cardId)) return refused("That card could not be found.");

  const parsed = teamCardSchema.safeParse(teamCardFormValues(formData));
  const photo = await readCardPhoto(formData);
  const errors: CardFieldErrors = parsed.success ? {} : cardFieldErrors(parsed.error);
  if (photo.kind === "invalid") errors.photo = [photo.message];
  if (!parsed.success || photo.kind === "invalid") return { ok: false, errors };

  // One account, one card: a link another card has is said beside it.
  const taken = await cardsSharingLinks(parsed.data.socials, cardId);
  const shared = Object.entries(taken) as [CountedSocial, string][];
  if (shared.length > 0) {
    return {
      ok: false,
      errors: Object.fromEntries(
        shared.map(([place, name]) => [`socials.${place}`, [`The card for ${name} already has this link.`]]),
      ),
    };
  }

  let change: PhotoChange = photo.kind === "replace" ? { kind: "keep" } : photo;
  if (photo.kind === "replace") {
    const type = cardPhotoType(photo.bytes)!;
    const key = teamPhotoKey(type.extension);
    try {
      await uploadBytes({ key, body: photo.bytes, contentType: type.contentType });
    } catch (error) {
      console.error("[team-card] photo upload failed", forLog(error));
      return { ok: false, errors: { photo: ["We could not store the photo. Try again in a moment."] } };
    }
    change = { kind: "replace", key };
  }

  let card;
  try {
    if (cardId) {
      const saved = await updateTeamCard({ cardId, values: parsed.data, photo: change });
      card = saved.card;
      await deleteObjectQuietly(saved.replacedPhotoKey);
    } else {
      card = await createTeamCard({
        actorId: actor.id,
        values: parsed.data,
        photoKey: change.kind === "replace" ? change.key : null,
      });
    }
  } catch (error) {
    if (change.kind === "replace") await deleteObjectQuietly(change.key);
    if (error instanceof CardOwned) return refused("This card belongs to its creator now. Only they can change it.");
    if (error instanceof CardNotFound) return refused("That card no longer exists.");
    console.error("[team-card] could not save", forLog(error));
    return refused("We could not save the card. Try again in a moment.");
  }

  /* The card is saved. What follows adds to it and never undoes it: a
     reading that fails leaves the link for the daily run. */
  let readings: SavedReading[] = [];
  let photoTaken = false;
  if (card.status === "approved") {
    try {
      const read = await readCardLinks(card.id);
      readings = read.map(({ platform, reading }) => ({
        platform,
        status: reading.status,
        followers: reading.status === "ok" ? reading.followers : null,
      }));
      if (!card.photoKey) {
        // The first channel, in the order the places are listed, that brought a picture.
        const pictures = CARD_SOCIALS.flatMap(({ value }) => {
          const found = read.find((entry) => entry.platform === value)?.reading;
          return found?.status === "ok" && found.avatarUrl ? [found.avatarUrl] : [];
        });
        for (const picture of pictures) {
          const key = await storeProfilePicture(picture);
          if (!key) continue;
          photoTaken = await giveTeamCardPhoto(card.id, key);
          if (!photoTaken) await deleteObjectQuietly(key);
          break;
        }
      }
    } catch (error) {
      console.error("[team-card] could not read the counts", forLog(error));
    }
  }

  refreshPages();
  return { ok: true, cardId: card.id, created: !cardId, readings, photoTaken };
}

export type RemoveCardResult = { ok: true; name: string } | { ok: false; message: string };

/* Take a card nobody owns off the list, for superadmins. It cannot be
   undone: the card, its readings and any claims on it go, and its photo. */
export async function removeTeamCardAction(cardId: string): Promise<RemoveCardResult> {
  try {
    await assertRole("superadmin");
  } catch (error) {
    if (error instanceof Unauthorized) return { ok: false, message: "You are not allowed to do that." };
    throw error;
  }
  if (typeof cardId !== "string" || !UUID.test(cardId)) return { ok: false, message: "That card could not be found." };
  try {
    const removed = await deleteTeamCard(cardId);
    await deleteObjectQuietly(removed.photoKey);
    refreshPages();
    return { ok: true, name: removed.displayName };
  } catch (error) {
    if (error instanceof CardOwned) {
      return { ok: false, message: "This card belongs to its creator now, so it cannot be removed here." };
    }
    if (error instanceof CardNotFound) return { ok: false, message: "That card no longer exists." };
    console.error("[team-card] could not remove", forLog(error));
    return { ok: false, message: "We could not remove the card. Try again in a moment." };
  }
}
