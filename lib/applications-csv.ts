import "server-only";
import { STATUS_LABEL } from "@/components/admin/status-badge";
import { exportApplications, type ListFilter } from "@/lib/applications";
import { toCsv, type CsvValue } from "@/lib/csv";
import { formatDateTime } from "@/lib/format";
import {
  AUDIENCE_LANGUAGES,
  AUDIENCE_REGIONS,
  CONTENT_TOPICS,
  FORM,
  PLATFORMS,
  TARGET_AUDIENCES,
  listWithOther,
  withOther,
} from "@/lib/registration-2027";

/* The applications list as a CSV file. `filter` takes the same values as
   the list's status pills, so the file holds exactly the rows the admin
   was looking at: everything but drafts by default. Answers are written
   as the detail page shows them (labels, "Other: …"), one row per
   application, dates in the convention's time zone. */

const HEADERS = [
  "Name",
  "Email",
  "Status",
  "Organisation",
  "Location",
  "Social media",
  "Content is about",
  "Target audience",
  "Audience region",
  "Audience language",
  "Platforms",
  "Intro video",
  FORM.sections.awards.items[0].name,
  FORM.sections.awards.items[1].name,
  FORM.sections.awards.items[2].name,
  "Review note",
  "Decided by",
  "Decided at",
  "Notified at",
  "Submitted at",
  "Last edited",
  "Application ID",
] as const;

export async function applicationsCsv(filter: ListFilter) {
  const rows = await exportApplications(filter);
  const csv = toCsv(
    HEADERS,
    rows.map((row): CsvValue[] => [
      row.fullName || row.user.name,
      row.user.email,
      STATUS_LABEL[row.status],
      row.organization,
      row.location,
      row.socialLinks,
      listWithOther(CONTENT_TOPICS, row.contentTopics, row.contentTopicsOther).join("; "),
      withOther(TARGET_AUDIENCES, row.targetAudience, row.targetAudienceOther),
      withOther(AUDIENCE_REGIONS, row.audienceRegion, row.audienceRegionOther),
      withOther(AUDIENCE_LANGUAGES, row.audienceLanguage, row.audienceLanguageOther),
      listWithOther(PLATFORMS, row.platforms, row.platformsOther).join("; "),
      row.videoKey ? "Yes" : "No",
      row.awardAudienceChoiceUrl,
      row.awardCreativeVideoUrl,
      row.awardViralContentUrl,
      row.reviewNote,
      row.decider ? (row.decider.name ?? row.decider.email) : null,
      formatDateTime(row.decidedAt),
      formatDateTime(row.notifiedAt),
      formatDateTime(row.submittedAt),
      formatDateTime(row.updatedAt),
      row.id,
    ]),
  );
  const today = new Date().toISOString().slice(0, 10);
  const filename = `convention-2027-applications${filter === "all" ? "" : `-${filter}`}-${today}.csv`;
  return { csv, filename, count: rows.length };
}
