import { z } from "zod";

/* The registration form for the 2027 convention: its copy, its option
   lists and the schemas that validate it. The option lists are the Google
   Form's, one slug per choice; the database stores slugs, the UI shows
   labels, and "other" pairs with a free-text field. */

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

export function labelFor(options: readonly Option[], value: string | null | undefined) {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? value;
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
    { label: "Venue", value: "Nagaloka, Nagpur, India" },
    { label: "Dates", value: "18 – 21 February 2027" },
    { label: "Language", value: "English / Hindi" },
    { label: "Participants", value: "Approximately 120 in person" },
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
    awards: {
      title: "Award submissions",
      description:
        "These awards recognise and celebrate the valuable contributions of Buddhist content creators in sharing the Buddha's Dharma through digital media. Review the three awards below and submit a public link to your eligible content under the relevant award. All three are optional.",
      items: [
        {
          name: "Audience Choice Award",
          description:
            "Buddhist-related content that meaningfully connects with and inspires audiences. Content must have been published after 10 February 2026. Twenty eligible entries will be shortlisted, and the winner will be selected through a public vote by followers and subscribers.",
        },
        {
          name: "Most Creative Video Award",
          description:
            "An original Buddhist-related video that demonstrates creativity, sincerity, strong storytelling and emotional impact. Creative use of AI tools, lighting, camera work, sound and editing may also be considered. The video must have been produced after 10 February 2026. Shortlisted entries will be presented for public voting.",
        },
        {
          name: "Most Viral Content Award",
          description:
            "Buddhist-related content that has achieved exceptional reach and engagement. Eligible content must have been published between 10 February 2026 and 31 January 2027. Views, likes, comments, shares and other engagement figures will be reviewed and verified by the selection committee.",
        },
      ],
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
const optionalLong = trimmed.max(4000).optional().or(z.literal("")).transform((v) => v || null);
const optionalUrl = trimmed
  .max(1000)
  .optional()
  .or(z.literal(""))
  .transform((v) => v || null)
  .refine((v) => v === null || /^https?:\/\/\S+$/i.test(v), {
    message: "Enter a full link starting with https://",
  });

export const draftSchema = z.object({
  fullName: optionalText,
  organization: optionalText,
  location: optionalText,
  contentTopics: z.array(values(CONTENT_TOPICS)).default([]),
  contentTopicsOther: optionalText,
  targetAudience: values(TARGET_AUDIENCES).optional().or(z.literal("")).transform((v) => v || null),
  targetAudienceOther: optionalText,
  audienceRegion: values(AUDIENCE_REGIONS).optional().or(z.literal("")).transform((v) => v || null),
  audienceRegionOther: optionalText,
  audienceLanguage: values(AUDIENCE_LANGUAGES).optional().or(z.literal("")).transform((v) => v || null),
  audienceLanguageOther: optionalText,
  platforms: z.array(values(PLATFORMS)).default([]),
  platformsOther: optionalText,
  socialLinks: optionalLong,
  awardAudienceChoiceUrl: optionalUrl,
  awardCreativeVideoUrl: optionalUrl,
  awardViralContentUrl: optionalUrl,
});

export type DraftValues = z.infer<typeof draftSchema>;

const REQUIRED = "This answer is required";

export const submitSchema = draftSchema
  .extend({
    fullName: trimmed.min(1, REQUIRED).max(500),
    organization: trimmed.min(1, "Write NA if you are coming as an individual").max(500),
    location: trimmed.min(1, REQUIRED).max(500),
    contentTopics: z.array(values(CONTENT_TOPICS)).min(1, "Choose at least one"),
    targetAudience: z.string().min(1, REQUIRED).pipe(values(TARGET_AUDIENCES)),
    platforms: z.array(values(PLATFORMS)).min(1, "Choose at least one"),
  })
  .superRefine((data, ctx) => {
    const needsOther = (list: readonly string[] | string | null, field: keyof typeof data) => {
      const picked = Array.isArray(list) ? list.includes("other") : list === "other";
      if (picked && !data[field]) {
        ctx.addIssue({ code: "custom", path: [field], message: "Tell us what “Other” is" });
      }
    };
    needsOther(data.contentTopics, "contentTopicsOther");
    needsOther(data.targetAudience, "targetAudienceOther");
    needsOther(data.audienceRegion, "audienceRegionOther");
    needsOther(data.audienceLanguage, "audienceLanguageOther");
    needsOther(data.platforms, "platformsOther");
  });

export type SubmitValues = z.infer<typeof submitSchema>;
export type FieldErrors = Partial<Record<keyof DraftValues | "video" | "form", string[]>>;

/** The form's FormData as the object the schemas read. */
export function formValues(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  const list = (name: string) => formData.getAll(name).filter((v): v is string => typeof v === "string");
  return {
    fullName: text("fullName"),
    organization: text("organization"),
    location: text("location"),
    contentTopics: list("contentTopics"),
    contentTopicsOther: text("contentTopicsOther"),
    targetAudience: text("targetAudience"),
    targetAudienceOther: text("targetAudienceOther"),
    audienceRegion: text("audienceRegion"),
    audienceRegionOther: text("audienceRegionOther"),
    audienceLanguage: text("audienceLanguage"),
    audienceLanguageOther: text("audienceLanguageOther"),
    platforms: list("platforms"),
    platformsOther: text("platformsOther"),
    socialLinks: text("socialLinks"),
    awardAudienceChoiceUrl: text("awardAudienceChoiceUrl"),
    awardCreativeVideoUrl: text("awardCreativeVideoUrl"),
    awardViralContentUrl: text("awardViralContentUrl"),
  };
}
