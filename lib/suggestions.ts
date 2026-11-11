import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { SUGGESTION_EMAIL_MAX_LENGTH, SUGGESTION_MAX_LENGTH } from "@/lib/db/schema";

/* The homepage suggestion box: the write the public form makes, and the
   read and the removal the dashboard makes. The form is public, so what arrives is
   whatever a browser, or anything else, chose to post. */

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

export const SUGGESTIONS_PAGE_SIZE = 50;

/** One page of suggestions for the dashboard, newest first, with how many
    there are in all. The caller checks the role. */
export async function listSuggestions(page = 1) {
  const { suggestions } = schema;
  const offset = Math.max(0, page - 1) * SUGGESTIONS_PAGE_SIZE;
  const [rows, [{ total }]] = await Promise.all([
    db()
      .select()
      .from(suggestions)
      // The id settles the order of two that arrived in the same instant,
      // so a row never shows on two pages.
      .orderBy(desc(suggestions.createdAt), desc(suggestions.id))
      .limit(SUGGESTIONS_PAGE_SIZE)
      .offset(offset),
    db().select({ total: sql<number>`count(*)::int` }).from(suggestions),
  ]);
  return { rows, total, page, pageSize: SUGGESTIONS_PAGE_SIZE };
}

/** Deletes one suggestion, for good, and says whether there was one to
    delete. The caller checks the role. */
export async function deleteSuggestion(id: string): Promise<boolean> {
  const { suggestions } = schema;
  const gone = await db().delete(suggestions).where(eq(suggestions.id, id)).returning({ id: suggestions.id });
  return gone.length > 0;
}
