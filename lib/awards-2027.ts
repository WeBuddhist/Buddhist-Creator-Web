import { z } from "zod";
import { isCountry } from "@/lib/countries";
import { FORM as REGISTRATION_FORM, isWebLink } from "@/lib/registration-2027";

/* The Buddhist Creators Convention Awards 2027: the awards, the copy of the
   awards page and of the nomination form, and the rules a set of
   nominations is checked against. The page is app/(site)/convention/2027/
   awards; the form is its nominate/ route, which needs a session (proxy.ts).

   The awards are the nomination form the team wrote, in its order. The
   photographs for each live in components/awards/photos.ts, so this file
   stays free of image imports and can be read by the server action as it
   is. */

export const AWARDS_2027 = {
  year: 2027,
  title: "Buddhist Creators Convention Awards 2027",
  shortTitle: "Awards 2027",
  path: "/convention/2027/awards",
  nominatePath: "/convention/2027/awards/nominate",
  /** Flip to false to close nominations: the form turns read-only, the
      server refuses changes and the pages say nominations are closed. */
  open: true,
  contact: REGISTRATION_FORM.contact,
} as const;

/* The rule, as the team wrote it. */
export const RULE = {
  title: "One person per category",
  body: "You may nominate in as many categories as you like, but only one person in each. Leave blank any category you do not wish to nominate for.",
} as const;

/* ---------------------------------------------------------------------- */
/* The awards                                                              */
/* ---------------------------------------------------------------------- */

export type AwardSlug =
  | "influencer-of-the-year"
  | "audience-choice"
  | "most-creative-video"
  | "most-viral-content"
  | "best-music"
  | "best-painting"
  | "best-poem"
  | "best-photography";

export type Award = {
  slug: AwardSlug;
  /** The award's full name, as the form and the dashboard give it. */
  title: string;
  /** The words set large on its card, one line each. */
  cardTitle: readonly string[];
  description: string;
  /** A shorter description for the award's card, where it is given. The
      nomination form keeps the full one. */
  cardDescription?: string;
  /** The label of the link field, which says what the link is to. */
  linkLabel: string;
  linkPlaceholder: string;
  /** The field beside the name, if the award has one: a link to their
      social media, required. */
  account?: AccountField;
  /** A second link the award asks for, required, below the first: a video
      of theirs where the first link is to their profile. */
  videoLink?: { label: string; placeholder: string };
  /** Whether the work can be uploaded as a picture instead of linked to.
      Such an award needs the link, the picture, or both. */
  image?: true;
  /** The line at the foot of the card: last year's winner of the same
      award, or that the award is new this year. */
  credit: { kind: "winner"; name: string } | { kind: "new" };
};

export type AccountField = { label: string; placeholder: string };

export type AwardGroup = {
  id: "a" | "b";
  letter: string;
  title: string;
  description?: string;
  awards: readonly Award[];
};

const PROFILE_PLACEHOLDER = "https://www.instagram.com/theirhandle";
const VIDEO_PLACEHOLDER = "https://www.youtube.com/watch?v=…";
const POST_PLACEHOLDER = "https://www.instagram.com/p/…";

const SOCIAL_LINK: AccountField = {
  label: "Link to their social media",
  placeholder: PROFILE_PLACEHOLDER,
};

export const AWARD_GROUPS: readonly AwardGroup[] = [
  {
    id: "a",
    letter: "A",
    title: "Best Social Content",
    description: "Creators who share the Dharma on social media.",
    awards: [
      {
        slug: "influencer-of-the-year",
        title: "Influencer of the Year 2027",
        cardTitle: ["Influencer", "of the Year"],
        description:
          "Awarded to a creator who combines significant digital reach with meaningful spiritual resonance. Assessed on global visibility, audience growth, and the integrity, originality, and authenticity with which they share the Dharma in a contemporary context.",
        cardDescription:
          "Awarded to a creator who combines significant digital reach with meaningful spiritual resonance.",
        linkLabel: "Link to their profile",
        linkPlaceholder: PROFILE_PLACEHOLDER,
        credit: { kind: "winner", name: "Quinthup Pema Bhutia" },
      },
      {
        slug: "audience-choice",
        title: "Audience Choice Award",
        cardTitle: ["Audience", "Choice"],
        description: "For the creator whose work the community loves most.",
        linkLabel: "Link to their profile",
        linkPlaceholder: PROFILE_PLACEHOLDER,
        videoLink: { label: "Link to the video from their social media", placeholder: VIDEO_PLACEHOLDER },
        credit: { kind: "winner", name: "Tashi Chosgon" },
      },
      {
        slug: "most-creative-video",
        title: "Most Creative Video Award",
        cardTitle: ["Most Creative", "Video"],
        description: "For a single video that shares the Dharma in a fresh and imaginative way.",
        linkLabel: "Link to the video",
        linkPlaceholder: VIDEO_PLACEHOLDER,
        account: SOCIAL_LINK,
        credit: { kind: "winner", name: "Tenzin Chime" },
      },
      {
        slug: "most-viral-content",
        title: "Most Viral Content Award",
        cardTitle: ["Most Viral", "Content"],
        description:
          "For Buddhist-related content, assessed on creative use of AI tools, lighting, camera work, storytelling, emotional impact, and sincerity.",
        linkLabel: "Link to the content",
        linkPlaceholder: "https://www.instagram.com/reel/…",
        account: SOCIAL_LINK,
        credit: { kind: "new" },
      },
    ],
  },
  {
    id: "b",
    letter: "B",
    title: "Best Art",
    description: "Creators who share the Dharma through music, art, writing and photography.",
    awards: [
      {
        slug: "best-music",
        title: "Best Music",
        cardTitle: ["Best Music"],
        description:
          "Honours music and songs rooted in the Buddha Dharma, such as chanting, devotional songs, mantras, and modern music inspired by Buddhist teachings.",
        linkLabel: "Link to the music",
        linkPlaceholder: VIDEO_PLACEHOLDER,
        account: SOCIAL_LINK,
        credit: { kind: "new" },
      },
      {
        slug: "best-painting",
        title: "Best Painting / Visual Art",
        cardTitle: ["Best Painting /", "Visual Art"],
        description:
          "Honours paintings and visual art rooted in Buddhist texts. Artworks should show the beauty and diversity of Buddhist scriptures and stories, such as Jataka tales, the life of the Buddha, Dhammapada stories, Bodhisattvas, mandalas and Thangka, in any style, traditional or modern.",
        cardDescription:
          "Honours paintings and visual art rooted in Buddhist texts, in any style, traditional or modern.",
        linkLabel: "Link to the content",
        linkPlaceholder: POST_PLACEHOLDER,
        account: SOCIAL_LINK,
        image: true,
        credit: { kind: "new" },
      },
      {
        slug: "best-poem",
        title: "Best Poem",
        cardTitle: ["Best Poem"],
        description:
          "Honours writing rooted in the Buddha Dharma. Poems and articles should express Buddhist teachings, stories or values (compassion, impermanence, mindfulness, devotion) in a beautiful, clear and meaningful way.",
        cardDescription: "Honours poems and writing rooted in the Buddha Dharma.",
        linkLabel: "Link to the content",
        linkPlaceholder: POST_PLACEHOLDER,
        account: SOCIAL_LINK,
        credit: { kind: "new" },
      },
      {
        slug: "best-photography",
        title: "Best Photography",
        cardTitle: ["Best", "Photography"],
        description:
          "Honours photographs that capture the living spirit of Buddhism. Photos should portray Buddhist rituals and ceremonies (prayers, offerings, chanting, festivals, monastic life, pilgrimage) and people's devotion to the Buddha Dharma (faith, prayer, prostration, lighting lamps, acts of kindness and respect).",
        cardDescription: "Honours photographs that capture the living spirit of Buddhism.",
        linkLabel: "Link to the content",
        linkPlaceholder: POST_PLACEHOLDER,
        account: SOCIAL_LINK,
        image: true,
        credit: { kind: "new" },
      },
    ],
  },
];

export const AWARDS: readonly Award[] = AWARD_GROUPS.flatMap((group) => group.awards);

export function isAwardSlug(value: unknown): value is AwardSlug {
  return AWARDS.some((award) => award.slug === value);
}

export function awardBySlug(slug: string): Award | undefined {
  return AWARDS.find((award) => award.slug === slug);
}

/** The year the credit on a card refers to. */
export const PREVIOUS_YEAR = AWARDS_2027.year - 1;

/* ---------------------------------------------------------------------- */
/* Page copy                                                               */
/* ---------------------------------------------------------------------- */

export const AWARDS_PAGE = {
  eyebrow: `${AWARDS_2027.shortTitle} · Nagpur`,
  /** The second part takes the italic. */
  title: ["Nominate the creators who", "inspire you"],
  /* For search and social cards; the page itself keeps to the title.
     The counts are words, so keep them in step with AWARD_GROUPS. */
  description:
    "Eight awards will be presented at the Buddhist Creators Convention 2027 in Nagpur. Tell us who deserves one: you can nominate creators in different categories, one person in each.",
  action: "Nominate a creator",
  closedNote: "Nominations are closed. Thank you to everyone who took part.",
  steps: [
    {
      title: "Sign in",
      body: "Use Google or Apple. Your nominations belong to your account, so you can come back and change them.",
    },
    RULE,
    {
      title: "Say why",
      body: "For each person, add a link to their work and a few words on why they deserve the award.",
    },
  ],
  categories: {
    kicker: "The categories",
    /** The second part takes the italic. */
    title: ["Two categories,", "eight awards"],
    description: "Choose an award to nominate someone for it.",
  },
  closing: {
    /** The second line takes the golden highlight. */
    title: ["Know a creator", "who deserves it?"],
    body: "Nominating takes a few minutes, and you can change your nominations until they close.",
  },
} as const;

export const NOMINATION_FORM = {
  eyebrow: AWARDS_2027.shortTitle,
  title: "Nominate creators",
  intro: [
    `This is the nomination form for the ${AWARDS_2027.title}, Nagpur. You can nominate creators in different categories.`,
  ],
  about: { title: "About you" },
} as const;

/* ---------------------------------------------------------------------- */
/* Validation                                                              */
/* ---------------------------------------------------------------------- */

/* The limits, repeated in lib/db/schema.ts's checks. */
export const NOMINATION_LIMITS = {
  nominatorName: 200,
  nominatorCountry: 100,
  nomineeName: 200,
  account: 1000,
  link: 1000,
  reason: 2000,
} as const;

/* An uploaded picture of the work. The browser scales it down and
   compresses it before sending, so it fits a Server Action's 1 MB body with
   the rest of the form; the server checks the bytes again. */
export const ARTWORK = {
  /** The longest side, in pixels, it is scaled down to. */
  longSide: 1600,
  /** The most it may weigh once compressed. */
  maxBytes: 800 * 1024,
  /** The largest file the browser will try to read. */
  sourceMaxBytes: 25 * 1024 * 1024,
} as const;

export const ENTRY_FIELDS = ["nomineeName", "account", "link", "videoLink", "reason"] as const;
export type EntryField = (typeof ENTRY_FIELDS)[number];

/** The name a field of one award's nomination has in the form, and the key
    its error is filed under: "audience-choice.link". */
export const entryKey = (slug: AwardSlug, field: ErrorField) => `${slug}.${field}` as const;

export type NominationValues = {
  nomineeName: string;
  account: string | null;
  /** Null only for an award that takes a picture instead. */
  link: string | null;
  videoLink: string | null;
  reason: string;
};

export type BallotValues = {
  nominatorName: string;
  nominatorCountry: string;
  /** Only the awards someone was nominated for, in the order of AWARDS. */
  nominations: Partial<Record<AwardSlug, NominationValues>>;
};

/** What an error can be filed under within one award: its fields, and the
    picture of an award that takes one. */
export type ErrorField = EntryField | "image";

export type BallotErrors = Partial<
  Record<"nominatorName" | "nominatorCountry" | "nominations" | "form" | `${AwardSlug}.${ErrorField}`, string>
>;

/* Text as a form means it: a textarea posts its line breaks as CRLF but
   counts each as one character against maxLength, so they are folded back
   to one first, and Postgres refuses a NUL. */
const text = z
  .string()
  .transform((value) => value.replace(/\r\n?/g, "\n").replaceAll("\0", "").trim());

/* A link as people paste it: "instagram.com/name" is as good as the full
   address, so a missing scheme is added rather than refused. */
const link = text
  .pipe(z.string().min(1, "Add the link").max(NOMINATION_LIMITS.link, "This link is too long"))
  .transform((value) => (/^https?:\/\//i.test(value) ? value : `https://${value}`))
  .refine(isWebLink, { message: "Enter the full link, like https://www.youtube.com/@theirchannel" });

/* A link that may be left out, for an award that takes a picture instead. */
const optionalLink = text.transform((value) => value || null).pipe(link.nullable());

/* A field the award does not ask for is stored as nothing, whatever was
   posted under its name. */
const absent = z.unknown().transform(() => null);

/** The checks for one award's nomination, which depend on the fields the
    award asks for. */
function entrySchema(award: Award) {
  return z.object({
    nomineeName: text.pipe(
      z
        .string()
        .min(1, "Enter the name of the person you nominate")
        .max(NOMINATION_LIMITS.nomineeName, `Keep the name under ${NOMINATION_LIMITS.nomineeName} characters`),
    ),
    account: award.account ? link : absent,
    link: award.image ? optionalLink : link,
    videoLink: award.videoLink ? link : absent,
    reason: text.pipe(
      z
        .string()
        .min(1, "Tell us why you nominate them")
        .max(NOMINATION_LIMITS.reason, `Keep this under ${NOMINATION_LIMITS.reason} characters`),
    ),
  });
}

const nominatorSchema = z.object({
  nominatorName: text.pipe(
    z
      .string()
      .min(1, "Enter your name")
      .max(NOMINATION_LIMITS.nominatorName, `Keep your name under ${NOMINATION_LIMITS.nominatorName} characters`),
  ),
  nominatorCountry: text.pipe(
    z.string().min(1, "Choose your country").refine(isCountry, { message: "Choose your country from the list" }),
  ),
});

/** The awards the form says were chosen, in the order of AWARDS: each open
    award on the form posts its slug as `awards`. */
function chosenAwards(formData: FormData): AwardSlug[] {
  const posted = new Set(formData.getAll("awards"));
  return AWARDS.map((award) => award.slug).filter((slug) => posted.has(slug));
}

const read = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

/** A posted set of nominations, checked. An award that was opened but left
    entirely empty counts as left blank; one filled in only in part is
    refused, field by field. At least one award must have a nomination.

    `hasImage` says whether an award that takes a picture will have one
    once saved: the server works that out from the upload and from what is
    stored, which this file cannot see. */
export function parseBallot(
  formData: FormData,
  hasImage: (slug: AwardSlug) => boolean = () => false,
): { ok: true; values: BallotValues } | { ok: false; errors: BallotErrors } {
  const errors: BallotErrors = {};

  const nominator = nominatorSchema.safeParse({
    nominatorName: read(formData, "nominatorName"),
    nominatorCountry: read(formData, "nominatorCountry"),
  });
  if (!nominator.success) {
    for (const issue of nominator.error.issues) {
      const key = issue.path[0] as "nominatorName" | "nominatorCountry";
      errors[key] ??= issue.message;
    }
  }

  const nominations: BallotValues["nominations"] = {};
  for (const slug of chosenAwards(formData)) {
    const award = awardBySlug(slug)!;
    const raw = Object.fromEntries(ENTRY_FIELDS.map((field) => [field, read(formData, entryKey(slug, field))]));
    const picture = Boolean(award.image) && hasImage(slug);
    if (!picture && Object.values(raw).every((value) => !value.trim())) continue;
    const entry = entrySchema(award).safeParse(raw);
    // Neither the link nor the picture: said on the link, with the rest.
    const nothingToSee = Boolean(award.image) && !picture && !raw.link.trim();
    if (nothingToSee) errors[entryKey(slug, "link")] = "Add a link or upload the image";
    if (entry.success && !nothingToSee) {
      nominations[slug] = entry.data;
    } else if (!entry.success) {
      for (const issue of entry.error.issues) {
        const key = entryKey(slug, issue.path[0] as EntryField);
        errors[key] ??= issue.message;
      }
    }
  }

  const anyEntryErrors = Object.keys(errors).some((key) => key.includes("."));
  if (!anyEntryErrors && Object.keys(nominations).length === 0) {
    errors.nominations = "Nominate someone in at least one category";
  }

  if (!nominator.success || Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, values: { ...nominator.data, nominations } };
}
