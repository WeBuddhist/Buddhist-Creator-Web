"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { assertRole, Unauthorized } from "@/lib/auth";
import { DECISIONS, type Decision } from "@/lib/decisions";
import { templateReady } from "@/lib/emails";
import { listOwed, sendDecisionEmail, sendTestEmail, type Recipient } from "@/lib/notifications";
import { delivery, sendQuota, type DeliveryMode, type HaltCode, type SendQuota } from "@/lib/ses";

/* The bulk send, driven from the applications list. The page asks for a
   preview, the admin confirms it, and the page then sends the confirmed
   list a few at a time through sendBulkChunkAction, so progress shows and
   a closed tab or a deploy stops the run where it is. Whatever was not
   sent is still owed and the next run picks it up.

   None of these revalidate: a re-render of the list in every chunk's
   response would be wasted work. The page refreshes once at the end. */

const NOT_ALLOWED = "You are not allowed to do that.";

async function admin() {
  try {
    return await assertRole("admin");
  } catch (error) {
    if (error instanceof Unauthorized) return null;
    throw error;
  }
}

export type BulkGroup = {
  decision: Decision;
  /** False while the wording is still a placeholder. */
  ready: boolean;
  recipients: Recipient[];
};

export type BulkPreview =
  | {
      ok: true;
      batchId: string;
      mode: DeliveryMode;
      note: string | null;
      groups: BulkGroup[];
      /** Owed an email but held back by a send that is unsettled. */
      blocked: number;
      quota: SendQuota | null;
    }
  | { ok: false; message: string };

const scopeSchema = z.array(z.enum(DECISIONS)).min(1).max(DECISIONS.length);

/** Who a bulk send would reach, for the confirm step. */
export async function previewBulkSendAction(scope: Decision[]): Promise<BulkPreview> {
  if (!(await admin())) return { ok: false, message: NOT_ALLOWED };
  const parsed = scopeSchema.safeParse(scope);
  if (!parsed.success) return { ok: false, message: "That request could not be read." };

  const { mode, note } = delivery();
  const [{ recipients, blocked }, quota] = await Promise.all([
    listOwed(parsed.data),
    mode === "live" ? sendQuota() : Promise.resolve(null),
  ]);
  const groups: BulkGroup[] = [];
  for (const decision of DECISIONS) {
    const mine = recipients.filter((recipient) => recipient.status === decision);
    if (mine.length === 0) continue;
    groups.push({ decision, ready: templateReady(decision), recipients: mine });
  }
  return { ok: true, batchId: randomUUID(), mode, note, groups, blocked: blocked.length, quota };
}

export type ChunkResult = {
  id: string;
  outcome: "sent" | "skipped" | "failed" | "uncertain";
  message?: string;
};

export type BulkChunk =
  | {
      ok: true;
      /** One entry per application attempted. An id sent in but missing
          here was not reached in time; the page sends it again. */
      results: ChunkResult[];
      /** Set when the run should stop: the rest would fail the same way,
          or something needs a person to look. */
      halt?: { code: HaltCode | "off" | "uncertain"; message: string };
    }
  | { ok: false; message: string };

const chunkSchema = z.object({
  batchId: z.uuid(),
  items: z.array(z.object({ id: z.uuid(), status: z.enum(DECISIONS) })).min(1).max(10),
});

/* A request stays well inside any proxy's patience. */
const CHUNK_BUDGET_MS = 8_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Send the next few of a confirmed list, one after another. Each goes
    through the same claim as a single send, so a decision that changed
    since the preview, or an email someone else already sent, is skipped. */
export async function sendBulkChunkAction(input: {
  batchId: string;
  items: { id: string; status: Decision }[];
}): Promise<BulkChunk> {
  const actor = await admin();
  if (!actor) return { ok: false, message: NOT_ALLOWED };
  const parsed = chunkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "That request could not be read." };

  const { mode } = delivery();
  // SES turns away mail sent faster than the account's rate. Unknown
  // limits are treated as the sandbox's one a second.
  const quota = mode === "live" ? await sendQuota() : null;
  const gap = mode === "live" ? Math.ceil(1000 / (quota?.perSecond ?? 1)) : 0;

  const started = Date.now();
  const results: ChunkResult[] = [];
  let last = 0;
  for (const item of parsed.data.items) {
    if (results.length > 0 && Date.now() - started > CHUNK_BUDGET_MS) break;
    const since = Date.now() - last;
    if (last && since < gap) await wait(gap - since);
    last = Date.now();

    const result = await sendDecisionEmail({
      applicationId: item.id,
      expectedStatus: item.status,
      actorId: actor.id,
      batchId: parsed.data.batchId,
    });
    if (result.outcome === "off") {
      return { ok: true, results, halt: { code: "off", message: result.message } };
    }
    if (result.outcome === "sent") {
      results.push({ id: item.id, outcome: "sent" });
      continue;
    }
    results.push({ id: item.id, outcome: result.outcome, message: result.message });
    if (result.outcome === "failed" && result.halt) {
      return { ok: true, results, halt: { code: result.halt, message: result.message } };
    }
    if (result.outcome === "uncertain") {
      // One unknown is a person's job to check; ten in a row would be a mess.
      return { ok: true, results, halt: { code: "uncertain", message: result.message } };
    }
  }
  return { ok: true, results };
}

/** One of the three emails, to the signed-in admin's own address. */
export async function sendTestEmailAction(decision: Decision): Promise<{ ok: boolean; message: string }> {
  const actor = await admin();
  if (!actor) return { ok: false, message: NOT_ALLOWED };
  const parsed = z.enum(DECISIONS).safeParse(decision);
  if (!parsed.success) return { ok: false, message: "That request could not be read." };
  return sendTestEmail({ decision: parsed.data, to: actor.email, name: actor.name });
}
