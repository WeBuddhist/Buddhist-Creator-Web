import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionHeading, card, cardInner } from "@/components/convention/section-heading";
import { getOrCreateMyApplication } from "@/lib/applications";
import { requireUser } from "@/lib/auth";
import { CONVENTION_2027 } from "@/lib/convention-2027";
import { FORM } from "@/lib/registration-2027";
import { presignedGetUrl } from "@/lib/s3";
import { cn } from "@/lib/utils";
import { RegistrationForm, type FormApplication } from "./registration-form";

export const metadata: Metadata = {
  title: `Register · ${CONVENTION_2027.shortTitle}`,
  description: `Apply to take part in the ${CONVENTION_2027.title}, ${CONVENTION_2027.dates.label} at ${CONVENTION_2027.location}.`,
  robots: { index: false },
};

const PATH = "/convention/2027/register";

/* The intro and the facts are static and prerender; the form needs the
   session and the row, so it streams in behind the boundary. The proxy has
   already sent anyone without a session to Auth0, so the boundary's
   fallback is only ever a brief placeholder. */
export default function RegisterPage() {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <section aria-labelledby="register-title" className="border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-14 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-16 lg:pt-20 lg:pb-16">
          <div>
            <SectionHeading id="register-title" eyebrow={FORM.eyebrow} title={FORM.title} />
            <div className="mt-6 max-w-[58ch] space-y-4 text-pretty text-lg leading-[1.6] text-muted-foreground">
              {FORM.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <aside className={card} aria-label="Convention details">
            <dl className={cn(cardInner, "flex flex-col gap-3 px-5 py-5 text-base leading-[1.5]")}>
              {FORM.facts.map(({ label, value }) => (
                <div key={label} className="flex flex-col">
                  <dt className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">{label}</dt>
                  <dd className="text-foreground">{value}</dd>
                </div>
              ))}
              <div className="mt-2 border-t border-border pt-4 text-sm text-muted-foreground">
                Questions?{" "}
                <a href={`mailto:${FORM.contact}`} className="font-medium text-foreground underline underline-offset-4">
                  {FORM.contact}
                </a>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section aria-label="Registration form" className="bg-muted/30">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <Suspense fallback={<FormFallback />}>
            <RegistrationLoader />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

async function RegistrationLoader() {
  const user = await requireUser(PATH);
  const row = await getOrCreateMyApplication(user.id);
  const videoUrl = row.videoKey ? await presignedGetUrl(row.videoKey) : null;

  const application: FormApplication = {
    status: row.status,
    fullName: row.fullName,
    organization: row.organization,
    location: row.location,
    contentTopics: row.contentTopics ?? [],
    contentTopicsOther: row.contentTopicsOther,
    targetAudience: row.targetAudience,
    targetAudienceOther: row.targetAudienceOther,
    audienceRegion: row.audienceRegion,
    audienceRegionOther: row.audienceRegionOther,
    audienceLanguage: row.audienceLanguage,
    audienceLanguageOther: row.audienceLanguageOther,
    platforms: row.platforms ?? [],
    platformsOther: row.platformsOther,
    socialLinks: row.socialLinks,
    awardAudienceChoiceUrl: row.awardAudienceChoiceUrl,
    awardCreativeVideoUrl: row.awardCreativeVideoUrl,
    awardViralContentUrl: row.awardViralContentUrl,
    video: row.videoKey
      ? {
          key: row.videoKey,
          sizeBytes: row.videoSizeBytes,
          uploadedAt: row.videoUploadedAt?.toISOString() ?? null,
          url: videoUrl,
        }
      : null,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };

  return <RegistrationForm user={{ email: user.email, name: user.name }} application={application} />;
}

function FormFallback() {
  return (
    <div className={card} aria-busy="true" aria-live="polite">
      <div className={cn(cardInner, "px-5 py-6 text-sm text-muted-foreground sm:px-6")}>Loading your application…</div>
    </div>
  );
}
