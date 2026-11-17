import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { framedCard, framedCardInner, label } from "@/components/convention/section-heading";
import { requireUser } from "@/lib/auth";
import { CARD_FORM, CARD_PATH, cardPhotoStyle } from "@/lib/creator-card";
import { cardFollowers, getClaimableCard, getMyCard } from "@/lib/creator-cards";
import { claimHref } from "@/lib/creators";
import type { CreatorCard } from "@/lib/db/schema";
import { presignedGetUrl } from "@/lib/s3";
import { cn } from "@/lib/utils";
import { CardForm, type FormCard } from "./card-form";
import { ClaimCard } from "./claim-card";

export const metadata: Metadata = {
  title: "Your creator card",
  description: CARD_FORM.intro,
  robots: { index: false },
};

/* The heading is static and prerenders; the form needs the session and the
   creator's card, so it streams in behind the boundary. The proxy has
   already sent anyone without a session to sign in, so the fallback is
   only ever a brief placeholder.

   Opening the page stores nothing. A card exists once its creator sends
   it for review.

   The page is also where a card the team made is claimed: the directory's
   "claim this card" link arrives here as ?claim=<id>, after the sign-in.
   Someone with no card of their own is then shown that card and asked to
   confirm it is theirs, in place of the empty form. */
export default function CreatorCardPage(props: PageProps<"/creator-card">) {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <section aria-labelledby="creator-card-title" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-12 sm:px-6 lg:pt-20 lg:pb-16">
          {/* The section heading's stack, with the page's h1 in it. */}
          <div className="max-w-3xl">
            <p className={cn(label, "text-brand-cyan")}>{CARD_FORM.eyebrow}</p>
            <h1
              id="creator-card-title"
              className="mt-4 text-balance font-display text-4xl leading-[1.06] text-foreground sm:text-5xl lg:text-6xl"
            >
              {CARD_FORM.title}
            </h1>
            <p className="mt-5 max-w-[58ch] text-pretty text-lg leading-[1.6] text-muted-foreground">
              {CARD_FORM.intro}
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Your creator card" className="flex-1 bg-paper-deep/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <Suspense fallback={<FormFallback />}>
            <CardLoader searchParams={props.searchParams} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function CardLoader({ searchParams }: { searchParams: PageProps<"/creator-card">["searchParams"] }) {
  const params = await searchParams;
  const asked = Array.isArray(params.claim) ? params.claim[0] : params.claim;
  const claimId = asked && UUID.test(asked) ? asked.toLowerCase() : null;

  const user = await requireUser(claimId ? claimHref(claimId) : CARD_PATH);
  const row = await getMyCard(user.id);
  if (row) {
    return (
      <>
        {/* One card each: theirs is shown, whatever they came to claim. */}
        {claimId && claimId !== row.id && (
          <Notice>You already have a creator card, so you cannot claim another one. This is your card.</Notice>
        )}
        <CardForm accountName={user.name} accountPicture={user.picture} card={await fromRow(row)} />
      </>
    );
  }

  const claimable = claimId ? await getClaimableCard(claimId) : null;
  if (claimable) {
    return (
      <ClaimCard
        cardId={claimable.id}
        email={user.email}
        // Only what the card shows goes to the browser.
        card={{
          photoUrl: await presignedGetUrl(claimable.photoKey),
          photoStyle: cardPhotoStyle(claimable.photoKey),
          displayName: claimable.displayName,
          country: claimable.country,
          creatorType: claimable.creatorType,
          languages: claimable.languages,
          languagesOther: claimable.languagesOther,
          contentTypes: claimable.contentTypes,
          contentTypesOther: claimable.contentTypesOther,
          tagline: claimable.tagline,
          socials: claimable.socials,
          totalFollowers: claimable.totalFollowers,
        }}
      />
    );
  }
  return (
    <>
      {claimId && (
        <Notice>
          That card has already been claimed, or is no longer there. If it is yours, write to{" "}
          <a
            href={`mailto:${CARD_FORM.contact}`}
            className="font-medium underline decoration-current/35 underline-offset-4 hover:decoration-current"
          >
            {CARD_FORM.contact}
          </a>
          . You can still make a card of your own below.
        </Notice>
      )}
      <CardForm accountName={user.name} accountPicture={user.picture} card={null} />
    </>
  );
}

/* A line above the form about the claim that brought the visitor here. */
function Notice({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="mb-6 rounded-xl border border-brand-cyan/30 bg-brand-cyan/5 px-4 py-3.5 text-sm leading-[1.5] text-foreground lg:max-w-[calc(100%-25.5rem)]"
    >
      {children}
    </p>
  );
}

async function fromRow(row: CreatorCard): Promise<FormCard> {
  return {
    // Only an uploaded photo; the form falls back to the account's picture.
    photoUrl: await presignedGetUrl(row.photoKey),
    photoStyle: cardPhotoStyle(row.photoKey),
    status: row.status,
    // The note is written for a rejection; it is not shown otherwise.
    reviewNote: row.status === "rejected" ? row.reviewNote : null,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    displayName: row.displayName,
    country: row.country,
    creatorType: row.creatorType,
    languages: row.languages ?? [],
    languagesOther: row.languagesOther,
    contentTypes: row.contentTypes ?? [],
    contentTypesOther: row.contentTypesOther,
    tagline: row.tagline,
    socials: row.socials,
    followers: cardFollowers(row),
  };
}

function FormFallback() {
  return (
    <div className={cn(framedCard, "max-w-3xl")} aria-busy="true" aria-live="polite">
      <div className={cn(framedCardInner, "px-5 py-6 text-sm text-muted-foreground sm:px-6")}>Loading your card…</div>
    </div>
  );
}
