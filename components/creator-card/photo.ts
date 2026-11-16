import { CARD_PHOTO_MAX_BYTES, CARD_PHOTO_SIDE, CARD_PHOTO_SOURCE_MAX_BYTES } from "@/lib/creator-card";

/* Getting a creator's chosen picture ready for their card, in the browser:
   cropped to a square, scaled down to the card's size and compressed, the
   way the backend compresses a profile image (WebP at quality 80), only
   here rather than on the server, which has no room to decode a phone
   photo. Redrawing the picture also leaves its metadata behind, the place
   it was taken included. */

export class PhotoProblem extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoProblem";
  }
}

const UNREADABLE = "We could not read that picture. Try a JPG or PNG.";

function encode(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/** The picture as the card will store it. Throws PhotoProblem, with words
    for the creator, when the file is not a picture this browser can read. */
export async function squarePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new PhotoProblem("Choose a picture: a JPG, PNG or WebP file.");
  if (file.size > CARD_PHOTO_SOURCE_MAX_BYTES) {
    throw new PhotoProblem(`That picture is too large. Choose one under ${CARD_PHOTO_SOURCE_MAX_BYTES / (1024 * 1024)} MB.`);
  }

  let bitmap: ImageBitmap;
  try {
    // Turned the way the camera held it, not the way the file stores it.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new PhotoProblem(UNREADABLE);
  }

  try {
    const side = Math.min(bitmap.width, bitmap.height);
    if (side < 1) throw new PhotoProblem(UNREADABLE);
    // The middle of a wide picture; of a tall one, a square nearer the
    // top, where a portrait keeps the face.
    const left = (bitmap.width - side) / 2;
    const top = (bitmap.height - side) * 0.3;
    // Never scaled up: a small picture stays the size it is.
    const size = Math.min(side, CARD_PHOTO_SIDE);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new PhotoProblem(UNREADABLE);
    // White under a transparent picture, as the card is.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, left, top, side, side, 0, 0, size, size);

    // Safari cannot write WebP and hands back a PNG instead: JPEG there.
    let blob = await encode(canvas, "image/webp", 0.8);
    if (blob?.type !== "image/webp") blob = await encode(canvas, "image/jpeg", 0.85);
    if (!blob || blob.type !== "image/jpeg" && blob.type !== "image/webp") throw new PhotoProblem(UNREADABLE);
    if (blob.size > CARD_PHOTO_MAX_BYTES) throw new PhotoProblem("That picture is too detailed to store. Try another one.");
    return blob;
  } finally {
    bitmap.close();
  }
}
