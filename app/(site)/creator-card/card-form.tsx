"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ClockIcon,
  FloppyDiskIcon,
  PaperPlaneTiltIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  framedCard,
  framedCardInner,
  primaryButton,
} from "@/components/convention/section-heading";
import type { PreparedPhoto } from "@/components/creator-card/photo";
import { PlaceField, TextField, errorText } from "@/components/form/fields";
import { goToField, publishBarHeight } from "@/components/form/form-helpers";
import { Button } from "@/components/ui/button";
import { COUNTRIES, isCountry, suggestCountries } from "@/lib/countries";
import {
  CARD_CONTENT_TYPES,
  CARD_EDIT_PATH,
  CARD_FORM,
  CARD_LANGUAGES,
  CARD_NAME_MAX,
  CARD_PATH,
  CARD_READING,
  CARD_SOCIALS,
  COUNTED_SOCIALS,
  CREATOR_TYPES,
  socialLinkKey,
  type CardContent,
  type CardFieldErrors,
  type CardFollowers,
  type CardSocial,
  type CountedSocial,
} from "@/lib/creator-card";
import type { CreatorCardStatus, FollowerCheckStatus } from "@/lib/db/schema";
import { formatCount, formatDate } from "@/lib/format";
import { loginUrl } from "@/lib/login-url";
import { sessionEnded } from "@/lib/session-ended";
import { cn } from "@/lib/utils";
import { submitCardAction, type CardSaveResult } from "./actions";
import { ChipGroup, LinkField, PhotoField, Section, TaglineField } from "./card-fields";

/** The creator's card as the page hands it over: what it says and where it
    stands. The reviewer's note comes only with a rejection. `photoUrl` is
    set only for a photo the creator uploaded.

    The follower counts come with it to be shown, never to be changed
    here: `followers` is the figure the card has for each counted place,
    and `checks` where the latest reading of its link stands. */
export type FormCard = CardContent & {
  status: CreatorCardStatus;
  reviewNote: string | null;
  submittedAt: string | null;
  followers: CardFollowers;
  checks: Partial<Record<CountedSocial, { status: FollowerCheckStatus; checkedAt: string }>>;
};

/** What the fields are filled from: a stored card, or one just saved. */
type FieldSource = Pick<
  CardContent,
  | "displayName"
  | "country"
  | "creatorType"
  | "languages"
  | "languagesOther"
  | "contentTypes"
  | "contentTypesOther"
  | "tagline"
  | "socials"
>;

type Values = {
  displayName: string;
  country: string;
  creatorType: string;
  languages: string[];
  languagesOther: string;
  contentTypes: string[];
  contentTypesOther: string;
  tagline: string;
  socials: Record<CardSocial, string>;
};

/** "YouTube, Instagram and TikTok". */
const COUNTED_PLACES = new Intl.ListFormat("en-GB", { type: "conjunction" }).format(
  COUNTED_SOCIALS.map(({ label }) => label),
);

function toValues(card: FieldSource | null, accountName: string | null): Values {
  // A country that is not on the list cannot be shown by the field: it
  // reads as unanswered, to be picked again.
  const country = card?.country && isCountry(card.country) ? card.country : "";
  return {
    // A new card starts from the name on the account, there to be changed.
    displayName: card ? card.displayName : (accountName ?? "").slice(0, CARD_NAME_MAX),
    country,
    creatorType: card?.creatorType ?? "",
    languages: card?.languages ?? [],
    languagesOther: card?.languagesOther ?? "",
    contentTypes: card?.contentTypes ?? [],
    contentTypesOther: card?.contentTypesOther ?? "",
    tagline: card?.tagline ?? "",
    socials: Object.fromEntries(CARD_SOCIALS.map(({ value }) => [value, card?.socials[value] ?? ""])) as Record<
      CardSocial,
      string
    >,
  };
}

/** What stands beside a counted link: the figure read from it, and a line
    saying where that reading stands. Nothing for a place with no link. A
    link that is not the stored one, new or changed in this visit, has no
    figure yet: the stored one was read from another account. */
function audienceOf(card: FormCard | null, place: CountedSocial, typed: string) {
  const link = typed.trim();
  if (!link) return undefined;
  const stored = card?.socials[place]?.trim();
  const same =
    !!stored &&
    socialLinkKey(place, /^https?:\/\//i.test(link) ? link : `https://${link}`) === socialLinkKey(place, stored);
  if (!card || !same) return { count: null, note: "We read this from your link once your card is approved." };

  const figure = card.followers[place];
  const count = figure == null ? null : formatCount(figure);
  const check = card.checks[place];
  if (check?.status === "ok") return { count, note: CARD_READING.lastRead(place, formatDate(check.checkedAt)) };
  if (check?.status === "not_found" || check?.status === "unreadable") return { count, note: CARD_READING.failed };
  // Only an approved card's links are read.
  if (card.status !== "approved") return { count, note: CARD_READING.onApproval };
  return { count, note: count ? CARD_READING.steady(place) : CARD_READING.soon };
}

/* What this visit has done about the photo and not yet sent: nothing, a
   newly chosen picture (ready to upload, shown from its own data), or a
   return to the account's picture. */
type PendingPhoto = { kind: "untouched" } | ({ kind: "chosen" } & PreparedPhoto) | { kind: "removed" };
const UNTOUCHED: PendingPhoto = { kind: "untouched" };
const NONE: ReadonlySet<string> = new Set();

type SaveOutcome = Extract<CardSaveResult, { ok: true }>["outcome"];

const TOAST_ID = "creator-card";

/* Each answer that can be refused, in the order of the form, with the
   element to go to for it. A group of chips or links is reached through
   its first input. */
const PROBLEM_FIELDS: readonly (readonly [keyof CardFieldErrors, string])[] = [
  ["photo", "[data-photo-button]"],
  ["displayName", "#displayName"],
  ["country", "#country"],
  ["creatorType", 'input[name="creatorType"]'],
  ["tagline", "#tagline"],
  ["languages", 'input[name="languages"]'],
  ["languagesOther", "#languagesOther"],
  ["contentTypes", 'input[name="contentTypes"]'],
  ["contentTypesOther", "#contentTypesOther"],
  ...CARD_SOCIALS.map(
    (social): readonly [keyof CardFieldErrors, string] => [`socials.${social.value}`, `#socials-${social.value}`],
  ),
  ["socials", `#socials-${CARD_SOCIALS[0].value}`],
];

/** Says a save was refused, and takes the creator to the first answer to fix. */
function showProblems(form: HTMLFormElement | null, errors: CardFieldErrors) {
  const problem = errors.form?.[0];
  toast.error(problem ? "Could not save" : "A few answers need attention", {
    id: TOAST_ID,
    description: problem ?? "Fix the highlighted answers, then try again.",
    duration: 8000,
    closeButton: true,
  });
  goToField(form, PROBLEM_FIELDS.find(([key]) => errors[key])?.[1]);
}

/** Says the sign-in has ended, and offers the way back that keeps what is
    on the page: signing in again in another tab, then saving from this one. */
function showSignedOut() {
  toast.error("You have been signed out", {
    id: TOAST_ID,
    description: "Sign in again, then come back to this tab and save. Your changes are still here.",
    duration: Infinity,
    closeButton: true,
    action: { label: "Sign in", onClick: () => window.open(loginUrl(CARD_EDIT_PATH), "_blank", "noopener") },
  });
}

/** Says what a save did, as the creator arrives back on their own page,
    which shows the card as it now stands. `from` is where the card stood
    when it was sent. */
function showSaved(outcome: SaveOutcome, from: CreatorCardStatus | null) {
  if (outcome === "unchanged") {
    toast("No changes to save", { id: TOAST_ID, description: "Your card is as it was." });
    return;
  }
  // A rejected card that was sent again is a resubmission, changed or not.
  const [title, description] =
    outcome === "created"
      ? ["Card submitted for review", "Our team will read it. This page shows where it stands."]
      : from === "rejected"
        ? ["Card resubmitted for review", "Our team will read it again."]
        : ["Changes saved", "The changed card has gone to our team for review."];
  toast.success(title, { id: TOAST_ID, description });
}

/* The creator card form, one column of questions with no preview of the
   card beside it (the user's choice: the card is seen on the creator's own
   page). It is on its own page (./edit/page.tsx), which a creator
   comes to only to make a card or to change one; the creator's own page
   (./page.tsx) is where a card that has been sent is read. So the fields
   here are always open:
   - no card yet: the one action is to submit it for review;
   - a card that has been submitted: Save changes sends the changed card
     back for review, and Cancel leaves it as it was.
   Both end on the creator's page, which then shows the card as it stands.
   The actions live in a bar that stays at the bottom of the viewport while
   the form scrolls, and the banner on top says what a save will do.

   Saving is a React Query mutation around the server action. It gives the
   form its pending state and the result, and its callbacks are where the
   result is acted on, so nothing here watches for one in an effect. The
   form sends itself from onSubmit rather than through `action`: React
   resets a form after its action, and a reset puts every checkbox and
   radio back to how it was when the page loaded, whatever the state says.
   A chip ticked in this visit would then look chosen and be missing from
   the next save. */
export function CardForm({
  card,
  accountName,
  accountPicture,
}: {
  card: FormCard | null;
  accountName: string | null;
  /** The picture from the sign-in account: the card's photo by default. */
  accountPicture: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<Values>(() => toValues(card, accountName));
  const [photo, setPhoto] = React.useState<PendingPhoto>(UNTOUCHED);
  // The messages the creator has since answered: changing an answer takes
  // its message away, rather than leaving it up until the next save.
  const [answered, setAnswered] = React.useState<ReadonlySet<string>>(NONE);
  const formRef = React.useRef<HTMLFormElement>(null);

  const exists = card !== null;
  const status: CreatorCardStatus | null = card?.status ?? null;

  const save = useMutation({
    mutationFn: async ({ data }: { data: FormData; from: CreatorCardStatus | null }): Promise<CardSaveResult> => {
      try {
        return await submitCardAction(data);
      } catch (error) {
        // A session that ended while the form was open is turned away
        // before the action runs, and arrives here as a failed request.
        if (await sessionEnded()) return { ok: false, errors: {}, signedOut: true };
        throw error;
      }
    },
    onMutate: () => setAnswered(NONE),
    onSuccess: (result, { from }) => {
      if (!result.ok) {
        if (result.signedOut) showSignedOut();
        else showProblems(formRef.current, result.errors);
        return;
      }
      // Back to the creator's own page, which the save has made anew.
      showSaved(result.outcome, from);
      router.push(CARD_PATH);
    },
    // The action never throws for a refused save, and a signed-out session
    // is caught above; this is the request itself failing, a dropped
    // connection most likely.
    onError: () =>
      toast.error("Could not save", {
        id: TOAST_ID,
        description: "We could not reach the site. Check your connection and try again.",
        duration: 8000,
        closeButton: true,
      }),
  });

  // A good save keeps the bar busy until the creator's page replaces this one.
  const busy = save.isPending || save.data?.ok === true;
  const refused = save.data && !save.data.ok ? save.data.errors : null;
  const errors: CardFieldErrors = refused
    ? Object.fromEntries(Object.entries(refused).filter(([key]) => !answered.has(key)))
    : {};
  const answer = (...keys: string[]) => {
    if (refused) setAnswered((previous) => new Set([...previous, ...keys]));
  };
  /** Sets one answer and clears its message, and any that hang on it. */
  const set = <K extends keyof Values>(key: K, value: Values[K], ...alsoAnswers: string[]) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    answer(key, ...alsoAnswers);
  };

  // The figure the card is ranked on, as the table has it.
  const total = card?.totalFollowers ?? 0;
  const uploadedUrl = card?.photoUrl ?? null;
  const photoUrl =
    photo.kind === "chosen" ? photo.url : photo.kind === "removed" ? accountPicture : (uploadedUrl ?? accountPicture);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    if (photo.kind === "chosen") {
      data.set("photoAction", "replace");
      data.set("photo", photo.blob, "photo");
    } else if (photo.kind === "removed") {
      data.set("photoAction", "remove");
    }
    save.mutate({ data, from: status });
  };

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      aria-describedby="card-form-status"
      className="w-full"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <StatusBanner status={status} reviewNote={card?.reviewNote ?? null} />

        <Section title="About you">
          <PhotoField
            url={photoUrl}
            ownPhoto={photo.kind === "chosen" || (photo.kind === "untouched" && !!uploadedUrl)}
            hasAccountPicture={!!accountPicture}
            error={errors.photo?.[0]}
            onChoose={(chosen) => {
              setPhoto({ kind: "chosen", ...chosen });
              answer("photo");
            }}
            onReset={() => {
              // Nothing uploaded to take back: this only drops the choice.
              setPhoto(uploadedUrl ? { kind: "removed" } : UNTOUCHED);
              answer("photo");
            }}
          />
          <TextField
            id="displayName"
            label="Display name"
            hint="The name on your card: your own, or the name of your channel or organization."
            required
            value={values.displayName}
            onChange={(v) => set("displayName", v)}
            error={errors.displayName?.[0]}
            maxLength={CARD_NAME_MAX}
            autoComplete="name"
          />
          <PlaceField
            id="country"
            label="Country"
            required
            noun="country"
            options={COUNTRIES}
            suggest={suggestCountries}
            value={values.country}
            onChange={(v) => set("country", v)}
            error={errors.country?.[0]}
          />
          <ChipGroup
            type="radio"
            name="creatorType"
            legend="I create as a"
            required
            options={CREATOR_TYPES}
            selected={values.creatorType ? [values.creatorType] : []}
            onChange={(v) => set("creatorType", v[0] ?? "")}
            error={errors.creatorType?.[0]}
          />
          <TaglineField
            value={values.tagline}
            onChange={(v) => set("tagline", v)}
            error={errors.tagline?.[0]}
          />
        </Section>

        <Section title="Your work">
          <ChipGroup
            type="checkbox"
            name="languages"
            legend="Languages you publish in"
            hint="Choose every language you make content in."
            required
            options={CARD_LANGUAGES}
            selected={values.languages}
            onChange={(v) => set("languages", v, "languagesOther")}
            other={values.languagesOther}
            onOtherChange={(v) => set("languagesOther", v)}
            otherLabel="Which other language?"
            error={errors.languages?.[0] ?? errors.languagesOther?.[0]}
          />
          <ChipGroup
            type="checkbox"
            name="contentTypes"
            legend="What type of content do you make?"
            hint="Choose all that fit."
            required
            options={CARD_CONTENT_TYPES}
            selected={values.contentTypes}
            onChange={(v) => set("contentTypes", v, "contentTypesOther")}
            other={values.contentTypesOther}
            onOtherChange={(v) => set("contentTypesOther", v)}
            otherLabel="What other content?"
            error={errors.contentTypes?.[0] ?? errors.contentTypesOther?.[0]}
          />
        </Section>

        <Section
          title="Where to find you"
          description={`Add the link for each place you publish. One is enough; add as many as you use. For ${COUNTED_PLACES}, we read how many people follow you from the link itself, every week (every three months on Douyin), so there is no number to type.`}
          required
        >
          {/* The links are one answer in several parts: the group carries
              the "at least one" message, each field its own. */}
          <fieldset
            aria-label="Your links"
            aria-invalid={!!errors.socials || undefined}
            aria-describedby={errors.socials ? "socials-error" : undefined}
            // On a phone a count sits under its link, so the places stand
            // further apart than the two halves of one.
            className="grid gap-x-5 gap-y-6 sm:grid-cols-2 sm:gap-y-4"
          >
            {CARD_SOCIALS.map((social) => {
              const counted = "audience" in social ? social.value : null;
              return (
                <LinkField
                  key={social.value}
                  social={social}
                  value={values.socials[social.value]}
                  onChange={(v) => set("socials", { ...values.socials, [social.value]: v }, `socials.${social.value}`)}
                  error={errors[`socials.${social.value}`]?.[0]}
                  audience={counted ? audienceOf(card, counted, values.socials[counted]) : undefined}
                />
              );
            })}
          </fieldset>
          {errors.socials && (
            <p id="socials-error" className={errorText}>
              {errors.socials[0]}
            </p>
          )}
          {/* The figure creators are ranked on. */}
          {total > 0 && (
            <p className="flex items-baseline justify-between gap-4 border-t border-border pt-5 text-sm">
              <span className="min-w-0">
                <span className="font-medium">Total followers</span>
                <span className="block text-muted-foreground sm:ms-2 sm:inline">{COUNTED_PLACES} together</span>
              </span>
              <span className="font-display text-2xl leading-none tabular-nums">{formatCount(total)}</span>
            </p>
          )}
        </Section>

        {errors.form && (
          <p className={cn(errorText, "text-base")} role="alert">
            {errors.form[0]}
          </p>
        )}

        {/* The actions, floating at the foot of the viewport for as long
            as the form is on screen. On a phone the main button takes the
            full row and the status the next; from sm up it is one row with
            the status at the trailing end. */}
        <div
          ref={publishBarHeight}
          data-action-bar
          className={cn(framedCard, "sticky bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-30")}
        >
          {/* The form's double border, with the lift of something that
              floats over the page in place of the surface's resting one. */}
          <div
            className={cn(
              framedCardInner,
              "flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 shadow-float sm:flex-nowrap",
            )}
          >
            <Button type="submit" size="pill" disabled={busy} className={cn(primaryButton, "w-full sm:w-auto")}>
              {!exists ? "Submit for review" : status === "rejected" ? "Resubmit for review" : "Save changes"}
              {exists && status !== "rejected" ? (
                <FloppyDiskIcon data-icon="inline-end" weight="bold" />
              ) : (
                <PaperPlaneTiltIcon data-icon="inline-end" weight="bold" />
              )}
            </Button>
            {/* Leaves the card as it was, for the creator's own page. */}
            <Button
              size="pill"
              variant="outline"
              nativeButton={false}
              render={<Link href={CARD_PATH} />}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            {/* Always mounted, so screen readers announce changes to it. */}
            <p
              id="card-form-status"
              role="status"
              aria-live="polite"
              className="ms-auto flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm"
            >
              <BarStatus pending={busy} exists={exists} />
            </p>
          </div>
        </div>
      </div>

    </form>
  );
}

/* ---------------------------------------------------------------------- */

/* The line at the end of the action bar: what is happening, or what a
   save will do. On a phone the resting lines, which only repeat the
   banner, are read but not shown, so the buttons keep the room. */
function BarStatus({ pending, exists }: { pending: boolean; exists: boolean }) {
  if (pending) return exists ? "Saving…" : "Submitting…";
  if (!exists) return <span className="max-sm:sr-only">Not submitted yet</span>;
  return <span className="max-sm:sr-only">Changes go to our team for review</span>;
}

/* What a save will do, above the fields, as the card stands now. For a
   card that was sent back it carries our team's note, which is what the
   creator is here to answer. */
function StatusBanner({ status, reviewNote }: { status: CreatorCardStatus | null; reviewNote: string | null }) {
  let tone = "border-border bg-card text-muted-foreground";
  let icon: React.ReactNode = null;
  let text: React.ReactNode;

  if (!status) {
    text =
      "Fill in your card and submit it for review. Nothing is saved until you submit, and you can edit your card afterwards.";
  } else if (status === "pending") {
    tone = "border-brand-cyan/30 bg-brand-cyan/5 text-foreground";
    icon = <ClockIcon className="mt-0.5 size-4 shrink-0 text-brand-cyan" weight="bold" aria-hidden />;
    text = "Your card is with our team. Saving a change sends the changed card for review in its place.";
  } else if (status === "approved") {
    tone = "border-brand-forest/30 bg-brand-forest/5 text-foreground";
    icon = <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-brand-forest" weight="fill" aria-hidden />;
    text =
      "Your card is approved. A changed card goes back to our team for review, and is out of the directory and the leaderboard until it is approved again.";
  } else {
    tone = "border-brand-maroon/30 bg-brand-maroon/5 text-foreground";
    icon = <WarningCircleIcon className="mt-0.5 size-4 shrink-0 text-brand-maroon" weight="fill" aria-hidden />;
    text = (
      <>
        Your card was not approved yet.{" "}
        {reviewNote ? (
          <>
            A note from our team:
            <span className="mt-2 block whitespace-pre-line wrap-anywhere border-s-2 border-brand-maroon/40 ps-3">
              {reviewNote}
            </span>
            <span className="mt-2 block">Make the changes and resubmit.</span>
          </>
        ) : (
          <>
            Change what needs changing and resubmit, or write to{" "}
            <a
              href={`mailto:${CARD_FORM.contact}`}
              className="font-medium underline decoration-current/35 underline-offset-4 hover:decoration-current"
            >
              {CARD_FORM.contact}
            </a>{" "}
            if you are not sure what to change.
          </>
        )}
      </>
    );
  }

  return (
    <div role="status" className={cn("flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm leading-[1.5]", tone)}>
      {icon}
      <div className="min-w-0">{text}</div>
    </div>
  );
}
