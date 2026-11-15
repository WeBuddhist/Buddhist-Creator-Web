import Image, { type StaticImageData } from "next/image";
import { label } from "@/components/convention/section-heading";
import { cn } from "@/lib/utils";
import stageCohort from "@/public/photos/stage-cohort.webp";
import templeDoorway from "@/public/photos/temple-doorway.webp";

type Shot = {
  src: StaticImageData;
  alt: string;
  /** Where the photograph sits in the grid, and its crop. */
  className: string;
  sizes: string;
};

/* Two photographs from the 2026 convention on one row: the whole cohort in
   front of the stage, and the small group at the temple door beside it at
   the same height. On a phone they stack. */
const SHOTS: Shot[] = [
  {
    src: stageCohort,
    alt: "The 2026 cohort posing in front of the Buddhist Creators Convention stage backdrop, a golden Buddha above it.",
    className: "aspect-[3/2] sm:col-span-7",
    sizes: "(min-width: 1152px) 42rem, (min-width: 640px) 58vw, 100vw",
  },
  {
    src: templeDoorway,
    alt: "Fifteen participants and two monks standing together at the painted doorway of a Tibetan temple.",
    className: "aspect-[3/2] sm:col-span-5 sm:aspect-auto sm:h-full",
    sizes: "(min-width: 1152px) 30rem, (min-width: 640px) 42vw, 100vw",
  },
];

export function Gallery() {
  return (
    <section aria-labelledby="gallery-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 pt-24 sm:px-6 lg:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className={cn(label, "text-brand-cyan")}>From the 2026 convention</p>
          <h2
            id="gallery-title"
            className="mt-4 text-balance font-display text-4xl leading-[1.06] text-foreground sm:text-5xl lg:text-6xl"
          >
            Join us in bringing the Dharma to the digital age
          </h2>
        </div>

        <ul className="mt-12 grid gap-3 sm:grid-cols-12 sm:gap-4 lg:mt-16">
          {SHOTS.map(({ src, alt, className, sizes }) => (
            <li key={src.src} className={cn("overflow-hidden rounded-2xl", className)}>
              <Image src={src} alt={alt} placeholder="blur" sizes={sizes} className="size-full object-cover" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
