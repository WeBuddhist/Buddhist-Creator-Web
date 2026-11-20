import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { card, cardInner, label } from "@/components/convention/section-heading";
import { Button } from "@/components/ui/button";
import { AWARDS_2027 } from "@/lib/awards-2027";
import { cn } from "@/lib/utils";
import medalStill from "@/public/awards/medal-still.webp";

/* The way to the awards from other pages: the award medal, as a still
   picture (the awards page has it turning), beside the invitation to
   nominate, leading to the awards page. The convention page sets it under the registration card, the
   homepage under the leaderboard, so a visitor meets it near the top of
   both. The caller gives the section its padding and the heading its id
   (two of these never share a page). */
export function AwardsPointer({ id, className }: { id: string; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn(card, className)}>
      <div className={cn(cardInner, "grid gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10")}>
        {/* The medal on warm paper, with the faint gold light the awards
            page sets behind it, so the gold does not float on flat white. */}
        <div className="relative isolate grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-paper">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgb(242_177_48/0.16),transparent_60%)]"
          />
          <Image
            src={medalStill}
            alt="The award medal: a gold coin struck with a walking lion, after the first-century Buddhist coin from Tillya Tepe."
            sizes="(min-width: 1024px) 22rem, 62vw"
            className="aspect-square w-[62%] object-contain"
          />
        </div>
        <div className="flex flex-col items-start justify-center px-1 pb-3 sm:px-2 lg:py-4">
          <p className={cn(label, "text-brand-cyan")}>{AWARDS_2027.title}</p>
          <h2 id={id} className="mt-4 text-balance font-display text-4xl leading-[1.06] text-foreground sm:text-5xl">
            {AWARDS_2027.open ? "Nominations are open" : "The awards"}
          </h2>
          <p className="mt-5 max-w-[46ch] text-pretty text-lg leading-[1.6] text-muted-foreground">
            Eight awards in two categories, from Influencer of the Year to Best Photography. Tell us which creators
            deserve them.
          </p>
          <Button size="pill" nativeButton={false} className="mt-7" render={<Link href={AWARDS_2027.path} />}>
            See the awards
            <ArrowRightIcon data-icon="inline-end" weight="bold" />
          </Button>
        </div>
      </div>
    </section>
  );
}
