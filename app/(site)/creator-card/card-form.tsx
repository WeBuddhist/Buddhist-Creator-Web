"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  ClockIcon,
  FloppyDiskIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  framedCard,
  framedCardInner,
  label as eyebrow,
  primaryButton,
} from "@/components/convention/section-heading";
import { CreatorCard } from "@/components/creator-card/creator-card";
import type { PreparedPhoto } from "@/components/creator-card/photo";
import { PlaceField, TextField, errorText } from "@/components/form/fields";
import { goToBanner, goToField, publishBarHeight, swapBarButtons } from "@/components/form/form-helpers";
import { Button } from "@/components/ui/button";
import { COUNTRIES, isCountry, suggestCountries } from "@/lib/countries";
import {
  CARD_CONTENT_TYPES,
  CARD_FORM,
  CARD_LANGUAGES,
  CARD_NAME_MAX,
  CARD_PATH,
  CARD_SOCIALS,
  COUNTED_SOCIALS,
  CREATOR_TYPES,
  readFollowerCount,
  totalFollowers,
  type CardContent,
  type CardFieldErrors,
  type CardFollowers,
  type CardSocial,
  type CountedSocial,
} from "@/lib/creator-card";
import type { CreatorCardStatus } from "@/lib/db/schema";
import { formatCount, formatDate } from "@/lib/format";
import { loginUrl } from "@/lib/login-url";
import { sessionEnded } from "@/lib/session-ended";
import { cn } from "@/lib/utils";
import { submitCardAction, type CardSaveResult } from "./actions";
import { ChipGroup, LinkField, PhotoField, Section, TaglineField } from "./card-fields";

/** What the form keeps of a card: what the card shows, and the follower
    counts, which it does not. */
type StoredCard = CardContent & { followers: CardFollowers };

/** The creator's card as the page hands it over: what it says and where it
    stands. The reviewer's note comes only with a rejection. `photoUrl` is
    set only for a photo the creator uploaded. */
export type FormCard = StoredCard & {
  status: CreatorCardStatus;
  reviewNote: string | null;
  submittedAt: string | null;
};

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
  /** Each count as typed; a stored one shows with its thousands grouped. */
  followers: Record<CountedSocial, string>;
};

/** "YouTube, Instagram and TikTok". */
const COUNTED_PLACES = new Intl.ListFormat("en-GB", { type: "conjunction" }).format(
  COUNTED_SOCIALS.map(({ label }) => label),
);

function toValues(card: StoredCard | null, accountName: string | null): Values {
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
    followers: Object.fromEntries(
      COUNTED_SOCIALS.map(({ value }) => {
        const count = card?.followers[value];
        return [value, count == null ? "" : formatCount(count)];
      }),
    ) as Record<CountedSocial, string>,
  };
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
   its first input; a link is followed by its follower count. */
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
  ...CARD_SOCIALS.flatMap((social): (readonly [keyof CardFieldErrors, string])[] => [
    [`socials.${social.value}`, `#socials-${social.value}`],
    ...("audience" in social ? [[`followers.${social.value}`, `#followers-${social.value}`] as const] : []),
  ]),
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
    action: { label: "Sign in", onClick: () => window.open(loginUrl(CARD_PATH), "_blank", "noopener") },
  });
}

/** Says what a save did, and takes the creator to the banner that now
    describes the card. `from` is where the card stood when it was sent. */
function showSaved(outcome: SaveOutcome, from: CreatorCardStatus | null, banner: HTMLElement | null) {
  if (outcome === "unchanged") {
    toast("No changes to save", { id: TOAST_ID, description: "Your card is as it was." });
    return;
  }
  // New follower counts alone are kept without a review, so the card
  // stands where it stood and the banner has nothing new to say.
  if (outcome === "counts") {
    toast.success("Follower counts updated", {
      id: TOAST_ID,
      description: from === "approved" ? "Your card stays approved." : "Your card is still in review.",
    });
    return;
  }
  // A rejected card that was sent again is a resubmission, changed or not.
  const [title, description] =
    outcome === "created"
      ? ["Card submitted for review", "Our team will read it. Come back to this page to see where it stands."]
      : from === "rejected"
        ? ["Card resubmitted for review", "Our team will read it again."]
        : ["Changes saved", "The changed card has gone to our team for review."];
  toast.success(title, { id: TOAST_ID, description });
  goToBanner(banner);
}

/* The creator card form, with the card itself beside it filling in as the
   creator types. It behaves as the registration form does
   (app/(site)/convention/2027/register/registration-form.tsx):
   - no card yet: every field is open, and the one action is to submit it
     for review;
   - a card that has been submitted: read-only behind an Edit button, in
     whichever state the review has left it;
   - editing: the fields open again, with Save changes and Cancel. Saving
     sends the changed card back for review and closes the fields.
   The actions live in a bar that stays at the bottom of the viewport while
   the form scrolls, and the banner on top says where the card stands.

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
  const [values, setValues] = React.useState<Values>(() => toValues(card, accountName));
  // The card as last stored, which Cancel goes back to.
  const [stored, setStored] = React.useState(values);
  const [photo, setPhoto] = React.useState<PendingPhoto>(UNTOUCHED);
  // A card exists once it has been submitted, in an earlier visit or this one.
  const [submittedNow, setSubmittedNow] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  // Counts the cancelled edits, to start the country field over each time.
  const [cancelled, setCancelled] = React.useState(0);
  // The messages the creator has since answered: changing an answer takes
  // its message away, rather than leaving it up until the next save.
  const [answered, setAnswered] = React.useState<ReadonlySet<string>>(NONE);
  const formRef = React.useRef<HTMLFormElement>(null);
  const bannerRef = React.useRef<HTMLDivElement>(null);

  const exists = card !== null || submittedNow;
  const editable = !exists || editing;
  // A card submitted in this visit is pending until the page's own copy
  // of it arrives to say so.
  const status: CreatorCardStatus | null = card?.status ?? (exists ? "pending" : null);

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
      // The fields take the card as stored, so a link shows with the
      // "https://" it was kept with, and close until Edit is pressed.
      const kept = toValues(result.saved, null);
      setValues(kept);
      setStored(kept);
      setPhoto(UNTOUCHED);
      setSubmittedNow(true);
      setEditing(false);
      showSaved(result.outcome, from, bannerRef.current);
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

  const refused = save.data && !save.data.ok ? save.data.errors : null;
  const errors: CardFieldErrors =
    editable && refused
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

  const uploadedUrl = card?.photoUrl ?? null;
  const photoUrl =
    photo.kind === "chosen" ? photo.url : photo.kind === "removed" ? accountPicture : (uploadedUrl ?? accountPicture);
  // The counts that read as numbers so far, added up as the table will.
  const total = totalFollowers(
    Object.fromEntries(
      COUNTED_SOCIALS.map(({ value }) => {
        const count = readFollowerCount(values.followers[value]);
        return [value, typeof count === "number" ? count : null];
      }),
    ),
  );
  const preview: CardContent = {
    ...values,
    photoUrl,
    totalFollowers: total,
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editable || save.isPending) return;
    const data = new FormData(event.currentTarget);
    if (photo.kind === "chosen") {
      data.set("photoAction", "replace");
      data.set("photo", photo.blob, "photo");
    } else if (photo.kind === "removed") {
      data.set("photoAction", "remove");
    }
    save.mutate({ data, from: status });
  };

  const startEditing = (event: React.MouseEvent<HTMLElement>) => swapBarButtons(event, () => setEditing(true));
  const cancelEditing = (event: React.MouseEvent<HTMLElement>) =>
    swapBarButtons(event, () => {
      setValues(stored);
      setPhoto(UNTOUCHED);
      setCancelled((count) => count + 1);
      setEditing(false);
      // Puts away the messages of a save that was refused.
      save.reset();
    });

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      aria-describedby="card-form-status"
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-x-10"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <StatusBanner
          ref={bannerRef}
          status={status}
          submittedAt={card?.submittedAt ?? null}
          reviewNote={card?.reviewNote ?? null}
        />

        <Section title="About you">
          <PhotoField
            url={photoUrl}
            ownPhoto={photo.kind === "chosen" || (photo.kind === "untouched" && !!uploadedUrl)}
            hasAccountPicture={!!accountPicture}
            readOnly={!editable}
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
            readOnly={!editable}
          />
          <PlaceField
            // A cancelled edit starts the field over with the stored country.
            key={cancelled}
            id="country"
            label="Country"
            required
            noun="country"
            options={COUNTRIES}
            suggest={suggestCountries}
            value={values.country}
            onChange={(v) => set("country", v)}
            error={errors.country?.[0]}
            readOnly={!editable}
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
            disabled={!editable}
          />
          <TaglineField
            value={values.tagline}
            onChange={(v) => set("tagline", v)}
            error={errors.tagline?.[0]}
            readOnly={!editable}
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
            disabled={!editable}
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
            disabled={!editable}
          />
        </Section>

        <Section
          title="Where to find you"
          description={
            editable
              ? `Add the link for each place you publish. One is enough; add as many as you use. For ${COUNTED_PLACES}, also tell us how many people follow you there.${
                  // Only worth saying once there is a review to send it back to.
                  exists ? " You can update these numbers at any time; that does not send your card back for review." : ""
                }`
              : undefined
          }
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
            {/* Read-only, only the links the card has: an empty box with a
                sample address in it would read as one of them. */}
            {CARD_SOCIALS.filter((social) => editable || values.socials[social.value]).map((social) => {
              const counted = "audience" in social ? social.value : null;
              return (
                <LinkField
                  key={social.value}
                  social={social}
                  readOnly={!editable}
                  value={values.socials[social.value]}
                  // A count's message can be about its link, so a changed
                  // link answers both.
                  onChange={(v) =>
                    set(
                      "socials",
                      { ...values.socials, [social.value]: v },
                      `socials.${social.value}`,
                      `followers.${social.value}`,
                    )
                  }
                  error={errors[`socials.${social.value}`]?.[0]}
                  followers={counted ? values.followers[counted] : undefined}
                  onFollowersChange={
                    counted
                      ? (v) => set("followers", { ...values.followers, [counted]: v }, `followers.${counted}`)
                      : undefined
                  }
                  followersError={counted ? errors[`followers.${counted}`]?.[0] : undefined}
                />
              );
            })}
          </fieldset>
          {errors.socials && (
            <p id="socials-error" className={errorText}>
              {errors.socials[0]}
            </p>
          )}
          {/* The figure creators are ranked on, added up as it is typed. */}
          {total !== null && (
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

        {/* On a phone the card comes after the questions, just above the
            bar that sends it. */}
        <CardPreview id="card-preview-below" card={preview} editable={editable} verified={!editable && status === "approved"} className="lg:hidden" />

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
            {editable ? (
              <React.Fragment key="editing">
                <Button
                  type="submit"
                  size="pill"
                  disabled={save.isPending}
                  className={cn(primaryButton, "w-full sm:w-auto")}
                >
                  {!exists ? "Submit for review" : status === "rejected" ? "Resubmit for review" : "Save changes"}
                  {exists && status !== "rejected" ? (
                    <FloppyDiskIcon data-icon="inline-end" weight="bold" />
                  ) : (
                    <PaperPlaneTiltIcon data-icon="inline-end" weight="bold" />
                  )}
                </Button>
                {exists && (
                  <Button
                    type="button"
                    size="pill"
                    variant="outline"
                    disabled={save.isPending}
                    onClick={cancelEditing}
                  >
                    Cancel
                  </Button>
                )}
              </React.Fragment>
            ) : (
              <Button
                key="reading"
                type="button"
                size="pill"
                variant="outline"
                onClick={startEditing}
                className="w-full sm:w-auto"
              >
                <PencilSimpleIcon data-icon="inline-start" weight="bold" />
                Edit card
              </Button>
            )}
            {/* Always mounted, so screen readers announce changes to it. */}
            <p
              id="card-form-status"
              role="status"
              aria-live="polite"
              className="ms-auto flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm"
            >
              <BarStatus
                pending={save.isPending}
                exists={exists}
                editable={editable}
                status={status}
                submittedAt={card?.submittedAt ?? null}
              />
            </p>
          </div>
        </div>
      </div>

      {/* Beside the form on a wide screen, where the card stays in view
          when the window is tall enough to show all of it (about 53rem
          with the header and the label above it). On a shorter one it
          scrolls with the page, or its links would stay below the fold. */}
      <CardPreview
        id="card-preview-beside"
        card={preview}
        editable={editable} verified={!editable && status === "approved"}
        className="hidden lg:top-[calc(var(--header-height)+1.5rem)] lg:block lg:[@media(min-height:53rem)]:sticky"
      />
    </form>
  );
}

/* ---------------------------------------------------------------------- */

/* The card as it reads, drawn from the form's own values. While the fields
   are open it is a preview: what is missing shows as a prompt and the
   links are not live, since what is typed is not a checked address yet.
   Read-only, it is the stored card, links and all. It is rendered twice,
   once for each layout, and the one not in use is not displayed. */
function CardPreview({
  id,
  card,
  editable,
  verified,
  className,
}: {
  id: string;
  card: CardContent;
  editable: boolean;
  /** The stored card is approved. While the fields are open it is a
      draft of a change, which nobody has approved yet. */
  verified: boolean;
  className?: string;
}) {
  return (
    <aside aria-labelledby={id} className={className}>
      <h2 id={id} className={cn(eyebrow, "text-muted-foreground")}>
        Your card
      </h2>
      <CreatorCard
        card={card}
        preview={editable}
        verified={verified}
        className="mt-3"
      />
      {editable && <p className="mt-3 text-sm leading-[1.5] text-muted-foreground">It fills in as you answer.</p>}
    </aside>
  );
}

/* The line at the end of the action bar: what is happening, or where the
   card stands. On a phone the resting lines that only repeat the banner
   are read but not shown, so the buttons keep the room. */
function BarStatus({
  pending,
  exists,
  editable,
  status,
  submittedAt,
}: {
  pending: boolean;
  exists: boolean;
  editable: boolean;
  status: CreatorCardStatus | null;
  submittedAt: string | null;
}) {
  if (pending) return exists ? "Saving…" : "Submitting…";
  if (!exists) return <span className="max-sm:sr-only">Not submitted yet</span>;
  if (editable) return <span className="max-sm:sr-only">Changes go to our team for review</span>;
  if (status === "approved") {
    return (
      <>
        <CheckCircleIcon className="size-4 shrink-0 text-brand-forest" weight="fill" aria-hidden />
        Approved
      </>
    );
  }
  if (status === "rejected") {
    return (
      <>
        <WarningCircleIcon className="size-4 shrink-0 text-brand-maroon" weight="fill" aria-hidden />
        Not approved
      </>
    );
  }
  return (
    <>
      <ClockIcon className="size-4 shrink-0 text-brand-cyan" weight="bold" aria-hidden />
      <span>
        In review
        {submittedAt && <span className="max-sm:sr-only">, submitted {formatDate(submittedAt)}</span>}
      </span>
    </>
  );
}

/* The one place the card's standing is spelled out. It takes focus when a
   save lands, so the reader arrives on the new state. */
function StatusBanner({
  ref,
  status,
  submittedAt,
  reviewNote,
}: {
  ref: React.Ref<HTMLDivElement>;
  status: CreatorCardStatus | null;
  submittedAt: string | null;
  reviewNote: string | null;
}) {
  const sent = submittedAt ? ` on ${formatDate(submittedAt)}` : "";
  let tone = "border-border bg-card text-muted-foreground";
  let icon: React.ReactNode = null;
  let text: React.ReactNode;

  if (!status) {
    text =
      "Fill in your card and submit it for review. Nothing is saved until you submit, and you can edit your card afterwards.";
  } else if (status === "pending") {
    tone = "border-brand-cyan/30 bg-brand-cyan/5 text-foreground";
    icon = <ClockIcon className="mt-0.5 size-4 shrink-0 text-brand-cyan" weight="bold" aria-hidden />;
    text = `Your card was submitted for review${sent}. Our team is reading it. To change anything, choose Edit card below.`;
  } else if (status === "approved") {
    tone = "border-brand-forest/30 bg-brand-forest/5 text-foreground";
    icon = <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-brand-forest" weight="fill" aria-hidden />;
    text =
      "Your card is approved. To change anything, choose Edit card below; a changed card goes back to our team for review.";
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
            <span className="mt-2 block">Choose Edit card below, make the changes and resubmit.</span>
          </>
        ) : (
          <>
            Choose Edit card below, change what needs changing and resubmit, or write to{" "}
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
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className={cn(
        "flex scroll-mt-[calc(var(--header-height)+1.5rem)] items-start gap-3 rounded-xl border px-4 py-3.5 text-sm leading-[1.5] focus-visible:ring-3 focus-visible:ring-ring/50",
        tone,
      )}
    >
      {icon}
      <div className="min-w-0">{text}</div>
    </div>
  );
}
