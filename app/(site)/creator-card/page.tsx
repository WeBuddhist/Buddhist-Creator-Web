import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { framedCard, framedCardInner, label } from "@/components/convention/section-heading";
import { requireUser } from "@/lib/auth";
import { CARD_FORM, CARD_PATH, type CardContent } from "@/lib/creator-card";
import { cardFollowers, cardLinkChecks, getClaimableCard, getMyCard, getMyClaim } from "@/lib/creator-cards";
import { claimHref } from "@/lib/creators";
import type { CreatorCard } from "@/lib/db/schema";
import { presignedGetUrl } from "@/lib/s3";
import { cn } from "@/lib/utils";
import { CardForm, type FormCard } from "./card-form";
import { ClaimCard, ClaimPending } from "./claim-card";

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
   claim link arrives here as ?claim=<id>, after the sign-in. Someone with
   no card of their own is then shown that card and can send a claim for
   it, in place of the empty form. A claim is a request: while it is with
   our team this page shows it waiting, with the code to put on the
   channel, and the card becomes theirs here only once an admin has
   approved it. */
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

  const claim = await getMyClaim(user.id);
  if (claim?.status === "pending") {
    return (
      <>
        {claimId && claimId !== claim.cardId && (
          <Notice>
            You already have a claim with our team, for the card below. To claim a different card, withdraw this one
            first.
          </Notice>
        )}
        <ClaimPending
          card={await cardContent(claim.card)}
          code={claim.code}
          sentAt={claim.createdAt.toISOString()}
          email={user.email}
        />
      </>
    );
  }

  const claimable = claimId ? await getClaimableCard(claimId) : null;
  if (claimable) {
    return <ClaimCard cardId={claimable.id} email={user.email} card={await cardContent(claimable)} />;
  }
  return (
    <>
      {claimId ? (
        <Notice>
          That card has an owner already, or is no longer there. If it is yours, write to {contactLink}. You can still
          make a card of your own below.
        </Notice>
      ) : (
        // The last claim was turned down: say so once, where they look.
        claim?.status === "rejected" && (
          <Notice>
            Your claim for <span className="font-medium">{claim.card.displayName}</span> was not approved.
            {claim.reviewNote && (
              <span className="mt-2 block whitespace-pre-line wrap-anywhere border-s-2 border-brand-cyan/40 ps-3">
                {claim.reviewNote}
              </span>
            )}
            <span className={claim.reviewNote ? "mt-2 block" : undefined}>
              {" "}
              If you have a question about it, write to {contactLink}. You can also make a card of your own below.
            </span>
          </Notice>
        )
      )}
      <CardForm accountName={user.name} accountPicture={user.picture} card={null} />
    </>
  );
}

const contactLink = (
  <a
    href={`mailto:${CARD_FORM.contact}`}
    className="font-medium underline decoration-current/35 underline-offset-4 hover:decoration-current"
  >
    {CARD_FORM.contact}
  </a>
);

/** What a card shows, and nothing else of its row, for the browser. */
async function cardContent(row: CreatorCard): Promise<CardContent> {
  return {
    photoUrl: await presignedGetUrl(row.photoKey),
    displayName: row.displayName,
    country: row.country,
    creatorType: row.creatorType,
    languages: row.languages,
    languagesOther: row.languagesOther,
    contentTypes: row.contentTypes,
    contentTypesOther: row.contentTypesOther,
    tagline: row.tagline,
    socials: row.socials,
    totalFollowers: row.totalFollowers,
  };
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
  const [photoUrl, checks] = await Promise.all([presignedGetUrl(row.photoKey), cardLinkChecks(row)]);
  return {
    // Only an uploaded photo; the form falls back to the account's picture.
    photoUrl,
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
    totalFollowers: row.totalFollowers,
    followers: cardFollowers(row),
    checks: Object.fromEntries(
      Object.entries(checks).map(([place, check]) => [
        place,
        { status: check.status, checkedAt: check.checkedAt.toISOString() },
      ]),
    ),
  };
}

function FormFallback() {
  return (
    <div className={cn(framedCard, "max-w-3xl")} aria-busy="true" aria-live="polite">
      <div className={cn(framedCardInner, "px-5 py-6 text-sm text-muted-foreground sm:px-6")}>Loading your card…</div>
    </div>
  );
}
