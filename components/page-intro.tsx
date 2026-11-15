import type { ReactNode } from "react";
import Image, { type StaticImageData } from "next/image";
import { label } from "@/components/convention/section-heading";
import { cn } from "@/lib/utils";

type PageIntroProps = {
  /** The id of the h1, which labels the section. */
  id: string;
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** A convention photograph to open the page on, in place of the plain
      cyan sheet. `position` is the object-position that keeps the faces
      in frame as the crop changes with the viewport. */
  photo?: { src: StaticImageData; alt: string; position?: string };
  /** Whatever follows the description: jump links, figures. */
  children?: ReactNode;
};

/* The opening of an inner page. Like the homepage's photograph it runs
   edge to edge and up behind the floating header, so it pulls itself up
   by the header's height and pads its top by the same.

   With a photo the intro fills the screen. On a phone the picture takes
   whatever height the words leave, at full strength, and fades into the
   dark ground they sit on, so no face is covered. From sm the picture
   fills the sheet and the words sit at its foot, as on the homepage.
   The shade sits behind the words alone: 92% ink at the foot, 80% at
   the top of the text, then a 14rem fade to clear above it, so a short
   intro darkens only the foot of the picture and a tall one as much as
   it needs. Measured against the brightest pixel behind each line,
   every label and line holds 4.5:1 or more.

   Without one it is a sheet of brand cyan: white measures 6.2:1 on it and
   the label, gold-soft, 4.7:1. */
export function PageIntro({ id, eyebrow, title, description, photo, children }: PageIntroProps) {
  const words = (
    <>
      <p className={cn(label, "text-gold-soft")}>{eyebrow}</p>
      <h1
        id={id}
        className="mt-5 max-w-4xl text-balance font-display text-[clamp(2.75rem,6.6vw,5.75rem)] leading-[1.02] tracking-[-0.03em]"
      >
        {title}
      </h1>
      {description && (
        <p className="mt-6 max-w-[58ch] text-pretty text-lg leading-[1.6] text-white/85 sm:text-xl sm:leading-[1.55]">
          {description}
        </p>
      )}
      {children}
    </>
  );

  if (!photo) {
    return (
      <section
        aria-labelledby={id}
        data-header-tone="dark"
        data-header-bg="var(--color-brand-cyan)"
        className="-mt-(--header-height)"
      >
        <div className="bg-brand-cyan text-white">
          <div className="mx-auto w-full max-w-6xl px-5 pt-[calc(var(--header-height)+3rem)] pb-14 sm:px-6 lg:pt-[calc(var(--header-height)+5rem)] lg:pb-24">
            {words}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={id}
      data-header-tone="dark"
      data-header-bg="rgb(4 20 27 / 0.7)"
      className="-mt-(--header-height)"
    >
      <div className="relative isolate flex min-h-svh flex-col overflow-hidden bg-[#04141b] text-white sm:justify-end">
        <div className="relative min-h-[calc(var(--header-height)+72vw)] flex-1 sm:absolute sm:inset-0 sm:-z-20 sm:min-h-0">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            preload
            placeholder="blur"
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: photo.position ?? "50% 50%" }}
          />
          {/* Phone: only the last stretch fades into the ground. */}
          <div aria-hidden className="absolute inset-0 bg-linear-to-t from-[#04141b] to-transparent to-35% sm:hidden" />
        </div>
        <div className="relative sm:mt-[calc(var(--header-height)+14rem)]">
          <div aria-hidden className="absolute inset-0 -z-10 hidden bg-linear-to-t from-[#04141b]/92 to-[#04141b]/80 sm:block" />
          <div aria-hidden className="absolute inset-x-0 bottom-full -z-10 hidden h-56 bg-linear-to-t from-[#04141b]/80 to-transparent sm:block" />
          <div className="mx-auto w-full max-w-6xl px-5 pt-2 pb-12 sm:px-6 sm:pt-4 lg:pb-16">{words}</div>
        </div>
      </div>
    </section>
  );
}
