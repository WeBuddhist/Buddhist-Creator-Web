"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { framedCard, framedCardInner, label as eyebrow, primaryButton } from "@/components/convention/section-heading";
import { CreatorCard } from "@/components/creator-card/creator-card";
import { Button } from "@/components/ui/button";
import { CARD_FORM, CARD_PATH, type CardContent } from "@/lib/creator-card";
import { claimHref } from "@/lib/creators";
import { loginUrl } from "@/lib/login-url";
import { sessionEnded } from "@/lib/session-ended";
import { cn } from "@/lib/utils";
import { claimCardAction, type ClaimResult } from "./actions";

const TOAST_ID = "creator-card";

type Refusal = Extract<ClaimResult, { ok: false }>["reason"];

/* Why a claim did not go through, said where the button is. */
const REFUSED: Record<Exclude<Refusal, "signed-out">, string> = {
  taken: "Someone has just claimed this card, so it can no longer be claimed.",
  "has-card": "You already have a creator card, so you cannot claim another one.",
  failed: "We could not claim the card. Please try again in a moment.",
};

/* A card the team made, shown to a signed-in visitor who came to claim it:
   the card as it stands, what claiming means, and the one button. A card
   can be claimed once. Whoever does becomes its owner, and from then on it
   is their card: this page turns into the card form, read-only behind
   Edit, as after any submission.

   The claim is a React Query mutation around the server action. A good
   one leaves for the card form; a refused one says why and stays. */
export function ClaimCard({ cardId, card, email }: { cardId: string; card: CardContent; email: string }) {
  const router = useRouter();
  const claim = useMutation({
    mutationFn: async (): Promise<ClaimResult> => {
      try {
        return await claimCardAction(cardId);
      } catch (error) {
        // A session that ended while the page was open is turned away
        // before the action runs, and arrives here as a failed request.
        if (await sessionEnded()) return { ok: false, reason: "signed-out" };
        throw error;
      }
    },
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("This card is now yours", {
          id: TOAST_ID,
          description: "Choose Edit card to add your photo, your links and what you make.",
        });
        // The same page without the claim: the card form, with the card.
        router.replace(CARD_PATH);
        return;
      }
      if (result.reason === "signed-out") {
        toast.error("You have been signed out", {
          id: TOAST_ID,
          description: "Sign in again, then come back to this tab and claim the card.",
          duration: Infinity,
          closeButton: true,
          action: { label: "Sign in", onClick: () => window.open(loginUrl(claimHref(cardId)), "_blank", "noopener") },
        });
      }
    },
  });

  const refusal = claim.data && !claim.data.ok && claim.data.reason !== "signed-out" ? claim.data.reason : null;
  const unreachable = claim.isError;
  // A good claim keeps the button busy until the card form has replaced it.
  const busy = claim.isPending || claim.data?.ok === true;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-x-10">
      <section aria-labelledby="claim-title" className={framedCard}>
        <div className={cn(framedCardInner, "px-5 py-6 sm:px-7 sm:py-8")}>
          <p className={cn(eyebrow, "text-brand-cyan")}>Claim a card</p>
          <h2 id="claim-title" className="mt-3 text-balance font-display text-3xl leading-[1.12] text-foreground sm:text-4xl">
            Is this your card?
          </h2>
          <p className="mt-4 max-w-[56ch] text-pretty text-base leading-[1.6] text-muted-foreground">
            Our team made this card for <span className="font-medium text-foreground">{card.displayName}</span> from
            what is public on their channel. If that is you, claim it and it becomes yours.
          </p>
          <ul className="mt-5 flex max-w-[56ch] flex-col gap-2.5 text-[0.9375rem] leading-[1.5] text-foreground">
            {[
              "You can then edit it: your photo, your links, your languages and what you make.",
              "A card can be claimed once, by one person. Claim it only if it is yours.",
              <>
                It will be linked to the account you are signed in with,{" "}
                <span className="font-medium wrap-anywhere">{email}</span>.
              </>,
            ].map((line, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <CheckCircleIcon aria-hidden weight="fill" className="mt-0.5 size-4.5 shrink-0 text-brand-cyan" />
                <span className="min-w-0">{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="pill"
              disabled={busy}
              onClick={() => claim.mutate()}
              className={cn(primaryButton, "w-full sm:w-auto")}
            >
              {busy ? "Claiming…" : "Claim this card"}
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
              : unreachable
                ? "We could not reach the site. Check your connection and try again."
                : null}
            {refusal === "taken" && (
              <>
                {" "}
                If it is yours, write to{" "}
                <a
                  href={`mailto:${CARD_FORM.contact}`}
                  className="font-medium underline decoration-current/35 underline-offset-4 hover:decoration-current"
                >
                  {CARD_FORM.contact}
                </a>
                .
              </>
            )}
          </p>
        </div>
      </section>

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
