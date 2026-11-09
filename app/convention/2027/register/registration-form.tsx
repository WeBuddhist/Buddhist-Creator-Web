"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckCircleIcon, FloppyDiskIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { card, cardInner, primaryButton } from "@/components/convention/section-heading";
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

const field = "h-11 px-3.5";
const sectionTitle = "text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground";
const errorText = "text-sm text-brand-maroon";

/* The whole application on one page, in the Google Form's four sections.
   Inputs are controlled so the browser's form reset after an action keeps
   what was typed. Two submit buttons share one action: the pressed one
   says whether this is a draft or a submission. */
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

  const status = application.status;
  const editable = status === "draft" || status === "submitted";
  const errors: FieldErrors = state.errors ?? {};
  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  return (
    <form action={formAction} className="flex flex-col gap-6" aria-describedby="form-status">
      <StatusBanner status={status} submittedAt={application.submittedAt} email={user.email} state={state} />

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
          disabled={!editable}
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
          disabled={!editable}
        />
        <TextField
          id="location"
          label="Current location and country"
          required
          value={values.location}
          onChange={(v) => set("location", v)}
          error={errors.location?.[0]}
          disabled={!editable}
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
            disabled={!editable}
            className="min-h-28 px-3.5 py-3 leading-[1.5]"
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
                disabled={!editable}
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

      {editable && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              name="intent"
              value="submit"
              size="pill"
              disabled={pending}
              className={primaryButton}
            >
              {status === "submitted" ? "Save changes" : "Submit application"}
              <PaperPlaneTiltIcon data-icon="inline-end" weight="bold" />
            </Button>
            <Button type="submit" name="intent" value="draft" size="pill" variant="outline" disabled={pending}>
              <FloppyDiskIcon data-icon="inline-start" weight="bold" />
              Save draft
            </Button>
            <span id="form-status" role="status" aria-live="polite" className="text-sm text-muted-foreground">
              {pending
                ? "Saving…"
                : state.savedAt
                  ? `Saved at ${formatDateTime(state.savedAt)}`
                  : `Last saved ${formatDateTime(application.updatedAt)}`}
            </span>
          </div>
          <Button
            type="submit"
            size="pill"
            variant="ghost"
            formAction={withdrawApplicationAction}
            formNoValidate
            disabled={pending}
            onClick={(event) => {
              if (!window.confirm("Withdraw your application? It will no longer be considered.")) {
                event.preventDefault();
              }
            }}
            className="text-muted-foreground"
          >
            Withdraw
          </Button>
        </div>
      )}
    </form>
  );
}

/* ---------------------------------------------------------------------- */

function StatusBanner({
  status,
  submittedAt,
  email,
  state,
}: {
  status: ApplicationStatus;
  submittedAt: string | null;
  email: string;
  state: FormState;
}) {
  const justSubmitted = state.ok && state.intent === "submit";
  const copy: Record<ApplicationStatus, { tone: string; text: React.ReactNode }> = {
    draft: {
      tone: "border-border bg-card text-muted-foreground",
      text: "Save a draft at any point and come back later. Submit once everything is complete; you can still edit after submitting until the committee decides.",
    },
    submitted: {
      tone: "border-brand-cyan/30 bg-brand-cyan/5 text-foreground",
      text: (
        <>
          {justSubmitted ? "Thank you, your application has been submitted" : "Your application has been received"}
          {submittedAt ? ` on ${formatDateTime(submittedAt)}` : ""}. You can still make changes until the selection
          committee decides. We will write to {email}.
        </>
      ),
    },
    accepted: {
      tone: "border-brand-forest/30 bg-brand-forest/5 text-foreground",
      text: `Congratulations, you have been accepted to the convention. We will be in touch at ${email} with the next steps.`,
    },
    waitlisted: {
      tone: "border-brand-golden/50 bg-brand-golden/10 text-foreground",
      text: `You are on the waitlist. If a place opens up we will write to ${email}.`,
    },
    rejected: {
      tone: "border-border bg-muted/50 text-foreground",
      text: "Thank you for applying. We were not able to offer you a place this time; we hope to see your work at a future convention.",
    },
    withdrawn: {
      tone: "border-border bg-muted/50 text-muted-foreground",
      text: `You withdrew your application. If that was a mistake, write to ${FORM.contact}.`,
    },
  };
  const { tone, text } = copy[status];
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm leading-[1.5]", tone)} role="status">
      {(status === "submitted" || status === "accepted") && (
        <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-brand-forest" weight="fill" aria-hidden />
      )}
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
      <div className={cn(cardInner, "flex flex-col gap-5 px-5 py-6 sm:px-6 sm:py-7")}>
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
        className={field}
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
      <legend className="flex items-center gap-2 text-sm font-medium leading-none">
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
