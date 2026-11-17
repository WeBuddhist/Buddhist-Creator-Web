import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { SectionHeading, accentButton } from "@/components/convention/section-heading";
import { TEAM } from "@/lib/get-involved";
import { cn } from "@/lib/utils";

/* Join our team: a page's last word, on a sheet of brand cyan. The Get
   Involved page and the Team page both end with it. `id` is the section's
   anchor; the Team page passes its own, since its roster is already
   `#team`. */
export function JoinTeam({ id = TEAM.id }: { id?: string }) {
  const titleId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={titleId} className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 pt-24 pb-24 sm:px-6 lg:pt-32 lg:pb-32">
        <div data-header-tone="dark" className="grid gap-8 rounded-3xl bg-brand-cyan px-6 py-10 text-white sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10 lg:px-12 lg:py-14">
          <SectionHeading
            id={titleId}
            level="h2"
            size="h3"
            eyebrow={TEAM.eyebrow}
            title={TEAM.title}
            description={TEAM.description}
            onPanel
          />
          <Button
            size="pill"
            nativeButton={false}
            className={cn(accentButton, "shrink-0 justify-self-start")}
            render={<a href={TEAM.action.href} />}
          >
            <EnvelopeSimpleIcon data-icon="inline-start" weight="bold" />
            {TEAM.action.label}
          </Button>
        </div>
      </div>
    </section>
  );
}
