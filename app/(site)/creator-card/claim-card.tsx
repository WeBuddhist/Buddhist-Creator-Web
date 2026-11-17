"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowUpRightIcon, ClockIcon, CopyIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { framedCard, framedCardInner, label as eyebrow, primaryButton } from "@/components/convention/section-heading";
import { CreatorCard } from "@/components/creator-card/creator-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CARD_FORM, CARD_PATH, CLAIM_NOTE_MAX, cardLinks, type CardContent } from "@/lib/creator-card";
import { claimHref } from "@/lib/creators";
import { formatDate } from "@/lib/format";
import { loginUrl } from "@/lib/login-url";
import { sessionEnded } from "@/lib/session-ended";
import { cn } from "@/lib/utils";
import { requestClaimAction, withdrawClaimAction, type ClaimResult } from "./actions";

const TOAST_ID = "creator-card";

type Refusal = Extract<ClaimResult, { ok: false }>["reason"];

/* Why a claim was not taken, said where the button is. */
const REFUSED: Record<Exclude<Refusal, "signed-out">, string> = {
  taken: "This card has an owner now, so it can no longer be claimed.",
  "has-card": "You already have a creator card, so you cannot claim another one.",
  "has-claim": "You already have a claim with our team. Withdraw it first to claim a different card.",
  failed: "We could not send your claim. Please try again in a moment.",
};

function showSignedOut(returnTo: string, what: string) {
  toast.error("You have been signed out", {
    id: TOAST_ID,
    description: `Sign in again, then come back to this tab and ${what}.`,
    duration: Infinity,
    closeButton: true,
    action: { label: "Sign in", onClick: () => window.open(loginUrl(returnTo), "_blank", "noopener") },
  });
}

const contact = (
  <a
    href={`mailto:${CARD_FORM.contact}`}
    className="font-medium underline decoration-current/35 underline-offset-4 hover:decoration-current"
  >
    {CARD_FORM.contact}
  </a>
);

/* The two columns every claim screen has: what is being said on the left,
   the card it is about on the right (under it on a phone). */
function ClaimLayout({ card, children }: { card: CardContent; children: React.ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-x-10">
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
      <aside aria-labelledby="claim-card-preview">
        <h2 id="claim-card-preview" className={cn(eyebrow, "text-muted-foreground")}>
          The card
        </h2>
        {/* Only an approved card can be claimed, so it wears the mark. */}
        <CreatorCard card={card} verified className="mt-3" />
      </aside>
    </div>
  );
}

const STEPS = (name: string, email: string) => [
  <>
    Send your claim. It goes to our team with the account you are signed in with,{" "}
    <span className="font-medium wrap-anywhere">{email}</span>.
  </>,
  <>
    We give you a short code. Put it in the bio or description of the channel on the card, so we can see the
    channel is yours.
  </>,
  <>Once our team approves, the card is yours: you edit it here, as {name}.</>,
];

/* A card the team made, shown to a signed-in visitor who came to claim it.
   Claiming is asking: signing in proves an email address, not that its
   owner runs the channel on the card, so nothing changes hands until our
   team has approved the claim. This screen says how that goes and sends
   the claim, with whatever the claimant wants to add.

   Sending is a React Query mutation around the server action. A good one
   leaves for the page's next state, the claim waiting with its code; a
   refused one says why and stays. */
export function ClaimCard({ cardId, card, email }: { cardId: string; card: CardContent; email: string }) {
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const claim = useMutation({
    mutationFn: async (): Promise<ClaimResult> => {
      try {
        return await requestClaimAction(cardId, note);
      } catch (error) {
        // A session that ended while the page was open is turned away
        // before the action runs, and arrives here as a failed request.
        if (await sessionEnded()) return { ok: false, reason: "signed-out" };
        throw error;
      }
    },
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Claim sent to our team", {
          id: TOAST_ID,
          description: "One more step: show the code on your channel so we can approve it.",
        });
        // The same page without the claim link: the claim, waiting.
        router.replace(CARD_PATH);
        return;
      }
      if (result.reason === "signed-out") showSignedOut(claimHref(cardId), "send your claim");
    },
  });

  const refusal = claim.data && !claim.data.ok && claim.data.reason !== "signed-out" ? claim.data.reason : null;
  // A sent claim keeps the button busy until the next screen replaces it.
  const busy = claim.isPending || claim.data?.ok === true;

  return (
    <ClaimLayout card={card}>
      <section aria-labelledby="claim-title" className={framedCard}>
        <form
          className={cn(framedCardInner, "px-5 py-6 sm:px-7 sm:py-8")}
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) claim.mutate();
          }}
        >
          <p className={cn(eyebrow, "text-brand-cyan")}>Claim a card</p>
          <h2 id="claim-title" className="mt-3 text-balance font-display text-3xl leading-[1.12] text-foreground sm:text-4xl">
            Is this your card?
          </h2>
          <p className="mt-4 max-w-[56ch] text-pretty text-base leading-[1.6] text-muted-foreground">
            Our team made this card for <span className="font-medium text-foreground">{card.displayName}</span> from
            what is public on their channel. If that is you, ask for it here. We check every claim before a card
            changes hands, so nobody can take a card that is not theirs.
          </p>
          <ol className="mt-6 flex max-w-[56ch] flex-col gap-3 text-[0.9375rem] leading-[1.5] text-foreground">
            {STEPS(card.displayName, email).map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-cyan/10 text-xs font-semibold text-brand-cyan tabular-nums"
                >
                  {index + 1}
                </span>
                <span className="min-w-0">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-7 flex max-w-[56ch] flex-col gap-2">
            <Label htmlFor="claim-note">
              Anything that helps us confirm it is you <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="claim-note"
              name="note"
              rows={3}
              maxLength={CLAIM_NOTE_MAX}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              readOnly={busy}
              placeholder="Your role at the organization, or another way to reach you."
              className="min-h-20 resize-none rounded-xl bg-card px-3.5 py-2.5 text-base leading-[1.5]"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" size="pill" disabled={busy} className={cn(primaryButton, "w-full sm:w-auto")}>
              {busy ? "Sending…" : "Send claim for review"}
            </Button>
            <Button
              size="pill"
              variant="outline"
              nativeButton={false}
              render={<Link href={CARD_PATH} />}
              className="w-full sm:w-auto"
            >
              Not me: make a new card
            </Button>
          </div>
          {/* Always mounted, so a refusal is announced. */}
          <p role="status" aria-live="polite" className="mt-4 text-sm leading-[1.5] text-brand-maroon empty:hidden">
            {refusal
              ? REFUSED[refusal]
              : claim.isError
                ? "We could not reach the site. Check your connection and try again."
                : null}
            {refusal === "taken" && <> If it is yours, write to {contact}.</>}
          </p>
        </form>
      </section>
    </ClaimLayout>
  );
}

/* A claim that is with our team: where it stands, and the one thing left
   for the claimant to do, which is to show the code on the channel. The
   code is the proof. An email address can be anyone's and a screenshot
   can be made up, but only whoever runs the channel can put a line of
   text on it, and our team can see it there without being sent anything.

   The claimant may take the claim back, which returns this page to the
   empty card form. */
export function ClaimPending({
  card,
  code,
  sentAt,
  email,
}: {
  card: CardContent;
  code: string;
  /** When the claim was sent, as an ISO date. */
  sentAt: string;
  email: string;
}) {
  const router = useRouter();
  const links = cardLinks(card.socials);
  const withdraw = useMutation({
    mutationFn: async () => {
      try {
        return await withdrawClaimAction();
      } catch (error) {
        if (await sessionEnded()) return { ok: false as const, reason: "signed-out" as const };
        throw error;
      }
    },
    onSuccess: (result) => {
      if (result.ok) {
        toast("Claim withdrawn", { id: TOAST_ID, description: "You can claim a card again, or make your own." });
        router.refresh();
      } else if (result.reason === "signed-out") showSignedOut(CARD_PATH, "withdraw the claim");
    },
  });
  const failed = withdraw.isError || (withdraw.data && !withdraw.data.ok && withdraw.data.reason === "failed");
  const busy = withdraw.isPending || withdraw.data?.ok === true;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied", { id: TOAST_ID });
    } catch {
      toast("Select the code and copy it", { id: TOAST_ID });
    }
  };

  return (
    <ClaimLayout card={card}>
      <div
        role="status"
        className="flex items-start gap-3 rounded-xl border border-brand-cyan/30 bg-brand-cyan/5 px-4 py-3.5 text-sm leading-[1.5] text-foreground"
      >
        <ClockIcon className="mt-0.5 size-4 shrink-0 text-brand-cyan" weight="bold" aria-hidden />
        <div className="min-w-0">
          Your claim for <span className="font-medium">{card.displayName}</span> was sent on {formatDate(sentAt)}, from{" "}
          <span className="font-medium wrap-anywhere">{email}</span>. Our team is checking it. Once it is approved, the
          card appears on this page as yours.
        </div>
      </div>

      <section aria-labelledby="claim-code-title" className={framedCard}>
        <div className={cn(framedCardInner, "px-5 py-6 sm:px-7 sm:py-8")}>
          <p className={cn(eyebrow, "text-brand-cyan")}>One step left</p>
          <h2
            id="claim-code-title"
            className="mt-3 text-balance font-display text-3xl leading-[1.12] text-foreground sm:text-4xl"
          >
            Show us the channel is yours
          </h2>
          <p className="mt-4 max-w-[56ch] text-pretty text-base leading-[1.6] text-muted-foreground">
            Add this code to the bio or description of {links.length > 1 ? "one of the channels" : "the channel"} on the
            card. Our team looks for it there, and you can take it off again once your claim is approved.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <code className="rounded-xl border border-border bg-paper-deep/60 px-4 py-2.5 font-mono text-xl font-semibold tracking-[0.08em] text-foreground select-all">
              {code}
            </code>
            <Button type="button" size="pill" variant="outline" onClick={copy}>
              <CopyIcon data-icon="inline-start" weight="bold" />
              Copy code
            </Button>
          </div>

          {links.length > 0 && (
            <ul className="mt-5 flex flex-col gap-1.5 text-[0.9375rem]">
              {links.map(({ value, label, url }) => (
                <li key={value}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex max-w-full items-baseline gap-1 rounded-sm font-medium text-brand-cyan underline decoration-current/35 underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="min-w-0 wrap-anywhere">{value === "website" ? "Open the website" : `Open ${label}`}</span>
                    <ArrowUpRightIcon aria-hidden weight="bold" className="size-3.5 shrink-0 self-center" />
                    <span className="sr-only">(opens in new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-6 max-w-[56ch] border-t border-border pt-5 text-sm leading-[1.6] text-muted-foreground">
            Cannot change the profile? Write to {contact} from the contact address shown on the channel, with this code,
            and we will check it that way.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button type="button" size="pill" variant="outline" disabled={busy} onClick={() => withdraw.mutate()}>
              {busy ? "Withdrawing…" : "Withdraw claim"}
            </Button>
            <p className="text-sm text-muted-foreground">Not your card after all, or want to make your own instead.</p>
          </div>
          <p role="status" aria-live="polite" className="mt-3 text-sm text-brand-maroon empty:hidden">
            {failed ? "We could not withdraw the claim. Please try again in a moment." : null}
          </p>
        </div>
      </section>
    </ClaimLayout>
  );
}
