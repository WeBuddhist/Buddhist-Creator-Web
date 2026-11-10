import { z } from "zod";
import { isCountry, isStateOf } from "@/lib/countries";

/* The registration form for the 2027 convention: its copy, its option
   lists and the schemas that validate it. The option lists are the Google
   Form's, one slug per choice; the database stores slugs, the UI shows
   labels, and "other" pairs with a free-text field. Every question with a
   list takes any number of answers. */

export type Option = { readonly value: string; readonly label: string };

export const CONTENT_TOPICS = [
  { value: "dharma-talks", label: "Dharma Talks & Teachings" },
  { value: "meditation-guides", label: "Meditation & Mindfulness Guides" },
  { value: "philosophy-explainers", label: "Buddhist Philosophy Explainers" },
  { value: "sutra-reflections", label: "Sutra/Scripture Reflections" },
  { value: "monastic-life", label: "Monastic Life & Sangha Stories" },
  { value: "buddhist-art", label: "Buddhist Art" },
  { value: "chanting-music", label: "Chanting & Music" },
  { value: "pilgrimage-vlogs", label: "Pilgrimage & Temple Vlogs" },
  { value: "jataka-tales", label: "Jataka Tales" },
  { value: "daily-practice", label: "Daily Buddhist Practice" },
  { value: "buddhist-history", label: "Buddhist History" },
  { value: "personal-journey", label: "Personal journey" },
  { value: "master-clips", label: "Buddhist Master Clips" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

export const TARGET_AUDIENCES = [
  { value: "new-practitioners", label: "New practitioners just beginning their journey" },
  { value: "sangha-members", label: "Long-time Sangha members with established practice" },
  { value: "youth", label: "Youth and teenagers" },
  { value: "young-adults", label: "Young adults and college students" },
  { value: "families", label: "Families with children" },
  { value: "seniors", label: "Seniors and elders" },
  { value: "spiritual-seekers", label: "General spiritual seekers exploring different paths" },
  { value: "meditation-wellbeing", label: "People interested in meditation for health and well-being" },
  { value: "grief-transitions", label: "Individuals going through grief, loss, or major life transitions" },
  { value: "caregivers", label: "Healthcare workers, caregivers, and helping professionals" },
  { value: "educators", label: "Educators and teachers" },
  { value: "workplace", label: "Workplace and professional groups (mindfulness at work)" },
  { value: "activists", label: "Activists and those engaged in social or environmental causes" },
  { value: "monastics-teachers", label: "Monastics and Dharma teachers" },
  { value: "recovery", label: "People in recovery (addiction, trauma, or illness)" },
  { value: "interfaith", label: "Interfaith or multi-tradition communities" },
  { value: "online-international", label: "Online or international participants" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

export const AUDIENCE_REGIONS = [
  { value: "north-america", label: "North America" },
  { value: "central-america", label: "Central America and the Caribbean" },
  { value: "south-america", label: "South America" },
  { value: "europe", label: "Europe" },
  { value: "south-asia", label: "South Asia (e.g., India, Nepal, Sri Lanka, Bangladesh)" },
  { value: "southeast-asia", label: "Southeast Asia (e.g., Vietnam, Thailand, Myanmar, Cambodia, Indonesia)" },
  { value: "east-asia", label: "East Asia (e.g., China, Japan, Korea, Taiwan)" },
  { value: "himalayan", label: "Central Asia and the Himalayan region (e.g., Tibet, Bhutan, Mongolia)" },
  { value: "oceania", label: "Australia, New Zealand, and the Pacific Islands" },
  { value: "global", label: "Global / online audience with no single region" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

export const AUDIENCE_LANGUAGES = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "nepali", label: "Nepali" },
  { value: "sinhala", label: "Sinhala" },
  { value: "vietnamese", label: "Vietnamese" },
  { value: "thai", label: "Thai" },
  { value: "burmese", label: "Burmese" },
  { value: "mandarin", label: "Mandarin Chinese" },
  { value: "japanese", label: "Japanese" },
  { value: "korean", label: "Korean" },
  { value: "tibetan", label: "Tibetan" },
  { value: "multilingual", label: "Multilingual audience" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

export const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

export type PlatformValue = (typeof PLATFORMS)[number]["value"];

/** One profile link per chosen platform, keyed by the platform's slug. */
export type PlatformLinks = Partial<Record<PlatformValue, string>>;

/* What the link field under each chosen platform shows while empty. */
export const PLATFORM_LINK_PLACEHOLDERS: Record<PlatformValue, string> = {
  instagram: "https://www.instagram.com/yourhandle",
  youtube: "https://www.youtube.com/@yourchannel",
  facebook: "https://www.facebook.com/yourpage",
  tiktok: "https://www.tiktok.com/@yourhandle",
  other: "https://",
};

/** What a platform's link points at, as it reads after "Link to": "your
    YouTube channel". Shared by the field's name and its error message. */
export function platformLinkTarget(platform: string) {
  if (platform === "other") return "your profile on this platform";
  return `your ${labelFor(PLATFORMS, platform)} ${platform === "youtube" ? "channel" : "profile"}`;
}

export function labelFor(options: readonly Option[], value: string | null | undefined) {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? value;
}

/** Where the applicant is, on one line: "Himachal Pradesh, India". */
export function locationLabel(state: string | null, country: string | null) {
  return [state, country].filter(Boolean).join(", ") || null;
}

/** A multi-choice answer as labels; "other" shows the free text. */
export function listWithOther(options: readonly Option[], values: string[] | null, other: string | null): string[] {
  if (!values?.length) return [];
  return values
    .map((value) => (value === "other" && other ? `Other: ${other}` : labelFor(options, value)))
    .filter((v): v is string => Boolean(v));
}

/** The chosen platforms in the order picked, each with its label and link. */
export function platformsWithLinks(
  values: string[] | null,
  other: string | null,
  links: Record<string, string | undefined> | null,
): { value: string; label: string; url: string | null }[] {
  return (values ?? []).map((value) => ({
    value,
    label: (value === "other" && other ? `Other: ${other}` : labelFor(PLATFORMS, value)) ?? value,
    url: links?.[value] || null,
  }));
}

/* Video limits. The server checks type and size; the browser also reads
   the length before uploading, so a too-long clip is refused before any
   bytes move. */
export const VIDEO_MAX_SECONDS = 120;
// Slack for container rounding and encoder padding, as the backend allows.
export const VIDEO_DURATION_TOLERANCE_SECONDS = 2;
export const VIDEO_MAX_BYTES = 120 * 1024 * 1024;
export const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

/* Copy. */
export const FORM = {
  title: "Register for the 2027 Buddhist Creators Convention",
  eyebrow: "Registration",
  intro: [
    "The 2nd Buddhist Creator Convention will bring together Buddhist content creators, content buyers, monastics, lay practitioners, monasteries, institutes and Buddhist organisations from the Theravada, Mahayana and Vajrayana traditions.",
    "Participation is merit-based, with careful consideration given to balanced representation across gender, Buddhist traditions and countries. Everything you share here is used only for the selection process.",
  ],
  facts: [
    { icon: "venue", label: "Venue", value: "Nagaloka, Nagpur, India" },
    { icon: "dates", label: "Dates", value: "18 – 21 February 2027" },
    { icon: "language", label: "Language", value: "English / Hindi" },
    { icon: "participants", label: "Participants", value: "Approximately 120 in person" },
    { icon: "fee", label: "Registration fee", value: "₹3,000, covering meals and accommodation for all 4 days" },
    { icon: "scholarships", label: "Scholarships", value: "Available for ordained Sangha" },
  ],
  contact: "hello@buddhistcreators.com",
  sections: {
    personal: {
      title: "Personal details",
      description: "All the information you provide will only be used for the selection process.",
    },
    journey: { title: "Your content creation journey" },
    video: {
      title: "Introduce yourself",
      description:
        "Upload a short video, up to 2 minutes, covering: a) a quick introduction about yourself, b) why you want to be part of the Buddhist Content Creators Convention 2027 and what you're bringing to it, and c) your expectations from this gathering.",
    },
  },
} as const;

/* Validation. A draft accepts anything partially filled in; a submission
   needs every required answer. Both read the same field names, which are
   the form's input names and the row's column names. */

const values = <T extends readonly Option[]>(options: T) =>
  z.enum(options.map((option) => option.value) as [T[number]["value"], ...T[number]["value"][]]);

const trimmed = z.string().trim();
const optionalText = trimmed.max(500).optional().or(z.literal("")).transform((v) => v || null);

/* A link as people paste it: "instagram.com/name" is as good as the full
   address, so a missing scheme is added rather than refused. A bare handle
   or a name is not a link. */
function isWebLink(value: string) {
  if (/\s/.test(value) || !URL.canParse(value)) return false;
  const { protocol, hostname } = new URL(value);
  return (protocol === "https:" || protocol === "http:") && /^[^.]+(\.[^.]+)+$/.test(hostname);
}
const optionalLink = trimmed
  .max(1000)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : null))
  .refine((v) => v === null || isWebLink(v), {
    message: "Enter the full link, like https://www.youtube.com/@yourchannel",
  });

/* One optional link per platform; only the filled ones are kept. */
const platformLinks = z
  .object({
    instagram: optionalLink,
    youtube: optionalLink,
    facebook: optionalLink,
    tiktok: optionalLink,
    other: optionalLink,
  } satisfies Record<PlatformValue, typeof optionalLink>)
  .transform((links) => {
    const filled: PlatformLinks = {};
    for (const { value } of PLATFORMS) {
      const link = links[value];
      if (link) filled[value] = link;
    }
    return filled;
  });

/* The country is one from the list and the state one of that country's:
   "India" with "Texas" is refused, as is a state with no country. The form
   only offers valid pairs; this is the same rule for anything that did not
   come through the form. */
function checkPlace(data: { state: string | null; country: string | null }, ctx: z.RefinementCtx) {
  const { state, country } = data;
  if (country && !isCountry(country)) {
    ctx.addIssue({ code: "custom", path: ["country"], message: "Choose a country from the list" });
  } else if (state && !country) {
    ctx.addIssue({ code: "custom", path: ["state"], message: "Choose the country first" });
  } else if (state && country && !isStateOf(country, state)) {
    ctx.addIssue({ code: "custom", path: ["state"], message: `Choose a state in ${country}` });
  }
}

const answers = z.object({
  fullName: optionalText,
  organization: optionalText,
  state: optionalText,
  country: optionalText,
  contentTopics: z.array(values(CONTENT_TOPICS)).default([]),
  contentTopicsOther: optionalText,
  targetAudience: z.array(values(TARGET_AUDIENCES)).default([]),
  targetAudienceOther: optionalText,
  audienceRegion: z.array(values(AUDIENCE_REGIONS)).default([]),
  audienceRegionOther: optionalText,
  audienceLanguage: z.array(values(AUDIENCE_LANGUAGES)).default([]),
  audienceLanguageOther: optionalText,
  platforms: z.array(values(PLATFORMS)).default([]),
  platformsOther: optionalText,
  platformLinks,
});

export const draftSchema = answers.superRefine(checkPlace);

export type DraftValues = z.infer<typeof draftSchema>;

const REQUIRED = "This answer is required";

export const submitSchema = answers
  .extend({
    fullName: trimmed.min(1, REQUIRED).max(500),
    organization: trimmed.min(1, "Write N/A if you are coming as an individual").max(500),
    state: trimmed.min(1, REQUIRED).max(500),
    country: trimmed.min(1, REQUIRED).max(500),
    contentTopics: z.array(values(CONTENT_TOPICS)).min(1, "Choose at least one"),
    targetAudience: z.array(values(TARGET_AUDIENCES)).min(1, "Choose at least one"),
    platforms: z.array(values(PLATFORMS)).min(1, "Choose at least one"),
  })
  .superRefine((data, ctx) => {
    checkPlace(data, ctx);
    const needsOther = (list: readonly string[], field: keyof typeof data) => {
      if (list.includes("other") && !data[field]) {
        ctx.addIssue({ code: "custom", path: [field], message: "Tell us what “Other” is" });
      }
    };
    needsOther(data.contentTopics, "contentTopicsOther");
    needsOther(data.targetAudience, "targetAudienceOther");
    needsOther(data.audienceRegion, "audienceRegionOther");
    needsOther(data.audienceLanguage, "audienceLanguageOther");
    needsOther(data.platforms, "platformsOther");
    // Every chosen platform comes with the link to the profile on it.
    for (const platform of data.platforms) {
      if (!data.platformLinks[platform]) {
        ctx.addIssue({
          code: "custom",
          path: ["platformLinks", platform],
          message: `Add the link to ${platformLinkTarget(platform)}`,
        });
      }
    }
  });

export type SubmitValues = z.infer<typeof submitSchema>;
export type FieldErrors = Partial<
  Record<keyof DraftValues | `platformLinks.${PlatformValue}` | "video" | "form", string[]>
>;

/** A failed parse as messages per field. A platform's link keeps its own
    key, "platformLinks.youtube", so the message lands under that field. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const [field, sub] = issue.path;
    const key =
      field === "platformLinks" && typeof sub === "string" ? `platformLinks.${sub}` : String(field ?? "form");
    (errors[key] ??= []).push(issue.message);
  }
  return errors as FieldErrors;
}

/** The form's FormData as the object the schemas read. */
export function formValues(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  const list = (name: string) => formData.getAll(name).filter((v): v is string => typeof v === "string");
  const platforms = list("platforms");
  return {
    fullName: text("fullName"),
    organization: text("organization"),
    state: text("state"),
    country: text("country"),
    contentTopics: list("contentTopics"),
    contentTopicsOther: text("contentTopicsOther"),
    targetAudience: list("targetAudience"),
    targetAudienceOther: text("targetAudienceOther"),
    audienceRegion: list("audienceRegion"),
    audienceRegionOther: text("audienceRegionOther"),
    audienceLanguage: list("audienceLanguage"),
    audienceLanguageOther: text("audienceLanguageOther"),
    platforms,
    platformsOther: text("platformsOther"),
    // Only the links of platforms still chosen: unticking one drops its link.
    platformLinks: Object.fromEntries(
      PLATFORMS.filter(({ value }) => platforms.includes(value)).map(({ value }) => [
        value,
        text(`platformLinks.${value}`),
      ]),
    ),
  };
}
