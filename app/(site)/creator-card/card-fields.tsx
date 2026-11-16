"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowCounterClockwiseIcon,
  CameraIcon,
  CheckIcon,
  FacebookLogoIcon,
  GlobeSimpleIcon,
  InstagramLogoIcon,
  TiktokLogoIcon,
  XLogoIcon,
  YoutubeLogoIcon,
  type Icon,
} from "@phosphor-icons/react";
import { card as cardFrame } from "@/components/convention/section-heading";
import { CardPhoto } from "@/components/creator-card/card-photo";
import { PhotoProblem, UNREADABLE, squarePhoto, type PreparedPhoto } from "@/components/creator-card/photo";
import { RequiredMark, errorText, field, readOnlyField } from "@/components/form/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CARD_SOCIALS, CARD_TAGLINE_MAX, type CardSocial } from "@/lib/creator-card";
import type { Option } from "@/lib/registration-2027";
import { cn } from "@/lib/utils";

/* The creator card form's own fields (card-form.tsx puts them together).
   Each is controlled by the form, and each has a read-only face for a card
   that has been submitted and is not being edited. The plain text and
   country fields are the shared ones in components/form/fields.tsx. */

const SOCIAL_ICON: Record<CardSocial, Icon> = {
  youtube: YoutubeLogoIcon,
  instagram: InstagramLogoIcon,
  facebook: FacebookLogoIcon,
  tiktok: TiktokLogoIcon,
  x: XLogoIcon,
  website: GlobeSimpleIcon,
};

const sectionTitle = "font-display text-2xl leading-[1.15] text-foreground";

/** One white card of the form, under its title. */
export function Section({
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

   Preparing the picture is a mutation, which is where "Preparing…" and the
   message for a file that could not be read come from. The file input is
   not part of what the form posts (it has no name): the form adds the
   prepared picture to its data when it is sent. */
export function PhotoField({
  url,
  ownPhoto,
  hasAccountPicture,
  readOnly,
  error,
  onChoose,
  onReset,
}: {
  url: string | null;
  /** Whether the photo shown is, or is about to be, the creator's upload. */
  ownPhoto: boolean;
  hasAccountPicture: boolean;
  /** The photo alone, with nothing to press. */
  readOnly?: boolean;
  /** What the server said about the photo last sent. */
  error?: string;
  onChoose: (photo: PreparedPhoto) => void;
  onReset: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const prepare = useMutation({ mutationFn: squarePhoto, onSuccess: onChoose });
  // A picture this browser could not read is said here: nothing was sent.
  const unreadable = prepare.error ? (prepare.error instanceof PhotoProblem ? prepare.error.message : UNREADABLE) : null;
  const message = readOnly ? null : (unreadable ?? error);

  return (
    <div role="group" aria-labelledby="photo-label" className="flex flex-col gap-3">
      <p id="photo-label" className="text-sm font-medium leading-none">
        Photo
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
        <CardPhoto src={url} />
        {!readOnly && (
          <div className="flex min-w-0 flex-1 basis-56 flex-col items-start gap-2.5">
            <div className="flex flex-wrap gap-2">
              {/* The browser's file picker, opened by the button beside it. */}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  // Cleared so choosing the same file again still fires a change.
                  event.target.value = "";
                  if (file) prepare.mutate(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="pill"
                data-photo-button
                disabled={prepare.isPending}
                aria-describedby={message ? "photo-hint photo-error" : "photo-hint"}
                onClick={() => inputRef.current?.click()}
                className="h-10 px-4 text-sm has-data-[icon=inline-start]:ps-3.5"
              >
                <CameraIcon data-icon="inline-start" weight="bold" />
                {prepare.isPending ? "Preparing…" : url ? "Change photo" : "Add a photo"}
              </Button>
              {ownPhoto && (
                <Button
                  type="button"
                  variant="ghost"
                  size="pill"
                  onClick={() => {
                    prepare.reset();
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
        )}
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
export function ChipGroup({
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
  disabled,
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
  /** Read-only: the answer shows, and nothing can be pressed. */
  disabled?: boolean;
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const otherId = `${name}Other`;
  // The hint says how to answer, which a read-only question does not need.
  const shownHint = disabled ? undefined : hint;
  const toggle = (value: string, checked: boolean) => {
    if (type === "radio") onChange([value]);
    else onChange(checked ? [...selected, value] : selected.filter((v) => v !== value));
  };
  return (
    <fieldset
      className="flex min-w-0 flex-col gap-3"
      aria-required={required || undefined}
      aria-invalid={!!error || undefined}
      aria-describedby={[shownHint && hintId, error && errorId].filter(Boolean).join(" ") || undefined}
      disabled={disabled}
    >
      {/* A legend sits outside the fieldset's flex flow, so the gap above
          never reaches it: the space below it is its own margin. */}
      <legend className={cn("text-sm font-medium leading-[1.3]", shownHint ? "mb-2" : "mb-3")}>
        {legend}
        {required && (
          <>
            <RequiredMark />
            <span className="sr-only">(required)</span>
          </>
        )}
      </legend>
      {shownHint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {shownHint}
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
                "inline-flex min-h-10 max-w-full select-none items-center gap-1.5 rounded-[1.25rem] border px-3.5 py-2 text-sm leading-[1.3] font-medium",
                "transition-[background-color,border-color,color] duration-150 ease-hover",
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
                checked ? "border-brand-cyan bg-brand-cyan text-white" : "border-input bg-card text-foreground",
                // Read-only, the choices not made step back so the answer
                // is what is read; the tick still marks it without colour.
                disabled ? !checked && "border-border text-muted-foreground/70" : "cursor-pointer",
                !disabled && !checked && "hover:border-ink/40",
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
            readOnly={disabled}
            className={cn(field, disabled && readOnlyField)}
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
export function TaglineField({
  value,
  onChange,
  error,
  readOnly,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  readOnly?: boolean;
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
        readOnly={readOnly}
        className={cn("min-h-11 resize-none px-3.5 py-2.5 leading-[1.5]", readOnly && readOnlyField)}
      />
      <p id="tagline-hint" className="text-sm text-muted-foreground">
        Shown on your card.
        {!readOnly && (
          <>
            {" "}
            <span className="tabular-nums">{value.length}</span> of {CARD_TAGLINE_MAX} characters.
          </>
        )}
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
   URL check would refuse "instagram.com/name" before the form was sent.

   A place a follower count is kept for takes the full row, the link with
   its count beside it (under it on a phone): the two are one answer, and
   the count is asked for as soon as there is a link. */
export function LinkField({
  social,
  value,
  onChange,
  error,
  followers,
  onFollowersChange,
  followersError,
  readOnly,
}: {
  social: (typeof CARD_SOCIALS)[number];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** The count as typed. Only read for a place that keeps one. */
  followers?: string;
  onFollowersChange?: (value: string) => void;
  followersError?: string;
  readOnly?: boolean;
}) {
  const id = `socials-${social.value}`;
  const SocialIcon = SOCIAL_ICON[social.value];
  const link = (
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
        readOnly={readOnly}
        className={cn(field, readOnly && readOnlyField)}
      />
      {error && (
        <p id={`${id}-error`} className={errorText}>
          {error}
        </p>
      )}
    </div>
  );
  if (!("audience" in social)) return link;

  const countId = `followers-${social.value}`;
  const linked = value.trim() !== "";
  return (
    <div
      role="group"
      aria-label={social.label}
      className="grid min-w-0 gap-x-5 gap-y-2.5 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_11rem]"
    >
      {link}
      <div className="flex min-w-0 flex-col gap-2">
        {/* As tall as the link's label with its icon, so the two boxes line up. */}
        <Label htmlFor={countId} className="min-h-4">
          <span className="sr-only">{`${social.label} `}</span>
          {social.audience}
          {linked && !readOnly && (
            <>
              <RequiredMark />
              <span className="sr-only">(required)</span>
            </>
          )}
        </Label>
        {/* Text, not type="number": a count is typed as "12,500" or pasted
            as the "12.5K" the app shows, and the server reads either. */}
        <Input
          id={countId}
          name={`followers.${social.value}`}
          value={followers ?? ""}
          onChange={(event) => onFollowersChange?.(event.target.value)}
          inputMode="numeric"
          autoComplete="off"
          maxLength={20}
          aria-required={(linked && !readOnly) || undefined}
          aria-invalid={!!followersError}
          aria-describedby={followersError ? `${countId}-error` : undefined}
          placeholder="e.g. 12,500"
          readOnly={readOnly}
          className={cn(field, "tabular-nums", readOnly && readOnlyField)}
        />
        {followersError && (
          <p id={`${countId}-error`} className={errorText}>
            {followersError}
          </p>
        )}
      </div>
    </div>
  );
}
