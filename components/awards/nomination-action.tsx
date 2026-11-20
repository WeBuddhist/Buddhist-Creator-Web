import { cache } from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { ArrowRightIcon, CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { accentButton, primaryButton } from "@/components/convention/section-heading";
import { getCurrentUser } from "@/lib/auth";
import { AWARDS_2027, AWARDS_PAGE } from "@/lib/awards-2027";
import { formatDate, plural } from "@/lib/format";
import { forLog } from "@/lib/log-error";
import { getMyBallot } from "@/lib/nominations";
import { cn } from "@/lib/utils";

/* The awards page's one action, under the medal at its head and again on
   the cyan band at its foot. A visitor is invited to nominate; someone who already
   has is told so and taken back to their nominations. It reads the
   session, so the page renders it inside <Suspense> with the visitor's
   version as the fallback, and falls back to that version if the session
   or the database cannot be read, as the registration action does. */

type Sent = { count: number; submittedAt: Date } | null;

const getSent = cache(async (): Promise<Sent> => {
  await connection();
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    const ballot = await getMyBallot(user.id);
    return ballot ? { count: ballot.nominations.length, submittedAt: ballot.submittedAt } : null;
  } catch (error) {
    unstable_rethrow(error);
    console.error("NominationAction: could not read the nominations", forLog(error));
    return null;
  }
});

/* The two grounds the action sits on: the white opening, where it is the
   site's cyan button, and the cyan closing band, where it is the banners'
   gold with white words around it. */
const TONES = {
  light: {
    button: primaryButton,
    note: "text-muted-foreground",
    sent: "text-foreground",
    check: "text-brand-forest",
  },
  dark: {
    button: accentButton,
    note: "text-white/85",
    sent: "text-white",
    check: "text-gold-soft",
  },
} as const;

type Tone = keyof typeof TONES;

const note = "mt-4 max-w-md text-pretty text-sm leading-[1.5]";

/** Pure, so it renders for a visitor and as the Suspense fallback. */
export function NominationCallToAction({
  sent = null,
  align = "start",
  tone = "dark",
}: {
  sent?: Sent;
  align?: "start" | "center";
  tone?: Tone;
}) {
  const centered = align === "center";
  const colours = TONES[tone];
  if (!AWARDS_2027.open && !sent) {
    return <p className={cn(note, colours.note, "text-base", centered && "mx-auto")}>{AWARDS_PAGE.closedNote}</p>;
  }
  return (
    <div className={cn("flex flex-col", centered ? "items-center text-center" : "items-start")}>
      {sent && (
        <p className={cn("mb-5 flex items-start gap-2 text-pretty text-base font-medium leading-[1.5]", colours.sent)}>
          <CheckCircleIcon aria-hidden weight="fill" className={cn("mt-0.5 size-5 shrink-0", colours.check)} />
          <span>
            You nominated creators for {sent.count} {plural(sent.count, "award", "awards")} on{" "}
            {formatDate(sent.submittedAt)}.
          </span>
        </p>
      )}
      <Button
        size="pill"
        nativeButton={false}
        className={colours.button}
        render={<Link href={AWARDS_2027.nominatePath} />}
      >
        {sent ? (AWARDS_2027.open ? "View or change your nominations" : "View your nominations") : AWARDS_PAGE.action}
        <ArrowRightIcon data-icon="inline-end" weight="bold" />
      </Button>
    </div>
  );
}

export async function NominationAction({ align, tone }: { align?: "start" | "center"; tone?: Tone }) {
  const sent = await getSent();
  return <NominationCallToAction sent={sent} align={align} tone={tone} />;
}
