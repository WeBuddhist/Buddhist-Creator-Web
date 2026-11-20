"use client";

import { useCallback, useState, useSyncExternalStore, type PointerEvent } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { SceneBoundary } from "@/components/scene-boundary";
import { cn } from "@/lib/utils";
import { worthDrawing } from "@/lib/worth-drawing";
import medalStill from "@/public/awards/medal-still.webp";
import { MedalControl } from "./control";

const MedalScene = dynamic(() => import("./scene"), { ssr: false });

/* Whether the tab is in view. */
const watchTab = (changed: () => void) => {
  document.addEventListener("visibilitychange", changed);
  return () => document.removeEventListener("visibilitychange", changed);
};
const tabShown = () => document.visibilityState === "visible";

/* The awards medal at the head of the awards page: a gold coin struck
   with a walking lion, after the 1st-century coin from Tillya Tepe.

   What the server sends is a still picture of it, rendered from the same
   scene, facing the reader. Once the page has settled, and where the
   browser can afford it, the scene (scene.tsx, with three.js, fetched
   then) draws the medal turning slowly in its place, and the picture
   fades out as the first frame lands, from the same pose. It turns only
   while it is on screen. It turns for everyone, reduced motion included,
   by the owner's decision. Where WebGL is not worth drawing (lib/worth-drawing.ts), or if the scene fails or runs
   slowly, the picture stays. While the medal is off screen or the tab is
   hidden it is not drawn at all.

   It turns clockwise seen from above, as one walks round a shrine, and
   once it is live it can be turned by hand: dragged sideways it spins,
   up or down it tilts, and let go it eases back into its own turn
   (control.ts). On a touch screen only a sideways drag is the medal's; an
   upright one still scrolls the page. It is an ornament, so turning it
   does nothing else and needs no keyboard way to do the same. */
export function Medal({ className }: { className?: string }) {
  /* "still" until the scene is asked for; "loading" while it is fetched
     and prepared; "live" once it draws; "failed" for the rest of the
     visit once it has gone wrong. */
  const [scene, setScene] = useState<"still" | "loading" | "live" | "failed">("still");
  const [onScreen, setOnScreen] = useState(true);
  const inView = useSyncExternalStore(watchTab, tabShown, () => true);
  const [control] = useState(() => new MedalControl());

  const host = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const watcher = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    watcher.observe(element);
    // After the page has settled: the still medal is already there to see.
    // Safari has no requestIdleCallback.
    const hasIdle = typeof window.requestIdleCallback === "function";
    let wait = 0;
    if (worthDrawing()) {
      const start = () => setScene((now) => (now === "still" ? "loading" : now));
      wait = hasIdle ? window.requestIdleCallback(start, { timeout: 1500 }) : window.setTimeout(start, 300);
    }
    return () => {
      watcher.disconnect();
      if (hasIdle) window.cancelIdleCallback(wait);
      else window.clearTimeout(wait);
    };
  }, []);

  const fail = useCallback(() => setScene("failed"), []);
  const ready = useCallback(() => setScene((now) => (now === "loading" ? "live" : now)), []);
  const live = scene === "live";

  const handlers = {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      const box = event.currentTarget.getBoundingClientRect();
      control.press(event.clientX, event.clientY, event.timeStamp, box.width, box.height);
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => control.move(event.clientX, event.clientY, event.timeStamp),
    onPointerUp: () => control.release(),
    // The browser took the touch for a scroll after all.
    onPointerCancel: () => control.release(),
  };

  return (
    <div
      ref={host}
      {...(live ? handlers : {})}
      className={cn(
        "relative aspect-square select-none",
        live && "cursor-grab touch-pan-y active:cursor-grabbing",
        className,
      )}
    >
      <Image
        src={medalStill}
        alt="The award medal: a gold coin struck with a walking lion on one side and the Buddha setting the Dharma wheel turning on the other, after the first-century Buddhist coin from Tillya Tepe."
        preload
        draggable={false}
        sizes="(min-width: 640px) 32rem, 88vw"
        // It fades out as the turning medal fades in over it. If the scene
        // ever gives up, the picture is back at once, with no fade: a fade
        // would leave the place half empty for a moment, a blink.
        className={cn("size-full object-contain", live && "opacity-0 transition-opacity duration-700 ease-out")}
      />
      {(scene === "loading" || live) && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 opacity-0 transition-opacity duration-700 ease-out",
            live && "opacity-100",
          )}
        >
          <SceneBoundary onError={fail}>
            <MedalScene control={control} running={onScreen && inView} onReady={ready} onLost={fail} />
          </SceneBoundary>
        </div>
      )}
    </div>
  );
}
