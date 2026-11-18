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

   The reply is totals only. The repository is public and so are its
   workflow logs, where this reply is printed. */

const BUDGET_MS = 55_000;

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

  const result = await refreshDueAccounts({ budgetMs: BUDGET_MS });
  if (!result) return NextResponse.json({ error: "ALREADY_RUNNING" }, { status: 409 });
  // A service that stopped (no credits, no quota, a refused key) needs a
  // person; answering with a failure is what makes the workflow say so.
  return NextResponse.json(result, { status: result.stopped.length > 0 ? 503 : 200 });
}
