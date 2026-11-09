import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatusHistory } from "@/components/admin/status-history";
import { card, cardInner } from "@/components/convention/section-heading";
import { getApplication } from "@/lib/applications";
import { requireRole } from "@/lib/auth";
import { formatBytes, formatDateTime } from "@/lib/format";
import {
  AUDIENCE_LANGUAGES,
  AUDIENCE_REGIONS,
  CONTENT_TOPICS,
  FORM,
  PLATFORMS,
  TARGET_AUDIENCES,
  labelFor,
  type Option,
} from "@/lib/registration-2027";
import { presignedGetUrl } from "@/lib/s3";
import { cn } from "@/lib/utils";
import { StatusActions } from "./status-actions";

export const metadata: Metadata = { title: "Application" };

export default function ApplicationPage(props: PageProps<"/admin/applications/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading application…</p>}>
      <ApplicationDetail params={props.params} />
    </Suspense>
  );
}

function withOther(options: readonly Option[], value: string | null, other: string | null) {
  const label = labelFor(options, value);
  if (!label) return null;
  return value === "other" && other ? `Other: ${other}` : label;
}

function listWithOther(options: readonly Option[], values: string[] | null, other: string | null) {
  if (!values?.length) return null;
  return values
    .map((value) => (value === "other" && other ? `Other: ${other}` : labelFor(options, value)))
    .filter(Boolean)
    .join(", ");
}

async function ApplicationDetail({ params }: { params: PageProps<"/admin/applications/[id]">["params"] }) {
  const viewer = await requireRole("admin", "/admin");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const application = await getApplication(id);
  if (!application) notFound();
  const videoUrl = application.videoKey ? await presignedGetUrl(application.videoKey) : null;

  const answers: { label: string; value: React.ReactNode }[] = [
    { label: "Name", value: application.fullName },
    { label: "Email", value: <a href={`mailto:${application.user.email}`} className="underline underline-offset-4">{application.user.email}</a> },
    { label: "Organisation", value: application.organization },
    { label: "Location", value: application.location },
    { label: "Content is about", value: listWithOther(CONTENT_TOPICS, application.contentTopics, application.contentTopicsOther) },
    { label: "Target audience", value: withOther(TARGET_AUDIENCES, application.targetAudience, application.targetAudienceOther) },
    { label: "Audience region", value: withOther(AUDIENCE_REGIONS, application.audienceRegion, application.audienceRegionOther) },
    { label: "Audience language", value: withOther(AUDIENCE_LANGUAGES, application.audienceLanguage, application.audienceLanguageOther) },
    { label: "Platforms", value: listWithOther(PLATFORMS, application.platforms, application.platformsOther) },
    { label: "Social media links", value: application.socialLinks ? <Links text={application.socialLinks} /> : null },
  ];

  const awards = [
    { name: FORM.sections.awards.items[0].name, url: application.awardAudienceChoiceUrl },
    { name: FORM.sections.awards.items[1].name, url: application.awardCreativeVideoUrl },
    { name: FORM.sections.awards.items[2].name, url: application.awardViralContentUrl },
  ].filter((award) => award.url);

  return (
    <>
      <p className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-medium text-brand-cyan underline decoration-brand-cyan/30 underline-offset-4 hover:decoration-brand-cyan">
          <ArrowLeftIcon aria-hidden weight="bold" className="size-3.5" />
          All applications
        </Link>
      </p>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {application.fullName || application.user.name || application.user.email}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {application.submittedAt ? `Submitted ${formatDateTime(application.submittedAt)}` : "Not submitted"}
            {" · "}last edited {formatDateTime(application.updatedAt)}
          </p>
        </div>
        <StatusBadge status={application.status} className="h-7 ps-2.5 pe-3 text-sm" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <section className={card} aria-labelledby="answers-title">
            <div className={cn(cardInner, "px-5 py-5 sm:px-6")}>
              <h3 id="answers-title" className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">Answers</h3>
              <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
                {answers.map(({ label, value }) => (
                  <div key={label} className="contents">
                    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
                    <dd className="text-sm text-foreground whitespace-pre-line">{value ?? <span className="text-muted-foreground">—</span>}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section className={card} aria-labelledby="video-title">
            <div className={cn(cardInner, "px-5 py-5 sm:px-6")}>
              <h3 id="video-title" className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">Intro video</h3>
              {videoUrl ? (
                <>
                  <video controls preload="metadata" src={videoUrl} className="mt-4 max-h-[28rem] w-full rounded-lg bg-black" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatBytes(application.videoSizeBytes)} · uploaded {formatDateTime(application.videoUploadedAt)}
                    {" · "}
                    <a href={videoUrl} className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">
                      Open in new tab
                    </a>
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No video uploaded.</p>
              )}
            </div>
          </section>

          <section className={card} aria-labelledby="awards-title">
            <div className={cn(cardInner, "px-5 py-5 sm:px-6")}>
              <h3 id="awards-title" className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">Award submissions</h3>
              {awards.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">None submitted.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2 text-sm">
                  {awards.map((award) => (
                    <li key={award.name} className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{award.name}</span>
                      <a href={award.url!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-brand-cyan underline decoration-brand-cyan/30 underline-offset-4 hover:decoration-brand-cyan">
                        {award.url}
                        <ArrowUpRightIcon aria-hidden weight="bold" className="size-3.5 shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
          <section className={card} aria-labelledby="decision-title">
            <div className={cn(cardInner, "px-5 py-5 sm:px-6")}>
              <h3 id="decision-title" className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">Decision</h3>
              <div className="mt-4">
                <StatusActions applicationId={application.id} status={application.status} reviewNote={application.reviewNote} />
              </div>
              {application.decidedAt && (
                <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
                  Decided {formatDateTime(application.decidedAt)}
                  {application.decider ? ` by ${application.decider.name ?? application.decider.email}` : ""}.
                  {application.notifiedAt ? ` Notified ${formatDateTime(application.notifiedAt)}.` : " Not notified yet."}
                </p>
              )}
            </div>
          </section>

          <section className={card} aria-labelledby="history-title">
            <div className={cn(cardInner, "px-5 py-5 sm:px-6")}>
              <h3 id="history-title" className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">History</h3>
              <StatusHistory events={application.events} viewerId={viewer.id} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/* Free text with links in it, each one made clickable. */
function Links({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/\S+)/g);
  return (
    <>
      {parts.map((part, index) =>
        /^https?:\/\//.test(part) ? (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="break-all text-brand-cyan underline decoration-brand-cyan/30 underline-offset-4 hover:decoration-brand-cyan">
            {part}
          </a>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
