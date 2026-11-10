import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { Chips, Facts, Section, type Fact } from "@/components/admin/section";
import { STATUS_LABEL, StatusBadge } from "@/components/admin/status-badge";
import { StatusHistory, type StatusEvent } from "@/components/admin/status-history";
import { EmailActions } from "@/app/admin/applications/[id]/email-actions";
import { StatusActions } from "@/app/admin/applications/[id]/status-actions";
import type { ApplicationStatus, NotificationKind, NotificationState } from "@/lib/db/schema";
import { DECISION_EMAIL, isDecision } from "@/lib/decisions";
import { formatBytes, formatDate, formatDateTime } from "@/lib/format";
import {
  AUDIENCE_LANGUAGES,
  AUDIENCE_REGIONS,
  CONTENT_TOPICS,
  TARGET_AUDIENCES,
  listWithOther,
  locationLabel,
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
  state: string | null;
  country: string | null;
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
  /** The decision last emailed to the applicant, and when. */
  notifiedStatus: ApplicationStatus | null;
  notifiedAt: Date | null;
  user: { email: string; name: string | null };
  decider: { name: string | null; email: string } | null;
  events: StatusEvent[];
  /** Every attempt to email a decision, newest first. */
  notifications: EmailAttempt[];
};

export type EmailAttempt = {
  id: string;
  status: ApplicationStatus;
  kind: NotificationKind;
  state: NotificationState;
  recipientEmail: string;
  errorMessage: string | null;
  createdAt: Date;
  sentAt: Date | null;
  sender: { id: string; name: string | null; email: string } | null;
};

/** Whether this environment may write to applicants, and if not, why. */
export type EmailDelivery = { canSend: boolean; note: string | null };

/** The attempt that has not settled, as lib/notifications.ts judges it:
    still mid-call, or abandoned and waiting for an admin. */
export type UnsettledAttempt = { id: string; inFlight: "sending" | "review" };

function attemptState(attempt: EmailAttempt, unsettled: UnsettledAttempt | null): "sending" | "review" | "sent" | "failed" {
  if (attempt.state === "sent" || attempt.state === "failed") return attempt.state;
  if (unsettled?.id === attempt.id) return unsettled.inFlight;
  return attempt.state === "uncertain" ? "review" : "sending";
}

const ATTEMPT_LABEL = { sending: "Sending", review: "Needs review", sent: "Sent", failed: "Not sent" } as const;

const ATTEMPT_DOT = {
  sending: "border-2 border-muted-foreground/40 bg-card",
  review: "bg-brand-maroon",
  sent: "bg-status-accepted-solid",
  failed: "border-2 border-status-rejected-solid bg-card",
} as const;

/* The Email card: where the applicant stands with their decision email,
   what can be done about it, and every attempt so far. */
function EmailSection({
  application,
  delivery,
  viewerId,
  unsettledAttempt,
}: {
  application: ApplicationDetailData;
  delivery: EmailDelivery;
  viewerId: string;
  unsettledAttempt: UnsettledAttempt | null;
}) {
  const { status, notifiedStatus, notifiedAt, notifications } = application;
  const decision = isDecision(status) ? status : null;
  const unsettled = notifications.find((attempt) => attempt.state === "sending" || attempt.state === "uncertain");
  const inFlight = unsettled ? attemptState(unsettled, unsettledAttempt) : null;
  const owed = decision !== null && notifiedStatus !== decision;
  const told = isDecision(notifiedStatus)
    ? `${STATUS_LABEL[notifiedStatus]} on ${formatDate(notifiedAt)}`
    : null;

  let standing: React.ReactNode;
  if (inFlight === "review" && unsettled) {
    standing = (
      <>
        <span className="font-medium text-brand-maroon">
          A send on {formatDateTime(unsettled.createdAt)} never confirmed.
        </span>{" "}
        It may or may not have reached {unsettled.recipientEmail}. Check the SES console or ask them, then record what
        happened. Nothing else can be sent to this applicant until you do.
      </>
    );
  } else if (inFlight === "sending") {
    standing = "An email is being sent right now.";
  } else if (!decision) {
    standing = told ? `No decision to send. They were last told ${told}.` : "No decision to send yet.";
  } else if (owed) {
    standing = (
      <>
        The {DECISION_EMAIL[decision]} email has not been sent.
        {told && <span className="font-medium text-foreground"> They were told {told}.</span>}
      </>
    );
  } else {
    standing = `The ${DECISION_EMAIL[decision]} email was sent ${formatDateTime(notifiedAt)}.`;
  }

  return (
    <Section id="email-title" title="Email" bodyClassName="flex flex-col gap-3">
      <p className="text-sm leading-[1.5] text-muted-foreground">{standing}</p>
      {!delivery.canSend && delivery.note && decision && (
        <p className="rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs leading-[1.5] text-foreground">{delivery.note}</p>
      )}
      <EmailActions
        applicationId={application.id}
        decision={decision}
        owed={owed}
        notifiedAt={notifiedAt ? notifiedAt.toISOString() : null}
        recipient={application.user.email}
        review={inFlight === "review" && unsettled && isDecision(unsettled.status) ? { id: unsettled.id, decision: unsettled.status } : null}
        sending={inFlight === "sending"}
        canSend={delivery.canSend}
      />
      {notifications.length > 0 && (
        <ol className="flex flex-col gap-2.5 border-t border-border pt-3">
          {notifications.map((attempt) => {
            const state = attemptState(attempt, unsettledAttempt);
            const who = attempt.sender ? (attempt.sender.id === viewerId ? "you" : attempt.sender.name ?? attempt.sender.email) : null;
            return (
              <li key={attempt.id} className="relative ps-5">
                <span aria-hidden="true" className={cn("absolute start-0 top-[5px] size-2.5 rounded-full", ATTEMPT_DOT[state])} />
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 text-sm text-foreground">
                    <span className="font-medium">{STATUS_LABEL[attempt.status]}</span>
                    <span className="text-muted-foreground">
                      {" · "}
                      {ATTEMPT_LABEL[state]}
                      {attempt.kind === "resend" ? " again" : ""}
                    </span>
                  </span>
                  <time dateTime={attempt.createdAt.toISOString()} className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatDateTime(attempt.sentAt ?? attempt.createdAt)}
                  </time>
                </div>
                <p className="mt-0.5 text-xs break-all text-muted-foreground">
                  to {attempt.recipientEmail}
                  {who ? ` · by ${who}` : ""}
                </p>
                {state === "failed" && attempt.errorMessage && (
                  <p className="mt-1 border-s-2 border-border ps-2.5 text-xs text-foreground/80">{attempt.errorMessage}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );
}

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
  delivery,
  unsettledAttempt,
}: {
  application: ApplicationDetailData;
  videoUrl: string | null;
  viewerId: string;
  delivery: EmailDelivery;
  unsettledAttempt: UnsettledAttempt | null;
}) {
  const title = application.fullName || application.user.name || application.user.email;
  const location = locationLabel(application.state, application.country);

  const applicant: Fact[] = [
    { label: "Name", value: application.fullName },
    { label: "Email", value: <a href={`mailto:${application.user.email}`} className={link}>{application.user.email}</a> },
    { label: "Organisation", value: application.organization },
    { label: "State", value: application.state },
    { label: "Country", value: application.country },
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
      }.`
    : null;
  // Saving a decision and telling the applicant are two steps; say so where
  // the decision is made, and say what they believe now if it differs.
  const told = isDecision(application.notifiedStatus) && application.notifiedStatus !== application.status
    ? `They were told ${STATUS_LABEL[application.notifiedStatus].toLowerCase()} on ${formatDate(application.notifiedAt)}. Saving a decision does not email them.`
    : "Saving a decision does not email the applicant. Send it from the Email card.";

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
              {location && <Meta>{location}</Meta>}
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
              told={told}
            />
          </Section>

          <EmailSection application={application} delivery={delivery} viewerId={viewerId} unsettledAttempt={unsettledAttempt} />

          <Section id="history-title" title="History">
            <StatusHistory events={application.events} viewerId={viewerId} />
          </Section>
        </div>
      </div>
    </>
  );
}
