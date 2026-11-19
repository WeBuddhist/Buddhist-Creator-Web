import { CARD_PHOTO_MAX_BYTES, cardPhotoType } from "@/lib/creator-card";

/* What a card form says to do about the photo: `photoAction` is "replace"
   with the picture in `photo`, "remove" to take the card's own photo
   away, or anything else to leave it alone. The browser has already
   cropped and compressed a new picture; what is checked here is only that
   one small WebP or JPEG arrived, read from its own bytes. The creator's
   form and the dashboard's editor both send a photo this way. */
export type PostedPhoto =
  | { kind: "keep" }
  | { kind: "remove" }
  | { kind: "replace"; bytes: Uint8Array }
  | { kind: "invalid"; message: string };

export async function readCardPhoto(formData: FormData): Promise<PostedPhoto> {
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
