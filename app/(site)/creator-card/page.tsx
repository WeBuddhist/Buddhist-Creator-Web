import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { label } from "@/components/convention/section-heading";
import { requireUser } from "@/lib/auth";
import { CARD_CLAIM, CARD_FORM, CARD_HOME, CARD_PATH, type CardContent } from "@/lib/creator-card";
import { getClaimableCard, getMyCard, getMyClaim } from "@/lib/creator-cards";
import { cardHome, homeNetwork } from "@/lib/creator-home";
import { claimHref } from "@/lib/creators";
import type { CreatorCard } from "@/lib/db/schema";
import { presignedGetUrl } from "@/lib/s3";
import { cn } from "@/lib/utils";
import { CardHomeView, HomeNotice, NoCardView } from "./card-home";
import { ClaimCard, ClaimPending } from "./claim-card";

export const metadata: Metadata = {
  title: "Your creator card",
  description: CARD_FORM.intro,
  robots: { index: false },
};

/* The creator's own page: their card, where it stands on the leaderboard
   and what it adds to the mission (card-home.tsx). Everything on it is
   about the person the session names, so nothing prerenders but the
   frame; the page streams in behind the boundary. The proxy has already
   sent anyone without a session to sign in.

   The form is not here: a card is made and changed on its own page
   (./edit), which this one leads to. Opening either stores nothing; a
   card exists once its creator sends it for review.

   The page is also where a card the team made is claimed: the directory's
   claim link arrives here as ?claim=<id>, after the sign-in. Someone with
   no card of their own is then shown that card and can send a claim for
   it. A claim is a request: while it is with our team this page shows it
   waiting, with the code to put on the channel, and the card becomes
   theirs here only once an admin has approved it. */
export default function CreatorCardPage(props: PageProps<"/creator-card">) {
  return (
    <main data-face="inter" className="flex flex-1 flex-col bg-background">
      <Suspense fallback={<HomeFallback />}>
        <CardLoader searchParams={props.searchParams} />
      </Suspense>
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
      <CardHomeView
        home={await cardHome(row, user)}
        notice={
          // One card each: theirs is shown, whatever they came to claim.
          claimId &&
          claimId !== row.id && (
            <HomeNotice>You already have a creator card, so you cannot claim another one. This is your card.</HomeNotice>
          )
        }
      />
    );
  }

  const claim = await getMyClaim(user.id);
  if (claim?.status === "pending") {
    return (
      <ClaimFrame>
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
      </ClaimFrame>
    );
  }

  const claimable = claimId ? await getClaimableCard(claimId) : null;
  if (claimable) {
    return (
      <ClaimFrame>
        <ClaimCard cardId={claimable.id} email={user.email} card={await cardContent(claimable)} />
      </ClaimFrame>
    );
  }
  return (
    <NoCardView
      name={user.name}
      picture={user.picture}
      network={await homeNetwork()}
      notice={
        claimId ? (
          <HomeNotice>
            That card has an owner already, or is no longer there. If it is yours, write to {contactLink}. You can
            still create a card of your own.
          </HomeNotice>
        ) : (
          // The last claim was turned down: say so once, where they look.
          claim?.status === "rejected" && (
            <HomeNotice>
              Your claim for <span className="font-medium">{claim.card.displayName}</span> was not approved.
              {claim.reviewNote && (
                <span className="mt-2 block whitespace-pre-line wrap-anywhere border-s-2 border-brand-cyan/40 ps-3">
                  {claim.reviewNote}
                </span>
              )}
              <span className={claim.reviewNote ? "mt-2 block" : undefined}>
                {" "}
                If you have a question about it, write to {contactLink}. You can also create a card of your own.
              </span>
            </HomeNotice>
          )
        )
      }
    />
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

/* The claim screens under their own heading: the page's title, for
   somebody who is here about a card the team made. */
function ClaimFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <section aria-labelledby="creator-card-title" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-5 pt-14 pb-12 sm:px-6 lg:pt-20 lg:pb-16">
          <div className="max-w-3xl">
            <p className={cn(label, "text-brand-cyan")}>{CARD_CLAIM.eyebrow}</p>
            <h1
              id="creator-card-title"
              className="mt-4 text-balance font-display text-4xl leading-[1.06] text-foreground sm:text-5xl lg:text-6xl"
            >
              {CARD_CLAIM.title}
            </h1>
            <p className="mt-5 max-w-[58ch] text-pretty text-lg leading-[1.6] text-muted-foreground">
              {CARD_CLAIM.intro}
            </p>
          </div>
        </div>
      </section>
      <section aria-label="Your claim" className="flex-1 bg-paper-deep/50">
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 lg:py-16">{children}</div>
      </section>
    </>
  );
}

/* A line above a claim screen about the claim that brought the visitor here. */
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

/* Holds about the height the page's opening takes, so the footer does not
   jump far when the page arrives. */
function HomeFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pt-12 pb-16 sm:px-6 lg:pt-16" aria-busy="true">
      <p className={cn(label, "text-brand-cyan")}>{CARD_HOME.eyebrow}</p>
      <p className="mt-4 min-h-[32rem] text-lg text-muted-foreground">{CARD_HOME.loading}</p>
    </div>
  );
}
