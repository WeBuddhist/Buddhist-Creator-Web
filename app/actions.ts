"use server";

import { forLog } from "@/lib/log-error";
import { saveSuggestion } from "@/lib/suggestions";

/* Suggestion box on the homepage. The form posts `suggestion` (required)
   and `email` (optional), and works without JavaScript because it is a
   server action. Each one becomes a row in `suggestions`.

   A failed write is thrown again, without the query: a suggestion that was
   not kept must not look sent, and the query's parameters are the visitor's
   words and email, which do not belong in the host's logs. */
export async function submitFeedback(formData: FormData) {
  try {
    await saveSuggestion(formData.get("suggestion"), formData.get("email"));
  } catch (error) {
    console.error("[suggestions] could not save", forLog(error));
    throw new Error("The suggestion could not be saved.");
  }
}
