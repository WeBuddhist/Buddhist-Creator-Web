/* Dates on the dashboard and the form, in the convention's own time zone. */
const dateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

const dateOnly = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Kolkata" });

const timeOnly = new Intl.DateTimeFormat("en-GB", { timeStyle: "short", timeZone: "Asia/Kolkata" });

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "";
  return dateTime.format(typeof value === "string" ? new Date(value) : value);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  return dateOnly.format(typeof value === "string" ? new Date(value) : value);
}

export function formatTime(value: Date | string | null | undefined) {
  if (!value) return "";
  return timeOnly.format(typeof value === "string" ? new Date(value) : value);
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const wholeNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** A count with its thousands grouped: 12,500. */
export function formatCount(value: number) {
  return wholeNumber.format(value);
}

const shortNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumSignificantDigits: 3 });

/** A count cut short for a tight place: 2.97M, 948K, 1.34K. Cut, not
    rounded: 999,950 is 999K until it is a million, so a short figure
    never says more than the count it stands for. */
export function formatCompact(value: number) {
  const size = Math.abs(value);
  if (size < 1000) return shortNumber.format(value);
  const step = 10 ** (Math.floor(Math.log10(size)) - 2);
  return shortNumber.format(Math.trunc(value / step) * step);
}

/* A count as a figure to be read at a glance, in a ranking: short from
   ten thousand up (17.4M, 948K, 12.3K), since a run of seven or eight
   digits has to be counted before it means anything, and whole below
   that, where four digits are read as they stand. Wherever a figure is
   shortened the whole count is printed with it, smaller (isShortened
   says when): in a ranking a few followers decide a place, and the short
   figure alone would show two neighbours as level. */
const SHORT_FROM = 10_000;

export const isShortened = (value: number) => Math.abs(value) >= SHORT_FROM;

export function formatFigure(value: number) {
  return isShortened(value) ? formatCompact(value) : formatCount(value);
}

const pluralRules = new Intl.PluralRules("en-US");

/** The word that goes with a count: plural(1, "place", "places") is
    "place". The count itself is the caller's to print. */
export function plural(count: number, one: string, other: string) {
  return pluralRules.select(count) === "one" ? one : other;
}
