import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { ctaLink } from "@/components/events/event-card";
import { SectionHeading } from "@/components/convention/section-heading";

export const metadata: Metadata = {
  title: "Not allowed",
  robots: { index: false },
};

/* Where a signed-in member lands when they open the dashboard. */
export default function ForbiddenPage() {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <SectionHeading
          id="forbidden-title"
          eyebrow="Admin"
          title="This page is for the selection committee"
          description="Your account is signed in, but it does not have access to the dashboard. If you are on the committee, ask a superadmin to give your account the admin role."
        />
        <p className="mt-8">
          <Link href="/convention/2027/register" className={ctaLink}>
            Go to my application
            <ArrowRightIcon aria-hidden weight="bold" className="size-3.5" />
          </Link>
        </p>
      </div>
    </main>
  );
}
