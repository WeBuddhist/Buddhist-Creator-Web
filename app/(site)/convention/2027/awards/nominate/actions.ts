"use server";

import { revalidatePath } from "next/cache";
import { ARTWORK, AWARDS, AWARDS_2027, entryKey, parseBallot, type AwardSlug, type BallotErrors } from "@/lib/awards-2027";
import { getCurrentUser } from "@/lib/auth";
import { cardPhotoType } from "@/lib/creator-card";
import { getMyBallot, nominationImageKey, saveMyBallot, type ImageChange } from "@/lib/nominations";
import { deleteObjectQuietly, uploadBytes } from "@/lib/s3";

export type NominationResult = {
  ok: boolean;
  errors?: BallotErrors;
  /** True when this save sent the person's first nominations. */
  firstSubmission?: boolean;
  /** How many awards now carry one of their nominations. */
  count?: number;
  /** The session ended while the form was open: nothing was saved. */
  signedOut?: true;
};

const CLOSED: BallotErrors = {
  form: `Nominations are closed, so they can no longer be changed. If something needs correcting, write to ${AWARDS_2027.contact}.`,
};

const STORE_FAILED = "We could not store your picture. Please try again in a moment.";

/* What the form says to do about an award's picture: `<slug>.imageAction`
   is "replace" with the picture in `<slug>.image`, "remove" to take the
   stored one away, or anything else to leave it as it is. The browser has
   already scaled and compressed a new picture; here it is checked to be one
   small WebP or JPEG, by its own bytes. */
type PostedImage =
  | { kind: "keep" }
  | { kind: "remove" }
  | { kind: "replace"; bytes: Uint8Array }
  | { kind: "invalid"; message: string };

async function readImage(formData: FormData, slug: AwardSlug): Promise<PostedImage> {
  const action = formData.get(`${slug}.imageAction`);
  if (action === "remove") return { kind: "remove" };
  if (action !== "replace") return { kind: "keep" };
  const file = formData.get(`${slug}.image`);
  if (!(file instanceof File) || file.size === 0) {
    return { kind: "invalid", message: "That picture did not arrive. Choose it again." };
  }
  if (file.size > ARTWORK.maxBytes) return { kind: "invalid", message: "That picture is too large. Try another one." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!cardPhotoType(bytes)) return { kind: "invalid", message: "We could not read that picture. Try a JPG or PNG." };
  return { kind: "replace", bytes };
}

/* Sends or changes the signed-in person's nominations. The form calls it
   as a React Query mutation with its own FormData; who is nominating is
   read from the session here, never from the form.

   A new picture goes to S3 before the nominations are saved, and is
   deleted again if the save fails; pictures nothing points at any more are
   deleted once it has succeeded. */
export async function saveNominationsAction(formData: FormData): Promise<NominationResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, signedOut: true };
  if (!AWARDS_2027.open) return { ok: false, errors: CLOSED };

  const stored = await getMyBallot(user.id);
  const storedImage = (slug: AwardSlug) =>
    stored?.nominations.find((nomination) => nomination.category === slug)?.imageKey ?? null;

  // The pictures of the awards the form has open: one chosen for an award
  // that was then closed is not looked at.
  const open = new Set(formData.getAll("awards"));
  const posted = new Map<AwardSlug, PostedImage>();
  for (const award of AWARDS) {
    if (award.image && open.has(award.slug)) posted.set(award.slug, await readImage(formData, award.slug));
  }
  const hasImage = (slug: AwardSlug) => {
    const image = posted.get(slug);
    return image?.kind === "replace" || (image?.kind === "keep" && storedImage(slug) !== null);
  };

  const parsed = parseBallot(formData, hasImage);
  const imageErrors: BallotErrors = {};
  for (const [slug, image] of posted) {
    if (image.kind === "invalid") imageErrors[entryKey(slug, "image")] = image.message;
  }
  if (!parsed.ok || Object.keys(imageErrors).length > 0) {
    return { ok: false, errors: { ...(parsed.ok ? {} : parsed.errors), ...imageErrors } };
  }

  const images: Partial<Record<AwardSlug, ImageChange>> = {};
  const uploaded: string[] = [];
  for (const slug of Object.keys(parsed.values.nominations) as AwardSlug[]) {
    const image = posted.get(slug);
    if (image?.kind === "remove") images[slug] = { kind: "remove" };
    if (image?.kind !== "replace") continue;
    const type = cardPhotoType(image.bytes)!;
    const key = nominationImageKey(user.id, type.extension);
    try {
      await uploadBytes({ key, body: image.bytes, contentType: type.contentType });
    } catch (error) {
      console.error("[nominations] picture upload failed", error);
      await Promise.all(uploaded.map(deleteObjectQuietly));
      return { ok: false, errors: { [entryKey(slug, "image")]: STORE_FAILED } };
    }
    uploaded.push(key);
    images[slug] = { kind: "replace", key };
  }

  let saved: Awaited<ReturnType<typeof saveMyBallot>>;
  try {
    saved = await saveMyBallot(user.id, parsed.values, images);
  } catch (error) {
    await Promise.all(uploaded.map(deleteObjectQuietly));
    throw error;
  }
  await Promise.all(saved.staleImageKeys.map(deleteObjectQuietly));

  revalidatePath(AWARDS_2027.nominatePath);
  revalidatePath(AWARDS_2027.path);
  return { ok: true, firstSubmission: saved.firstSubmission, count: Object.keys(parsed.values.nominations).length };
}
