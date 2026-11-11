"use server";

import { forLog } from "@/lib/log-error";
import { saveSuggestion } from "@/lib/suggestions";

/* What the suggestion box is told came of a send: stored, nothing to store,
   or the write failed. */
export type FeedbackState = { status: "idle" | "sent" | "empty" | "failed" };

/* Suggestion box on the homepage. The form posts `suggestion` (required)
   and `email` (optional), and is stored without JavaScript too, because
   it is a server action. Each one becomes a row in `suggestions`.

   The form reads the outcome through useActionState, so a failed write is
   reported rather than thrown: a suggestion that was not kept must not
   look sent. It is logged without the query, whose parameters are the
   visitor's words and email and do not belong in the host's logs. */
export async function submitFeedback(_previous: FeedbackState, formData: FormData): Promise<FeedbackState> {
  try {
    const saved = await saveSuggestion(formData.get("suggestion"), formData.get("email"));
    return { status: saved ? "sent" : "empty" };
  } catch (error) {
    console.error("[suggestions] could not save", forLog(error));
    return { status: "failed" };
  }
}
