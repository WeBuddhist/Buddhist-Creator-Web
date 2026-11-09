"use client";

import * as React from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/* One testimonial at a time. The browser owns the slide track (scroll-snap,
   one full-width slide per view), so a swipe gets its physics and the
   arrow keys scroll it once it has focus. The buttons and the "n of 7"
   counter are the cue that more lies off-screen, since a single slide
   leaves nothing to peek.

   Layout, from the tablet breakpoint: the intro and the controls stack in
   the first column, the track takes the second across both rows. The DOM
   runs intro, track, controls, so on a phone the controls follow the quote
   they act on, and in the tab order the track comes before its buttons. At
   either end a button stays focusable (aria-disabled, not disabled) so
   focus never drops out of the page. */
export function Carousel({
  label,
  intro,
  count,
  children,
  className,
}: {
  label: string;
  intro: React.ReactNode;
  count: number;
  children: React.ReactNode;
  className?: string;
}) {
  const trackRef = React.useRef<HTMLUListElement>(null);
  const [index, setIndex] = React.useState(0);
  const [height, setHeight] = React.useState<number>();

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const width = track.clientWidth;
      if (width > 0) setIndex(Math.round(track.scrollLeft / width));
    };
    update();
    track.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  /* The track is as tall as the slide in view, not the tallest of the
     seven, so the band's height follows the quote on screen. Slides sit
     at the top of the track and anything past the current height is
     clipped; the height change itself transitions in CSS. */
  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const slide = track.children[index] as HTMLElement | undefined;
      if (slide) setHeight(slide.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const slide of track.children) observer.observe(slide);
    return () => observer.disconnect();
  }, [index]);

  /* scrollTo takes the track's CSS scroll-behavior: smooth, or instant
     when the reader prefers reduced motion. */
  const go = (to: number) => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(count - 1, to));
    track.scrollTo({ left: next * track.clientWidth });
  };

  const atStart = index <= 0;
  const atEnd = index >= count - 1;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className={cn(
        // The second row is the flexible one, so the track's extra height lands
        // there and the controls stay right under the description.
        "grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-rows-[auto_1fr] lg:gap-y-10",
        className,
      )}
    >
      <div className="lg:col-start-1 lg:row-start-1">{intro}</div>

      <ul
        ref={trackRef}
        tabIndex={0}
        style={{ height }}
        className={cn(
          "flex items-start overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth motion-reduce:scroll-auto",
          "transition-[height] duration-300 ease-out motion-reduce:transition-none",
          "snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[&>li]:w-full [&>li]:shrink-0 [&>li]:snap-start",
          "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-white",
          "lg:col-start-2 lg:row-span-2 lg:row-start-1",
        )}
      >
        {children}
      </ul>

      <div className="flex items-center gap-3 lg:col-start-1 lg:row-start-2 lg:self-start">
        <StepButton disabled={atStart} onClick={() => go(index - 1)} icon={ArrowLeftIcon}>
          Previous testimonial
        </StepButton>
        <StepButton disabled={atEnd} onClick={() => go(index + 1)} icon={ArrowRightIcon}>
          Next testimonial
        </StepButton>
        <p aria-live="polite" className="ms-2 text-sm tabular-nums text-white/80">
          {index + 1} of {count}
        </p>
      </div>
    </div>
  );
}

/* A round glass button on the band: white at 10% for the surface with a
   white 30% edge; the glyph is white, 6.2:1 on brand cyan. */
function StepButton({
  icon: Icon,
  disabled,
  onClick,
  children,
}: {
  icon: React.ComponentType<{ className?: string; weight?: "bold"; "aria-hidden"?: boolean }>;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white",
        "transition-[background-color,opacity,scale] duration-150 ease-out",
        "hover:not-aria-disabled:bg-white/20 active:not-aria-disabled:scale-[0.96]",
        "aria-disabled:cursor-default aria-disabled:opacity-40",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
      )}
    >
      <Icon aria-hidden weight="bold" className="size-5" />
      <span className="sr-only">{children}</span>
    </button>
  );
}
