import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { ctaLink } from "@/components/events/event-card";
import { AWARDS_2027 } from "@/lib/awards-2027";
import { cn } from "@/lib/utils";
import { CONVENTION_2027, CONVENTION_PATH, REGISTRATION_ID } from "@/lib/convention-2027";
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

        {/* The status with its gold light, and the way to registration:
            it leads to the registration card on the convention's page,
            which says what applying takes before the form asks for a
            sign-in. Framed in the creator card's double border (a muted
            frame with a ring, the white pill inside with its own), and
            the arrow marks it as a link. */}
        <Link
          href={`${CONVENTION_PATH}#${REGISTRATION_ID}`}
          className="group/status mt-7 inline-flex rounded-full border border-transparent bg-muted/40 p-1 shadow-ring transition-[background-color,scale] duration-150 ease-out hover:bg-muted motion-safe:active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-transparent bg-card px-3.5 py-2 text-xs font-semibold uppercase leading-none tracking-[0.1em] text-foreground shadow-border">
            <span aria-hidden className="size-2 rounded-full bg-saffron" />
            {CONVENTION_2027.status}
            <span className="sr-only">: how to register</span>
            <ArrowRightIcon
              aria-hidden
              weight="bold"
              className="size-3.5 text-brand-cyan transition-transform duration-150 ease-hover motion-safe:group-hover/status:translate-x-0.5"
            />
          </span>
        </Link>

        {/* The awards are given at the convention, so while nominations are
            open the flyer points to them under its status, on the homepage
            and at the head of the convention's own page. */}
        {AWARDS_2027.open && (
          <Link href={AWARDS_2027.path} className={cn(ctaLink, "mt-5 text-brand-cyan")}>
            Nominate creators for the 2027 awards
            <ArrowRightIcon
              aria-hidden
              weight="bold"
              className="size-4 transition-transform duration-150 ease-hover motion-safe:group-hover/link:translate-x-0.5"
            />
          </Link>
        )}
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
