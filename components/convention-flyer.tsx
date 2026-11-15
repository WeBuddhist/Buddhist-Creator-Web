import Image from "next/image";
import { tag } from "@/components/convention/section-heading";
import { cn } from "@/lib/utils";
import { CONVENTION_2027 } from "@/lib/convention-2027";
import logo from "@/public/logo.jpg";
import nagalokaFooter from "@/public/nagaloka-footer.webp";

type ConventionFlyerProps = {
  /** h1 when the flyer opens the convention's own page, h2 on the homepage. */
  as?: "h1" | "h2";
  /** The flyer at the top of a page sits closer to the header than one
      following a section. */
  first?: boolean;
};

export function ConventionFlyer({ as: Heading = "h2", first }: ConventionFlyerProps) {
  return (
    <section
      aria-labelledby="convention-title"
      className="overflow-hidden bg-background"
    >
      <div
        className={cn(
          "mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-6",
          first ? "pt-10 sm:pt-14 lg:pt-16" : "pt-24 lg:pt-32",
        )}
      >
        <Image
          src={logo}
          alt=""
          width={112}
          height={112}
          placeholder="blur"
          className="size-20 mix-blend-multiply sm:size-24"
        />

        <p className="mt-6 text-lg font-medium text-foreground sm:text-xl">
          <time dateTime={CONVENTION_2027.dates.start}>
            18<sup className="text-[0.6em]">th</sup>
          </time>
          {" – "}
          <time dateTime={CONVENTION_2027.dates.end}>
            21<sup className="text-[0.6em]">st</sup> Feb
          </time>
          <span
            aria-hidden
            className="mx-3 inline-block h-[1.1em] w-0.5 translate-y-[0.2em] bg-foreground/40"
          />
          <span>{CONVENTION_2027.location}</span>
        </p>

        <Heading
          id="convention-title"
          className="mt-5 text-balance font-display text-[clamp(2.75rem,7.6vw,7rem)] leading-[1] tracking-[-0.03em] text-brand-cyan"
        >
          {CONVENTION_2027.title}
        </Heading>

        {/* On the homepage the theme sits under the title in the serif's
            italic; the convention's own page opens its next section with
            it instead. */}
        {!first && (
          <p className="mt-6 font-display text-2xl italic leading-[1.3] text-muted-foreground sm:text-3xl">
            {CONVENTION_2027.theme}
          </p>
        )}

        {/* A status, not a control: a quiet label with a gold light. */}
        <p className={cn(tag, "mt-7 gap-2 bg-card px-3.5 py-2 text-xs text-foreground")}>
          <span aria-hidden className="size-2 rounded-full bg-saffron" />
          {CONVENTION_2027.status}
        </p>
      </div>

      {/* Full-bleed illustration, bottom-aligned so the ground meets whatever
          follows: the footer on the homepage, the welcome section on the
          convention page. Encoded from assets/nagaloka-footer.png, which
          the social card also draws. */}
      <div className="mt-6 flex justify-center sm:mt-8 lg:mt-10">
        <Image
          src={nagalokaFooter}
          alt="Crayon illustration of the Walking Buddha at Nagaloka, Nagpur"
          placeholder="blur"
          preload={first}
          sizes="100vw"
          className="h-auto w-full min-w-[48rem] max-w-none"
        />
      </div>
    </section>
  );
}
