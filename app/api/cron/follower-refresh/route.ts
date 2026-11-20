import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { refreshDueAccounts } from "@/lib/follower-refresh";

/* The daily call that reads follower counts (lib/follower-refresh.ts). It
   comes from a scheduled GitHub Actions workflow
   (.github/workflows/follower-refresh.yml), not from a person, so there is
   no session: the caller proves itself with CRON_SECRET.

   One call works for about a minute and says how much is left, and the
   workflow calls again until nothing is. That keeps each request well
   inside what a proxy in front of the site will wait for.

   Run by hand, the workflow can ask for every link but the Douyin ones to
   be read again now rather than only what is due. It then sends the moment it was started,
   `{"rereadBefore": "2026-11-18T10:00:00Z"}`, with every call.

   The reply is totals only. The repository is public and so are its
   workflow logs, where this reply is printed. */

const BUDGET_MS = 55_000;
/** How old a full reading's starting moment may be: a workflow run lasts
    twenty minutes at most. */
const REREAD_WINDOW_MS = 60 * 60 * 1000;

/** The moment a full reading was asked for, undefined when the call asks
    for none, null when what was sent is not a moment a run could have. */
async function rereadMoment(request: NextRequest): Promise<Date | undefined | null> {
  const text = await request.text();
  if (!text.trim()) return undefined;
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return null;
  }
  const given = (body as { rereadBefore?: unknown } | null)?.rereadBefore;
  if (given === undefined) return undefined;
  const moment = typeof given === "string" ? new Date(given) : null;
  if (!moment || Number.isNaN(moment.getTime())) return null;
  const age = Date.now() - moment.getTime();
  // A minute of grace for two clocks that disagree.
  return age >= -60_000 && age <= REREAD_WINDOW_MS ? moment : null;
}

const digest = (text: string) => createHash("sha256").update(text).digest();

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // With no secret set, "Bearer undefined" would be a password.
  if (!secret) return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 503 });
  const given = request.headers.get("authorization") ?? "";
  // Hashed first: the comparison needs two values of one length.
  if (!timingSafeEqual(digest(given), digest(`Bearer ${secret}`))) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const rereadBefore = await rereadMoment(request);
  if (rereadBefore === null) return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });

  const result = await refreshDueAccounts({ budgetMs: BUDGET_MS, rereadBefore });
  if (!result) return NextResponse.json({ error: "ALREADY_RUNNING" }, { status: 409 });
  // A service that stopped (no credits, no quota, a refused key) needs a
  // person; answering with a failure is what makes the workflow say so.
  return NextResponse.json(result, { status: result.stopped.length > 0 ? 503 : 200 });
}
