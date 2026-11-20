import { PhotoProblem, UNREADABLE, type PreparedPhoto } from "@/components/creator-card/photo";
import { ARTWORK } from "@/lib/awards-2027";

/* Getting a picture of a nominated artwork ready to send, in the browser:
   the whole picture, never cropped, scaled down so its longest side is at
   most ARTWORK.longSide and compressed, as the card photo is (components/
   creator-card/photo.ts), only larger, since the jury looks at the work
   itself. A detailed painting that is still too heavy is tried again
   smaller. Redrawing it also leaves its metadata behind. */

function encode(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

function dataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new PhotoProblem(UNREADABLE));
    reader.readAsDataURL(blob);
  });
}

/* Each try: the longest side, and the quality. */
const TRIES = [
  [ARTWORK.longSide, 0.82],
  [ARTWORK.longSide, 0.7],
  [1280, 0.7],
  [1024, 0.68],
] as const;

/** The picture as it will be sent. Throws PhotoProblem, with words for the
    nominator, when the file is not a picture this browser can read. */
export async function prepareArtwork(file: File): Promise<PreparedPhoto> {
  if (!file.type.startsWith("image/")) throw new PhotoProblem("Choose a picture: a JPG, PNG or WebP file.");
  if (file.size > ARTWORK.sourceMaxBytes) {
    throw new PhotoProblem(`That picture is too large. Choose one under ${ARTWORK.sourceMaxBytes / (1024 * 1024)} MB.`);
  }

  let bitmap: ImageBitmap;
  try {
    // Turned the way the camera held it, not the way the file stores it.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new PhotoProblem(UNREADABLE);
  }

  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest < 1) throw new PhotoProblem(UNREADABLE);
    for (const [side, quality] of TRIES) {
      // Never scaled up: a small picture stays the size it is.
      const scale = Math.min(1, side / longest);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new PhotoProblem(UNREADABLE);
      // White under a transparent picture.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      // Safari cannot write WebP and hands back a PNG instead: JPEG there.
      let blob = await encode(canvas, "image/webp", quality);
      if (blob?.type !== "image/webp") blob = await encode(canvas, "image/jpeg", quality + 0.03);
      if (!blob || (blob.type !== "image/jpeg" && blob.type !== "image/webp")) throw new PhotoProblem(UNREADABLE);
      if (blob.size <= ARTWORK.maxBytes) return { blob, url: await dataUrl(blob) };
    }
    throw new PhotoProblem("That picture is too detailed to send. Try a smaller one.");
  } finally {
    bitmap.close();
  }
}
