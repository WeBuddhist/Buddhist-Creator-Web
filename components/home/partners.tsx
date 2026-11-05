import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { ctaLink } from "@/components/events/event-card";
import { PartnerLogos } from "@/components/partner-logos";
import { PARTNER } from "@/lib/get-involved";
import { PARTNERS } from "@/lib/home";

/* Trust strip under the mission band: the overline heading leads, the
   partner link trails, and the logo wall from the Get Involved page sits
   beneath them on the same left edge. No bottom padding: the next section's
   top padding is the gap, as on the events page. */
export function Partners() {
  return (
    <section aria-labelledby="partners-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6 lg:pt-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <h2
            id="partners-title"
            className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground"
          >
            {PARTNERS.title}
          </h2>
          <Link href={PARTNERS.action.href} className={cn(ctaLink, "shrink-0")}>
            {PARTNERS.action.label}
            <ArrowRightIcon
              aria-hidden
              weight="bold"
              className="size-3.5 transition-transform duration-150 ease-hover motion-safe:group-hover/link:translate-x-0.5"
            />
          </Link>
        </div>

        <PartnerLogos partners={PARTNER.partners} className="mt-6" />
      </div>
    </section>
  );
}
