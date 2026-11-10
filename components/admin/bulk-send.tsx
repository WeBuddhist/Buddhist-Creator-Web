"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Progress } from "@base-ui/react/progress";
import { PaperPlaneTiltIcon, WarningIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  previewBulkSendAction,
  sendBulkChunkAction,
  sendTestEmailAction,
  type BulkGroup,
  type BulkPreview,
} from "@/app/admin/actions";
import { panel } from "@/components/admin/panel";
import { STATUS_LABEL } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DECISIONS, DECISION_EMAIL, type Decision } from "@/lib/decisions";
import { cn } from "@/lib/utils";

/* The bulk send, above the applications table. The strip says how many
   decision emails are waiting in the tab on screen; the button opens a
   confirm step listing exactly who will be written to, and the send then
   runs from this page a few applicants at a time, so progress shows and
   stopping is possible. Closing the tab stops the run where it is: whoever
   was not reached is still owed their email and the next run picks them
   up. Nobody is ever written to twice for the same decision; the server
   checks each one again as it sends. */

export type BulkSendSummary = {
  owed: Record<Decision, number>;
  total: number;
  review: { applicationId: string; name: string }[];
  reviewCount: number;
};

export type Ready = Extract<BulkPreview, { ok: true }>;

export type Problem = { name: string; message: string };

export type Tally = { sent: number; skipped: number; failed: number; uncertain: number };

type Stage =
  | { name: "loading" }
  | { name: "error"; message: string }
  | { name: "confirm"; preview: Ready }
  | { name: "running"; total: number; tally: Tally; stopping: boolean }
  | { name: "done"; tally: Tally; problems: Problem[]; stopped: string | null };

const CHUNK = 10;

const emails = (count: number) => (count === 1 ? "1 email" : `${count} emails`);

function breakdown(owed: Record<Decision, number>) {
  return DECISIONS.filter((decision) => owed[decision] > 0)
    .map((decision) => `${owed[decision]} ${DECISION_EMAIL[decision]}`)
    .join(", ");
}

/* In the live site an email whose wording is still a placeholder cannot
   go out, so its group is listed but left out of the run. */
function sendable(preview: Ready): BulkGroup[] {
  if (preview.mode === "simulate") return preview.groups;
  if (preview.mode !== "live") return [];
  return preview.groups.filter((group) => group.ready);
}

export function BulkSend({ scope, summary }: { scope: Decision[]; summary: BulkSendSummary }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>({ name: "loading" });
  const stop = useRef(false);

  if (summary.total === 0 && summary.reviewCount === 0) return null;

  const busy = stage.name === "running";
  const single = scope.length === 1 ? scope[0] : null;

  function openDialog() {
    setStage({ name: "loading" });
    setOpen(true);
    startTransition(async () => {
      try {
        const preview = await previewBulkSendAction(scope);
        setStage(preview.ok ? { name: "confirm", preview } : { name: "error", message: preview.message });
      } catch {
        setStage({ name: "error", message: "The list could not be loaded. Reload the page and try again." });
      }
    });
  }

  function run(preview: Ready) {
    const names = new Map<string, string>();
    const queue = sendable(preview).flatMap((group) =>
      group.recipients.map((recipient) => {
        names.set(recipient.id, recipient.name ?? recipient.email);
        return { id: recipient.id, status: recipient.status };
      }),
    );
    const total = queue.length;
    const tally: Tally = { sent: 0, skipped: 0, failed: 0, uncertain: 0 };
    const problems: Problem[] = [];
    let stopped: string | null = null;
    stop.current = false;
    setStage({ name: "running", total, tally: { ...tally }, stopping: false });

    startTransition(async () => {
      // A chunk that reaches nobody means the server ran out of time
      // before the first send. Give up after a few of those in a row.
      let empty = 0;
      while (queue.length > 0) {
        if (stop.current) {
          stopped = "Stopped. The rest are still waiting.";
          break;
        }
        let chunk;
        try {
          chunk = await sendBulkChunkAction({ batchId: preview.batchId, items: queue.slice(0, CHUNK) });
        } catch {
          // A deploy mid-run retires this page's actions.
          stopped = "The connection to the server was lost. Reload the page to carry on; nobody is emailed twice.";
          break;
        }
        if (!chunk.ok) {
          stopped = chunk.message;
          break;
        }
        const handled = new Set<string>();
        for (const result of chunk.results) {
          handled.add(result.id);
          tally[result.outcome] += 1;
          if (result.outcome === "failed" || result.outcome === "uncertain") {
            problems.push({ name: names.get(result.id) ?? "An applicant", message: result.message ?? "" });
          }
        }
        for (let i = queue.length - 1; i >= 0; i -= 1) if (handled.has(queue[i].id)) queue.splice(i, 1);
        setStage({ name: "running", total, tally: { ...tally }, stopping: stop.current });
        if (chunk.halt) {
          stopped = chunk.halt.message;
          break;
        }
        empty = handled.size === 0 ? empty + 1 : 0;
        if (empty >= 3) {
          stopped = "The server is not getting through. Try again in a minute.";
          break;
        }
      }
      setStage({ name: "done", tally: { ...tally }, problems, stopped });
      router.refresh();
    });
  }

  function sendTest(decision: Decision) {
    startTransition(async () => {
      try {
        const result = await sendTestEmailAction(decision);
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
      } catch {
        toast.error("The test could not be sent.");
      }
    });
  }

  return (
    <>
      <div className={cn(panel, "mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3.5")}>
        <div className="min-w-0 text-sm">
          {summary.total > 0 && (
            <p className="text-foreground">
              <span className="font-medium tabular-nums">
                {single ? `${summary.total} ${DECISION_EMAIL[single]} ${summary.total === 1 ? "email" : "emails"}` : emails(summary.total)}
              </span>{" "}
              waiting to be sent
              {!single && <span className="text-muted-foreground tabular-nums">: {breakdown(summary.owed)}</span>}.
            </p>
          )}
          {summary.reviewCount > 0 && (
            <p className={cn("flex flex-wrap items-center gap-x-1.5 text-brand-maroon", summary.total > 0 && "mt-1")}>
              <WarningIcon aria-hidden weight="fill" className="size-4 shrink-0" />
              <span className="font-medium">
                {summary.reviewCount === 1 ? "1 send needs review" : `${summary.reviewCount} sends need review`}:
              </span>
              {summary.review.map((item, index) => (
                <span key={item.applicationId}>
                  <Link
                    href={`/admin/applications/${item.applicationId}`}
                    className="underline decoration-brand-maroon/40 underline-offset-4 hover:decoration-brand-maroon"
                  >
                    {item.name}
                  </Link>
                  {index < summary.review.length - 1 ? "," : ""}
                </span>
              ))}
              {summary.reviewCount > summary.review.length && (
                <span>and {summary.reviewCount - summary.review.length} more</span>
              )}
            </p>
          )}
        </div>
        {summary.total > 0 && (
          <Button type="button" variant="emphasis" size="lg" className="px-3" onClick={openDialog}>
            <PaperPlaneTiltIcon aria-hidden weight="fill" />
            Send emails
          </Button>
        )}
      </div>

      <Dialog
        open={open}
        // While a run is going the dialog stays: Escape and a click outside
        // would hide the progress but not stop the sending.
        onOpenChange={(next) => {
          if (!busy) setOpen(next);
        }}
        disablePointerDismissal={busy}
      >
        <DialogContent>
          {stage.name === "loading" && (
            <>
              <DialogHeader>
                <DialogTitle>Send decision emails</DialogTitle>
                <DialogDescription role="status">Checking who is waiting…</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" size="lg" className="px-3" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )}

          {stage.name === "error" && (
            <>
              <DialogHeader>
                <DialogTitle>Send decision emails</DialogTitle>
                <DialogDescription role="alert" className="text-brand-maroon">
                  {stage.message}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" size="lg" className="px-3" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}

          {stage.name === "confirm" && (
            <Confirm preview={stage.preview} onCancel={() => setOpen(false)} onSend={() => run(stage.preview)} onTest={sendTest} />
          )}

          {stage.name === "running" && (
            <Running
              total={stage.total}
              tally={stage.tally}
              stopping={stage.stopping}
              onStop={() => {
                stop.current = true;
                setStage({ ...stage, stopping: true });
              }}
            />
          )}

          {stage.name === "done" && (
            <Done tally={stage.tally} problems={stage.problems} stopped={stage.stopped} onClose={() => setOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Notice({ tone, children }: { tone: "info" | "warning"; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "rounded-lg border px-3 py-2 text-sm leading-[1.5]",
        tone === "warning"
          ? "border-status-waitlisted-solid/40 bg-status-waitlisted-bg text-foreground"
          : "border-border bg-muted/60 text-foreground",
      )}
    >
      {children}
    </p>
  );
}

/* The dialog's three views are exported so each can be rendered on its own
   with made-up data. */
export function Confirm({
  preview,
  onCancel,
  onSend,
  onTest,
}: {
  preview: Ready;
  onCancel: () => void;
  onSend: () => void;
  onTest: (decision: Decision) => void;
}) {
  const groups = sendable(preview);
  const count = groups.reduce((sum, group) => sum + group.recipients.length, 0);
  const waiting = preview.groups.reduce((sum, group) => sum + group.recipients.length, 0);
  const canTest = preview.mode !== "off";
  const overQuota =
    preview.quota?.remainingToday != null && preview.quota.remainingToday < count ? preview.quota.remainingToday : null;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Send decision emails</DialogTitle>
        <DialogDescription>
          {waiting === 0
            ? "Nobody is waiting for an email right now."
            : "Each person below gets the email for their current decision. Anyone already emailed that decision is left out."}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        {preview.note && <Notice tone={preview.mode === "simulate" ? "info" : "warning"}>{preview.note}</Notice>}
        {preview.quota?.sandbox && (
          <Notice tone="warning">
            The SES account is still in the sandbox: only verified addresses receive mail, and at most 200 a day.
          </Notice>
        )}
        {preview.quota && !preview.quota.sendingEnabled && (
          <Notice tone="warning">Sending is paused on the SES account.</Notice>
        )}
        {overQuota !== null && (
          <Notice tone="warning">
            SES will take {emails(overQuota)} more today. The run stops there and the rest stay waiting.
          </Notice>
        )}

        {preview.groups.map((group) => (
          <section key={group.decision} aria-label={`${STATUS_LABEL[group.decision]} emails`} className="rounded-lg border border-border">
            <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border bg-muted/60 px-3 py-2">
              <h3 className="text-sm font-medium text-foreground">
                {STATUS_LABEL[group.decision]}
                <span className="ms-1.5 font-normal text-muted-foreground tabular-nums">{group.recipients.length}</span>
              </h3>
              {canTest && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => onTest(group.decision)}
                  className="h-auto p-0 text-xs font-medium text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:text-foreground hover:decoration-foreground"
                >
                  Send me a test
                </Button>
              )}
            </header>
            {!group.ready && (
              <p className="border-b border-border px-3 py-2 text-xs text-brand-maroon">
                {preview.mode === "live"
                  ? "This email still has placeholder wording, so it is left out of this run."
                  : "This email still has placeholder wording. The live site will not send it until it is approved."}
              </p>
            )}
            <details className="group border-b border-border px-3 py-2 text-sm">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                Preview: {group.sample.subject}
              </summary>
              <p className="mt-2 text-xs leading-[1.6] whitespace-pre-line text-foreground/80">{group.sample.text.trim()}</p>
            </details>
            <ul className="max-h-44 divide-y divide-border overflow-y-auto">
              {group.recipients.map((recipient) => (
                <li key={recipient.id} className="flex flex-wrap items-baseline justify-between gap-x-3 px-3 py-1.5 text-sm">
                  {/* The address drops under the name whole when the two do
                      not fit, and only breaks inside itself on its own line. */}
                  <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                    <span className="text-foreground [overflow-wrap:anywhere]">{recipient.name ?? recipient.email}</span>
                    {recipient.name && <span className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{recipient.email}</span>}
                  </span>
                  {recipient.previouslyTold && (
                    <span className="text-xs font-medium text-status-waitlisted-text">
                      was told {STATUS_LABEL[recipient.previouslyTold].toLowerCase()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}

        {preview.blocked > 0 && (
          <p className="text-xs text-muted-foreground">
            {preview.blocked === 1 ? "1 more is" : `${preview.blocked} more are`} held back until an earlier send has been
            reviewed.
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" size="lg" className="px-3" onClick={onCancel} data-initial-focus>
          {waiting === 0 ? "Close" : "Cancel"}
        </Button>
        {waiting > 0 && (
          <Button type="button" variant="emphasis" size="lg" className="px-3" disabled={count === 0} onClick={onSend}>
            <PaperPlaneTiltIcon aria-hidden weight="fill" />
            Send {emails(count)}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

export function Running({
  total,
  tally,
  stopping,
  onStop,
}: {
  total: number;
  tally: Tally;
  stopping: boolean;
  onStop: () => void;
}) {
  const done = tally.sent + tally.skipped + tally.failed + tally.uncertain;
  return (
    <>
      <DialogHeader>
        <DialogTitle>Sending…</DialogTitle>
        <DialogDescription>Keep this tab open until it finishes.</DialogDescription>
      </DialogHeader>
      <DialogBody>
        <Progress.Root value={done} max={Math.max(total, 1)} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <Progress.Label className="text-foreground">
              {tally.sent} sent
              {tally.failed > 0 && <span className="text-brand-maroon">, {tally.failed} failed</span>}
            </Progress.Label>
            <span className="text-muted-foreground tabular-nums">
              {done} of {total}
            </span>
          </div>
          <Progress.Track className="h-2 overflow-hidden rounded-full bg-muted">
            <Progress.Indicator className="rounded-full bg-brand-cyan transition-[width] duration-300 ease-out motion-reduce:transition-none" />
          </Progress.Track>
        </Progress.Root>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" size="lg" className="px-3" disabled={stopping} onClick={onStop}>
          {stopping ? "Stopping…" : "Stop"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function Done({
  tally,
  problems,
  stopped,
  onClose,
}: {
  tally: Tally;
  problems: Problem[];
  stopped: string | null;
  onClose: () => void;
}) {
  // The Send button this view replaces took the focus with it.
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => close.current?.focus(), []);
  return (
    <>
      <DialogHeader>
        <DialogTitle>{stopped ? "Stopped early" : "Finished"}</DialogTitle>
        <DialogDescription role="status">
          {emails(tally.sent)} sent
          {tally.skipped > 0 && `, ${tally.skipped} skipped because the decision changed or the email had already gone`}
          {tally.failed > 0 && `, ${tally.failed} failed`}
          {tally.uncertain > 0 && `, ${tally.uncertain} need review`}.
        </DialogDescription>
      </DialogHeader>
      {(stopped || problems.length > 0) && (
        <DialogBody className="flex flex-col gap-3">
          {stopped && <Notice tone="warning">{stopped}</Notice>}
          {problems.length > 0 && (
            <ul className="flex flex-col gap-2 text-sm">
              {problems.map((problem, index) => (
                <li key={index}>
                  <span className="font-medium text-foreground">{problem.name}</span>
                  <span className="block text-xs text-muted-foreground">{problem.message}</span>
                </li>
              ))}
            </ul>
          )}
        </DialogBody>
      )}
      <DialogFooter>
        <Button ref={close} type="button" variant="outline" size="lg" className="px-3" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  );
}
