import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { framedCard, framedCardInner, label } from "@/components/convention/section-heading";
import { requireUser } from "@/lib/auth";
import { CARD_EDIT_PATH, CARD_FORM, CARD_PATH } from "@/lib/creator-card";
import { cardFollowers, cardLinkChecks, getMyCard, getMyClaim } from "@/lib/creator-cards";
import type { CreatorCard } from "@/lib/db/schema";
import { presignedGetUrl } from "@/lib/s3";
import { cn } from "@/lib/utils";
import { CardForm, type FormCard } from "../card-form";

export const metadata: Metadata = {
  title: "Edit your creator card",
  description: CARD_FORM.intro,
  robots: { index: false },
};

/* The form a creator card is made and changed with. It is its own page so
   that the creator's page (../page.tsx) can be about the creator: the
   form is shown only to somebody who has asked to create or edit a card.

   Which of the two it is depends on the person, so the heading streams in
   with the form. Somebody with a claim waiting on a card the team made
   has no form to fill in: they are sent back to their claim. */
export default function EditCardPage() {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <Suspense fallback={<FormFallback />}>
        <FormLoader />
      </Suspense>
    </main>
  );
}

/* One centred column for the whole page, heading and form alike, so the
   title, the status line and every field start on the same edge. 48rem
   of content: wide enough for two fields side by side, narrow enough that
   a line of help text stays readable. */
const column = "mx-auto w-full max-w-[calc(48rem+2.5rem)] px-5 sm:max-w-[calc(48rem+3rem)] sm:px-6";

async function FormLoader() {
  const user = await requireUser(CARD_EDIT_PATH);
  const row = await getMyCard(user.id);
  if (!row && (await getMyClaim(user.id))?.status === "pending") redirect(CARD_PATH);

  return (
    <>
      <section aria-labelledby="creator-card-title" className="border-b border-border">
        <div className={cn(column, "pt-10 pb-12 lg:pt-14 lg:pb-16")}>
          <Link
            href={CARD_PATH}
            className="inline-flex min-h-6 items-center gap-1.5 rounded-sm text-sm font-medium text-brand-cyan underline decoration-brand-cyan/35 underline-offset-4 transition-[text-decoration-color] duration-150 ease-hover hover:decoration-brand-cyan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeftIcon aria-hidden weight="bold" className="size-3.5 rtl:-scale-x-100" />
            Back to your card
          </Link>
          <div className="mt-8">
            <p className={cn(label, "text-brand-cyan")}>{CARD_FORM.eyebrow}</p>
            <h1
              id="creator-card-title"
              className="mt-4 text-balance font-display text-4xl leading-[1.06] text-foreground sm:text-5xl lg:text-6xl"
            >
              {row ? CARD_FORM.editTitle : CARD_FORM.title}
            </h1>
            <p className="mt-5 max-w-[58ch] text-pretty text-lg leading-[1.6] text-muted-foreground">
              {row ? CARD_FORM.editIntro : CARD_FORM.intro}
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Your creator card" className="flex-1 bg-paper-deep/50">
        <div className={cn(column, "py-12 lg:py-16")}>
          <CardForm accountName={user.name} accountPicture={user.picture} card={row ? await fromRow(row) : null} />
        </div>
      </section>
    </>
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
    <div className={cn(column, "py-12 lg:py-16")} aria-busy="true">
      <div className={framedCard} aria-live="polite">
        <div className={cn(framedCardInner, "px-5 py-6 text-sm text-muted-foreground sm:px-6")}>Loading your card…</div>
      </div>
    </div>
  );
}
