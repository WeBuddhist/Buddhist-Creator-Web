"use client";

import * as React from "react";
import Image from "next/image";
import { flushSync } from "react-dom";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  FloppyDiskIcon,
  ImageIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { prepareArtwork } from "@/components/awards/artwork";
import { AWARD_PHOTOS } from "@/components/awards/photos";
import { PhotoProblem, UNREADABLE as UNREADABLE_PICTURE, type PreparedPhoto } from "@/components/creator-card/photo";
import { card, label, primaryButton } from "@/components/convention/section-heading";
import { PlaceField, RequiredMark, TextField, errorText, field } from "@/components/form/fields";
import { goToBanner, goToField, publishBarHeight, swapBarButtons } from "@/components/form/form-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AWARDS,
  AWARD_GROUPS,
  NOMINATION_FORM,
  NOMINATION_LIMITS,
  ENTRY_FIELDS,
  RULE,
  entryKey,
  type Award,
  type AwardSlug,
  type BallotErrors,
  type EntryField,
  type ErrorField,
} from "@/lib/awards-2027";
import { COUNTRIES, isCountry, suggestCountries } from "@/lib/countries";
import { formatDateTime } from "@/lib/format";
import { loginUrl } from "@/lib/login-url";
import { UNREACHABLE, sessionEnded } from "@/lib/session-ended";
import { cn } from "@/lib/utils";
import { saveNominationsAction, type NominationResult } from "./actions";

type Entry = Record<EntryField, string>;

/* The person's nominations as the server last stored them, with an
   address to load each stored picture from. */
export type FormBallot = {
  nominatorName: string;
  nominatorCountry: string;
  submittedAt: string;
  updatedAt: string;
  nominations: Partial<Record<AwardSlug, Entry>>;
  images: Partial<Record<AwardSlug, string>>;
};

/* The picture of an award that takes one: the one stored, one chosen here
   and not yet sent, or none. */
type Picture = { kind: "stored"; url: string } | ({ kind: "new" } & PreparedPhoto) | { kind: "none" };

type Values = {
  nominatorName: string;
  nominatorCountry: string;
  entries: Record<AwardSlug, Entry>;
  pictures: Partial<Record<AwardSlug, Picture>>;
};

const NO_PICTURE: Picture = { kind: "none" };

const EMPTY_ENTRY: Entry = { nomineeName: "", account: "", link: "", videoLink: "", reason: "" };

function toValues(ballot: FormBallot | null, name: string | null): Values {
  return {
    nominatorName: ballot?.nominatorName ?? name ?? "",
    nominatorCountry: ballot && isCountry(ballot.nominatorCountry) ? ballot.nominatorCountry : "",
    entries: Object.fromEntries(
      AWARDS.map(({ slug }) => [slug, { ...EMPTY_ENTRY, ...ballot?.nominations[slug] }]),
    ) as Record<AwardSlug, Entry>,
    pictures: Object.fromEntries(
      Object.entries(ballot?.images ?? {}).map(([slug, url]) => [slug, { kind: "stored", url }]),
    ),
  };
}

/** The awards that carry a nomination in `ballot`, in the order of AWARDS. */
const nominatedIn = (ballot: FormBallot | null) =>
  AWARDS.map(({ slug }) => slug).filter((slug) => ballot?.nominations[slug]);

/* Where things stand:
   - new: nothing sent yet; the form is open;
   - sent: read-only behind an Edit button, until nominations close;
   - closed: nominations are closed; read-only with no actions. */
type Mode = "new" | "sent" | "closed";

const TOAST_ID = "nominations";

/* Each answer that can be refused, in the order of the form, with the
   element to go to for it. "Nominate someone in at least one category"
   goes to the first award's button. */
const PROBLEM_FIELDS: readonly (readonly [keyof BallotErrors, string])[] = [
  ["nominatorName", "#nominatorName"],
  ["nominatorCountry", "#nominatorCountry"],
  ...AWARDS.flatMap(({ slug, image }) =>
    [...ENTRY_FIELDS, ...(image ? (["image"] as const) : [])].map(
      (name: ErrorField) => [entryKey(slug, name), `#${slug}-${name}`] as const,
    ),
  ),
  ["nominations", `#${AWARDS[0].slug}-toggle`],
];

/* The whole set of nominations on one page: who is nominating, then each
   award under its category. An award is left blank until "Nominate
   someone" opens it; "Remove" closes it again, and only the open ones are
   sent. What was typed into a closed award stays in the page until it is
   left, so a slip of "Remove" loses nothing.

   Saving is a React Query mutation around the server action, sent from
   onSubmit with the form's own FormData (see the registration form for
   why not `action`). Once sent, the form reads like a receipt: the
   nominations as stored, with Edit in the floating bar, as the
   registration form does. */
export function NominationForm({
  user,
  ballot,
  focusAward,
  open,
}: {
  user: { email: string; name: string | null };
  ballot: FormBallot | null;
  /** The award the awards page sent the person here for. */
  focusAward: AwardSlug | null;
  /** Whether nominations are still open. */
  open: boolean;
}) {
  const mode: Mode = !open ? "closed" : ballot ? "sent" : "new";
  // Someone who has sent nominations and arrives from a poster for an
  // award they left blank is taken straight to it, open, to add one.
  const arrivingToAdd = mode === "sent" && focusAward !== null && !ballot?.nominations[focusAward];
  const [editing, setEditing] = React.useState(arrivingToAdd);
  const [values, setValues] = React.useState<Values>(() => toValues(ballot, user.name));
  const [chosen, setChosen] = React.useState<AwardSlug[]>(() => {
    const initial = nominatedIn(ballot);
    return focusAward && mode !== "closed" && !initial.includes(focusAward) ? [...initial, focusAward] : initial;
  });
  const formRef = React.useRef<HTMLFormElement>(null);
  const bannerRef = React.useRef<HTMLDivElement>(null);

  const editable = mode === "new" || (mode === "sent" && editing);

  const save = useMutation({
    mutationFn: async (data: FormData): Promise<NominationResult> => {
      try {
        return await saveNominationsAction(data);
      } catch (error) {
        if (await sessionEnded()) return { ok: false, signedOut: true };
        throw error;
      }
    },
    onSuccess: (result) => {
      if (result.signedOut) {
        toast.error("You have been signed out", {
          id: TOAST_ID,
          description: "Sign in again, then come back to this tab and send. Your answers are still here.",
          duration: Infinity,
          closeButton: true,
          action: {
            label: "Sign in",
            onClick: () => window.open(loginUrl(window.location.pathname), "_blank", "noopener"),
          },
        });
        return;
      }
      if (result.ok) {
        setEditing(false);
        toast.success(result.firstSubmission ? "Nominations sent" : "Changes saved", {
          id: TOAST_ID,
          description: result.firstSubmission
            ? "Thank you. You can change them until nominations close."
            : "Your nominations have been updated.",
        });
        goToBanner(bannerRef.current);
        return;
      }
      const errors = result.errors ?? {};
      const problem = errors.form ?? errors.nominations;
      toast.error(problem ? "Could not send" : "A few answers need attention", {
        id: TOAST_ID,
        description: problem ?? "Fix the highlighted answers, then try again.",
        duration: 8000,
        closeButton: true,
      });
      goToField(formRef.current, PROBLEM_FIELDS.find(([key]) => errors[key])?.[1]);
    },
    onError: () =>
      toast.error("Could not send", { id: TOAST_ID, description: UNREACHABLE, duration: 8000, closeButton: true }),
  });
  const pending = save.isPending;
  const errors: BallotErrors = editable && save.data && !save.data.ok ? (save.data.errors ?? {}) : {};

  const setEntry = (slug: AwardSlug, name: EntryField, value: string) =>
    setValues((previous) => ({
      ...previous,
      entries: { ...previous.entries, [slug]: { ...previous.entries[slug], [name]: value } },
    }));

  // Opening an award puts the reader in its first field; closing it leaves
  // them on the same button, which now offers to open it again.
  const toggle = (slug: AwardSlug) => {
    if (chosen.includes(slug)) {
      setChosen((previous) => previous.filter((s) => s !== slug));
      return;
    }
    flushSync(() => setChosen((previous) => AWARDS.map((a) => a.slug).filter((s) => s === slug || previous.includes(s))));
    document.getElementById(`${slug}-nomineeName`)?.focus();
  };

  // Editing starts from what is stored, and cancelling goes back to it.
  const restore = () => {
    setValues(toValues(ballot, user.name));
    setChosen(nominatedIn(ballot));
    save.reset();
  };
  const startEditing = (event: React.MouseEvent<HTMLElement>) =>
    swapBarButtons(event, () => {
      restore();
      setEditing(true);
    });
  const cancelEditing = (event: React.MouseEvent<HTMLElement>) =>
    swapBarButtons(event, () => {
      restore();
      setEditing(false);
    });

  const setPicture = (slug: AwardSlug, picture: Picture) =>
    setValues((previous) => ({ ...previous, pictures: { ...previous.pictures, [slug]: picture } }));

  // How many awards will carry a nomination: open, with something typed
  // or a picture. With none, there is nothing to send, and the button says
  // so.
  const filled = chosen.filter(
    (slug) =>
      Object.values(values.entries[slug]).some((v) => v.trim()) ||
      (values.pictures[slug] ?? NO_PICTURE).kind !== "none",
  ).length;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Enter in a field submits even while the button is disabled.
    if (!editable || pending || filled === 0) return;
    const data = new FormData(event.currentTarget);
    // A picture chosen here goes with the form; a stored one taken away is
    // said so; a stored one kept needs nothing.
    for (const slug of chosen) {
      const picture = values.pictures[slug] ?? NO_PICTURE;
      if (picture.kind === "new") {
        data.set(`${slug}.imageAction`, "replace");
        data.set(`${slug}.image`, picture.blob, "image");
      } else if (picture.kind === "none" && ballot?.images[slug]) {
        data.set(`${slug}.imageAction`, "remove");
      }
    }
    save.mutate(data);
  };

  // The award the person came for is brought into view once, as it mounts.
  const scrollToFocus = React.useCallback((node: HTMLElement | null) => {
    node?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <form ref={formRef} onSubmit={submit} className="flex flex-col gap-6" aria-describedby="nomination-status">
      <StatusBanner ref={bannerRef} mode={mode} editing={editing} ballot={ballot} email={user.email} />

      {/* About you */}
      <section className={card} aria-labelledby="about-title">
        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card px-5 py-6 sm:px-6 sm:py-7">
          <h2 id="about-title" className="font-display text-2xl leading-[1.15] text-foreground">
            {NOMINATION_FORM.about.title}
          </h2>
          {editable ? (
            <>
              <TextField
                id="nominatorName"
                label="Your name"
                required
                value={values.nominatorName}
                onChange={(v) => setValues((p) => ({ ...p, nominatorName: v }))}
                error={errors.nominatorName}
                autoComplete="name"
                maxLength={NOMINATION_LIMITS.nominatorName}
              />
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">
                  Your email
                  <RequiredMark />
                  <span className="sr-only">(required)</span>
                </Label>
                <Input id="email" value={user.email} readOnly className={cn(field, "bg-muted/50 text-muted-foreground")} />
                <p className="text-sm text-muted-foreground">From your sign-in.</p>
              </div>
              <PlaceField
                id="nominatorCountry"
                label="Your country"
                required
                noun="country"
                options={COUNTRIES}
                suggest={suggestCountries}
                value={values.nominatorCountry}
                onChange={(v) => setValues((p) => ({ ...p, nominatorCountry: v }))}
                error={errors.nominatorCountry}
              />
            </>
          ) : (
            <Summary
              rows={[
                ["Your name", ballot?.nominatorName ?? "—"],
                ["Your email", user.email],
                ["Your country", ballot?.nominatorCountry ?? "—"],
              ]}
            />
          )}
        </div>
      </section>

      {AWARD_GROUPS.map((group) => (
        <section key={group.id} aria-labelledby={`group-${group.id}-title`} className="mt-6 flex flex-col gap-4">
          <div className="flex items-end gap-4 px-1">
            <span aria-hidden className="font-display text-6xl leading-[0.8] tracking-[-0.04em] text-brand-cyan">
              {group.letter}
            </span>
            <div>
              <p aria-hidden className={cn(label, "text-brand-cyan")}>
                Category {group.letter}
              </p>
              <h2 id={`group-${group.id}-title`} className="mt-1 font-display text-[1.75rem] leading-[1.15] text-foreground">
                <span className="sr-only">Category {group.letter}: </span>
                {group.title}
              </h2>
              {group.description && <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>}
            </div>
          </div>
          {group.awards.map((award) => (
            <AwardSection
              key={award.slug}
              ref={award.slug === focusAward ? scrollToFocus : undefined}
              award={award}
              editable={editable}
              chosen={chosen.includes(award.slug)}
              stored={ballot?.nominations[award.slug] ?? null}
              storedImage={ballot?.images[award.slug] ?? null}
              entry={values.entries[award.slug]}
              picture={values.pictures[award.slug] ?? NO_PICTURE}
              errors={errors}
              onToggle={() => toggle(award.slug)}
              onChange={(name, value) => setEntry(award.slug, name, value)}
              onPicture={(picture) => setPicture(award.slug, picture)}
              disabled={pending}
            />
          ))}
        </section>
      ))}

      {errors.nominations && (
        <p className={cn(errorText, "text-base")} role="alert">
          {errors.nominations}
        </p>
      )}
      {errors.form && (
        <p className={cn(errorText, "text-base")} role="alert">
          {errors.form}
        </p>
      )}

      {mode !== "closed" && (
        <div
          ref={publishBarHeight}
          data-action-bar
          className={cn(card, "sticky bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-30")}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-transparent bg-card px-4 py-3 shadow-float sm:flex-nowrap">
            {editable ? (
              <React.Fragment key="editing">
                <Button
                  type="submit"
                  size="pill"
                  disabled={pending || filled === 0}
                  aria-describedby="nomination-status"
                  className={cn(primaryButton, "w-full sm:w-auto")}
                >
                  {mode === "sent" ? "Save changes" : "Send nominations"}
                  {mode === "sent" ? (
                    <FloppyDiskIcon data-icon="inline-end" weight="bold" />
                  ) : (
                    <PaperPlaneTiltIcon data-icon="inline-end" weight="bold" />
                  )}
                </Button>
                {mode === "sent" && (
                  <Button type="button" size="pill" variant="outline" disabled={pending} onClick={cancelEditing}>
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
                Edit nominations
              </Button>
            )}
            {/* Always mounted, so screen readers hear it change. */}
            <p
              id="nomination-status"
              role="status"
              aria-live="polite"
              className="ms-auto flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums sm:text-sm"
            >
              {pending ? (
                "Sending…"
              ) : editable ? (
                `${filled} of ${AWARDS.length} awards filled in`
              ) : (
                <>
                  <CheckCircleIcon className="size-4 shrink-0 text-brand-forest" weight="fill" aria-hidden />
                  <span>
                    Sent<span className="max-sm:sr-only"> on {formatDateTime(ballot?.submittedAt)}</span>
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </form>
  );
}

/* ---------------------------------------------------------------------- */

/* The one place where the nominations' state is spelled out. A live
   region that takes focus after a send, so the reader lands on it. */
function StatusBanner({
  ref,
  mode,
  editing,
  ballot,
  email,
}: {
  ref: React.Ref<HTMLDivElement>;
  mode: Mode;
  editing: boolean;
  ballot: FormBallot | null;
  email: string;
}) {
  let tone = "border-border bg-card text-muted-foreground";
  let check = false;
  let text: string;
  const sent = ballot ? formatDateTime(ballot.submittedAt) : "";
  const count = ballot ? nominatedIn(ballot).length : 0;
  const awards = `${count} ${count === 1 ? "award" : "awards"}`;

  if (mode === "new") {
    text = `Choose “Nominate someone” on each award you want to nominate for, then send. ${RULE.body}`;
  } else if (mode === "closed") {
    tone = "border-border bg-muted/50 text-foreground";
    text = ballot
      ? `Nominations are closed. These are the nominations you sent on ${sent}, for ${awards}.`
      : "Nominations are closed. Thank you to everyone who took part.";
  } else if (editing) {
    text = `You are changing your nominations. Save to keep the changes, or cancel to leave them as they were. ${RULE.body}`;
  } else {
    tone = "border-brand-cyan/30 bg-brand-cyan/5 text-foreground";
    check = true;
    text = `Your nominations for ${awards} were received on ${sent}, from ${email}. You can change them until nominations close.`;
  }

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className={cn(
        "flex scroll-mt-24 items-start gap-3 rounded-xl border px-4 py-3.5 text-sm leading-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        tone,
      )}
    >
      {check && <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-brand-forest" weight="fill" aria-hidden />}
      <p>{text}</p>
    </div>
  );
}

/* One award: its photograph, name and what it honours, and below them the
   nomination, as fields while editing or as it was sent otherwise. */
function AwardSection({
  ref,
  award,
  editable,
  chosen,
  stored,
  storedImage,
  entry,
  picture,
  errors,
  onToggle,
  onChange,
  onPicture,
  disabled,
}: {
  ref?: React.Ref<HTMLElement>;
  award: Award;
  editable: boolean;
  chosen: boolean;
  stored: Entry | null;
  storedImage: string | null;
  entry: Entry;
  picture: Picture;
  errors: BallotErrors;
  onToggle: () => void;
  onChange: (name: EntryField, value: string) => void;
  onPicture: (picture: Picture) => void;
  disabled: boolean;
}) {
  const { slug } = award;
  const photo = AWARD_PHOTOS[slug];
  const titleId = `${slug}-title`;
  const fieldsId = `${slug}-fields`;
  const open = editable && chosen;
  const error = (name: ErrorField) => errors[entryKey(slug, name)];

  return (
    <section ref={ref} id={slug} aria-labelledby={titleId} className={cn(card, "scroll-mt-24")}>
      <div
        className={cn(
          "rounded-2xl border bg-card px-4 py-4 transition-colors duration-150 ease-hover sm:px-5 sm:py-5",
          open ? "border-brand-cyan/40" : "border-border",
        )}
      >
        <div className="flex flex-wrap items-start gap-x-4 gap-y-4 sm:flex-nowrap">
          <div className="relative h-18 w-14 shrink-0 overflow-hidden rounded-lg bg-sky-deep sm:h-24 sm:w-18">
            <Image
              src={photo.src}
              alt=""
              fill
              sizes="4.5rem"
              className="object-cover saturate-[0.75] outline -outline-offset-1 outline-black/10"
              style={{ objectPosition: photo.position }}
            />
          </div>
          <div className="min-w-0 flex-1 basis-40">
            <h3 id={titleId} className="font-display text-[1.375rem] leading-[1.2] text-foreground">
              {award.title}
            </h3>
            <p className="mt-1.5 max-w-[60ch] text-pretty text-sm leading-[1.55] text-muted-foreground">
              {award.description}
            </p>
          </div>
          {editable && (
            <Button
              id={`${slug}-toggle`}
              type="button"
              size="sm"
              variant={chosen ? "ghost" : "outline"}
              disabled={disabled}
              onClick={onToggle}
              aria-expanded={chosen}
              aria-controls={chosen ? fieldsId : undefined}
              aria-label={chosen ? `Remove your nomination for ${award.title}` : `Nominate someone for ${award.title}`}
              className={cn("h-9 rounded-full px-3.5 max-sm:w-full", chosen && "text-muted-foreground")}
            >
              {chosen ? (
                <>
                  <XIcon data-icon="inline-start" weight="bold" />
                  Remove
                </>
              ) : (
                <>
                  <PlusIcon data-icon="inline-start" weight="bold" />
                  Nominate someone
                </>
              )}
            </Button>
          )}
        </div>

        {open && (
          <div id={fieldsId} className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
            <input type="hidden" name="awards" value={slug} />
            <TextField
              id={`${slug}-nomineeName`}
              name={entryKey(slug, "nomineeName")}
              label="Name"
              required
              value={entry.nomineeName}
              onChange={(v) => onChange("nomineeName", v)}
              error={error("nomineeName")}
              autoComplete="off"
              maxLength={NOMINATION_LIMITS.nomineeName}
              className={cn(!award.account && "sm:col-span-2")}
            />
            {award.account && (
              <LinkField
                slug={slug}
                name="account"
                label={award.account.label}
                placeholder={award.account.placeholder}
                required
                value={entry.account}
                onChange={onChange}
                error={error("account")}
                className="" /* beside the name, not across */
              />
            )}
            <LinkField
              slug={slug}
              name="link"
              label={award.linkLabel}
              placeholder={award.linkPlaceholder}
              required={!award.image}
              value={entry.link}
              onChange={onChange}
              error={error("link")}
            />
            {award.image && (
              <PictureField
                slug={slug}
                picture={picture}
                onChoose={(prepared) => onPicture({ kind: "new", ...prepared })}
                onRemove={() => onPicture(NO_PICTURE)}
                error={error("image")}
              />
            )}
            {award.videoLink && (
              <LinkField
                slug={slug}
                name="videoLink"
                label={award.videoLink.label}
                placeholder={award.videoLink.placeholder}
                required
                value={entry.videoLink}
                onChange={onChange}
                error={error("videoLink")}
              />
            )}
            <ReasonField slug={slug} value={entry.reason} onChange={(v) => onChange("reason", v)} error={error("reason")} />
          </div>
        )}

        {!editable &&
          (stored ? (
            <div className="mt-5 border-t border-border pt-5">
              <Summary
                rows={summaryRows(award, stored, storedImage)}
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No nomination for this award.</p>
          ))}
      </div>
    </section>
  );
}

/* The nomination as sent, row by row, with only the fields the award asks
   for. */
function summaryRows(award: Award, stored: Entry, image: string | null): [string, React.ReactNode][] {
  const rows: [string, React.ReactNode][] = [["Name", stored.nomineeName]];
  if (award.account) {
    rows.push([award.account.label, stored.account ? <OutLink href={stored.account} /> : "—"]);
  }
  rows.push([award.linkLabel, stored.link ? <OutLink key="link" href={stored.link} /> : "—"]);
  if (award.image) {
    rows.push([
      "Image",
      image ? (
        <a
          key="image"
          href={image}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <PicturePreview src={image} alt="The image you uploaded" />
          <span className="sr-only"> (opens in new tab)</span>
        </a>
      ) : (
        "—"
      ),
    ]);
  }
  if (award.videoLink) rows.push([award.videoLink.label, stored.videoLink ? <OutLink href={stored.videoLink} /> : "—"]);
  rows.push(["Why you nominate them", <span key="why" className="whitespace-pre-line">{stored.reason}</span>]);
  return rows;
}

/* A link field. A plain text field, not type="url": the server adds a
   missing https://, which the browser's check would refuse. */
function LinkField({
  slug,
  name,
  label,
  placeholder,
  required,
  value,
  onChange,
  error,
  className = "sm:col-span-2",
}: {
  slug: AwardSlug;
  name: EntryField;
  label: string;
  placeholder: string;
  required?: boolean;
  value: string;
  onChange: (name: EntryField, value: string) => void;
  error?: string;
  className?: string;
}) {
  return (
    <TextField
      id={`${slug}-${name}`}
      name={entryKey(slug, name)}
      label={label}
      required={required}
      value={value}
      onChange={(v) => onChange(name, v)}
      error={error}
      inputMode="url"
      autoComplete="off"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      placeholder={placeholder}
      maxLength={NOMINATION_LIMITS.link}
      className={className}
    />
  );
}

/* The picture of the work, for an award that takes one: chosen from the
   device, scaled and compressed here (components/awards/artwork.ts), and
   sent with the form. */
function PictureField({
  slug,
  picture,
  onChoose,
  onRemove,
  error,
}: {
  slug: AwardSlug;
  picture: Picture;
  onChoose: (prepared: PreparedPhoto) => void;
  onRemove: () => void;
  error?: string;
}) {
  const id = `${slug}-image`;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const prepare = useMutation({ mutationFn: prepareArtwork, onSuccess: onChoose });
  // A picture this browser could not read is said here: nothing was sent.
  const unreadable = prepare.error
    ? prepare.error instanceof PhotoProblem
      ? prepare.error.message
      : UNREADABLE_PICTURE
    : null;
  const message = unreadable ?? error;
  const url = picture.kind === "none" ? null : picture.url;

  return (
    <div role="group" aria-labelledby={`${id}-label`} className="flex flex-col gap-2 sm:col-span-2">
      <p id={`${id}-label`} className="text-sm leading-none font-medium">
        Or upload the image
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {url && <PicturePreview src={url} alt="The image you chose" />}
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
            id={id}
            type="button"
            variant="outline"
            size="pill"
            disabled={prepare.isPending}
            aria-describedby={message ? `${id}-hint ${id}-error` : `${id}-hint`}
            onClick={() => inputRef.current?.click()}
            className="h-10 px-4 text-sm has-data-[icon=inline-start]:ps-3.5"
          >
            <ImageIcon data-icon="inline-start" weight="bold" />
            {prepare.isPending ? "Preparing…" : url ? "Change image" : "Upload the image"}
          </Button>
          {url && (
            <Button
              type="button"
              variant="ghost"
              size="pill"
              onClick={() => {
                prepare.reset();
                onRemove();
              }}
              className="h-10 px-4 text-sm text-muted-foreground"
            >
              Remove image
            </Button>
          )}
        </div>
      </div>
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">
        A JPG, PNG or WebP. Add the link, the image, or both.
      </p>
      {message && (
        <p id={`${id}-error`} className={errorText}>
          {message}
        </p>
      )}
    </div>
  );
}

/* A picture of the work at thumbnail size, whole, never cropped. */
function PicturePreview({ src, alt }: { src: string; alt: string }) {
  return (
    // A data URL or a presigned S3 address, neither of which next/image adds anything to.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-24 w-auto max-w-48 rounded-lg border border-border bg-muted object-contain"
    />
  );
}

/* A link as sent, opening in a new tab. */
function OutLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-sm text-brand-cyan underline decoration-brand-cyan/30 underline-offset-4 wrap-anywhere hover:decoration-brand-cyan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {href}
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  );
}

function ReasonField({
  slug,
  value,
  onChange,
  error,
}: {
  slug: AwardSlug;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const id = `${slug}-reason`;
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <Label htmlFor={id}>
        Why do you nominate them?
        <RequiredMark />
        <span className="sr-only">(required)</span>
      </Label>
      <Textarea
        id={id}
        name={entryKey(slug, "reason")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        maxLength={NOMINATION_LIMITS.reason}
        aria-invalid={!!error}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        className="min-h-28 px-3.5 py-2.5 leading-normal"
      />
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">
        A few sentences is plenty.
      </p>
      {error && (
        <p id={`${id}-error`} className={errorText}>
          {error}
        </p>
      )}
    </div>
  );
}

/* What was sent, read back as label and answer. */
function Summary({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm leading-[1.55] sm:grid-cols-[11rem_minmax(0,1fr)]">
      {rows.map(([term, detail]) => (
        <div key={term} className="contents">
          <dt className="text-muted-foreground">{term}</dt>
          <dd className="min-w-0 text-foreground max-sm:-mt-2 max-sm:mb-1 wrap-anywhere">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}
