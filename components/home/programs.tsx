import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/convention/section-heading";
import { ctaLink } from "@/components/events/event-card";
import { PROGRAMS, type Program } from "@/lib/home";
import awardPhoto from "@/public/convention/2026/award-quinthup-pema-bhutia.webp";
import sakaDawa from "@/public/events/saka-dawa.webp";
import templeCohort from "@/public/photos/temple-cohort.webp";

/* Each program has a picture of the thing itself. */
const PICTURES: Record<Program["id"], { image: StaticImageData; alt: string; position?: string }> = {
  convention: {
    image: templeCohort,
    alt: "The whole 2026 cohort gathered on the steps of a Tibetan temple, a convention banner beside them.",
    position: "object-[50%_60%]",
  },
  awards: {
    image: awardPhoto,
    alt: "Venerable Quinthup Pema Bhutia receiving the Buddhist Influencer of the Year award on stage at the 2026 convention.",
    position: "object-[31%_50%]",
  },
  campaigns: {
    image: sakaDawa,
    alt: "Thangka painting of Shakyamuni Buddha seated on a lotus throne, one hand touching the earth.",
    position: "object-[50%_38%]",
  },
};

export function Programs() {
  return (
    <section aria-labelledby="programs-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 pt-24 sm:px-6 lg:pt-32">
        <SectionHeading
          id="programs-title"
          eyebrow={PROGRAMS.eyebrow}
          title={PROGRAMS.title}
          description={PROGRAMS.description}
        />

        <ul className="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-3 lg:mt-16 lg:gap-x-10">
          {PROGRAMS.items.map(({ id, title, body, href, cta }) => {
            const { image, alt, position } = PICTURES[id];
            return (
              <li key={id}>
                <article className="flex h-full flex-col">
                  <Image
                    src={image}
                    alt={alt}
                    placeholder="blur"
                    sizes="(min-width: 768px) 30vw, 100vw"
                    className={cn(
                      "aspect-[4/3] w-full rounded-2xl object-cover sm:aspect-[16/10] md:aspect-[4/5]",
                      position,
                    )}
                  />
                  <h3 className="mt-7 text-balance font-display text-[1.75rem] leading-[1.12] text-foreground">
                    {title}
                  </h3>
                  <p className="mt-3 text-pretty text-base leading-[1.6] text-muted-foreground">{body}</p>
                  <p className="mt-auto pt-6 text-brand-cyan">
                    <Link href={href} className={ctaLink}>
                      {cta}
                      <ArrowRightIcon
                        aria-hidden
                        weight="bold"
                        className="size-4 transition-transform duration-150 ease-hover motion-safe:group-hover/link:translate-x-0.5"
                      />
                    </Link>
                  </p>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
