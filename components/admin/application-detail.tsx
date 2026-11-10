import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { Chips, Facts, Section, type Fact } from "@/components/admin/section";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatusHistory, type StatusEvent } from "@/components/admin/status-history";
import { StatusActions } from "@/app/admin/applications/[id]/status-actions";
import type { ApplicationStatus } from "@/lib/db/schema";
import { formatBytes, formatDateTime } from "@/lib/format";
import {
  AUDIENCE_LANGUAGES,
  AUDIENCE_REGIONS,
  CONTENT_TOPICS,
  TARGET_AUDIENCES,
  listWithOther,
  platformsWithLinks,
  type PlatformLinks,
} from "@/lib/registration-2027";

/* What the page shows of one application. A plain data shape rather than
   the query's row type, so the page passes what it loaded and a preview
   can pass something made up. */
export type ApplicationDetailData = {
  id: string;
  status: ApplicationStatus;
  fullName: string | null;
  organization: string | null;
  location: string | null;
  contentTopics: string[] | null;
  contentTopicsOther: string | null;
  targetAudience: string[] | null;
  targetAudienceOther: string | null;
  audienceRegion: string[] | null;
  audienceRegionOther: string | null;
  audienceLanguage: string[] | null;
  audienceLanguageOther: string | null;
  platforms: string[] | null;
  platformsOther: string | null;
  platformLinks: PlatformLinks;
  videoSizeBytes: number | null;
  videoUploadedAt: Date | null;
  reviewNote: string | null;
  submittedAt: Date | null;
  updatedAt: Date;
  decidedAt: Date | null;
  notifiedAt: Date | null;
  user: { email: string; name: string | null };
  decider: { name: string | null; email: string } | null;
  events: StatusEvent[];
};

const link =
  "break-all text-foreground underline decoration-foreground/30 underline-offset-4 transition-[text-decoration-color] duration-150 ease-hover hover:decoration-foreground";

/* The chosen platforms, one to a line, each with the link the applicant
   gave for it. The name leads so the links share an edge from `sm` up. */
function Platforms({ items }: { items: ReturnType<typeof platformsWithLinks> }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map(({ value, label, url }) => (
        <li key={value} className="grid gap-x-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <span className="font-medium">{label}</span>
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className={link}>
              {url}
            </a>
          ) : (
            <span className="text-muted-foreground">No link given</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/* Several answers as one line each: the audience options are sentences,
   too long for chips. */
const lines = (items: string[]) => (items.length ? items.join("\n") : null);

/* One fact in the header's meta line. Every item but the first carries
   its own separator, so when the line wraps the dot moves with its item
   instead of hanging at the end of the previous line. */
function Meta({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 before:text-muted-foreground/50 before:content-['·'] first:before:hidden", className)}>
      {children}
    </span>
  );
}

export function ApplicationDetail({
  application,
  videoUrl,
  viewerId,
}: {
  application: ApplicationDetailData;
  videoUrl: string | null;
  viewerId: string;
}) {
  const title = application.fullName || application.user.name || application.user.email;

  const applicant: Fact[] = [
    { label: "Name", value: application.fullName },
    { label: "Email", value: <a href={`mailto:${application.user.email}`} className={link}>{application.user.email}</a> },
    { label: "Organisation", value: application.organization },
    { label: "Location", value: application.location },
  ];

  const topics = listWithOther(CONTENT_TOPICS, application.contentTopics, application.contentTopicsOther);
  const platforms = platformsWithLinks(application.platforms, application.platformsOther, application.platformLinks);
  const content: Fact[] = [
    { label: "Content is about", value: topics.length ? <Chips items={topics} /> : null },
    { label: "Target audience", value: lines(listWithOther(TARGET_AUDIENCES, application.targetAudience, application.targetAudienceOther)) },
    { label: "Audience region", value: lines(listWithOther(AUDIENCE_REGIONS, application.audienceRegion, application.audienceRegionOther)) },
    { label: "Audience language", value: lines(listWithOther(AUDIENCE_LANGUAGES, application.audienceLanguage, application.audienceLanguageOther)) },
    { label: "Platforms", value: platforms.length ? <Platforms items={platforms} /> : null },
  ];

  const decided = application.decidedAt
    ? `Decided ${formatDateTime(application.decidedAt)}${
        application.decider ? ` by ${application.decider.name ?? application.decider.email}` : ""
      }. ${application.notifiedAt ? `Notified ${formatDateTime(application.notifiedAt)}.` : "Not notified yet."}`
    : null;

  return (
    <>
      <PageHeader
        title={title}
        badge={<StatusBadge status={application.status} />}
        description={
          // Two rows by design, who and when, so neither has to wrap at the
          // header's measure on a desktop.
          <span className="flex flex-col gap-0.5 tabular-nums">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Meta>{application.user.email}</Meta>
              {application.organization && <Meta>{application.organization}</Meta>}
              {application.location && <Meta>{application.location}</Meta>}
            </span>
            {/* The two dates do not fit one phone line, so there they stack
                as plain lines with no separator between them. */}
            <span className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
              <Meta>{application.submittedAt ? `Submitted ${formatDateTime(application.submittedAt)}` : "Not submitted"}</Meta>
              <Meta className="max-sm:before:hidden">Edited {formatDateTime(application.updatedAt)}</Meta>
            </span>
          </span>
        }
        className="mb-6"
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <Section id="applicant-title" title="Applicant">
            <Facts items={applicant} />
          </Section>

          <Section id="content-title" title="Content">
            <Facts items={content} />
          </Section>

          <Section
            id="video-title"
            title="Intro video"
            meta={
              videoUrl
                ? `${formatBytes(application.videoSizeBytes)} · uploaded ${formatDateTime(application.videoUploadedAt)}`
                : undefined
            }
          >
            {videoUrl ? (
              <>
                {/* Sized to a 16:9 frame the width of the answers' measure,
                    never the full card, so a portrait phone video does not
                    become a wall. */}
                <video controls preload="metadata" src={videoUrl} className="aspect-video w-full max-w-2xl rounded-lg bg-black" />
                <p className="mt-3 text-xs text-muted-foreground">
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
                    Open in new tab
                    <ArrowUpRightIcon aria-hidden weight="bold" className="size-3" />
                  </a>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No video uploaded.</p>
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-5 lg:sticky lg:top-[calc(var(--header-height)+1.25rem)]">
          <Section id="decision-title" title="Decision" bodyClassName="p-0">
            <StatusActions
              applicationId={application.id}
              status={application.status}
              reviewNote={application.reviewNote}
              decided={decided}
            />
          </Section>

          <Section id="history-title" title="History">
            <StatusHistory events={application.events} viewerId={viewerId} />
          </Section>
        </div>
      </div>
    </>
  );
}
