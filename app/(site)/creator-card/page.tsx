import type { Metadata } from "next";
import { Suspense } from "react";
import { card, cardInner, label } from "@/components/convention/section-heading";
import { requireUser } from "@/lib/auth";
import { CARD_FORM, CARD_PATH } from "@/lib/creator-card";
import { getMyCard } from "@/lib/creator-cards";
import type { CreatorCard } from "@/lib/db/schema";
import { presignedGetUrl } from "@/lib/s3";
import { cn } from "@/lib/utils";
import { CardForm, type FormCard } from "./card-form";

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
   it for review. */
export default function CreatorCardPage() {
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
            <CardLoader />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

async function CardLoader() {
  const user = await requireUser(CARD_PATH);
  const row = await getMyCard(user.id);
  return (
    <CardForm accountName={user.name} accountPicture={user.picture} card={row ? await fromRow(row) : null} />
  );
}

async function fromRow(row: CreatorCard): Promise<FormCard> {
  return {
    // Only an uploaded photo; the form falls back to the account's picture.
    photoUrl: await presignedGetUrl(row.photoKey),
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
  };
}

function FormFallback() {
  return (
    <div className={cn(card, "max-w-3xl")} aria-busy="true" aria-live="polite">
      <div className={cn(cardInner, "px-5 py-6 text-sm text-muted-foreground sm:px-6")}>Loading your card…</div>
    </div>
  );
}
