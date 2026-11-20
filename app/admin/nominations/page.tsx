import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { panel } from "@/components/admin/panel";
import { requireRole } from "@/lib/auth";
import { AWARDS_2027 } from "@/lib/awards-2027";
import { formatDateTime, plural } from "@/lib/format";
import { listNominations, type NominationRow } from "@/lib/nominations";
import { presignedGetUrl } from "@/lib/s3";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Award nominations" };

const PATH = "/admin/nominations";

export default function NominationsPage() {
  return (
    <>
      <PageHeader
        eyebrow={AWARDS_2027.shortTitle}
        title="Award nominations"
        description="Everything sent through the nomination form, award by award. Nominations of the same name, typed the same way, are grouped, with how many people put that name forward."
        className="mb-6"
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading nominations…</p>}>
        <NominationsList />
      </Suspense>
    </>
  );
}

/* Names as people type them: case and spacing aside, "Ven. Pema" and
   "ven.  pema" are one name. Anything subtler is for the jury to judge. */
const nameKey = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

function byName(rows: NominationRow[]) {
  const groups: { name: string; rows: NominationRow[] }[] = [];
  for (const row of rows) {
    const last = groups.at(-1);
    if (last && nameKey(last.name) === nameKey(row.nomineeName)) last.rows.push(row);
    else groups.push({ name: row.nomineeName, rows: [row] });
  }
  // Most nominated first; the list arrives sorted by name, which settles ties.
  return groups.sort((a, b) => b.rows.length - a.rows.length);
}

const link =
  "rounded-sm text-foreground underline decoration-foreground/20 underline-offset-4 wrap-anywhere hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

async function NominationsList() {
  await requireRole("admin", PATH);
  const { byAward, nominators, total } = await listNominations();
  // The uploaded pictures are private: each is shown through a presigned URL.
  const imageUrls = new Map(
    await Promise.all(
      byAward
        .flatMap(({ rows }) => rows)
        .filter((row) => row.imageKey)
        .map(async (row) => [row.id, await presignedGetUrl(row.imageKey)] as const),
    ),
  );

  if (total === 0) {
    return (
      <section aria-label="Nominations" className={panel}>
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          No nominations yet. They appear here as soon as someone sends the nomination form.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {total} {plural(total, "nomination", "nominations")} from {nominators}{" "}
          {plural(nominators, "person", "people")}
        </p>
        <nav aria-label="Awards" className="mt-3">
          <ul className="flex flex-wrap gap-2">
            {byAward.map(({ award, rows }) => (
              <li key={award.slug}>
                <a
                  href={`#${award.slug}`}
                  className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {award.title}
                  <span className="text-muted-foreground tabular-nums">{rows.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {byAward.map(({ award, rows }) => {
        const groups = byName(rows);
        return (
          <section key={award.slug} id={award.slug} aria-labelledby={`${award.slug}-title`} className="scroll-mt-20">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4">
              <h2 id={`${award.slug}-title`} className="text-lg font-semibold tracking-[-0.01em] text-foreground">
                {award.title}
              </h2>
              <p className="text-sm text-muted-foreground tabular-nums">
                {rows.length} {plural(rows.length, "nomination", "nominations")}
                {rows.length > 0 && (
                  <>
                    {" "}
                    · {groups.length} {plural(groups.length, "name", "names")}
                  </>
                )}
              </p>
            </div>
            {rows.length === 0 ? (
              <p className={cn(panel, "px-5 py-6 text-sm text-muted-foreground")}>No nominations for this award yet.</p>
            ) : (
              <ul className={panel}>
                {groups.map((group) => (
                  <li key={nameKey(group.name)} className="border-b border-border px-4 py-4 last:border-b-0 sm:px-5">
                    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-semibold text-foreground">{group.name}</span>
                      {group.rows.length > 1 && (
                        <span className="rounded-full bg-status-submitted-bg px-2 py-0.5 text-xs font-medium text-status-submitted-text tabular-nums">
                          {group.rows.length} nominations
                        </span>
                      )}
                    </p>
                    <ul className="mt-3 flex flex-col gap-4">
                      {group.rows.map((row) => (
                        <li key={row.id} className="border-s-2 border-border ps-4 text-sm">
                          <p className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
                            {row.account &&
                              (/^https?:\/\//i.test(row.account) ? (
                                <OutLink href={row.account} />
                              ) : (
                                <span className="text-foreground wrap-anywhere">{row.account}</span>
                              ))}
                            {row.link && <OutLink href={row.link} />}
                            {row.videoLink && <OutLink href={row.videoLink} label="Video" />}
                          </p>
                          {imageUrls.get(row.id) && (
                            <a
                              href={imageUrls.get(row.id)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                              {/* A presigned S3 address; next/image adds nothing to it. */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrls.get(row.id)!}
                                alt={`The image uploaded with this nomination of ${row.nomineeName}`}
                                className="h-32 w-auto max-w-64 rounded-lg border border-border bg-muted object-contain"
                              />
                              <span className="sr-only"> (opens in new tab)</span>
                            </a>
                          )}
                          <p className="mt-2 max-w-[72ch] whitespace-pre-line wrap-anywhere leading-[1.6] text-foreground">
                            {row.reason}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Nominated by {row.nominatorName}, {row.nominatorCountry} ·{" "}
                            <a href={`mailto:${row.nominatorEmail}`} className={link}>
                              {row.nominatorEmail}
                            </a>{" "}
                            ·{" "}
                            <time dateTime={row.updatedAt.toISOString()}>{formatDateTime(row.updatedAt)}</time>
                          </p>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function OutLink({ href, label }: { href: string; label?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={link}>
      {label && <span className="text-muted-foreground">{label}: </span>}
      {href}
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  );
}
