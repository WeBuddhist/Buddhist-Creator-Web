"use client";

import {
  createContext,
  use,
  useCallback,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { SceneBoundary } from "@/components/scene-boundary";
import { cn } from "@/lib/utils";
import { worthDrawing } from "@/lib/worth-drawing";
import { PodiumStore } from "./store";
import { TIERS, type Tier } from "./tiers";

/* The row the leaderboard's first three cards stand in, and the canvas
   behind them that draws their bodies (scene.tsx).

   The cards are whole without the canvas: each has a surface of its own
   in CSS (`podium-surface` in app/globals.css), which is what the server
   sends and what stays where WebGL cannot be had. The scene is fetched
   only when the cards come near the screen, and not at all where it
   would be unkind or unreadable: a visitor saving data, a device with
   little memory or few cores, a forced-colours theme (which recolours the
   text but not a canvas). When it has drawn a card, that card's CSS
   surface fades out and the lit body is what is seen; if the context is
   lost or the frames come too slowly, the CSS surface comes back.

   Below `lg` the row scrolls sideways, a card and a half to a phone's
   screen, each card catching at the edge; from `lg` the three stand side
   by side. The canvas is inside what scrolls, so the browser moves a body
   and its markup together.

   CardStage is the same thing for one card standing alone: the white card
   a creator has on their own page (components/creator-card/
   collectible-card.tsx). */

const PodiumScene = dynamic(() => import("./scene"), { ssr: false });

const StageContext = createContext<PodiumStore | null>(null);

/* What a stage keeps: the store its cards and its scene share, whether the
   scene is being drawn, and the two elements the store watches. `host` is
   what must be near the screen for the scene to be fetched; `box` is what
   the canvas fills. */
function useStage(room?: number) {
  const [store] = useState(() => {
    const made = new PodiumStore();
    if (room !== undefined) made.room = room;
    return made;
  });
  /* "waiting" until the cards are near the screen, then "drawing"; "plain"
     once the scene has failed or been given up, for the rest of the visit. */
  const [scene, setScene] = useState<"waiting" | "drawing" | "plain">("waiting");
  const plain = useCallback(() => setScene("plain"), []);

  const host = useCallback(
    (element: HTMLDivElement) =>
      store.connect(element, () => {
        if (!worthDrawing()) return;
        // After the page has settled: the cards are already there to read.
        const start = () => setScene((now) => (now === "waiting" ? "drawing" : now));
        if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 1200 });
        else setTimeout(start, 200);
      }),
    [store],
  );
  const box = useCallback(
    (element: HTMLDivElement) => {
      store.setBox(element);
      return () => store.setBox(null);
    },
    [store],
  );

  return {
    store,
    host,
    box,
    canvas: scene === "drawing" && (
      <SceneBoundary onError={plain}>
        <PodiumScene store={store} onLost={plain} />
      </SceneBoundary>
    ),
  };
}

export function PodiumStage({ children }: { children: ReactNode }) {
  const { store, host, box, canvas } = useStage();
  return (
    <StageContext value={store}>
      {/* What scrolls below lg. The padding is the room the canvas has for
          a card's corners when it turns, taken back by the margins; sideways it is
          the page's own gutter, so a card can be scrolled to the screen's
          edge. It shows no scrollbar: the next card, cut by the screen's
          edge, is what says there is more, and a link in a card brings its
          card into view when it is tabbed to. */}
      <div
        onScroll={(event) => store.scrolled(event.currentTarget, event.currentTarget.scrollLeft, 0)}
        className={cn(
          "-mx-5 -mt-6 -mb-2 snap-x snap-mandatory scroll-px-5 overflow-x-auto overscroll-x-contain px-5 pt-6 pb-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "sm:-mx-6 sm:scroll-px-6 sm:px-6",
          "lg:m-0 lg:overflow-visible lg:p-0",
        )}
      >
        <div ref={host} className="relative w-max min-w-full lg:w-auto">
          <div
            ref={box}
            aria-hidden
            className="pointer-events-none absolute -inset-x-5 -top-6 -bottom-7 sm:-inset-x-6 lg:-inset-y-10"
          >
            {canvas}
          </div>
          {children}
        </div>
      </div>
    </StageContext>
  );
}

/* The stage for one card, which can be turned over. The canvas reaches
   past the card by the page's own gutter to either side, and by 4rem
   above and below: a card turning over rises toward the eye, and half
   way round its near edge stands out past its box. It takes no clicks
   and holds nothing but the card's body, so what it lies over is not
   hidden. */
export function CardStage({ children, className }: { children: ReactNode; className?: string }) {
  const { store, host, box, canvas } = useStage(4);
  return (
    <StageContext value={store}>
      <div ref={host} className={cn("relative", className)}>
        <div ref={box} aria-hidden className="pointer-events-none absolute -inset-x-5 -inset-y-16 sm:-inset-x-6">
          {canvas}
        </div>
        {children}
      </div>
    </StageContext>
  );
}

/* A card's place on the stage: what its element and the scene need of
   each other. `attach` goes on the card's own element (a list item on the
   leaderboard), whose markup marks the part
   that turns (`data-podium-body`) and the photo (`data-podium-photo`);
   the handlers lean the card toward a mouse that is over it. `style`
   carries the place's metal to the card's CSS. Outside a stage it is an
   ordinary card. */
export function usePodiumCard(key: string, tier: Tier) {
  const store = use(StageContext);
  const attach = useCallback(
    (element: HTMLElement | null) => {
      const body = element?.querySelector<HTMLElement>("[data-podium-body]");
      if (!store || !element || !body) return;
      const added = store.add({
        key,
        tier,
        el: element,
        body,
        photo: element.querySelector<HTMLElement>("[data-podium-photo]"),
      });
      return () => store.remove(added);
    },
    [store, key, tier],
  );
  const metal = TIERS[tier];
  return {
    attach,
    metal,
    style: {
      "--metal-deep": metal.deep,
      "--metal-mid": metal.mid,
      "--metal-light": metal.light,
      "--metal-pale": metal.pale,
      "--metal-rim": metal.rim,
    } as CSSProperties,
    /** Turn the card whose element this is over, or back. */
    turnOver: (element: Element, over: boolean) => store?.flip(element, over),
    handlers: {
      onPointerMove: (event: PointerEvent) => {
        if (event.pointerType !== "touch") store?.point(event.currentTarget, event.clientX, event.clientY);
      },
      onPointerLeave: (event: PointerEvent) => store?.rest(event.currentTarget),
    },
  };
}
