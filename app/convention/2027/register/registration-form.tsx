"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckCircleIcon, FloppyDiskIcon, PaperPlaneTiltIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { card, primaryButton } from "@/components/convention/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationStatus } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";
import {
  AUDIENCE_LANGUAGES,
  AUDIENCE_REGIONS,
  CONTENT_TOPICS,
  FORM,
  PLATFORMS,
  TARGET_AUDIENCES,
  type FieldErrors,
  type Option,
} from "@/lib/registration-2027";
import { cn } from "@/lib/utils";
import { saveApplicationAction, withdrawApplicationAction, type FormState } from "./actions";
import { VideoUpload, type UploadedVideo } from "./video-upload";

export type FormApplication = {
  status: ApplicationStatus;
  fullName: string | null;
  organization: string | null;
  location: string | null;
  contentTopics: string[];
  contentTopicsOther: string | null;
  targetAudience: string | null;
  targetAudienceOther: string | null;
  audienceRegion: string | null;
  audienceRegionOther: string | null;
  audienceLanguage: string | null;
  audienceLanguageOther: string | null;
  platforms: string[];
  platformsOther: string | null;
  socialLinks: string | null;
  awardAudienceChoiceUrl: string | null;
  awardCreativeVideoUrl: string | null;
  awardViralContentUrl: string | null;
  video: UploadedVideo | null;
  submittedAt: string | null;
  updatedAt: string;
};

type Values = {
  [K in Exclude<keyof FormApplication, "status" | "video" | "submittedAt" | "updatedAt">]: NonNullable<
    FormApplication[K]
  > extends string[]
    ? string[]
    : string;
};

function toValues(application: FormApplication): Values {
  return {
    fullName: application.fullName ?? "",
    organization: application.organization ?? "",
    location: application.location ?? "",
    contentTopics: application.contentTopics,
    contentTopicsOther: application.contentTopicsOther ?? "",
    targetAudience: application.targetAudience ?? "",
    targetAudienceOther: application.targetAudienceOther ?? "",
    audienceRegion: application.audienceRegion ?? "",
    audienceRegionOther: application.audienceRegionOther ?? "",
    audienceLanguage: application.audienceLanguage ?? "",
    audienceLanguageOther: application.audienceLanguageOther ?? "",
    platforms: application.platforms,
    platformsOther: application.platformsOther ?? "",
    socialLinks: application.socialLinks ?? "",
    awardAudienceChoiceUrl: application.awardAudienceChoiceUrl ?? "",
    awardCreativeVideoUrl: application.awardCreativeVideoUrl ?? "",
    awardViralContentUrl: application.awardViralContentUrl ?? "",
  };
}

/* What the applicant can do depends on where the application is:
   - draft: every field is open; submit, or save and come back;
   - submitted: read-only behind an Edit button until the committee decides;
   - locked: read-only with no actions.
   A decision reaches the applicant by email. The form never shows
   accepted, waitlisted or rejected; those all look like "received". */
type Mode = "draft" | "submitted" | "locked";

function modeFor(status: ApplicationStatus): Mode {
  if (status === "draft") return "draft";
  if (status === "submitted") return "submitted";
  return "locked";
}

const field = "h-11 px-3.5";
const readOnlyField = "bg-muted/50";
const sectionTitle = "text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground";
const errorText = "text-sm text-brand-maroon";
const TOAST_ID = "application";

/* The whole application on one page, in the Google Form's four sections.
   Inputs are controlled so the browser's form reset after an action keeps
   what was typed. The submit buttons share one action: the pressed one
   says whether this is a draft or a submission. The actions live in a bar
   that stays at the bottom of the viewport while the form scrolls. */
export function RegistrationForm({
  user,
  application,
}: {
  user: { email: string; name: string | null };
  application: FormApplication;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveApplicationAction, { ok: false });
  const [values, setValues] = React.useState<Values>(() => toValues(application));
  const [video, setVideo] = React.useState<UploadedVideo | null>(application.video);
  const [editing, setEditing] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const bannerRef = React.useRef<HTMLDivElement>(null);
  const barRef = React.useRef<HTMLDivElement>(null);

  // A fresh upload calls router.refresh(), and the server comes back with a
  // playback URL: take the server's version whenever its key changes or it
  // gains a URL the local one lacks.
  const [seenVideo, setSeenVideo] = React.useState(application.video);
  if (application.video !== seenVideo) {
    setSeenVideo(application.video);
    if (application.video?.key !== video?.key || (application.video?.url && !video?.url)) {
      setVideo(application.video);
    }
  }

  // A submission that went through closes edit mode. Done during render,
  // like the video above, so the read-only view and the result arrive in
  // the same frame.
  const [seenState, setSeenState] = React.useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.ok && state.intent === "submit") setEditing(false);
  }

  const status = application.status;
  const mode = modeFor(status);
  const editable = mode === "draft" || (mode === "submitted" && editing);
  const errors: FieldErrors = editable ? (state.errors ?? {}) : {};
  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  // Each action result is announced once: a toast at the bottom, and focus
  // moved to where the result is, the banner on success or the first
  // answer that needs fixing on failure.
  const handled = React.useRef(state);
  React.useEffect(() => {
    if (handled.current === state) return;
    handled.current = state;
    if (!state.intent) return;
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";

    if (state.ok) {
      if (state.intent === "submit") {
        toast.success(state.firstSubmission ? "Application submitted" : "Changes saved", {
          id: TOAST_ID,
          description: state.firstSubmission
            ? `We will write to ${user.email}.`
            : "Your application stays submitted with the new answers.",
        });
        bannerRef.current?.scrollIntoView({ behavior, block: "start" });
        bannerRef.current?.focus({ preventScroll: true });
      } else {
        toast.success("Draft saved", { id: TOAST_ID, description: "Come back any time to finish it." });
      }
      return;
    }

    const problem = state.errors?.form?.[0];
    toast.error(problem ? "Could not save" : "A few answers need attention", {
      id: TOAST_ID,
      description: problem ?? "Fix the highlighted answers, then try again.",
      duration: 8000,
      closeButton: true,
    });
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    const target = invalid?.matches("fieldset") ? invalid.querySelector<HTMLElement>("input") : invalid;
    invalid?.scrollIntoView({ behavior, block: "center" });
    target?.focus({ preventScroll: true });
  }, [state, user.email]);

  // The toaster lifts itself above the bar by this much, see globals.css.
  React.useEffect(() => {
    const bar = barRef.current;
    const root = document.documentElement.style;
    if (!bar) return;
    const observer = new ResizeObserver(() => {
      root.setProperty("--action-bar-height", `${Math.ceil(bar.offsetHeight)}px`);
    });
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.removeProperty("--action-bar-height");
    };
  }, [mode]);

  // Both handlers stop the click's default action. React re-renders the
  // bar synchronously inside the click, and without the keys below the
  // browser would then run the default action on the node that replaced
  // the button, a submit button, and send the form.
  const startEditing = (event: React.MouseEvent) => {
    event.preventDefault();
    setEditing(true);
  };
  const cancelEditing = (event: React.MouseEvent) => {
    event.preventDefault();
    setValues(toValues(application));
    setEditing(false);
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-6"
      aria-describedby={mode === "locked" ? undefined : "form-status"}
    >
      <StatusBanner
        ref={bannerRef}
        mode={mode}
        status={status}
        submittedAt={application.submittedAt}
        email={user.email}
      />

      {/* Section 2: personal details */}
      <Section title={FORM.sections.personal.title} description={FORM.sections.personal.description}>
        <TextField
          id="fullName"
          label="Name"
          required
          value={values.fullName}
          onChange={(v) => set("fullName", v)}
          error={errors.fullName?.[0]}
          autoComplete="name"
          readOnly={!editable}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email} readOnly className={cn(field, "bg-muted/50 text-muted-foreground")} />
          <p className="text-sm text-muted-foreground">
            From your sign-in. We will write to this address about your application.
          </p>
        </div>
        <TextField
          id="organization"
          label="Organization"
          hint="If you are coming as an individual, write NA."
          required
          value={values.organization}
          onChange={(v) => set("organization", v)}
          error={errors.organization?.[0]}
          autoComplete="organization"
          readOnly={!editable}
        />
        <TextField
          id="location"
          label="Current location and country"
          required
          value={values.location}
          onChange={(v) => set("location", v)}
          error={errors.location?.[0]}
          readOnly={!editable}
        />
      </Section>

      {/* Section 3: content creation journey */}
      <Section title={FORM.sections.journey.title}>
        <ChoiceGroup
          name="contentTopics"
          legend="What is your content about?"
          required
          type="checkbox"
          options={CONTENT_TOPICS}
          selected={values.contentTopics}
          onChange={(v) => set("contentTopics", v)}
          other={values.contentTopicsOther}
          onOtherChange={(v) => set("contentTopicsOther", v)}
          error={errors.contentTopics?.[0] ?? errors.contentTopicsOther?.[0]}
          disabled={!editable}
        />
        <ChoiceGroup
          name="targetAudience"
          legend="Who is your target audience?"
          required
          type="radio"
          options={TARGET_AUDIENCES}
          selected={values.targetAudience ? [values.targetAudience] : []}
          onChange={(v) => set("targetAudience", v[0] ?? "")}
          other={values.targetAudienceOther}
          onOtherChange={(v) => set("targetAudienceOther", v)}
          error={errors.targetAudience?.[0] ?? errors.targetAudienceOther?.[0]}
          disabled={!editable}
        />
        <ChoiceGroup
          name="audienceRegion"
          legend="Which region is your audience primarily from?"
          type="radio"
          options={AUDIENCE_REGIONS}
          selected={values.audienceRegion ? [values.audienceRegion] : []}
          onChange={(v) => set("audienceRegion", v[0] ?? "")}
          other={values.audienceRegionOther}
          onOtherChange={(v) => set("audienceRegionOther", v)}
          error={errors.audienceRegion?.[0] ?? errors.audienceRegionOther?.[0]}
          disabled={!editable}
        />
        <ChoiceGroup
          name="audienceLanguage"
          legend="What is the primary language of your audience?"
          type="radio"
          options={AUDIENCE_LANGUAGES}
          selected={values.audienceLanguage ? [values.audienceLanguage] : []}
          onChange={(v) => set("audienceLanguage", v[0] ?? "")}
          other={values.audienceLanguageOther}
          onOtherChange={(v) => set("audienceLanguageOther", v)}
          error={errors.audienceLanguage?.[0] ?? errors.audienceLanguageOther?.[0]}
          disabled={!editable}
        />
        <ChoiceGroup
          name="platforms"
          legend="Which platform do you primarily create content for?"
          required
          type="checkbox"
          options={PLATFORMS}
          selected={values.platforms}
          onChange={(v) => set("platforms", v)}
          other={values.platformsOther}
          onOtherChange={(v) => set("platformsOther", v)}
          error={errors.platforms?.[0] ?? errors.platformsOther?.[0]}
          disabled={!editable}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="socialLinks">Links to your social media handles</Label>
          <Textarea
            id="socialLinks"
            name="socialLinks"
            rows={4}
            value={values.socialLinks}
            onChange={(e) => set("socialLinks", e.target.value)}
            placeholder={"https://www.youtube.com/@yourchannel\nhttps://www.instagram.com/yourhandle"}
            aria-invalid={!!errors.socialLinks}
            aria-describedby={errors.socialLinks ? "socialLinks-error" : undefined}
            readOnly={!editable}
            className={cn("min-h-28 px-3.5 py-3 leading-[1.5]", !editable && readOnlyField)}
          />
          {errors.socialLinks && (
            <p id="socialLinks-error" className={errorText}>
              {errors.socialLinks[0]}
            </p>
          )}
        </div>
      </Section>

      {/* Video */}
      <Section title={FORM.sections.video.title} description={FORM.sections.video.description} required>
        <VideoUpload video={video} onChange={setVideo} disabled={!editable} error={errors.video?.[0]} />
      </Section>

      {/* Section 4: awards */}
      <Section title={FORM.sections.awards.title} description={FORM.sections.awards.description}>
        {(
          [
            ["awardAudienceChoiceUrl", 0],
            ["awardCreativeVideoUrl", 1],
            ["awardViralContentUrl", 2],
          ] as const
        ).map(([key, index]) => {
          const award = FORM.sections.awards.items[index];
          return (
            <div key={key} className="flex flex-col gap-2 border-t border-border pt-5 first:border-t-0 first:pt-0">
              <h3 className="text-base font-semibold text-foreground">{award.name}</h3>
              <p className="text-pretty text-sm leading-[1.5] text-muted-foreground">{award.description}</p>
              <TextField
                id={key}
                label="Public link to your entry"
                type="url"
                inputMode="url"
                placeholder="https://"
                value={values[key]}
                onChange={(v) => set(key, v)}
                error={errors[key]?.[0]}
                readOnly={!editable}
                className="mt-1"
              />
            </div>
          );
        })}
      </Section>

      {errors.form && (
        <p className={cn(errorText, "text-base")} role="alert">
          {errors.form[0]}
        </p>
      )}

      {mode !== "locked" && (
        <div
          ref={barRef}
          data-action-bar
          className={cn(card, "sticky bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-30")}
        >
          {/* On a phone the main button takes the full row and the second
              action shares the next row with the status; from sm up it is
              one row with the status at the trailing end. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-transparent bg-card px-4 py-3 shadow-float sm:flex-nowrap">
            {editable ? (
              <React.Fragment key="editing">
                <Button
                  type="submit"
                  name="intent"
                  value="submit"
                  size="pill"
                  disabled={pending}
                  className={cn(primaryButton, "w-full sm:w-auto")}
                >
                  {mode === "submitted" ? "Save changes" : "Submit application"}
                  {mode === "submitted" ? (
                    <FloppyDiskIcon data-icon="inline-end" weight="bold" />
                  ) : (
                    <PaperPlaneTiltIcon data-icon="inline-end" weight="bold" />
                  )}
                </Button>
                {mode === "draft" ? (
                  <Button type="submit" name="intent" value="draft" size="pill" variant="outline" disabled={pending}>
                    <FloppyDiskIcon data-icon="inline-start" weight="bold" />
                    Save draft
                  </Button>
                ) : (
                  <Button type="button" size="pill" variant="outline" disabled={pending} onClick={cancelEditing}>
                    Cancel
                  </Button>
                )}
              </React.Fragment>
            ) : (
              <React.Fragment key="reading">
                <Button type="button" size="pill" variant="outline" onClick={startEditing} className="w-full sm:w-auto">
                  <PencilSimpleIcon data-icon="inline-start" weight="bold" />
                  Edit application
                </Button>
                <Button
                  type="submit"
                  size="pill"
                  variant="ghost"
                  formAction={withdrawApplicationAction}
                  formNoValidate
                  onClick={(event) => {
                    if (!window.confirm("Withdraw your application? It will no longer be considered.")) {
                      event.preventDefault();
                    }
                  }}
                  className="text-muted-foreground"
                >
                  Withdraw
                </Button>
              </React.Fragment>
            )}
            {/* Always mounted, so screen readers announce changes to it. On a
                phone the resting "Last saved" line is read but not shown;
                anything newer than that takes the room. */}
            <p
              id="form-status"
              role="status"
              aria-live="polite"
              className={cn(
                "ms-auto flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm",
                editable && !pending && !state.savedAt && "max-sm:sr-only",
              )}
            >
              {pending ? (
                "Saving…"
              ) : !editable ? (
                <>
                  <CheckCircleIcon className="size-4 shrink-0 text-brand-forest" weight="fill" aria-hidden />
                  <span>
                    Submitted<span className="max-sm:sr-only"> on {formatDateTime(application.submittedAt)}</span>
                  </span>
                </>
              ) : state.savedAt ? (
                `Saved ${formatDateTime(state.savedAt)}`
              ) : (
                `Last saved ${formatDateTime(application.updatedAt)}`
              )}
            </p>
          </div>
        </div>
      )}
    </form>
  );
}

/* ---------------------------------------------------------------------- */

/* The one place the application's state is spelled out. It is a live
   region, so when a submission lands the new text is announced, and it
   takes focus then so the reader lands on it. */
function StatusBanner({
  ref,
  mode,
  status,
  submittedAt,
  email,
}: {
  ref: React.Ref<HTMLDivElement>;
  mode: Mode;
  status: ApplicationStatus;
  submittedAt: string | null;
  email: string;
}) {
  const received = submittedAt ? ` on ${formatDateTime(submittedAt)}` : "";
  let tone = "border-border bg-card text-muted-foreground";
  let text: React.ReactNode;
  let check = false;

  if (mode === "draft") {
    text =
      "Save a draft at any point and come back later. Submit once everything is complete; you can still make changes until the selection committee decides.";
  } else if (status === "withdrawn") {
    tone = "border-border bg-muted/50 text-muted-foreground";
    text = `You withdrew your application. If that was a mistake, write to ${FORM.contact}.`;
  } else if (mode === "submitted") {
    tone = "border-brand-cyan/30 bg-brand-cyan/5 text-foreground";
    check = true;
    text = `Your application has been received${received}. You can still make changes until the selection committee decides. We will write to ${email}.`;
  } else {
    // Decided. The outcome goes out by email, so here it only looks received.
    tone = "border-brand-cyan/30 bg-brand-cyan/5 text-foreground";
    check = true;
    text = `Your application has been received${received}. We will write to ${email}.`;
  }

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className={cn(
        "flex scroll-mt-6 items-start gap-3 rounded-xl border px-4 py-3.5 text-sm leading-[1.5] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        tone,
      )}
    >
      {check && <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-brand-forest" weight="fill" aria-hidden />}
      <p>{text}</p>
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
    <section className={card} aria-label={title}>
      <div className="flex flex-col gap-5 rounded-xl border border-transparent bg-card px-5 py-6 shadow-border sm:px-6 sm:py-7">
        <div>
          <h2 className={sectionTitle}>
            {title}
            {required && <RequiredMark />}
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

function RequiredMark() {
  return (
    <span className="ml-1 text-brand-maroon" aria-hidden>
      *
    </span>
  );
}

function TextField({
  id,
  label,
  hint,
  required,
  error,
  value,
  onChange,
  className,
  readOnly,
  ...rest
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
} & Omit<React.ComponentProps<"input">, "id" | "value" | "onChange" | "className">) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <>
            <RequiredMark />
            <span className="sr-only">(required)</span>
          </>
        )}
      </Label>
      <Input
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        readOnly={readOnly}
        className={cn(field, readOnly && readOnlyField)}
        {...rest}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={errorText}>
          {error}
        </p>
      )}
    </div>
  );
}

/* A list of checkboxes or radios. The native controls carry the state and
   the keyboard behaviour; only the colour is the site's. "Other" opens a
   text field beside it. An optional radio group can be cleared again. */
function ChoiceGroup({
  name,
  legend,
  required,
  type,
  options,
  selected,
  onChange,
  other,
  onOtherChange,
  error,
  disabled,
}: {
  name: string;
  legend: string;
  required?: boolean;
  type: "checkbox" | "radio";
  options: readonly Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  other: string;
  onOtherChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const otherPicked = selected.includes("other");
  const errorId = `${name}-error`;
  return (
    <fieldset
      className="flex flex-col gap-3"
      aria-required={required || undefined}
      aria-invalid={!!error || undefined}
      aria-describedby={error ? errorId : undefined}
      disabled={disabled}
    >
      {/* A legend sits outside the fieldset's flex flow, so the gap above
          never reaches it: the space below it is its own margin. */}
      <legend className="mb-3 flex items-center gap-2 text-sm font-medium leading-none">
        {legend}
        {required && (
          <>
            <RequiredMark />
            <span className="sr-only">(required)</span>
          </>
        )}
      </legend>
      <div className="flex flex-col gap-2.5">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const checked = selected.includes(option.value);
          return (
            <div key={option.value} className="flex flex-col gap-2">
              <label
                htmlFor={id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 text-sm leading-[1.4] text-foreground",
                  disabled && "cursor-default",
                )}
              >
                <input
                  id={id}
                  type={type}
                  name={name}
                  value={option.value}
                  checked={checked}
                  onChange={(e) => {
                    if (type === "radio") {
                      onChange([option.value]);
                    } else {
                      onChange(
                        e.target.checked ? [...selected, option.value] : selected.filter((v) => v !== option.value),
                      );
                    }
                  }}
                  className="mt-0.5 size-4 shrink-0 accent-brand-cyan"
                />
                {option.label}
              </label>
              {option.value === "other" && otherPicked && (
                <Input
                  name={`${name}Other`}
                  value={other}
                  onChange={(e) => onOtherChange(e.target.value)}
                  aria-label={`${legend} Other, please specify`}
                  placeholder="Please specify"
                  className={cn(field, "ml-7 max-w-md")}
                />
              )}
            </div>
          );
        })}
      </div>
      {type === "radio" && !required && selected.length > 0 && !disabled && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="self-start text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Clear choice
        </button>
      )}
      {error && (
        <p id={errorId} className={errorText}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
