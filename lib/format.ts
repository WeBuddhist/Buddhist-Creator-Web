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
