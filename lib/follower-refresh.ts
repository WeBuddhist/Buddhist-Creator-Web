import "server-only";
import { socialAccount, type SocialAccount } from "@/lib/creator-card";
import {
  accountKey,
  knownAccountIds,
  listCountedLinks,
  listMonthChecks,
  saveFollowerCheck,
  type CountedLink,
} from "@/lib/creator-cards";
import { inTurns, SourceStopped, type FollowerReading } from "@/lib/follower-reading";
import { forLog } from "@/lib/log-error";
import { fetchSocialProfile, type SocialCrawlPlace } from "@/lib/socialcrawl";
import { fetchYoutubeChannel, fetchYoutubeChannels, YOUTUBE_IDS_PER_REQUEST } from "@/lib/youtube";

/* The monthly reading of follower counts. Each counted link of each
   approved card is read once a month from the place itself: YouTube from its
   own API, Instagram, TikTok and Facebook through SocialCrawl, where each
   account read costs a credit. A reading goes to creator_follower_checks,
   one row for the card, place and month, and its figure to the card's own
   count.

   It is run every day (app/api/cron/follower-refresh). On the first run
   of a month every link is due; on the others only what is new since, and
   what failed and is tried again. So a card has its figure within a day
   of being approved, and a month's readings are all taken as near its
   start as they can be, which is what makes one month comparable with
   the next.

   A link is due when the month has no row for it under its current key,
   or has one that failed more than RETRY_AFTER_MS ago. A missing account
   and an unreadable one are answers, not failures: they wait for next
   month.

   A person can also ask for every link to be read again now, outside the
   monthly reading (`rereadBefore`). The month's rows are then written
   over, so a month still has one figure for each link: the latest. */

const RETRY_AFTER_MS = 20 * 60 * 60 * 1000;
const AT_ONCE = 4;

/** The first day, in UTC, of the month `at` falls in: "2026-11-01". */
export function monthOf(at: Date): string {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

/** The services, as the run calls them. Passed in by a test. */
export type FollowerSources = {
  youtubeChannels: (ids: readonly string[]) => Promise<Map<string, FollowerReading>>;
  youtubeChannel: (account: SocialAccount) => Promise<FollowerReading>;
  socialProfile: (place: SocialCrawlPlace, account: SocialAccount) => Promise<FollowerReading>;
};

const SOURCES: FollowerSources = {
  youtubeChannels: fetchYoutubeChannels,
  youtubeChannel: fetchYoutubeChannel,
  socialProfile: fetchSocialProfile,
};

export type RefreshResult = {
  /** Links read in this run, whatever came of it. */
  checked: number;
  ok: number;
  /** Read, with no figure: missing, unreadable, or a failed attempt. */
  failed: number;
  /** Links still due that this run did not get to. */
  remaining: number;
  /** The services that could go no further, as "youtube: out-of-quota". */
  stopped: string[];
};

const running = globalThis as unknown as { __followerRefresh?: boolean };

/** Read the links that are due, for about `budgetMs`, and say what is
    left. Null when a run is already going in this process. */
export async function refreshDueAccounts(options: {
  budgetMs: number;
  now?: () => Date;
  sources?: FollowerSources;
  /** Read again every link last read before this moment, whatever the
      month holds for it. The caller gives the moment the full reading was
      asked for and repeats it on every call of that reading, so a link
      read by an earlier call is not read twice. */
  rereadBefore?: Date;
}): Promise<RefreshResult | null> {
  if (running.__followerRefresh) return null;
  running.__followerRefresh = true;
  try {
    return await refresh(
      options.budgetMs,
      options.now ?? (() => new Date()),
      options.sources ?? SOURCES,
      options.rereadBefore,
    );
  } finally {
    running.__followerRefresh = false;
  }
}

async function refresh(
  budgetMs: number,
  now: () => Date,
  sources: FollowerSources,
  rereadBefore: Date | undefined,
): Promise<RefreshResult> {
  const started = now();
  const month = monthOf(started);
  const deadline = started.getTime() + budgetMs;
  const inTime = () => now().getTime() < deadline;

  const [links, checks, channelIds] = await Promise.all([
    listCountedLinks(),
    listMonthChecks(month),
    knownAccountIds("youtube"),
  ]);
  const done = new Map(checks.map((check) => [`${check.cardId} ${check.platform}`, check]));
  const due = links.filter((link) => {
    const check = done.get(`${link.cardId} ${link.platform}`);
    if (!check || check.linkKey !== link.linkKey) return true;
    if (rereadBefore && check.checkedAt.getTime() < rereadBefore.getTime()) return true;
    return check.status === "error" && started.getTime() - check.checkedAt.getTime() > RETRY_AFTER_MS;
  });

  const result: RefreshResult = { checked: 0, ok: 0, failed: 0, remaining: due.length, stopped: [] };
  const keep = async (link: CountedLink, reading: FollowerReading) => {
    const saved = await saveFollowerCheck({ link, month, reading, at: now() });
    result.remaining--;
    if (saved === "moved") return;
    result.checked++;
    if (reading.status === "ok") result.ok++;
    else result.failed++;
  };
  /** Runs one service's share. A service that stops, or a fault, leaves
      the rest of the share due for the next run; what was read before it
      is kept, and the other service carries on. */
  const share = async (work: () => Promise<void>) => {
    try {
      await work();
    } catch (error) {
      if (error instanceof SourceStopped) {
        result.stopped.push(error.message);
      } else {
        console.error("[follower-refresh] run failed", forLog(error));
        result.stopped.push("failed");
      }
    }
  };

  // A link that names no account is settled without asking anyone.
  const youtubeById = new Map<string, CountedLink[]>();
  const youtubeByName: { link: CountedLink; account: SocialAccount }[] = [];
  const social: { link: CountedLink; account: SocialAccount }[] = [];
  for (const link of due) {
    const account = socialAccount(link.platform, link.link);
    if (!account) {
      await keep(link, { status: "unreadable" });
    } else if (link.platform !== "youtube") {
      social.push({ link, account });
    } else {
      const id = account.by === "channel" ? account.channelId : channelIds.get(accountKey(link));
      if (id) youtubeById.set(id, [...(youtubeById.get(id) ?? []), link]);
      else youtubeByName.push({ link, account });
    }
  }

  await Promise.all([
    share(async () => {
      const ids = [...youtubeById.keys()];
      for (let from = 0; from < ids.length && inTime(); from += YOUTUBE_IDS_PER_REQUEST) {
        const readings = await sources.youtubeChannels(ids.slice(from, from + YOUTUBE_IDS_PER_REQUEST));
        for (const [id, reading] of readings) for (const link of youtubeById.get(id) ?? []) await keep(link, reading);
      }
      // A channel not read before is asked for by name, which also
      // gives the id it is asked for by from then on.
      await inTurns(youtubeByName, AT_ONCE, inTime, async ({ link, account }) => {
        await keep(link, await sources.youtubeChannel(account));
      });
    }),
    share(() =>
      inTurns(social, AT_ONCE, inTime, async ({ link, account }) => {
        await keep(link, await sources.socialProfile(link.platform as SocialCrawlPlace, account));
      }),
    ),
  ]);

  return result;
}

/** What came of reading one of a card's links now: the reading, or the
    word of a service that could not be asked ("youtube: not-configured"). */
export type CardLinkReading = {
  platform: CountedLink["platform"];
  link: string;
  reading: FollowerReading | { status: "stopped"; reason: string };
};

/** Read the links of one approved card that have no figure for this month
    yet: the ones just added or changed. It is what the dashboard does when
    an admin saves a card, so a new channel has its count at once rather
    than at the next daily run. A link read already this month is left
    alone, so saving a card twice costs nothing more. */
export async function readCardLinks(
  cardId: string,
  options: { now?: () => Date; sources?: FollowerSources } = {},
): Promise<CardLinkReading[]> {
  const now = options.now ?? (() => new Date());
  const sources = options.sources ?? SOURCES;
  const month = monthOf(now());
  const [links, checks] = await Promise.all([listCountedLinks(), listMonthChecks(month)]);
  const done = new Map(
    checks.filter((check) => check.cardId === cardId).map((check) => [`${check.platform} ${check.linkKey}`, check]),
  );
  const due = links.filter((link) => {
    if (link.cardId !== cardId) return false;
    const check = done.get(`${link.platform} ${link.linkKey}`);
    return !check || check.status === "error";
  });

  return Promise.all(
    due.map(async (link): Promise<CardLinkReading> => {
      const account = socialAccount(link.platform, link.link);
      let reading: FollowerReading;
      try {
        if (!account) reading = { status: "unreadable" };
        else if (link.platform !== "youtube") {
          reading = await sources.socialProfile(link.platform as SocialCrawlPlace, account);
        } else if (account.by === "channel") {
          reading = (await sources.youtubeChannels([account.channelId])).get(account.channelId) ?? { status: "error" };
        } else {
          reading = await sources.youtubeChannel(account);
        }
      } catch (error) {
        // A service with no key, or out of credits: nothing is saved, and
        // the link stays due for the daily run.
        if (error instanceof SourceStopped) {
          return { platform: link.platform, link: link.link, reading: { status: "stopped", reason: error.message } };
        }
        throw error;
      }
      await saveFollowerCheck({ link, month, reading, at: now() });
      return { platform: link.platform, link: link.link, reading };
    }),
  );
}
