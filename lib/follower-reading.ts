import { CARD_FOLLOWERS_MAX } from "@/lib/creator-card";

/* What the services that read follower counts (lib/youtube.ts,
   lib/socialcrawl.ts) hand back, in one shape, so everything after the
   request is the same for every place. */

/** One account's follower count as it was just read, or why there is none.
    The statuses are those of creator_follower_checks (lib/db/schema.ts). */
export type FollowerReading =
  | { status: "ok"; followers: number; externalId: string | null; handle: string | null }
  | { status: "not_found" | "unreadable" | "error" };

/** A service that can answer nothing more in this run: its key is missing
    or refused, or its credits or quota are used up. The accounts it was
    still to read are left for the next run. `reason` is a fixed word, safe
    to print anywhere. */
export class SourceStopped extends Error {
  constructor(
    source: "youtube" | "socialcrawl",
    reason: "not-configured" | "refused" | "out-of-credits" | "out-of-quota",
  ) {
    super(`${source}: ${reason}`);
    this.name = "SourceStopped";
  }
}

/** A figure a service gave, as a count the table can hold, or null for
    anything that is not one. YouTube sends its numbers as text. */
export function readCount(value: unknown): number | null {
  const count = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof count === "number" && Number.isInteger(count) && count >= 0 && count <= CARD_FOLLOWERS_MAX
    ? count
    : null;
}

/** Runs `job` over `items`, a few at a time, until `go` says stop or a job
    throws. What it never started is left for the caller to count. A throw
    is passed on once the jobs already under way have finished, so nothing
    is still running when the caller hears of it. */
export async function inTurns<T>(items: readonly T[], width: number, go: () => boolean, job: (item: T) => Promise<void>) {
  let next = 0;
  let fault: { error: unknown } | null = null;
  const worker = async () => {
    while (next < items.length && !fault && go()) {
      try {
        await job(items[next++]);
      } catch (error) {
        fault ??= { error };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(width, items.length) }, worker));
  if (fault) throw (fault as { error: unknown }).error;
}
