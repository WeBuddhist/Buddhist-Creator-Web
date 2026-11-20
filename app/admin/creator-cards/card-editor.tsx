"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowCounterClockwiseIcon, CameraIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { LinkField } from "@/app/(site)/creator-card/card-fields";
import { Section } from "@/components/admin/section";
import { CardPhoto } from "@/components/creator-card/card-photo";
import { CreatorCard } from "@/components/creator-card/creator-card";
import { PhotoProblem, UNREADABLE, squarePhoto, type PreparedPhoto } from "@/components/creator-card/photo";
import { PlaceField, TextField, errorText } from "@/components/form/fields";
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
import { COUNTRIES, isCountry, suggestCountries } from "@/lib/countries";
import {
  CARD_NAME_MAX,
  CARD_SOCIALS,
  CARD_TAGLINE_MAX,
  socialLinkKey,
  type CardFieldErrors,
  type CardFollowers,
  type CardSocial,
  type CardSocials,
  type CountedSocial,
} from "@/lib/creator-card";
import type { FollowerCheckStatus } from "@/lib/db/schema";
import { formatCount, formatDate } from "@/lib/format";
import { SIGNED_OUT, UNREACHABLE, sessionEnded, settled } from "@/lib/session-ended";
import {
  removeTeamCardAction,
  saveTeamCardAction,
  type SavedReading,
  type TeamCardResult,
} from "./editor-actions";

const LIST = "/admin/creator-cards";

/** A card nobody owns, as the editor is handed it. */
export type EditorCard = {
  id: string;
  displayName: string;
  country: string | null;
  tagline: string | null;
  socials: CardSocials;
  /** Where its photo loads from, if it has one. */
  photoUrl: string | null;
  followers: CardFollowers;
  totalFollowers: number;
  checks: Partial<Record<CountedSocial, { status: FollowerCheckStatus; checkedAt: string }>>;
};

type Values = { displayName: string; country: string; tagline: string; socials: Record<CardSocial, string> };

function toValues(card: EditorCard | null): Values {
  return {
    displayName: card?.displayName ?? "",
    // A country that is not on the list cannot be shown by the field.
    country: card?.country && isCountry(card.country) ? card.country : "",
    tagline: card?.tagline ?? "",
    socials: Object.fromEntries(CARD_SOCIALS.map(({ value }) => [value, card?.socials[value] ?? ""])) as Record<
      CardSocial,
      string
    >,
  };
}

const CHECK_NOTE: Record<FollowerCheckStatus, string> = {
  ok: "Read from this link",
  not_found: "No account was found at this link. Tried",
  unreadable: "No figure could be read for this account. Tried",
  error: "The last attempt failed and will be made again. Tried",
};

/** What stands beside a counted link: the figure the card has for it and
    where its reading stands, or, for a link typed in this visit, that it
    is read on saving. */
function audienceOf(card: EditorCard | null, place: CountedSocial, typed: string) {
  const link = typed.trim();
  if (!link) return undefined;
  const stored = card?.socials[place]?.trim();
  const same =
    !!stored &&
    socialLinkKey(place, /^https?:\/\//i.test(link) ? link : `https://${link}`) === socialLinkKey(place, stored);
  if (!card || !same) return { count: null, note: "Read when you save." };
  const figure = card.followers[place];
  const check = card.checks[place];
  return {
    count: figure == null ? null : formatCount(figure),
    note: check ? `${CHECK_NOTE[check.status]} ${formatDate(check.checkedAt)}.` : "Not read yet. Read at the next daily reading.",
  };
}

/** The links as the preview may show them, live: what is typed is not a
    checked address yet, so only what reads as a web address gets through,
    with the "https://" the save would add. */
function previewLinks(socials: Record<CardSocial, string>): CardSocials {
  const links: CardSocials = {};
  for (const { value } of CARD_SOCIALS) {
    const typed = socials[value].trim();
    if (!typed) continue;
    const address = /^https?:\/\//i.test(typed) ? typed : `https://${typed}`;
    if (URL.canParse(address) && /^https?:$/.test(new URL(address).protocol)) links[value] = address;
  }
  return links;
}

const PLACE_LABEL = Object.fromEntries(CARD_SOCIALS.map(({ value, label }) => [value, label])) as Record<
  CardSocial,
  string
>;

const READING_SAID: Record<Exclude<SavedReading["status"], "ok">, string> = {
  not_found: "no account at this link",
  unreadable: "no figure could be read",
  error: "the reading failed and will be tried again",
  stopped: "could not be read now and will be tried at the daily reading",
};

/** What a save read, in a line: "YouTube 572,000 · Facebook: no account at this link". */
const readingsSaid = (readings: SavedReading[]) =>
  readings
    .map(({ platform, status, followers }) =>
      status === "ok" ? `${PLACE_LABEL[platform]} ${formatCount(followers ?? 0)}` : `${PLACE_LABEL[platform]}: ${READING_SAID[status]}`,
    )
    .join(" · ");

/* Each answer that can be refused, in the order of the form, with the
   element to go to for it. */
const PROBLEM_FIELDS: readonly (readonly [keyof CardFieldErrors, string])[] = [
  ["photo", "[data-photo-button]"],
  ["displayName", "#displayName"],
  ["country", "#country"],
  ["tagline", "#tagline"],
  ...CARD_SOCIALS.map(
    (social): readonly [keyof CardFieldErrors, string] => [`socials.${social.value}`, `#socials-${social.value}`],
  ),
  ["socials", `#socials-${CARD_SOCIALS[0].value}`],
];

type PendingPhoto = { kind: "untouched" } | ({ kind: "chosen" } & PreparedPhoto) | { kind: "removed" };
const UNTOUCHED: PendingPhoto = { kind: "untouched" };
const NONE: ReadonlySet<string> = new Set();

/* The dashboard's editor for a card our team keeps: a new one for a
   creator the team knows, or one nobody has claimed. A name and one link
   are all it asks for. The card as it will read stands beside the form
   and fills in as the admin types.

   Saving keeps the card approved, since the admin is the reviewer, and
   reads the follower count of each link that is new or changed, which the
   line over the links says before the button is pressed: Instagram, TikTok
   and Facebook cost a credit each, Douyin six. The page that follows is the card's
   own, where every link shows what its reading gave.

   Saving and removing are React Query mutations around their server
   actions; the form sends itself from onSubmit, as every form here does. */
export function CardEditor({ card, canRemove }: { card: EditorCard | null; canRemove: boolean }) {
  const router = useRouter();
  const [values, setValues] = React.useState<Values>(() => toValues(card));
  const [photo, setPhoto] = React.useState<PendingPhoto>(UNTOUCHED);
  // The messages the admin has since answered.
  const [answered, setAnswered] = React.useState<ReadonlySet<string>>(NONE);
  const formRef = React.useRef<HTMLFormElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const prepare = useMutation({
    mutationFn: squarePhoto,
    onSuccess: (chosen) => {
      setPhoto({ kind: "chosen", ...chosen });
      answer("photo");
    },
  });

  const save = useMutation({
    mutationFn: async (data: FormData): Promise<TeamCardResult> => {
      try {
        return await saveTeamCardAction(data);
      } catch {
        // The request itself failed: a session that ended, or no connection.
        return (await sessionEnded())
          ? { ok: false, errors: {}, signedOut: true }
          : { ok: false, errors: { form: [UNREACHABLE] } };
      }
    },
    onMutate: () => setAnswered(NONE),
    onSuccess: (result) => {
      if (!result.ok) {
        const problem = result.signedOut ? SIGNED_OUT : result.errors.form?.[0];
        toast.error(problem ? "Could not save" : "A few answers need attention", {
          description: problem ?? "Fix the highlighted answers, then save again.",
          duration: 8000,
          closeButton: true,
        });
        const first = PROBLEM_FIELDS.find(([key]) => result.errors[key])?.[1];
        if (first) formRef.current?.querySelector<HTMLElement>(first)?.focus();
        return;
      }
      const said = [
        result.readings.length > 0 ? readingsSaid(result.readings) : null,
        result.photoTaken ? "Photo taken from their channel." : null,
      ]
        .filter(Boolean)
        .join(" ");
      const troubled = result.readings.some((reading) => reading.status !== "ok");
      (troubled ? toast.warning : toast.success)(result.created ? "Creator added" : "Card saved", {
        description: said || undefined,
        duration: troubled ? 12000 : 6000,
        closeButton: troubled,
      });
      // The card's own page, where each link says what its reading gave.
      router.push(`${LIST}/${result.cardId}`);
      router.refresh();
    },
  });

  const refused = save.data && !save.data.ok ? save.data.errors : null;
  const errors: CardFieldErrors = refused
    ? Object.fromEntries(Object.entries(refused).filter(([key]) => !answered.has(key)))
    : {};
  function answer(...keys: string[]) {
    if (refused) setAnswered((previous) => new Set([...previous, ...keys]));
  }
  const set = <K extends keyof Values>(key: K, value: Values[K], ...alsoAnswers: string[]) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    answer(key, ...alsoAnswers);
  };

  const storedPhoto = card?.photoUrl ?? null;
  const photoUrl = photo.kind === "chosen" ? photo.url : photo.kind === "removed" ? null : storedPhoto;
  const unreadable = prepare.error ? (prepare.error instanceof PhotoProblem ? prepare.error.message : UNREADABLE) : null;
  const photoMessage = unreadable ?? errors.photo?.[0];
  const pending = save.isPending;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    if (photo.kind === "chosen") {
      data.set("photoAction", "replace");
      data.set("photo", photo.blob, "photo");
    } else if (photo.kind === "removed") {
      data.set("photoAction", "remove");
    }
    save.mutate(data);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      <form ref={formRef} onSubmit={submit} className="flex min-w-0 flex-col gap-6">
        {card && <input type="hidden" name="cardId" value={card.id} />}

        <Section id="editor-who-title" title="Who they are" bodyClassName="flex flex-col gap-6 py-5">
          <div role="group" aria-labelledby="photo-label" className="flex flex-col gap-3">
            <p id="photo-label" className="text-sm leading-none font-medium">
              Photo
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
              <CardPhoto src={photoUrl} name={values.displayName || undefined} />
              <div className="flex min-w-0 flex-1 basis-56 flex-col items-start gap-2.5">
                <div className="flex flex-wrap gap-2">
                  {/* The browser's file picker, opened by the button beside it. */}
                  <input
                    ref={fileRef}
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
                    size="lg"
                    data-photo-button
                    disabled={prepare.isPending || pending}
                    aria-describedby={photoMessage ? "photo-hint photo-error" : "photo-hint"}
                    onClick={() => fileRef.current?.click()}
                    className="px-3"
                  >
                    <CameraIcon data-icon="inline-start" aria-hidden />
                    {prepare.isPending ? "Preparing…" : photoUrl ? "Change photo" : "Choose a photo"}
                  </Button>
                  {photoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      disabled={pending}
                      onClick={() => {
                        prepare.reset();
                        // A picture chosen in this visit is dropped; a stored one is marked to go.
                        setPhoto(photo.kind === "chosen" ? UNTOUCHED : { kind: "removed" });
                        answer("photo");
                      }}
                      className="px-3 text-muted-foreground"
                    >
                      <ArrowCounterClockwiseIcon data-icon="inline-start" aria-hidden />
                      {photo.kind === "chosen" ? "Undo" : "Remove photo"}
                    </Button>
                  )}
                </div>
                <p id="photo-hint" className="text-sm leading-[1.5] text-muted-foreground">
                  Optional. With none, the card takes the profile picture from the creator&rsquo;s own channel when you
                  save, or shows their initials.
                </p>
              </div>
            </div>
            {photoMessage && (
              <p id="photo-error" role="alert" className={errorText}>
                {photoMessage}
              </p>
            )}
          </div>

          <TextField
            id="displayName"
            label="Name"
            hint="As the card shows it: the creator's own name, or the name of their channel or organization."
            required
            value={values.displayName}
            onChange={(value) => set("displayName", value)}
            error={errors.displayName?.[0]}
            maxLength={CARD_NAME_MAX}
            autoComplete="off"
          />
          <PlaceField
            id="country"
            label="Country"
            noun="country"
            options={COUNTRIES}
            suggest={suggestCountries}
            value={values.country}
            onChange={(value) => set("country", value)}
            error={errors.country?.[0]}
          />
          <TextField
            id="tagline"
            label="One line about their work"
            hint={`Optional. What they share, in a few words. Up to ${CARD_TAGLINE_MAX} characters.`}
            value={values.tagline}
            onChange={(value) => set("tagline", value)}
            error={errors.tagline?.[0]}
            maxLength={CARD_TAGLINE_MAX}
            autoComplete="off"
          />
        </Section>

        <Section id="editor-links-title" title="Where to find them" bodyClassName="flex flex-col gap-5 py-5">
          <p className="max-w-[68ch] text-sm leading-[1.6] text-muted-foreground">
            Paste the address of each channel. One is enough. When you save, we read the follower count of every link
            that is new or changed: YouTube is free, Instagram, TikTok and Facebook use one SocialCrawl credit
            each, and Douyin six.
          </p>
          <fieldset
            aria-label="Their links"
            aria-invalid={!!errors.socials || undefined}
            aria-describedby={errors.socials ? "socials-error" : undefined}
            className="grid gap-x-5 gap-y-6 sm:grid-cols-2 sm:gap-y-4"
          >
            {CARD_SOCIALS.map((social) => {
              const counted = "audience" in social ? social.value : null;
              return (
                <LinkField
                  key={social.value}
                  social={social}
                  value={values.socials[social.value]}
                  onChange={(value) =>
                    set("socials", { ...values.socials, [social.value]: value }, `socials.${social.value}`)
                  }
                  error={errors[`socials.${social.value}`]?.[0]}
                  audience={counted ? audienceOf(card, counted, values.socials[counted]) : undefined}
                />
              );
            })}
          </fieldset>
          {errors.socials && (
            <p id="socials-error" role="alert" className={errorText}>
              {errors.socials[0]}
            </p>
          )}
          {card && card.totalFollowers > 0 && (
            <p className="flex items-baseline justify-between gap-4 border-t border-border pt-4 text-sm">
              <span className="font-medium">Total followers</span>
              <span className="font-medium tabular-nums">{formatCount(card.totalFollowers)}</span>
            </p>
          )}
        </Section>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" variant="emphasis" size="lg" className="px-3" disabled={pending}>
            {pending ? (card ? "Saving and reading counts…" : "Adding and reading counts…") : card ? "Save changes" : "Add creator"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="px-3"
            nativeButton={false}
            render={<Link href={card ? `${LIST}/${card.id}` : LIST} />}
          >
            Cancel
          </Button>
          <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
            {pending ? "This can take a few seconds." : ""}
          </p>
        </div>
      </form>

      <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
        <Section id="editor-preview-title" title="How it will look">
          {/* The public site's own text face, so the card reads here as it will there. */}
          <div className="font-[family-name:var(--font-instrument),ui-sans-serif,system-ui,sans-serif]">
            <CreatorCard
              card={{
                displayName: values.displayName.trim() || "Creator’s name",
                country: values.country || null,
                tagline: values.tagline.trim() || null,
                socials: previewLinks(values.socials),
                creatorType: null,
                languages: null,
                languagesOther: null,
                contentTypes: null,
                contentTypesOther: null,
                photoUrl,
                totalFollowers: card?.totalFollowers ?? 0,
              }}
              verified
            />
          </div>
        </Section>
        {card && canRemove && <RemoveCard cardId={card.id} name={card.displayName} />}
      </div>
    </div>
  );
}

/* Taking a card off the list, for superadmins. It cannot be undone, so
   the button asks first: the dialog names the creator and says what goes
   with the card, and opens with focus on Cancel. */
function RemoveCard({ cardId, name }: { cardId: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const remove = useMutation({
    mutationFn: () => settled(removeTeamCardAction(cardId)),
    onSuccess: (result) => {
      if (!result.ok) return;
      toast.success("Creator removed", { description: `${name} is no longer on the list.` });
      router.push(LIST);
      router.refresh();
    },
  });
  const pending = remove.isPending;
  const error = !pending && remove.data && !remove.data.ok ? remove.data.message : undefined;

  return (
    <Section id="editor-remove-title" title="Remove this creator">
      <p className="text-sm leading-[1.6] text-muted-foreground">
        Takes the card off the creators list and the leaderboard for good.
      </p>
      <Button
        type="button"
        variant="destructive"
        size="lg"
        className="mt-3 px-3"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          remove.reset();
          setOpen(true);
        }}
      >
        <TrashIcon data-icon="inline-start" aria-hidden />
        Remove creator
      </Button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)} disablePointerDismissal={pending}>
        <DialogContent className="max-w-md">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!pending) remove.mutate();
            }}
            className="flex min-h-0 flex-col"
          >
            <DialogHeader>
              <DialogTitle>Remove {name}?</DialogTitle>
              <DialogDescription>
                The card is deleted for good, with its photo, its follower readings and any claims on it. You can’t
                undo this.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              {error && (
                <p role="alert" className="flex items-center gap-1.5 text-sm text-brand-maroon">
                  <WarningCircleIcon aria-hidden weight="fill" className="size-4 shrink-0" />
                  {error}
                </p>
              )}
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="px-3"
                disabled={pending}
                onClick={() => setOpen(false)}
                data-initial-focus
              >
                Cancel
              </Button>
              {/* Stays focusable while it works: a disabled button would drop focus out of the dialog. */}
              <Button
                type="submit"
                variant="destructive"
                size="lg"
                aria-disabled={pending || undefined}
                className="px-3 aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                {pending ? "Removing…" : "Remove creator"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
