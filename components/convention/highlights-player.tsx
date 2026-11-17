"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { PlayIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { card, cardInner, photo } from "@/components/convention/section-heading";
import { HIGHLIGHTS } from "@/lib/convention-2026";

const { talks } = HIGHLIGHTS;

/* One player and the three talks beside it. The player opens on the first
   talk's thumbnail, and YouTube itself loads only when someone presses
   play: the section sits right under the hero, so an embedded player here
   would otherwise load on every visit. Choosing a talk from the list
   plays it in the same frame. */
export function HighlightsPlayer() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  /* Pressing the poster removes the button that had focus. The player
     takes it, so a keyboard user is not sent back to the top of the page. */
  const focusPlayer = useRef(false);

  const { youtubeId, title, creator, poster } = talks[current];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-6">
      <div className={card}>
        <div className={cn(cardInner, "overflow-hidden")}>
          <div className="relative aspect-video bg-black">
            {playing ? (
              <iframe
                key={youtubeId}
                ref={(frame) => {
                  if (frame && focusPlayer.current) {
                    focusPlayer.current = false;
                    frame.focus();
                  }
                }}
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&autoplay=1`}
                title={`${title}, a lightning talk by ${creator}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 size-full border-0"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  focusPlayer.current = true;
                  setPlaying(true);
                }}
                className="group/poster absolute inset-0 size-full cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
              >
                {/* The thumbnail already carries the title and the name,
                    which the button's own label repeats for assistive
                    tech. The play mark sits in the corner, clear of that
                    lettering, rather than in the middle on top of it. */}
                <Image
                  src={poster}
                  alt=""
                  placeholder="blur"
                  sizes="(min-width: 1024px) 45rem, 100vw"
                  className="size-full object-cover"
                />
                <span
                  aria-hidden
                  className="absolute right-4 bottom-4 flex size-14 items-center justify-center rounded-full bg-white text-brand-cyan shadow-[0_0.5rem_2rem_rgb(0_0_0/0.35)] transition-transform duration-150 ease-hover group-hover/poster:scale-105 group-active/poster:scale-[0.97] motion-reduce:transition-none sm:right-6 sm:bottom-6 sm:size-[4.5rem]"
                >
                  <PlayIcon weight="fill" className="size-6 translate-x-[0.0625rem] sm:size-7" />
                </span>
                <span className="sr-only">
                  Play {title}, a lightning talk by {creator}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* The three talks. One row each beside the player on a desktop,
          three columns under it on a tablet, rows again on a phone. */}
      <ul className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 lg:grid-rows-3">
        {talks.map((talk, index) => {
          const selected = index === current;
          return (
            <li key={talk.youtubeId} className="flex">
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => {
                  setCurrent(index);
                  setPlaying(true);
                }}
                className={cn(
                  "group/talk flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border p-2.5 text-left sm:flex-col sm:items-stretch lg:flex-row lg:items-center",
                  "transition-[background-color,border-color] duration-150 ease-hover",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  /* The talk in the player sits on a card; the others lie
                     flat on the page until hovered. */
                  selected ? "border-border bg-card" : "border-transparent hover:bg-paper-deep",
                )}
              >
                <span className="relative block w-28 shrink-0 sm:w-full lg:w-36">
                  <Image
                    src={talk.poster}
                    alt=""
                    placeholder="blur"
                    sizes="(min-width: 1024px) 9rem, (min-width: 640px) 33vw, 7rem"
                    className={cn("aspect-video w-full rounded-lg object-cover", photo)}
                  />
                </span>
                <span className="flex min-w-0 flex-col sm:px-1 sm:pb-1 lg:p-0">
                  <span className="text-pretty text-[0.9375rem] font-medium leading-[1.3] text-foreground">
                    {talk.title}
                  </span>
                  <span className="mt-1 text-sm leading-[1.4] text-muted-foreground">{talk.creator}</span>
                  {selected && playing && (
                    <span className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-cyan">
                      <PlayIcon aria-hidden weight="fill" className="size-3" />
                      Now playing
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
