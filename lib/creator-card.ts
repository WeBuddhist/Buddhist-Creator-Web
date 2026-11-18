import { z } from "zod";
import { isCountry } from "@/lib/countries";
import { formatCount } from "@/lib/format";
import { CONTENT_TOPICS, isWebLink, labelFor, type Option } from "@/lib/registration-2027";

/* The creator card: its copy, its option lists and the schema that
   validates a creator's own submission. No server imports, so the form and
   the card itself can use it in the browser.

   The database stores slugs and the UI shows labels, as on the
   registration form; "other" pairs with a free-text field. The table
   (lib/db/schema.ts) lets almost everything be empty, because the team
   also makes cards for creators whose details it only partly has. What is
   required here is what a creator must give when sending their own card
   for review. */

export const CARD_PATH = "/creator-card";

/** The longest note a claimant can send with a claim. */
export const CLAIM_NOTE_MAX = 1000;

export const CARD_NAME_MAX = 80;
export const CARD_TAGLINE_MAX = 140;
const OTHER_MAX = 120;
const LINK_MAX = 1000;

export const CREATOR_TYPES = [
  { value: "monastic", label: "Monastic" },
  { value: "lay-practitioner", label: "Lay practitioner" },
  { value: "organization", label: "Organization" },
  { value: "teacher", label: "Teacher" },
] as const satisfies readonly Option[];

/* The slugs the registration form already uses, where a language is on
   both lists. */
export const CARD_LANGUAGES = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "marathi", label: "Marathi" },
  { value: "nepali", label: "Nepali" },
  { value: "tibetan", label: "Tibetan" },
  { value: "dzongkha", label: "Dzongkha" },
  { value: "sinhala", label: "Sinhala" },
  { value: "bengali", label: "Bengali" },
  { value: "tamil", label: "Tamil" },
  { value: "burmese", label: "Burmese" },
  { value: "thai", label: "Thai" },
  { value: "khmer", label: "Khmer" },
  { value: "vietnamese", label: "Vietnamese" },
  { value: "mandarin", label: "Mandarin Chinese" },
  { value: "japanese", label: "Japanese" },
  { value: "korean", label: "Korean" },
  { value: "mongolian", label: "Mongolian" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

/* What a creator makes: the registration form's own list, so a card and an
   application describe content in the same words. */
export const CARD_CONTENT_TYPES = CONTENT_TOPICS;

/* Where a creator publishes. The places with an `audience` come first: for
   those the card also keeps how many people follow the creator there,
   under the name the place itself gives them. Creators are ranked on those
   numbers added together. Nobody types them: they are read from the place
   itself every month (lib/follower-refresh.ts). */
export const CARD_SOCIALS = [
  {
    value: "youtube",
    label: "YouTube",
    placeholder: "https://www.youtube.com/@yourchannel",
    audience: "Subscribers",
  },
  {
    value: "instagram",
    label: "Instagram",
    placeholder: "https://www.instagram.com/yourhandle",
    audience: "Followers",
  },
  { value: "tiktok", label: "TikTok", placeholder: "https://www.tiktok.com/@yourhandle", audience: "Followers" },
  {
    value: "facebook",
    label: "Facebook",
    placeholder: "https://www.facebook.com/yourpage",
    audience: "Followers",
  },
  { value: "x", label: "X", placeholder: "https://x.com/yourhandle" },
  { value: "website", label: "Website", placeholder: "https://" },
] as const satisfies readonly (Option & { placeholder: string; audience?: string })[];

export type CardSocial = (typeof CARD_SOCIALS)[number]["value"];

/** One link per place the creator publishes, keyed by its slug. */
export type CardSocials = Partial<Record<CardSocial, string>>;

type CountedSocialOption = Extract<(typeof CARD_SOCIALS)[number], { audience: string }>;

/** The places a follower count is kept for. */
export const COUNTED_SOCIALS = CARD_SOCIALS.filter((social): social is CountedSocialOption => "audience" in social);

export type CountedSocial = CountedSocialOption["value"];

/** How many people follow the creator in each counted place. Null where
    the card has no figure. */
export type CardFollowers = Record<CountedSocial, number | null>;

/** No real account is near this; a figure past it is not taken. */
export const CARD_FOLLOWERS_MAX = 1_000_000_000;

/* The site each place's link has to be on. A website can be anywhere. */
const SOCIAL_SITES: Partial<Record<CardSocial, readonly string[]>> = {
  youtube: ["youtube.com"],
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com"],
  facebook: ["facebook.com", "fb.com"],
  x: ["x.com", "twitter.com"],
};

/** The host as people mean it: "m.facebook.com" is facebook.com. */
const siteOf = (url: URL) => url.hostname.toLowerCase().replace(/^(?:www|m|mobile|web)\./, "");

/** Whether a link is on the site its place names. */
export function linkFitsPlace(slug: CardSocial, link: string) {
  const sites = SOCIAL_SITES[slug];
  if (!sites) return true;
  return URL.canParse(link) && sites.includes(siteOf(new URL(link)));
}

/** A link in the form two links are compared in: the same account written
    two ways ("https://instagram.com/Name" and
    "https://www.instagram.com/name/?hl=en") gives the same key. Follower
    readings are kept under it, so one account's figures are never set
    beside another's. A YouTube channel id and a Facebook share code keep
    their capitals, which are part of them. */
export function socialLinkKey(slug: CardSocial, link: string) {
  const text = link.trim();
  if (!URL.canParse(text)) return text.toLowerCase();
  const url = new URL(text);
  const path = url.pathname.replace(/\/+$/, "");
  const exact = (slug === "youtube" && /^\/channel\//i.test(path)) || (slug === "facebook" && /^\/share\//i.test(path));
  const id = slug === "facebook" ? url.searchParams.get("id") : null;
  return `${siteOf(url)}${exact ? path : path.toLowerCase()}${id ? `?id=${id}` : ""}`;
}

/** How a counted link names its account to the service that reads it. */
export type SocialAccount =
  | { by: "handle"; handle: string }
  /** A YouTube channel id, "UC…". */
  | { by: "channel"; channelId: string }
  /** A YouTube name from before handles: youtube.com/user/name. */
  | { by: "user"; username: string }
  /** Facebook is read by the page's address. */
  | { by: "url"; url: string };

function safeDecode(part: string) {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

/* The first parts of an Instagram address that are not an account. */
const INSTAGRAM_PAGES = new Set(["p", "reel", "reels", "tv", "stories", "explore", "accounts", "direct"]);

/** The account a counted link is for, or null when the link does not name
    one: a post, a search, or a YouTube address of the old "/c/name" kind,
    which YouTube's own API cannot look up. */
export function socialAccount(slug: CountedSocial, link: string): SocialAccount | null {
  if (!linkFitsPlace(slug, link)) return null;
  const url = new URL(link);
  const [first = "", second = ""] = url.pathname.split("/").filter(Boolean);
  switch (slug) {
    case "youtube": {
      // A handle may be in any script, which the address percent-encodes.
      const handle = /^@/.test(first) && safeDecode(first).slice(1);
      if (handle && /^[^\s/@]+$/.test(handle)) return { by: "handle", handle };
      if (first === "channel" && /^UC[\w-]{22}$/.test(second)) return { by: "channel", channelId: second };
      if (first === "user" && second) return { by: "user", username: safeDecode(second) };
      return null;
    }
    case "instagram":
      return /^[\w.]{1,30}$/.test(first) && !INSTAGRAM_PAGES.has(first.toLowerCase())
        ? { by: "handle", handle: first.toLowerCase() }
        : null;
    case "tiktok":
      return /^@[\w.]{2,}$/.test(first) ? { by: "handle", handle: first.slice(1).toLowerCase() } : null;
    case "facebook": {
      if (!first) return null;
      // The address without what a share adds to it; a profile.php
      // address keeps its id, which is the account.
      const id = url.searchParams.get("id");
      return { by: "url", url: `https://www.facebook.com${url.pathname}${id ? `?id=${encodeURIComponent(id)}` : ""}` };
    }
  }
}

/** The counts a card has, in the list's order, as the review page prints
    them. */
export function cardAudiences(followers: Partial<Record<CountedSocial, number | null>> | null | undefined) {
  return COUNTED_SOCIALS.flatMap(({ value, label, audience }) => {
    const count = followers?.[value];
    return count == null ? [] : [{ value, label: `${label} ${audience.toLowerCase()}`, count: formatCount(count) }];
  });
}

/* The card's photo. By default it is the picture from the creator's
   sign-in account; a creator may upload their own instead. The browser
   crops an upload to a square, scales it down and compresses it before it
   is sent (components/creator-card/photo.ts), as the backend's clients do
   for chat media, so the server only checks what arrives: one small WebP
   or JPEG. The limit leaves room under the 1 MB a server action accepts. */
export const CARD_PHOTO_SIDE = 512;
export const CARD_PHOTO_MAX_BYTES = 512 * 1024;
/** The largest file the browser will try to read and shrink. */
export const CARD_PHOTO_SOURCE_MAX_BYTES = 20 * 1024 * 1024;

export type CardPhotoType = { contentType: "image/webp" | "image/jpeg"; extension: "webp" | "jpg" };

/** What an uploaded photo's own first bytes say it is, or null for
    anything but a WebP or a JPEG. The type the browser declared is not
    taken on trust. */
export function cardPhotoType(bytes: Uint8Array): CardPhotoType | null {
  const at = (offset: number, text: string) =>
    [...text].every((char, index) => bytes[offset + index] === char.charCodeAt(0));
  if (bytes.length >= 12 && at(0, "RIFF") && at(8, "WEBP")) return { contentType: "image/webp", extension: "webp" };
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  return null;
}

/** The address to load a card photo from. Google hands out its account
    pictures 96 pixels wide ("…=s96-c"), which is soft at the card's size
    on a sharp screen; the same address asks for a larger one by changing
    that number. Every other address is used as it is. */
export function cardPhotoSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!URL.canParse(url) || !new URL(url).hostname.endsWith(".googleusercontent.com")) return url;
  return url.replace(/=s\d+(-c)?$/, "=s512-c");
}

/* A card the team makes for a creator it knows takes its picture from
   the creator's own public profile. Those are kept apart in the bucket
   from the photos creators upload, so the dashboard can say which kind a
   card has. The card shows both the same way, as a circle. */
export const PROFILE_PICTURE_PREFIX = "creator-cards/profile-pictures/";

/** Whether the photo stored under `photoKey` is one the team took from the
    creator's public profile. */
export function isProfilePicture(photoKey: string | null | undefined) {
  return photoKey?.startsWith(PROFILE_PICTURE_PREFIX) ?? false;
}

/** What the card shows. Everything but the name can be missing. */
export type CardContent = {
  /** Where the browser loads the photo from: a presigned URL for an
      upload, the sign-in account's picture otherwise, or nothing. */
  photoUrl?: string | null;
  displayName: string;
  country: string | null;
  creatorType: string | null;
  languages: string[] | null;
  languagesOther: string | null;
  contentTypes: string[] | null;
  contentTypesOther: string | null;
  tagline: string | null;
  socials: Record<string, string | undefined>;
  /** The follower counts added together. The card shows it once it is
      above zero: "0 followers" tells a reader nothing. */
  totalFollowers?: number | null;
};

/** A multi-choice answer as the card prints it: labels, in the list's own
    order, with "Other" replaced by what the creator wrote. */
export function cardLabels(options: readonly Option[], values: string[] | null, other: string | null): string[] {
  if (!values?.length) return [];
  return options
    .filter((option) => values.includes(option.value))
    .map((option) => (option.value === "other" ? other?.trim() || null : option.label))
    .filter((label): label is string => Boolean(label));
}

export function creatorTypeLabel(value: string | null) {
  return labelFor(CREATOR_TYPES, value);
}

/** The links a card has, in the list's order. */
export function cardLinks(socials: Record<string, string | undefined> | null) {
  return CARD_SOCIALS.flatMap(({ value, label }) => {
    const url = socials?.[value]?.trim();
    return url ? [{ value, label, url }] : [];
  });
}

/* Copy. */
export const CARD_FORM = {
  eyebrow: "Creator card",
  title: "Create your creator card",
  intro:
    "A creator card says who you are, what you make and where to find it. Fill it in and send it to our team; we read every card before it is approved.",
  contact: "hello@buddhistcreators.com",
} as const;

/* ---------------------------------------------------------------------- */
/* Validation                                                              */
/* ---------------------------------------------------------------------- */

const REQUIRED = "This answer is required";
const CHOOSE = "Choose at least one";

const slugs = <T extends readonly Option[]>(options: T) =>
  options.map((option) => option.value) as [T[number]["value"], ...T[number]["value"][]];

/* One line of text as the card prints it: no line breaks, no runs of
   spaces. Postgres refuses a NUL in text. */
const line = z.string().transform((value) => value.replaceAll("\0", "").replace(/\s+/g, " ").trim());
const optionalLine = (max: number) =>
  line.pipe(z.string().max(max, `Keep this under ${max} characters`)).transform((value) => value || null);

/* A link as people paste it: "instagram.com/name" is as good as the full
   address, so a missing scheme is added rather than refused. Only http and
   https get through, since these links are shown on the card. */
const optionalLink = z
  .string()
  .trim()
  .max(LINK_MAX, "This link is too long")
  .transform((value) => (value ? (/^https?:\/\//i.test(value) ? value : `https://${value}`) : null))
  .refine((value) => value === null || isWebLink(value), {
    message: "This is not a link we can open. Paste the full address of the page.",
  });

/* The link for one place. It has to be on that place's site, and where a
   follower count is kept it has to name the account, since the count is
   read from it. The link is checked and kept as it was written, never
   rewritten: a stored link must compare equal to itself on the next save,
   or an untouched card would be sent back for review. */
const linkFor = (social: (typeof CARD_SOCIALS)[number], whose: "your" | "their" = "your") =>
  optionalLink.superRefine((value, ctx) => {
    if (value === null) return;
    if (!linkFitsPlace(social.value, value)) {
      ctx.addIssue({ code: "custom", message: `This is not a ${social.label} link. Paste ${whose} ${social.label} address here.` });
    } else if ("audience" in social && !socialAccount(social.value, value)) {
      ctx.addIssue({
        code: "custom",
        message: `Paste the address of ${whose} ${social.label} ${social.value === "youtube" ? "channel" : "profile"}, like ${social.placeholder}`,
      });
    }
  });

/* The links, one for each place: every one checked, only the filled ones
   kept, and at least one asked for. `whose` and `none` word the messages
   for who is typing. */
const linksFor = (whose: "your" | "their", none: string) =>
  z
    .object(
      Object.fromEntries(CARD_SOCIALS.map((social) => [social.value, linkFor(social, whose)])) as Record<
        CardSocial,
        ReturnType<typeof linkFor>
      >,
    )
    .transform((links) => {
      // Only the filled ones are kept.
      const filled: CardSocials = {};
      for (const { value } of CARD_SOCIALS) {
        const link = links[value];
        if (link) filled[value] = link;
      }
      return filled;
    })
    .refine((links) => Object.keys(links).length > 0, none);

const unique = <T>(list: T[]) => [...new Set(list)];
const includesOther = (list: unknown) => Array.isArray(list) && list.includes("other");

export const cardSchema = z
  .object({
    displayName: line.pipe(
      z.string().min(1, REQUIRED).max(CARD_NAME_MAX, `Keep your name under ${CARD_NAME_MAX} characters`),
    ),
    country: z.string().trim().min(1, "Choose your country").refine(isCountry, "Choose a country from the list"),
    creatorType: z.enum(slugs(CREATOR_TYPES), "Choose the one that fits best"),
    languages: z.array(z.enum(slugs(CARD_LANGUAGES))).min(1, CHOOSE).transform(unique),
    languagesOther: optionalLine(OTHER_MAX),
    contentTypes: z.array(z.enum(slugs(CARD_CONTENT_TYPES))).min(1, CHOOSE).transform(unique),
    contentTypesOther: optionalLine(OTHER_MAX),
    tagline: line.pipe(
      z.string().min(1, REQUIRED).max(CARD_TAGLINE_MAX, `Keep it to one line, under ${CARD_TAGLINE_MAX} characters`),
    ),
    socials: linksFor("your", "Add at least one link, so people can find your work"),
  })
  /* An "other" needs its text. These two look across fields, and zod
     skips such a check once any single field has failed, which would hold
     the message back until everything else was fixed. `when` runs them
     regardless, so each reads only what it can trust to be there. */
  .refine((data) => !(includesOther(data.languages) && !data.languagesOther), {
    path: ["languagesOther"],
    message: "Tell us which other language",
    when: () => true,
  })
  .refine((data) => !(includesOther(data.contentTypes) && !data.contentTypesOther), {
    path: ["contentTypesOther"],
    message: "Tell us what “Other” is",
    when: () => true,
  })
  // An "other" that is no longer ticked takes its text with it.
  .transform((data) => ({
    ...data,
    languagesOther: data.languages.includes("other") ? data.languagesOther : null,
    contentTypesOther: data.contentTypes.includes("other") ? data.contentTypesOther : null,
  }));

export type CardValues = z.infer<typeof cardSchema>;

/* A card our team makes, or keeps, for a creator it knows: what the
   dashboard's editor sends (app/admin/creator-cards). The team often has
   no more than a name and a channel, so only those are asked for; the
   creator fills in the rest when they claim the card. A creator with no
   link at all is not listed, which is why one is asked for. */
export const teamCardSchema = z.object({
  displayName: line.pipe(
    z.string().min(1, REQUIRED).max(CARD_NAME_MAX, `Keep the name under ${CARD_NAME_MAX} characters`),
  ),
  country: z
    .string()
    .trim()
    .refine((value) => value === "" || isCountry(value), "Choose a country from the list")
    .transform((value) => value || null),
  tagline: optionalLine(CARD_TAGLINE_MAX),
  socials: linksFor("their", "Add at least one link. A creator with no link is not listed."),
});

export type TeamCardValues = z.infer<typeof teamCardSchema>;

/** The editor's FormData as the object teamCardSchema reads. */
export function teamCardFormValues(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  return {
    displayName: text("displayName"),
    country: text("country"),
    tagline: text("tagline"),
    socials: Object.fromEntries(CARD_SOCIALS.map(({ value }) => [value, text(`socials.${value}`)])),
  };
}

type CardField = Exclude<keyof CardValues, "socials">;
export type CardFieldErrors = Partial<
  Record<CardField | "socials" | `socials.${CardSocial}` | "photo" | "form", string[]>
>;

/** A failed parse as messages per field. A link keeps its own key,
    "socials.youtube", so the message lands under that field. */
export function cardFieldErrors(error: z.ZodError): CardFieldErrors {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const [field, sub] = issue.path;
    const key = field === "socials" && typeof sub === "string" ? `${field}.${sub}` : String(field ?? "form");
    (errors[key] ??= []).push(issue.message);
  }
  return errors as CardFieldErrors;
}

/** The form's FormData as the object the schema reads. */
export function cardFormValues(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  const list = (name: string) => formData.getAll(name).filter((v): v is string => typeof v === "string");
  return {
    displayName: text("displayName"),
    country: text("country"),
    creatorType: text("creatorType"),
    languages: list("languages"),
    languagesOther: text("languagesOther"),
    contentTypes: list("contentTypes"),
    contentTypesOther: text("contentTypesOther"),
    tagline: text("tagline"),
    socials: Object.fromEntries(CARD_SOCIALS.map(({ value }) => [value, text(`socials.${value}`)])),
  };
}
