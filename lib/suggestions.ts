import "server-only";
import { db, schema } from "@/lib/db";
import { SUGGESTION_EMAIL_MAX_LENGTH, SUGGESTION_MAX_LENGTH } from "@/lib/db/schema";

/* Writes for the homepage suggestion box. The form is public, so what
   arrives is whatever a browser, or anything else, chose to post. */

/* A field as the form means it. A textarea posts its line breaks as CRLF
   but counts each as one character against `maxLength`, so they are folded
   back to one before anything is measured. Postgres refuses a NUL in text. */
function field(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n?/g, "\n").replaceAll("\0", "").trim();
}

/** Stores one suggestion and says whether it did. Nothing is stored when
    the suggestion is empty or over the limit, which the form's own
    `required` and `maxLength` already stop a browser from sending. An
    email over its limit is left out and the suggestion kept. */
export async function saveSuggestion(
  suggestion: FormDataEntryValue | null,
  email: FormDataEntryValue | null,
): Promise<boolean> {
  const body = field(suggestion);
  if (!body || body.length > SUGGESTION_MAX_LENGTH) return false;

  const address = field(email);
  await db()
    .insert(schema.suggestions)
    .values({
      body,
      email: address && address.length <= SUGGESTION_EMAIL_MAX_LENGTH ? address : null,
    });
  return true;
}
