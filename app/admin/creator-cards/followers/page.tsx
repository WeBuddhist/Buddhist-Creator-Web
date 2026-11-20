import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/admin/page-header";
import { panel } from "@/components/admin/panel";
import { requireRole } from "@/lib/auth";
import { CARD_SOCIALS } from "@/lib/creator-card";
import { listUnreadLinks, type UnreadLink } from "@/lib/creator-cards";
import { formatCount, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Follower counts" };

const PATH = "/admin/creator-cards/followers";

const WHY: Record<UnreadLink["status"], string> = {
  not_found: "No account at this link",
  unreadable: "No figure could be read",
  error: "The attempt failed; it is made again the next day",
};

const placeLabel = (slug: string) => CARD_SOCIALS.find((social) => social.value === slug)?.label ?? slug;

/* Follower counts are read from each card's links every week
   (lib/follower-refresh.ts). This is what that reading could not do: the
   links that gave no figure the last time they were tried. A wrong or
   mistyped link is the usual reason, and it is put right on the card: by
   its creator if it has one, by our team otherwise. A link that reads
   again leaves the list by itself. */
export default function FollowerCountsPage() {
  return (
    <>
      <PageHeader
        title="Follower counts"
        description="We read each creator's follower count from their links every week, and every three months on Douyin. These are the links that gave no count the last time we tried, by creator. Open the link to see what is wrong with it; a card keeps the count it had until its link reads again."
        className="mb-6"
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading links…</p>}>
        <UnreadLinks />
      </Suspense>
    </>
  );
}

async function UnreadLinks() {
  await requireRole("admin", PATH);
  const rows = await listUnreadLinks();
  return (
    <div className={cn(panel, "overflow-x-auto")}>
      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          Every link gave a count the last time it was read.
        </p>
      ) : (
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-left text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
              <th scope="col" className="px-4 py-3">Creator</th>
              <th scope="col" className="px-4 py-3">Link</th>
              <th scope="col" className="px-4 py-3">What happened</th>
              <th scope="col" className="px-4 py-3">Count kept</th>
              <th scope="col" className="px-4 py-3">Tried</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.cardId} ${row.platform}`} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                <td className="max-w-[16rem] px-4 py-3">
                  <Link
                    href={`/admin/creator-cards/${row.cardId}`}
                    className="font-medium wrap-anywhere text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground"
                  >
                    {row.displayName}
                  </Link>
                </td>
                <td className="max-w-[20rem] px-4 py-3">
                  <div className="text-xs text-muted-foreground">{placeLabel(row.platform)}</div>
                  <a
                    href={row.link}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex max-w-full items-baseline gap-1 text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground"
                  >
                    <span className="min-w-0 wrap-anywhere">{row.link}</span>
                    <ArrowUpRightIcon aria-hidden weight="bold" className="size-3 shrink-0 self-center text-muted-foreground" />
                    <span className="sr-only">(opens in new tab)</span>
                  </a>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{WHY[row.status]}</td>
                <td className="px-4 py-3 text-muted-foreground tabular-nums">
                  {row.followers == null ? "—" : formatCount(row.followers)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                  {formatDateTime(row.checkedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
