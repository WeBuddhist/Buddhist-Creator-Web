import "server-only";
import { z } from "zod";
import type { SocialAccount } from "@/lib/creator-card";
import { readCount, SourceStopped, type FollowerReading } from "@/lib/follower-reading";

/* YouTube subscriber counts, from YouTube's own Data API (v3,
   channels.list). A channel is asked for by its id, fifty to a request,
   or one at a time by its handle; either costs one unit of a daily quota
   of ten thousand. So a channel is looked up by handle once, to learn its
   id, and by id every week after.

   YouTube rounds the count it gives out to three figures (2,970,000;
   24,900). That is theirs to decide, and the same wherever it is read.

   YOUTUBE_API_BASE_URL is for a local stand-in; it is unset on the site. */

const DEFAULT_BASE = "https://www.googleapis.com/youtube/v3";
const TIMEOUT_MS = 25_000;

/** How many channel ids one request takes. */
export const YOUTUBE_IDS_PER_REQUEST = 50;

const reply = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        snippet: z
          .object({
            customUrl: z.string().nullish(),
            thumbnails: z.record(z.string(), z.object({ url: z.string().nullish() }).nullish()).nullish(),
          })
          .nullish(),
        statistics: z
          .object({ subscriberCount: z.unknown().optional(), hiddenSubscriberCount: z.boolean().nullish() })
          .nullish(),
      }),
    )
    .nullish(),
});

const failure = z.object({
  error: z.object({ errors: z.array(z.object({ reason: z.string().nullish() })).nullish() }).nullish(),
});

type Item = NonNullable<z.infer<typeof reply>["items"]>[number];

function reading(item: Item): FollowerReading {
  const followers = item.statistics?.hiddenSubscriberCount ? null : readCount(item.statistics?.subscriberCount);
  if (followers === null) return { status: "unreadable" };
  // The largest of the channel's pictures on offer.
  const pictures = item.snippet?.thumbnails;
  const avatarUrl = pictures?.high?.url ?? pictures?.medium?.url ?? pictures?.default?.url ?? null;
  return {
    status: "ok",
    followers,
    externalId: item.id,
    handle: item.snippet?.customUrl?.replace(/^@/, "") || null,
    avatarUrl,
  };
}

/** The channels a request matched, or null when the request failed. */
async function channels(params: Record<string, string>): Promise<Item[] | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new SourceStopped("youtube", "not-configured");
  const search = new URLSearchParams({ part: "snippet,statistics", maxResults: String(YOUTUBE_IDS_PER_REQUEST), ...params });
  let response: Response;
  try {
    // The key goes in a header, so it is never part of an address that
    // could be logged.
    response = await fetch(`${process.env.YOUTUBE_API_BASE_URL || DEFAULT_BASE}/channels?${search}`, {
      headers: { "x-goog-api-key": key },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    return null;
  }
  const body: unknown = await response.json().catch(() => null);
  if (response.status === 400 || response.status === 401 || response.status === 403) {
    const parsed = failure.safeParse(body);
    const reasons = parsed.success ? (parsed.data.error?.errors ?? []).map((error) => error.reason) : [];
    const spent = reasons.some((reason) => reason === "quotaExceeded" || reason === "dailyLimitExceeded" || reason === "rateLimitExceeded");
    if (spent) throw new SourceStopped("youtube", "out-of-quota");
    // A 400 can be about the one channel asked for; a refused key is not.
    if (response.status !== 400 || reasons.includes("keyInvalid")) throw new SourceStopped("youtube", "refused");
    return null;
  }
  if (!response.ok) return null;
  const parsed = reply.safeParse(body);
  return parsed.success ? (parsed.data.items ?? []) : null;
}

/** Up to fifty channels by id. A channel the reply leaves out is gone. */
export async function fetchYoutubeChannels(ids: readonly string[]): Promise<Map<string, FollowerReading>> {
  const items = await channels({ id: ids.join(",") });
  const found = new Map(items?.map((item) => [item.id, reading(item)]));
  return new Map(ids.map((id) => [id, items ? (found.get(id) ?? { status: "not_found" }) : { status: "error" }]));
}

/** One channel by its handle, or by the name it had before handles. */
export async function fetchYoutubeChannel(account: SocialAccount): Promise<FollowerReading> {
  const params: Record<string, string> | null =
    account.by === "handle"
      ? { forHandle: `@${account.handle}` }
      : account.by === "user"
        ? { forUsername: account.username }
        : null;
  if (!params) return { status: "unreadable" };
  const items = await channels(params);
  if (!items) return { status: "error" };
  return items[0] ? reading(items[0]) : { status: "not_found" };
}
