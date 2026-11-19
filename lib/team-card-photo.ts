import "server-only";
import { cardPhotoType } from "@/lib/creator-card";
import { teamPhotoKey } from "@/lib/creator-cards";
import { forLog } from "@/lib/log-error";
import { uploadBytes } from "@/lib/s3";

/* A creator's own profile picture, kept for a card the team is making.
   The address comes with the reading of the creator's channel
   (FollowerReading.avatarUrl), which is to say from another service's
   reply, so it is fetched only from the hosts those pictures are served
   from, only over https, and only up to a size no profile picture needs.
   What arrives is stored as it is, once its own first bytes say it is a
   JPEG or a WebP. */

const PICTURE_HOSTS = [
  ".googleusercontent.com",
  ".ggpht.com",
  ".cdninstagram.com",
  ".fbcdn.net",
  ".tiktokcdn.com",
  ".tiktokcdn-eu.com",
  ".tiktokcdn-us.com",
];
const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 15_000;

const allowed = (address: string) => {
  if (!URL.canParse(address)) return false;
  const url = new URL(address);
  return url.protocol === "https:" && PICTURE_HOSTS.some((host) => url.hostname.endsWith(host));
};

/** Fetch the picture and store it. The key it was stored under, or null
    when there is nothing usable at the address: the card then goes
    without, which is no error. */
export async function storeProfilePicture(address: string): Promise<string | null> {
  if (!allowed(address)) return null;
  try {
    const response = await fetch(address, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
    // A redirect that left the picture hosts is not followed on trust.
    if (!response.ok || !allowed(response.url)) return null;
    if (Number(response.headers.get("content-length") ?? 0) > MAX_BYTES) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_BYTES) return null;
    const type = cardPhotoType(bytes);
    if (!type) return null;
    return await uploadBytes({ key: teamPhotoKey(type.extension), body: bytes, contentType: type.contentType });
  } catch (error) {
    console.error("[team-card] could not keep a profile picture", forLog(error));
    return null;
  }
}
