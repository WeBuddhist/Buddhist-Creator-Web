import "server-only";
import { z } from "zod";
import type { SocialAccount } from "@/lib/creator-card";
import { readCount, SourceStopped, type FollowerReading } from "@/lib/follower-reading";

/* SocialCrawl (socialcrawl.dev) reads the follower counts YouTube's own
   API does not cover: Instagram, TikTok, Facebook and Douyin. Only the
   plain profile endpoints are called, one credit each for an account that
   was found (six for Douyin, whose profile is the cheapest call that place
   has). Nothing here asks for the fuller, dearer ones.

   SOCIALCRAWL_BASE_URL is for a local stand-in; it is unset on the site. */

export type SocialCrawlPlace = "instagram" | "tiktok" | "facebook" | "douyin";

const DEFAULT_BASE = "https://www.socialcrawl.dev/v1";
const TIMEOUT_MS = 25_000;
/** The first part of a Facebook address that is not an account's name. */
const FACEBOOK_PATH_WORDS = new Set(["p", "people", "profile.php", "pages"]);

/* Only the fields that are read. Everything is optional: a reply that is
   not shaped as expected gives no figure, never a thrown error. */
const reply = z.object({
  data: z
    .object({
      author: z
        .object({
          id: z.union([z.string(), z.number()]).nullish(),
          username: z.string().nullish(),
          // Optional by name: zod requires an `unknown` key to be there.
          followers: z.unknown().optional(),
          likes_count: z.unknown().optional(),
          avatar_url: z.unknown().optional(),
          ext: z.unknown().optional(),
        })
        .nullish(),
    })
    .nullish(),
  error: z.object({ details: z.object({ reason: z.string().nullish() }).nullish() }).nullish(),
});

function query(place: SocialCrawlPlace, account: SocialAccount): URLSearchParams | null {
  if (place === "facebook" || place === "douyin") {
    return account.by === "url" ? new URLSearchParams({ url: account.url }) : null;
  }
  if (account.by !== "handle") return null;
  // `trim` leaves the recent posts out of an Instagram reply.
  return new URLSearchParams(place === "instagram" ? { handle: account.handle, trim: "true" } : { handle: account.handle });
}

/** The account's profile picture: the larger one Instagram also gives
      (`ext.hd_avatar_url`), or the plain one. */
function pictureOf(author: { avatar_url?: unknown; ext?: unknown }): string | null {
  const large = (author.ext as { hd_avatar_url?: unknown } | null | undefined)?.hd_avatar_url;
  const picture = typeof large === "string" && large ? large : author.avatar_url;
  return typeof picture === "string" && picture ? picture : null;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** One account's follower count. A missing account, and one whose count
    cannot be had, are answers; SourceStopped means no further account can
    be read in this run. */
export async function fetchSocialProfile(place: SocialCrawlPlace, account: SocialAccount): Promise<FollowerReading> {
  const key = process.env.SOCIALCRAWL_API_KEY;
  if (!key) throw new SourceStopped("socialcrawl", "not-configured");
  const params = query(place, account);
  if (!params) return { status: "unreadable" };
  const url = `${process.env.SOCIALCRAWL_BASE_URL || DEFAULT_BASE}/${place}/profile?${params}`;

  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, { headers: { "x-api-key": key }, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
    } catch {
      return { status: "error" };
    }
    if (response.status === 402) throw new SourceStopped("socialcrawl", "out-of-credits");
    if (response.status === 401 || response.status === 403) throw new SourceStopped("socialcrawl", "refused");
    if (response.status === 429 && attempt === 0) {
      const wait = Number(response.headers.get("retry-after"));
      await pause(Math.min(Number.isFinite(wait) && wait > 0 ? wait : 1, 5) * 1000);
      continue;
    }
    const parsed = reply.safeParse(await response.json().catch(() => null));
    if (response.status === 404) {
      // A private account is there; it only has no figure to give.
      const reason = parsed.success ? parsed.data.error?.details?.reason : null;
      return { status: reason === "account_private" ? "unreadable" : "not_found" };
    }
    if (!response.ok || !parsed.success) return { status: "error" };

    const author = parsed.data.data?.author;
    if (!author) return { status: "error" };
    // A Facebook page's audience comes as its likes; elsewhere a like
    // count is the likes on the account's posts, never its audience.
    const followers = readCount(author.followers) ?? (place === "facebook" ? readCount(author.likes_count) : null);
    if (followers === null) return { status: "unreadable" };
    const handle = author.username?.replace(/^@/, "") || null;
    return {
      status: "ok",
      followers,
      externalId: author.id == null ? null : String(author.id),
      // For a Facebook address like /p/Name-123/ the name that comes back
      // is the "p", which is no handle.
      handle: place === "facebook" && handle && FACEBOOK_PATH_WORDS.has(handle.toLowerCase()) ? null : handle,
      avatarUrl: pictureOf(author),
    };
  }
}
