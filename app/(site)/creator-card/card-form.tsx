"use client";

import * as React from "react";
import { startTransition, useActionState } from "react";
import {
  ArrowCounterClockwiseIcon,
  CameraIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  FacebookLogoIcon,
  GlobeSimpleIcon,
  InstagramLogoIcon,
  PaperPlaneTiltIcon,
  TiktokLogoIcon,
  WarningCircleIcon,
  XLogoIcon,
  YoutubeLogoIcon,
  type Icon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { card as cardFrame, label as eyebrow, primaryButton } from "@/components/convention/section-heading";
import { CardPhoto } from "@/components/creator-card/card-photo";
import { CreatorCard } from "@/components/creator-card/creator-card";
import { PhotoProblem, squarePhoto } from "@/components/creator-card/photo";
import { PlaceField, RequiredMark, TextField, errorText, field } from "@/components/form/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COUNTRIES, isCountry, suggestCountries } from "@/lib/countries";
import {
  CARD_CONTENT_TYPES,
  CARD_FORM,
  CARD_LANGUAGES,
  CARD_NAME_MAX,
  CARD_SOCIALS,
  CARD_TAGLINE_MAX,
  CREATOR_TYPES,
  type CardContent,
  type CardFieldErrors,
  type CardSocial,
} from "@/lib/creator-card";
import type { CreatorCardStatus } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";
import type { Option } from "@/lib/registration-2027";
import { cn } from "@/lib/utils";
import { submitCardAction, type CardFormState } from "./actions";

/** The creator's card as the page hands it over: what it says and where it
    stands. The reviewer's note comes only with a rejection. `photoUrl` is
    set only for a photo the creator uploaded. */
export type FormCard = CardContent & {
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
};

function toValues(card: CardContent | null, accountName: string | null): Values {
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

const SOCIAL_ICON: Record<CardSocial, Icon> = {
  youtube: YoutubeLogoIcon,
  instagram: InstagramLogoIcon,
  facebook: FacebookLogoIcon,
  tiktok: TiktokLogoIcon,
  x: XLogoIcon,
  website: GlobeSimpleIcon,
};

const sectionTitle = "font-display text-2xl leading-[1.15] text-foreground";
const TOAST_ID = "creator-card";
const INITIAL: CardFormState = { ok: false };

type PendingPhoto = { kind: "untouched" } | { kind: "chosen"; blob: Blob; url: string } | { kind: "removed" };
const UNTOUCHED: PendingPhoto = { kind: "untouched" };
const NONE: ReadonlySet<string> = new Set();

/* The creator card form, with the card itself beside it filling in as the
   creator types. There is one action: send the card for review. Every
   later change is sent the same way, so the button is all there is to
   learn; the banner on top says where the card stands and what pressing
   the button will do.

   Inputs are controlled, so the card can be drawn from them. The form
   sends itself from onSubmit rather than through `action`: React resets a
   form after its action, and a reset puts every checkbox and radio back to
   how it was when the page loaded, whatever the state says. A chip ticked
   in this visit would then look chosen and be missing from the next save. */
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
  const [state, formAction, pending] = useActionState<CardFormState, FormData>(submitCardAction, INITIAL);
  const [values, setValues] = React.useState<Values>(() => toValues(card, accountName));
  // What this visit has done about the photo and not yet sent: nothing, a
  // newly chosen picture (ready to upload, shown from memory), or a return
  // to the account's picture.
  const [photo, setPhoto] = React.useState<PendingPhoto>(UNTOUCHED);
  const formRef = React.useRef<HTMLFormElement>(null);
  const bannerRef = React.useRef<HTMLDivElement>(null);

  // A save that went through hands back the card as stored: the fields
  // take it, so a link shows with the "https://" it was kept with. Done
  // during render, so the fields and the result arrive in the same frame.
  const [seenState, setSeenState] = React.useState(state);
  // The messages the creator has since answered: changing an answer takes
  // its message away, rather than leaving it up until the next send.
  const [answered, setAnswered] = React.useState<ReadonlySet<string>>(NONE);
  if (state !== seenState) {
    setSeenState(state);
    setAnswered(NONE);
    if (state.ok && state.saved) {
      setValues(toValues(state.saved, null));
      // The photo is stored now; the page's own copy of the card has it.
      setPhoto(UNTOUCHED);
    }
  }

  // A chosen picture is shown from memory; let go of it when it is
  // replaced, sent, or the page is left.
  const chosenUrl = photo.kind === "chosen" ? photo.url : null;
  React.useEffect(() => {
    if (!chosenUrl) return;
    return () => URL.revokeObjectURL(chosenUrl);
  }, [chosenUrl]);

  const uploadedUrl = card?.photoUrl ?? null;
  const photoUrl = photo.kind === "chosen" ? photo.url : photo.kind === "removed" ? accountPicture : (uploadedUrl ?? accountPicture);
  /** Whether the card shows, or is about to show, the creator's own upload. */
  const ownPhoto = photo.kind === "chosen" || (photo.kind === "untouched" && !!uploadedUrl);

  const errors: CardFieldErrors = Object.fromEntries(
    Object.entries(state.errors ?? {}).filter(([key]) => !answered.has(key)),
  );
  /** Sets one answer and clears its message, and any that hang on it. */
  const set = <K extends keyof Values>(key: K, value: Values[K], ...alsoAnswers: string[]) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    if (state.errors) setAnswered((previous) => new Set([...previous, key, ...alsoAnswers]));
  };

  // Each result is announced once: a toast, and focus moved to where the
  // result is, the banner on success or the first answer to fix.
  const handled = React.useRef(state);
  React.useEffect(() => {
    if (handled.current === state) return;
    handled.current = state;
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";

    if (state.ok) {
      if (state.outcome === "unchanged") {
        toast("Nothing to send", { id: TOAST_ID, description: "Your card is already saved exactly like this." });
        return;
      }
      toast.success(state.outcome === "created" ? "Card sent for review" : "Changes sent for review", {
        id: TOAST_ID,
        description: "Our team will read it. Come back to this page to see where it stands.",
      });
      bannerRef.current?.scrollIntoView({ behavior, block: "start" });
      bannerRef.current?.focus({ preventScroll: true });
      return;
    }

    const problem = state.errors?.form?.[0];
    toast.error(problem ? "Could not save" : "A few answers need attention", {
      id: TOAST_ID,
      description: problem ?? "Fix the highlighted answers, then send it again.",
      duration: 8000,
      closeButton: true,
    });
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    const target = invalid?.matches("fieldset") ? invalid.querySelector<HTMLElement>("input") : invalid;
    invalid?.scrollIntoView({ behavior, block: "center" });
    target?.focus({ preventScroll: true });
  }, [state]);

  const status = card?.status ?? null;
  const preview: CardContent = { ...values, photoUrl };

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const data = new FormData(event.currentTarget);
        if (photo.kind === "chosen") {
          data.set("photoAction", "replace");
          data.set("photo", photo.blob, "photo");
        } else if (photo.kind === "removed") {
          data.set("photoAction", "remove");
        }
        startTransition(() => formAction(data));
      }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-x-10"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <StatusBanner ref={bannerRef} card={card} />

        <Section title="About you">
          <PhotoField
            url={photoUrl}
            ownPhoto={ownPhoto}
            hasAccountPicture={!!accountPicture}
            error={errors.photo?.[0]}
            onChoose={(blob) => {
              setPhoto({ kind: "chosen", blob, url: URL.createObjectURL(blob) });
              if (state.errors) setAnswered((previous) => new Set([...previous, "photo"]));
            }}
            onReset={() => {
              // Nothing uploaded to take back: this only drops the choice.
              setPhoto(uploadedUrl ? { kind: "removed" } : UNTOUCHED);
              if (state.errors) setAnswered((previous) => new Set([...previous, "photo"]));
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
          <TaglineField value={values.tagline} onChange={(v) => set("tagline", v)} error={errors.tagline?.[0]} />
        </Section>

        <Section
          title="Where to find you"
          description="Add the link for each place you publish. One is enough; add as many as you use."
          required
        >
          {/* The links are one answer in several parts: the group carries
              the "at least one" message, each field its own. */}
          <fieldset
            aria-label="Your links"
            aria-invalid={!!errors.socials || undefined}
            aria-describedby={errors.socials ? "socials-error" : undefined}
            className="grid gap-x-5 gap-y-4 sm:grid-cols-2"
          >
            {CARD_SOCIALS.map((social) => (
              <LinkField
                key={social.value}
                social={social}
                value={values.socials[social.value]}
                onChange={(v) => set("socials", { ...values.socials, [social.value]: v }, `socials.${social.value}`)}
                error={errors[`socials.${social.value}`]?.[0]}
              />
            ))}
          </fieldset>
          {errors.socials && (
            <p id="socials-error" className={errorText}>
              {errors.socials[0]}
            </p>
          )}
        </Section>

        {errors.form && (
          <p className={cn(errorText, "text-base")} role="alert">
            {errors.form[0]}
          </p>
        )}
      </div>

      {/* The card, as it will read. Beside the form on a wide screen, where
          it stays in view; on a phone it comes after the questions, just
          above the button that sends it. */}
      <aside aria-labelledby="card-preview-title" className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:row-span-2">
        <h2 id="card-preview-title" className={cn(eyebrow, "text-muted-foreground")}>
          Your card
        </h2>
        <CreatorCard card={preview} preview className="mt-3 shadow-[0_1px_2px_rgb(18_34_42/0.04),0_12px_32px_-16px_rgb(18_34_42/0.18)]" />
        <p className="mt-3 text-sm leading-[1.5] text-muted-foreground">It fills in as you answer.</p>
      </aside>

      <div className={cn(cardFrame, "min-w-0")}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-card px-5 py-4 sm:px-6">
          <Button
            type="submit"
            size="pill"
            // Focusable while it works, so the reader's place is not lost;
            // onSubmit ignores a second press.
            aria-disabled={pending}
            className={cn(primaryButton, "w-full sm:w-auto", pending && "cursor-default opacity-70")}
          >
            {pending ? "Sending…" : submitLabel(status)}
            <PaperPlaneTiltIcon data-icon="inline-end" weight="bold" />
          </Button>
          <p className="min-w-0 flex-1 basis-56 text-sm leading-[1.5] text-muted-foreground">
            {status === "approved"
              ? "Changes to an approved card are read by our team again before they count."
              : "Our team reads every card before it is approved."}
          </p>
        </div>
      </div>
    </form>
  );
}

function submitLabel(status: CreatorCardStatus | null) {
  if (status === "pending") return "Save changes";
  if (status === "approved") return "Send changes for review";
  if (status === "rejected") return "Send for review again";
  return "Submit for review";
}

/* ---------------------------------------------------------------------- */

/* The one place the card's standing is spelled out. It takes focus when a
   save lands, so the reader arrives on the new state. */
function StatusBanner({ ref, card }: { ref: React.Ref<HTMLDivElement>; card: FormCard | null }) {
  const sent = card?.submittedAt ? ` on ${formatDate(card.submittedAt)}` : "";
  let tone = "border-border bg-card text-muted-foreground";
  let icon: React.ReactNode = null;
  let text: React.ReactNode;

  if (!card) {
    text =
      "Fill in your card and submit it for review. Nothing is saved until you submit, and you can change your card afterwards.";
  } else if (card.status === "pending") {
    tone = "border-brand-cyan/30 bg-brand-cyan/5 text-foreground";
    icon = <ClockIcon className="mt-0.5 size-4 shrink-0 text-brand-cyan" weight="bold" aria-hidden />;
    text = `Your card was sent for review${sent}. Our team is reading it. You can still change it; saving sends the new version.`;
  } else if (card.status === "approved") {
    tone = "border-brand-forest/30 bg-brand-forest/5 text-foreground";
    icon = <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-brand-forest" weight="fill" aria-hidden />;
    text = "Your card is approved. If you change it, the new version goes back to our team for review.";
  } else {
    tone = "border-brand-maroon/30 bg-brand-maroon/5 text-foreground";
    icon = <WarningCircleIcon className="mt-0.5 size-4 shrink-0 text-brand-maroon" weight="fill" aria-hidden />;
    text = (
      <>
        Your card was not approved yet.{" "}
        {card.reviewNote ? (
          <>
            A note from our team:
            <span className="mt-2 block whitespace-pre-line wrap-anywhere border-s-2 border-brand-maroon/40 ps-3">
              {card.reviewNote}
            </span>
            <span className="mt-2 block">Make the changes and send it again.</span>
          </>
        ) : (
          <>
            Change what needs changing and send it again, or write to{" "}
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

function Section({
  title,
  description,
  required,
  children,
}: {
  title: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cardFrame} aria-label={title}>
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card px-5 py-6 sm:px-6 sm:py-7">
        <div>
          <h2 className={sectionTitle}>
            {title}
            {required && (
              <>
                <RequiredMark />
                <span className="sr-only">(required)</span>
              </>
            )}
          </h2>
          {description && (
            <p className="mt-2 max-w-[62ch] text-pretty text-sm leading-[1.5] text-muted-foreground">{description}</p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

/* The card's photo. It starts as the picture from the sign-in account, and
   the creator may put their own in its place: the file is cropped square
   and compressed here in the browser, shown at once on the card beside the
   form, and uploaded when the card is sent. Going back to the account's
   picture is one press.

   The file input is not part of what the form posts (it has no name): the
   prepared picture is added to the form's data on submit instead. */
function PhotoField({
  url,
  ownPhoto,
  hasAccountPicture,
  error,
  onChoose,
  onReset,
}: {
  url: string | null;
  ownPhoto: boolean;
  hasAccountPicture: boolean;
  error?: string;
  onChoose: (photo: Blob) => void;
  onReset: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [working, setWorking] = React.useState(false);
  // A picture this browser could not read: said here, since nothing was sent.
  const [problem, setProblem] = React.useState<string | null>(null);
  const message = problem ?? error;

  const choose = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Cleared so choosing the same file again still fires a change.
    event.target.value = "";
    if (!file) return;
    setWorking(true);
    setProblem(null);
    try {
      onChoose(await squarePhoto(file));
    } catch (caught) {
      setProblem(caught instanceof PhotoProblem ? caught.message : "We could not read that picture. Try a JPG or PNG.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div role="group" aria-labelledby="photo-label" className="flex flex-col gap-3">
      <p id="photo-label" className="text-sm font-medium leading-none">
        Photo
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
        <CardPhoto src={url} />
        <div className="flex min-w-0 flex-1 basis-56 flex-col items-start gap-2.5">
          <div className="flex flex-wrap gap-2">
            {/* The browser's file picker, opened by the button beside it. */}
            <input ref={inputRef} type="file" accept="image/*" onChange={choose} hidden />
            <Button
              type="button"
              variant="outline"
              size="pill"
              disabled={working}
              aria-describedby={message ? "photo-hint photo-error" : "photo-hint"}
              onClick={() => inputRef.current?.click()}
              className="h-10 px-4 text-sm has-data-[icon=inline-start]:ps-3.5"
            >
              <CameraIcon data-icon="inline-start" weight="bold" />
              {working ? "Preparing…" : url ? "Change photo" : "Add a photo"}
            </Button>
            {ownPhoto && (
              <Button
                type="button"
                variant="ghost"
                size="pill"
                onClick={() => {
                  setProblem(null);
                  onReset();
                }}
                className="h-10 px-4 text-sm text-muted-foreground has-data-[icon=inline-start]:ps-3.5"
              >
                <ArrowCounterClockwiseIcon data-icon="inline-start" weight="bold" />
                {hasAccountPicture ? "Use my account picture" : "Remove photo"}
              </Button>
            )}
          </div>
          <p id="photo-hint" className="text-sm leading-[1.5] text-muted-foreground">
            {hasAccountPicture
              ? "Your card uses the picture from your sign-in account unless you choose another."
              : "Your sign-in account has no picture. Add one for your card if you like."}{" "}
            A square photo of you or your logo works best.
          </p>
        </div>
      </div>
      {message && (
        <p id="photo-error" role="alert" className={errorText}>
          {message}
        </p>
      )}
    </div>
  );
}

/* A question answered by picking from a short list, drawn as chips: one of
   them (radio) or any number (checkbox). The native inputs carry the state
   and the keyboard behaviour, hidden under their labels; a chosen chip
   fills with brand cyan and gains a tick, so the choice does not rest on
   colour alone. "Other" opens a text field under the chips. */
function ChipGroup({
  type,
  name,
  legend,
  hint,
  required,
  options,
  selected,
  onChange,
  other,
  onOtherChange,
  otherLabel,
  error,
}: {
  type: "radio" | "checkbox";
  name: string;
  legend: string;
  hint?: string;
  required?: boolean;
  options: readonly Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  other?: string;
  onOtherChange?: (value: string) => void;
  otherLabel?: string;
  error?: string;
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const otherId = `${name}Other`;
  const toggle = (value: string, checked: boolean) => {
    if (type === "radio") onChange([value]);
    else onChange(checked ? [...selected, value] : selected.filter((v) => v !== value));
  };
  return (
    <fieldset
      className="flex min-w-0 flex-col gap-3"
      aria-required={required || undefined}
      aria-invalid={!!error || undefined}
      aria-describedby={[hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined}
    >
      {/* A legend sits outside the fieldset's flex flow, so the gap above
          never reaches it: the space below it is its own margin. */}
      <legend className={cn("text-sm font-medium leading-[1.3]", hint ? "mb-2" : "mb-3")}>
        {legend}
        {required && (
          <>
            <RequiredMark />
            <span className="sr-only">(required)</span>
          </>
        )}
      </legend>
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                // Radius 1.25rem: a full pill on one line, still a soft
                // corner when a long label wraps to two on a phone.
                "inline-flex min-h-10 max-w-full cursor-pointer select-none items-center gap-1.5 rounded-[1.25rem] border px-3.5 py-2 text-sm leading-[1.3] font-medium",
                "transition-[background-color,border-color,color] duration-150 ease-hover",
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
                checked
                  ? "border-brand-cyan bg-brand-cyan text-white"
                  : "border-input bg-card text-foreground hover:border-ink/40",
              )}
            >
              <input
                type={type}
                name={name}
                value={option.value}
                checked={checked}
                onChange={(event) => toggle(option.value, event.target.checked)}
                className="sr-only"
              />
              {checked && <CheckIcon aria-hidden weight="bold" className="size-3.5 shrink-0" />}
              {option.label}
            </label>
          );
        })}
      </div>
      {onOtherChange && selected.includes("other") && (
        <div className="flex max-w-md flex-col gap-2">
          <Label htmlFor={otherId}>{otherLabel ?? "Please specify"}</Label>
          <Input
            id={otherId}
            name={otherId}
            value={other ?? ""}
            onChange={(event) => onOtherChange(event.target.value)}
            maxLength={120}
            className={field}
          />
        </div>
      )}
      {error && (
        <p id={errorId} className={errorText}>
          {error}
        </p>
      )}
    </fieldset>
  );
}

/* The one line about the creator's work. It is one line on the card, but
   up to 140 characters will not fit one line of a phone, so the box grows
   to show all of it. Enter does nothing here: there is no second line to
   start, and the server folds any pasted line break into a space. */
function TaglineField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="tagline">
        One line about your work
        <RequiredMark />
        <span className="sr-only">(required)</span>
      </Label>
      <Textarea
        id="tagline"
        name="tagline"
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[\r\n]+/g, " "))}
        onKeyDown={(event) => {
          // Not while an input method is composing: there Enter picks the word.
          if (event.key === "Enter" && !event.nativeEvent.isComposing) event.preventDefault();
        }}
        maxLength={CARD_TAGLINE_MAX}
        aria-invalid={!!error}
        aria-describedby={error ? "tagline-hint tagline-error" : "tagline-hint"}
        placeholder="Short Dharma talks in Hindi for people new to practice"
        className="min-h-11 resize-none px-3.5 py-2.5 leading-[1.5]"
      />
      <p id="tagline-hint" className="text-sm text-muted-foreground">
        Shown on your card. <span className="tabular-nums">{value.length}</span> of {CARD_TAGLINE_MAX} characters.
      </p>
      {error && (
        <p id="tagline-error" className={errorText}>
          {error}
        </p>
      )}
    </div>
  );
}

/* The link to one place the creator publishes. A plain text field, not
   type="url": the server adds a missing "https://", and the browser's own
   URL check would refuse "instagram.com/name" before the form was sent. */
function LinkField({
  social,
  value,
  onChange,
  error,
}: {
  social: (typeof CARD_SOCIALS)[number];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const id = `socials-${social.value}`;
  const SocialIcon = SOCIAL_ICON[social.value];
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>
        <SocialIcon aria-hidden className="size-4 text-muted-foreground" />
        {social.label}
      </Label>
      <Input
        id={id}
        name={`socials.${social.value}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        placeholder={social.placeholder}
        className={field}
      />
      {error && (
        <p id={`${id}-error`} className={errorText}>
          {error}
        </p>
      )}
    </div>
  );
}
