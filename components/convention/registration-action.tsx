import { cache } from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { ArrowRightIcon, ArrowUpRightIcon, CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { primaryButton } from "@/components/convention/section-heading";
import { getMyApplication } from "@/lib/applications";
import { getCurrentUser } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/db/schema";
import { CLOSING, REGISTRATION } from "@/lib/convention-2027";
import { formatDateTime } from "@/lib/format";
import { forLog } from "@/lib/log-error";
import { FORM } from "@/lib/registration-2027";
import { cn } from "@/lib/utils";

/* The action in the 2027 details card. For a visitor it is the register
   button; for someone with an application it says where they are and
   takes them back to it. It reads the session, so the page renders it
   inside <Suspense> with the visitor's version as the fallback, and like
   the header's account corner it falls back to that version if the
   session or the database cannot be read.

   A decision reaches the applicant by email: accepted, waitlisted and
   rejected look exactly like submitted here. */

const buttonClass = cn(primaryButton, "w-full sm:w-auto");
const outlineClass = "w-full sm:w-auto";
const note = "mt-4 text-pretty text-sm leading-[1.5] text-muted-foreground";

export function RegisterCallToAction() {
  if (!REGISTRATION.open) {
    // Genuinely unavailable, so natively disabled: it leaves the tab order
    // and reads as disabled to assistive tech.
    return (
      <>
        <div>
          <Button size="pill" disabled className={buttonClass}>
            {REGISTRATION.label}
            <ArrowUpRightIcon data-icon="inline-end" weight="bold" />
          </Button>
        </div>
        <p className={note}>{REGISTRATION.note}</p>
      </>
    );
  }
  return (
    <>
      <div>
        <Button size="pill" nativeButton={false} className={buttonClass} render={<Link href={REGISTRATION.href} />}>
          {REGISTRATION.label}
          <ArrowRightIcon data-icon="inline-end" weight="bold" />
        </Button>
      </div>
      <p className={note}>{REGISTRATION.note}</p>
    </>
  );
}

/* The signed-in visitor's application and the address a decision goes to,
   or null for anyone else. The card and the closing band both ask, so the
   answer is read once per request. */
const getRegistration = cache(async () => {
  // As in the header's account corner (components/user-menu.tsx): wait
  // for the real request, outside the try, before reading the session.
  await connection();
  try {
    const user = await getCurrentUser();
    if (!user?.email) return null;
    const application = await getMyApplication(user.id);
    return application ? { application, email: user.email } : null;
  } catch (error) {
    // Redirects and prerender interruptions are Next's, not ours.
    unstable_rethrow(error);
    console.error("RegistrationAction: could not read the application", forLog(error));
    return null;
  }
});

export async function RegistrationAction() {
  if (!REGISTRATION.open) return <RegisterCallToAction />;

  const registration = await getRegistration();
  if (!registration) return <RegisterCallToAction />;
  const { application, email } = registration;
  return (
    <RegistrationActionView
      status={application.status}
      submittedAt={application.submittedAt}
      updatedAt={application.updatedAt}
      email={email}
    />
  );
}

/** The signed-in card action for one application. Pure, so it can be
    rendered for every status without a session. */
export function RegistrationActionView({
  status,
  submittedAt,
  updatedAt,
  email,
}: {
  status: ApplicationStatus;
  submittedAt: Date | string | null;
  updatedAt: Date | string;
  email: string;
}) {
  if (status === "draft") {
    return (
      <>
        <div>
          <Button size="pill" nativeButton={false} className={buttonClass} render={<Link href={REGISTRATION.href} />}>
            Continue your application
            <ArrowRightIcon data-icon="inline-end" weight="bold" />
          </Button>
        </div>
        <p className={note}>You started a draft on {formatDateTime(updatedAt)}. Nothing is sent until you submit it.</p>
      </>
    );
  }

  if (status === "withdrawn") {
    return (
      <>
        <p className="text-sm font-medium leading-[1.5] text-foreground">You withdrew your application.</p>
        <div className="mt-4">
          <Button
            size="pill"
            variant="outline"
            nativeButton={false}
            className={outlineClass}
            render={<Link href={REGISTRATION.href} />}
          >
            Reopen your application
            <ArrowRightIcon data-icon="inline-end" weight="bold" />
          </Button>
        </div>
        <p className={note}>It will not be considered unless you reopen it. Questions? Write to {FORM.contact}.</p>
      </>
    );
  }

  // Submitted, or decided: the same view, because the outcome goes by email.
  const canEdit = status === "submitted";
  return (
    <>
      <p className="flex items-start gap-2 text-sm font-medium leading-[1.5] text-foreground">
        <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-brand-forest" weight="fill" aria-hidden />
        <span>Application submitted on {formatDateTime(submittedAt)}</span>
      </p>
      <div className="mt-4">
        <Button
          size="pill"
          variant="outline"
          nativeButton={false}
          className={outlineClass}
          render={<Link href={REGISTRATION.href} />}
        >
          View your application
          <ArrowRightIcon data-icon="inline-end" weight="bold" />
        </Button>
      </div>
      <p className={note}>
        {canEdit ? "You can still make changes until the selection committee decides. " : ""}We will write to {email}.
      </p>
    </>
  );
}


/* The same action at the foot of the page, on the brand band: one line and
   one button, centred. A visitor is invited to apply; someone with an
   application is told where it stands and taken back to it, as in the card,
   which carries the detail. The button is the white pill, so it reads as
   the one control on the cyan, and its focus ring is white for the same
   reason: the grey ring measures under 3:1 there. */

const closingLine = "mt-6 max-w-xl text-pretty text-lg leading-[1.6] text-white/80";
const closingButton = "focus-visible:ring-white/70";

/** What the closing band says for each application status. */
function closingCopy(status: ApplicationStatus | null) {
  if (status === null) return { line: CLOSING.body, label: REGISTRATION.label };
  if (status === "draft") return { line: "Your application is saved as a draft.", label: "Continue your application" };
  if (status === "withdrawn") return { line: "You withdrew your application.", label: "Reopen your application" };
  return { line: "Your application is in. We will write to you by email.", label: "View your application" };
}

/** Pure, so it can be rendered for every status without a session. */
export function ClosingCallToAction({ status = null }: { status?: ApplicationStatus | null }) {
  if (!REGISTRATION.open) {
    // No line: the one the band has says registration is open.
    return (
      <div className="mt-8">
        <Button size="pill" variant="outline" disabled>
          {REGISTRATION.label}
          <ArrowRightIcon data-icon="inline-end" weight="bold" />
        </Button>
      </div>
    );
  }
  const { line, label } = closingCopy(status);
  return (
    <>
      <p className={closingLine}>{line}</p>
      <div className="mt-8">
        <Button
          size="pill"
          variant="outline"
          nativeButton={false}
          className={closingButton}
          render={<Link href={REGISTRATION.href} />}
        >
          {label}
          <ArrowRightIcon data-icon="inline-end" weight="bold" />
        </Button>
      </div>
    </>
  );
}

export async function ClosingAction() {
  if (!REGISTRATION.open) return <ClosingCallToAction />;
  const registration = await getRegistration();
  return <ClosingCallToAction status={registration?.application.status ?? null} />;
}
