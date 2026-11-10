import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { ArrowRightIcon, ArrowUpRightIcon, CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { primaryButton } from "@/components/convention/section-heading";
import { getMyApplication } from "@/lib/applications";
import { getCurrentUser } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/db/schema";
import { REGISTRATION } from "@/lib/convention-2027";
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
        <div className="mt-6">
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
      <div className="mt-6">
        <Button size="pill" nativeButton={false} className={buttonClass} render={<Link href={REGISTRATION.href} />}>
          {REGISTRATION.label}
          <ArrowRightIcon data-icon="inline-end" weight="bold" />
        </Button>
      </div>
      <p className={note}>{REGISTRATION.note}</p>
    </>
  );
}

export async function RegistrationAction() {
  if (!REGISTRATION.open) return <RegisterCallToAction />;

  // As in the header's account corner (components/user-menu.tsx): wait
  // for the real request, outside the try, before reading the session.
  await connection();
  let application: Awaited<ReturnType<typeof getMyApplication>> = null;
  let email: string | null = null;
  try {
    const user = await getCurrentUser();
    if (user) {
      email = user.email;
      application = await getMyApplication(user.id);
    }
  } catch (error) {
    // Redirects and prerender interruptions are Next's, not ours.
    unstable_rethrow(error);
    console.error("RegistrationAction: could not read the application", forLog(error));
  }

  if (!application || !email) return <RegisterCallToAction />;
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
        <div className="mt-6">
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
        <p className="mt-6 text-sm font-medium leading-[1.5] text-foreground">You withdrew your application.</p>
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
      <p className="mt-6 flex items-start gap-2 text-sm font-medium leading-[1.5] text-foreground">
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

