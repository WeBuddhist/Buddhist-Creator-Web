import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { CreatorCard } from "@/components/creator-card/creator-card";
import { CreatorFilters } from "@/components/creators/creator-filters";
import { PageIntro } from "@/components/page-intro";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { CARD_PATH, cardPhotoStyle } from "@/lib/creator-card";
import { listPublicCards, type PublicCard } from "@/lib/creator-cards";
import {
  CREATORS_DIRECTORY,
  CREATORS_PAGE,
  DIRECTORY_ID,
  claimHref,
  creatorsHref,
  creatorsView,
} from "@/lib/creators";
import { forLog } from "@/lib/log-error";
import { presignedGetUrl } from "@/lib/s3";
import crowdSelfie from "@/public/photos/crowd-selfie.webp";

export const metadata: Metadata = {
  title: "Creators",
  description: CREATORS_PAGE.description,
};

/* The creators directory: every approved creator card, the most followed
   first, thirty to a page. The intro and the heading are static and
   prerender; the cards depend on the URL's search, country and page, so
   they stream in behind the boundary.

   A card the team made and nobody owns yet carries a way to claim it. */
export default function CreatorsPage(props: PageProps<"/creators">) {
  return (
    <main className="flex flex-1 flex-col">
      <PageIntro
        id="creators-title"
        eyebrow={CREATORS_PAGE.eyebrow}
        title={CREATORS_PAGE.title}
        description={CREATORS_PAGE.description}
        photo={{
          src: crowdSelfie,
          alt: "A creator holding a phone up for a selfie with the whole convention behind him, a hall full of monastics and lay creators cheering with their arms raised.",
          position: "50% 45%",
        }}
      />

      <section id={DIRECTORY_ID} aria-labelledby="directory-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 pt-20 pb-24 sm:px-6 lg:pt-28 lg:pb-32">
          <h2 id="directory-title" className="font-display text-4xl leading-[1.06] text-foreground sm:text-5xl">
            {CREATORS_DIRECTORY.title}
          </h2>
          {/* The way in for a creator. The page behind it asks for a
              sign-in first and comes back. */}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button size="pill" nativeButton={false} render={<Link href={CARD_PATH} />}>
              {CREATORS_DIRECTORY.card.action}
              <ArrowRightIcon data-icon="inline-end" weight="bold" />
            </Button>
            <p className="max-w-[40ch] text-pretty text-sm leading-[1.5] text-muted-foreground">
              {CREATORS_DIRECTORY.card.note}
            </p>
          </div>
          <Suspense fallback={<DirectoryFallback />}>
            <Directory searchParams={props.searchParams} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

/* A card's photo: its own, or failing that its owner's sign-in picture. A
   picture that cannot be signed for (storage not set up, say) leaves the
   card with the stand-in rather than taking the directory down. */
async function photoUrl(card: PublicCard) {
  try {
    return await presignedGetUrl(card.photoKey ?? card.ownerPicture);
  } catch (error) {
    console.error("[creators] could not sign a card photo", forLog(error));
    return null;
  }
}

async function Directory({ searchParams }: { searchParams: PageProps<"/creators">["searchParams"] }) {
  const params = await searchParams;
  const view = creatorsView(params);
  const asked = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(1, Math.floor(Number(asked)) || 1);

  const list = await listPublicCards(view, page);
  const pages = Math.max(1, Math.ceil(list.matching / list.pageSize));
  // A page past the end (a stale link, or a list that has shrunk) lands
  // on the last real page rather than an empty one.
  if (page > pages) redirect(creatorsHref(view, pages, false));

  const cards = await Promise.all(list.rows.map(async (row) => ({ row, photo: await photoUrl(row) })));

  return (
    <CreatorFilters view={view} total={list.total} matching={list.matching} countries={list.countries}>
      {cards.length > 0 ? (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {cards.map(({ row, photo }) => (
            <li key={row.id} className="flex min-w-0">
              <CreatorCard
                className="min-w-0 flex-1"
                card={{ ...row, photoUrl: photo, photoStyle: cardPhotoStyle(row.photoKey) }}
                footer={
                  row.unclaimed && (
                    <Link
                      href={claimHref(row.id)}
                      // Behind a sign-in: nothing to fetch ahead for a visitor.
                      prefetch={false}
                      rel="nofollow"
                      className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-brand-cyan underline decoration-current/35 underline-offset-[5px] transition-[text-decoration-color] duration-150 ease-hover hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {CREATORS_DIRECTORY.claim}
                      <span className="sr-only">: {row.displayName}</span>
                      <ArrowRightIcon aria-hidden weight="bold" className="size-3.5" />
                    </Link>
                  )
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-2xl bg-paper-deep px-6 py-10 text-center sm:py-14">
          <p className="font-display text-2xl leading-[1.2] text-foreground">
            {list.total === 0 ? "No creators here yet" : "No creator matches that search"}
          </p>
          <p className="mx-auto mt-2 max-w-[44ch] text-pretty text-base leading-[1.6] text-muted-foreground">
            {list.total === 0
              ? "Creator cards appear here once our team has approved them."
              : "Try part of a name, or look across every country."}
          </p>
          {list.total > 0 && (
            <Link
              href={creatorsHref({ q: "", country: null })}
              scroll={false}
              className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-full border border-ink/25 px-5 text-[0.9375rem] font-medium text-foreground transition-[background-color] duration-150 ease-hover hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Clear filters
            </Link>
          )}
        </div>
      )}

      <Pagination
        page={page}
        pages={pages}
        total={list.matching}
        pageSize={list.pageSize}
        href={(n) => creatorsHref(view, n)}
        className="mt-10"
      />
    </CreatorFilters>
  );
}

function DirectoryFallback() {
  return (
    <p className="mt-10 border-y border-border py-5 text-sm text-muted-foreground lg:mt-12" aria-busy="true">
      Loading creators…
    </p>
  );
}
