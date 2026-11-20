import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { SectionHeading, card, cardInner, framedCard, framedCardInner, label } from "@/components/convention/section-heading";
import { AWARDS_2027, NOMINATION_FORM, RULE, isAwardSlug, type AwardSlug } from "@/lib/awards-2027";
import { requireUser } from "@/lib/auth";
import { getMyBallot } from "@/lib/nominations";
import { presignedGetUrl } from "@/lib/s3";
import { cn } from "@/lib/utils";
import { NominationForm, type FormBallot } from "./nomination-form";

export const metadata: Metadata = {
  title: `Nominate · ${AWARDS_2027.shortTitle}`,
  description: `Nominate creators for the ${AWARDS_2027.title}.`,
  robots: { index: false },
};

/* The intro and the rule are static and prerender; the form needs the
   session and the person's nominations, so it streams in behind the
   boundary. The proxy has already sent anyone without a session to sign
   in. Opening the form stores nothing: the ballot is written on the first
   send.

   ?award=<slug> (the awards page's posters link here with it) opens that
   award on the form and brings it into view. */
export default function NominatePage(props: PageProps<"/convention/2027/awards/nominate">) {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <section aria-labelledby="nominate-title" className="border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-14 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-16 lg:pt-20 lg:pb-16">
          <div>
            <Link
              href={AWARDS_2027.path}
              className="group/back mb-8 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground transition-colors duration-150 ease-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <ArrowLeftIcon aria-hidden weight="bold" className="size-4" />
              All the awards
            </Link>
            <SectionHeading id="nominate-title" eyebrow={NOMINATION_FORM.eyebrow} title={NOMINATION_FORM.title} />
            <div className="mt-6 max-w-[58ch] space-y-4 text-pretty text-lg leading-[1.6] text-muted-foreground">
              {NOMINATION_FORM.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <aside aria-labelledby="rule-title" className={framedCard}>
            <div className={cn(framedCardInner, "px-6 py-6")}>
              <p className={cn(label, "text-brand-cyan")}>The rule</p>
              <h2 id="rule-title" className="mt-3 font-display text-[1.75rem] leading-[1.15] text-foreground">
                {RULE.title}
              </h2>
              <p className="mt-3 text-pretty text-[0.9375rem] leading-[1.6] text-muted-foreground">{RULE.body}</p>
            </div>
          </aside>
        </div>
      </section>

      <section aria-label="Nomination form" className="bg-paper-deep/50 pb-7">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <Suspense fallback={<FormFallback />}>
            <NominationLoader searchParams={props.searchParams} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

async function NominationLoader({
  searchParams,
}: {
  searchParams: PageProps<"/convention/2027/awards/nominate">["searchParams"];
}) {
  const user = await requireUser(AWARDS_2027.nominatePath);
  const [row, params] = await Promise.all([getMyBallot(user.id), searchParams]);
  const asked = Array.isArray(params.award) ? params.award[0] : params.award;
  const focusAward: AwardSlug | null = isAwardSlug(asked) ? asked : null;

  const nominations = (row?.nominations ?? []).filter((nomination) => isAwardSlug(nomination.category));
  const images = await Promise.all(
    nominations
      .filter((nomination) => nomination.imageKey)
      .map(async (nomination) => [nomination.category, await presignedGetUrl(nomination.imageKey)] as const),
  );

  const ballot: FormBallot | null = row
    ? {
        nominatorName: row.nominatorName,
        nominatorCountry: row.nominatorCountry,
        submittedAt: row.submittedAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        nominations: Object.fromEntries(
          nominations.map((nomination) => [
            nomination.category,
            {
              nomineeName: nomination.nomineeName,
              account: nomination.account ?? "",
              link: nomination.link ?? "",
              videoLink: nomination.videoLink ?? "",
              reason: nomination.reason,
            },
          ]),
        ),
        images: Object.fromEntries(images.filter(([, url]) => url)),
      }
    : null;

  return (
    <NominationForm
      user={{ email: user.email, name: user.name }}
      ballot={ballot}
      focusAward={focusAward}
      open={AWARDS_2027.open}
    />
  );
}

function FormFallback() {
  return (
    <div className={card} aria-busy="true" aria-live="polite">
      <div className={cn(cardInner, "px-5 py-6 text-sm text-muted-foreground sm:px-6")}>Loading your nominations…</div>
    </div>
  );
}
