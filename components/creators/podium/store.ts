import type { Group } from "three";
import type { FaceMaterial } from "./materials";
import { CARD, type Tier } from "./tiers";

/* What the page and the WebGL scene share about the three cards: where
   each is, how it is turned, and whether the scene is drawing it.

   A card is two things laid exactly over each other. Its words, photo and
   links are ordinary markup, which is what a screen reader, a search
   engine and a browser without WebGL get. Under them, the scene draws the
   card's body: the metal frame and the face. When the body
   turns toward the pointer the markup is turned by the same angles with a
   CSS transform, in the same frame, so the two move as one object.

   None of this is React state: a pointer moves and a frame is drawn many
   times a second, and re-rendering for each would cost more than the
   drawing. The scene re-renders only when a card arrives, leaves or
   changes size (`version`). */

/** The scene's own objects for a card, which the frame loop turns. */
export type CardParts = { tilt: Group; face: FaceMaterial };

export type PodiumCard = {
  key: string;
  tier: Tier;
  /** The list item: never transformed, so its box is the card's place. */
  el: HTMLElement;
  /** The markup that is turned with the body. */
  body: HTMLElement;
  /** The photo's box, which the scene rings in metal. */
  photo: HTMLElement | null;
  /* On a card that turns over, the markup of each side. Whichever faces
     away is hidden outright as the card passes edge-on: browsers do not
     all hide a turned-away side for backface-visibility (Safari draws its
     separately composited parts, the photo and the text, mirrored). */
  front: HTMLElement | null;
  back: HTMLElement | null;
  /* The card's box in CSS pixels from the canvas's top-left corner, and
     the photo's centre and radius from the card's. */
  x: number;
  y: number;
  w: number;
  h: number;
  px: number;
  py: number;
  pr: number;
  /* How it is turned now (degrees, as CSS has them: a positive rx takes
     the top edge away, a positive ry the right edge), how far it stands
     toward the eye (pixels), the speed of each, and where each is going. */
  rx: number;
  ry: number;
  lift: number;
  vrx: number;
  vry: number;
  vlift: number;
  toRx: number;
  toRy: number;
  toLift: number;
  /** How far the card is turned over, in degrees: 0 face up, 180 face
      down; its speed; and where it is going. Only a card with a back
      (CardStage's) is ever turned. */
  turn: number;
  vturn: number;
  toTurn: number;
  /** Seconds into the pass of light a card arrives with; below zero it is
      waiting its turn, and null when there is none. */
  pass: number | null;
  /** Drawn at least once, so the markup has dropped its own surface. */
  live: boolean;
  /** Waiting for the cards to be on screen before its light passes. */
  arriving: boolean;
  parts: CardParts | null;
};

/* The furthest a card turns: toward a pointer, and on a touch screen as
   it is carried by a scroll. */
const POINTER_TILT = { x: 7, y: 9 };
const SCROLL_TILT = { x: 6, y: 8 };
/** The scrolling speed, in pixels a millisecond, that turns a card all the way. */
const SCROLL_FULL = 1.6;
/** How long after the last scroll event the cards lie back down, in milliseconds. */
const SCROLL_REST = 90;

/* The spring that carries a card to where it is going: a little short of
   critical damping, so it arrives without a wobble but is not stiff. */
const STIFFNESS = 170;
const DAMPING = 23;

/* The spring that turns a card over: slower than the tilt's, and a touch
   under critical damping, so the card lands a hair past flat and settles
   back, as a card dropped face down on a table does. */
const TURN_STIFFNESS = 120;
const TURN_DAMPING = 19;
/** How far a card turning over rises toward the eye at the middle of the
    turn, in rem, and how far its top tips away then, in degrees. */
const TURN_LIFT = 2.5;
const TURN_TIP = 5;

/** How long the pass of light takes, and how far apart the cards start it. */
export const PASS_SECONDS = 1.1;
const PASS_STAGGER = 0.12;

export class PodiumStore {
  cards: PodiumCard[] = [];
  /** The element the canvas fills. */
  box: HTMLElement | null = null;
  boxWidth = 0;
  boxHeight = 0;
  /** The root font-size in pixels. */
  rem = 16;
  /** The room around each card the scene draws in, in rem: for its
      corners when it turns and comes forward. */
  room: number = CARD.room;
  /** Grows when a card arrives, leaves, or changes its place or size. */
  version = 0;
  /** A mouse or trackpad is the pointer, so a card can follow it. */
  hovers = true;
  /** Some of the box is on screen. */
  visible = false;
  /** Set by the scene: draw a frame. */
  wake: () => void = () => {};

  private listeners = new Set<() => void>();
  private byElement = new Map<Element, PodiumCard>();
  /** Where each thing that scrolls was at its last event, and when. */
  private scrolls = new Map<EventTarget, { x: number; y: number; at: number }>();
  private scrollRest: ReturnType<typeof setTimeout> | undefined;
  private pending = 0;
  private observer: ResizeObserver | null = null;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getVersion = () => this.version;

  private changed() {
    this.version += 1;
    for (const listener of this.listeners) listener();
  }

  private watch() {
    if (!this.observer && typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(() => this.remeasure());
    }
    return this.observer;
  }

  setBox(box: HTMLElement | null) {
    if (this.box) this.observer?.unobserve(this.box);
    this.box = box;
    if (box) this.watch()?.observe(box);
    this.remeasure();
  }

  add(given: Pick<PodiumCard, "key" | "tier" | "el" | "body" | "photo">) {
    const card: PodiumCard = {
      ...given,
      front: given.body.querySelector<HTMLElement>("[data-podium-face]"),
      back: given.body.querySelector<HTMLElement>("[data-podium-back]"),
      ...{ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0, pr: 0 },
      ...{ rx: 0, ry: 0, lift: 0, vrx: 0, vry: 0, vlift: 0, toRx: 0, toRy: 0, toLift: 0 },
      // A card already turned over when the scene arrives starts so.
      ...(given.el.hasAttribute("data-flipped") ? { turn: 180, toTurn: 180 } : { turn: 0, toTurn: 0 }),
      vturn: 0,
      pass: null,
      live: false,
      arriving: false,
      parts: null,
    };
    this.cards.push(card);
    this.byElement.set(card.el, card);
    this.watch()?.observe(card.el);
    this.remeasure();
    return card;
  }

  remove(card: PodiumCard) {
    this.cards = this.cards.filter((other) => other !== card);
    this.byElement.delete(card.el);
    this.observer?.unobserve(card.el);
    this.settle(card);
    this.changed();
  }

  /** Ask for the boxes to be read again, once, before the next frame. */
  remeasure() {
    if (this.pending || typeof requestAnimationFrame === "undefined") return;
    this.pending = requestAnimationFrame(() => {
      this.pending = 0;
      this.measure();
    });
  }

  private measure() {
    const box = this.box;
    if (!box) return;
    const origin = box.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    let moved = rem !== this.rem || origin.width !== this.boxWidth || origin.height !== this.boxHeight;
    this.rem = rem;
    this.boxWidth = origin.width;
    this.boxHeight = origin.height;
    for (const card of this.cards) {
      const rect = card.el.getBoundingClientRect();
      /* The photo is inside the markup that turns, so its place is read
         from the layout, which a transform does not change. */
      const photo = card.photo;
      let photoLeft = 0;
      let photoTop = 0;
      for (let node = photo; node && node !== card.body; node = node.offsetParent as HTMLElement | null) {
        photoLeft += node.offsetLeft;
        photoTop += node.offsetTop;
      }
      const next = {
        x: rect.left - origin.left,
        y: rect.top - origin.top,
        w: rect.width,
        h: rect.height,
        px: photo ? photoLeft + photo.offsetWidth / 2 : rect.width / 2,
        py: photo ? photoTop + photo.offsetHeight / 2 : 0,
        pr: photo ? photo.offsetWidth / 2 : 0,
      };
      for (const key of Object.keys(next) as (keyof typeof next)[]) {
        if (Math.abs(card[key] - next[key]) > 0.25) moved = true;
        card[key] = next[key];
      }
    }
    if (moved) this.changed();
    this.wake();
  }

  /** The pointer is over a card: it leans toward it and comes forward. */
  point(element: Element, clientX: number, clientY: number) {
    const card = this.byElement.get(element);
    if (!card || !this.hovers || !card.live) return;
    const rect = card.el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((clientY - rect.top) / rect.height) * 2 - 1;
    card.toRx = -clamp(y) * POINTER_TILT.x;
    card.toRy = clamp(x) * POINTER_TILT.y;
    card.toLift = CARD.hoverLift * this.rem;
    this.wake();
  }

  /** Turn a card over, or back. */
  flip(element: Element, over: boolean) {
    const card = this.byElement.get(element);
    if (!card) return;
    card.toTurn = over ? 180 : 0;
    this.wake();
  }

  /** The pointer has left: the card lies back down. */
  rest(element: Element) {
    const card = this.byElement.get(element);
    if (!card || !this.hovers) return;
    card.toRx = 0;
    card.toRy = 0;
    card.toLift = 0;
    this.wake();
  }

  /* On a touch screen there is no pointer to follow, so the cards answer
     the scroll instead: carried up the page or along their row, they
     lean with the movement, as a card held by its middle would, and the
     light on them moves; when the scroll stops they lie flat again, so
     their text is still and sharp whenever it is being read. `x` and `y`
     are how far `source` has been scrolled. */
  scrolled(source: EventTarget, x: number, y: number) {
    const at = performance.now();
    const last = this.scrolls.get(source);
    this.scrolls.set(source, { x, y, at });
    if (this.hovers || !this.visible || !last) return;
    const elapsed = Math.max(4, Math.min(at - last.at, 64));
    const alongRow = clamp((x - last.x) / elapsed / SCROLL_FULL);
    const upPage = clamp((y - last.y) / elapsed / SCROLL_FULL);
    for (const card of this.cards) {
      if (!card.live) continue;
      // The edge that leads is the edge that leans away.
      card.toRy = -alongRow * SCROLL_TILT.y;
      card.toRx = upPage * SCROLL_TILT.x;
    }
    clearTimeout(this.scrollRest);
    this.scrollRest = setTimeout(() => {
      for (const card of this.cards) card.toRx = card.toRy = 0;
      this.wake();
    }, SCROLL_REST);
    this.wake();
  }

  /* Watch what the cards depend on outside themselves: whether they are
     near the screen and on it, what the visitor's device points with,
     and, where nothing hovers,
     the page's scrolling. `onNear` is called once, when the cards first
     come within a screen's reach, which is when the scene is worth
     fetching. Returns the way to stop watching. */
  connect(host: HTMLElement, onNear: () => void) {
    const stops: (() => void)[] = [];
    const media = (query: string, apply: (matches: boolean) => void) => {
      const list = window.matchMedia(query);
      const listen = () => {
        apply(list.matches);
        for (const card of this.cards) card.toRx = card.toRy = card.toLift = 0;
        this.wake();
      };
      apply(list.matches);
      list.addEventListener("change", listen);
      stops.push(() => list.removeEventListener("change", listen));
    };
    media("(hover: hover) and (pointer: fine)", (matches) => {
      this.hovers = matches;
    });

    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        near.disconnect();
        onNear();
      },
      { rootMargin: "100% 0px" },
    );
    near.observe(host);
    const seen = new IntersectionObserver((entries) => this.setVisible(entries[entries.length - 1].isIntersecting), {
      threshold: 0.2,
    });
    seen.observe(host);
    stops.push(() => near.disconnect(), () => seen.disconnect());

    const scrolled = () => this.scrolled(window, window.scrollX, window.scrollY);
    window.addEventListener("scroll", scrolled, { passive: true });
    stops.push(() => window.removeEventListener("scroll", scrolled));

    return () => {
      for (const stop of stops) stop();
    };
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    if (!visible) return;
    let order = 0;
    for (const card of this.cards) if (card.arriving) this.arrive(card, order++);
    this.wake();
  }

  /** A card the scene has just drawn for the first time: the markup lets
      go of its own surface, and a light passes over the card. */
  drawn(card: PodiumCard) {
    card.live = true;
    card.el.setAttribute("data-live", "");
    if (this.visible) this.arrive(card, this.cards.filter((other) => other.pass !== null).length);
    else card.arriving = true;
  }

  private arrive(card: PodiumCard, order: number) {
    card.arriving = false;
    card.pass = -order * PASS_STAGGER;
    // A small nod as the light crosses: a push the spring then settles.
    card.vrx -= 46;
    card.vry += 30;
  }

  /** Move a card toward where it is going by `dt` seconds. True while it
      still has somewhere to go. */
  step(card: PodiumCard, dt: number) {
    let moving = false;
    if (card.pass !== null) {
      card.pass += dt;
      if (card.pass >= PASS_SECONDS) card.pass = null;
      else moving = true;
    }
    // In steps no longer than 8ms, so a slow frame cannot throw the spring.
    for (let left = dt; left > 0; left -= 0.008) {
      const h = Math.min(left, 0.008);
      card.vrx += ((card.toRx - card.rx) * STIFFNESS - card.vrx * DAMPING) * h;
      card.vry += ((card.toRy - card.ry) * STIFFNESS - card.vry * DAMPING) * h;
      card.vlift += ((card.toLift - card.lift) * STIFFNESS - card.vlift * DAMPING) * h;
      card.rx += card.vrx * h;
      card.ry += card.vry * h;
      card.lift += card.vlift * h;
      card.vturn += ((card.toTurn - card.turn) * TURN_STIFFNESS - card.vturn * TURN_DAMPING) * h;
      card.turn += card.vturn * h;
    }
    const still =
      Math.abs(card.toRx - card.rx) < 0.02 &&
      Math.abs(card.toRy - card.ry) < 0.02 &&
      Math.abs(card.toLift - card.lift) < 0.05 &&
      Math.abs(card.vrx) < 0.05 &&
      Math.abs(card.vry) < 0.05 &&
      Math.abs(card.vlift) < 0.05 &&
      Math.abs(card.toTurn - card.turn) < 0.05 &&
      Math.abs(card.vturn) < 0.05;
    if (still) {
      card.rx = card.toRx;
      card.ry = card.toRy;
      card.lift = card.toLift;
      card.turn = card.toTurn;
      card.vrx = card.vry = card.vlift = card.vturn = 0;
    }
    return moving || !still;
  }

  /** How a card stands as a whole: its tilt, and its turn over with the
      rise and the tip back that go with it, which are greatest half way. */
  posed(card: PodiumCard) {
    const midway = Math.sin((Math.min(Math.max(card.turn, 0), 180) * Math.PI) / 180);
    return {
      rx: card.rx + midway * TURN_TIP,
      ry: card.ry + card.turn,
      lift: card.lift + midway * TURN_LIFT * this.rem,
    };
  }

  /** Turn a card's markup as its body is turned. A card lying flat face up
      has no transform at all, so its text is drawn sharp. */
  pose(card: PodiumCard) {
    const { rx, ry, lift } = this.posed(card);
    const flat = rx === 0 && ry === 0 && lift === 0;
    card.body.style.transform = flat
      ? ""
      : `perspective(${CARD.perspective * this.rem}px) translateZ(${lift.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;
    if (card.back) {
      const showingBack = Math.cos((ry * Math.PI) / 180) < 0;
      if (card.front) card.front.style.visibility = showingBack ? "hidden" : "visible";
      card.back.style.visibility = showingBack ? "visible" : "hidden";
    }
  }

  /** Give a card back to its markup alone: flat, and with its own surface. */
  settle(card: PodiumCard) {
    card.rx = card.ry = card.lift = card.vrx = card.vry = card.vlift = 0;
    card.toRx = card.toRy = card.toLift = 0;
    // The markup's own CSS turns a card that is face down (data-flipped).
    card.turn = card.toTurn = card.vturn = 0;
    card.pass = null;
    card.live = false;
    card.arriving = false;
    card.body.style.transform = "";
    // Which side shows goes back to the markup's own CSS.
    if (card.front) card.front.style.visibility = "";
    if (card.back) card.back.style.visibility = "";
    card.el.removeAttribute("data-live");
  }

  /** The scene is up: `wake` is how it is asked for a frame. Returns the
      way to tell the store it has gone. */
  attachScene(wake: () => void) {
    this.wake = wake;
    wake();
    return () => this.release();
  }

  /** The scene's objects for a card, or null when they are taken down. */
  setParts(card: PodiumCard, parts: CardParts | null) {
    card.parts = parts;
    this.wake();
  }

  /** The scene is gone (unmounted, or its context lost). */
  release() {
    this.wake = () => {};
    for (const card of this.cards) this.settle(card);
  }

  dispose() {
    this.release();
    this.observer?.disconnect();
    this.observer = null;
    clearTimeout(this.scrollRest);
    if (this.pending) cancelAnimationFrame(this.pending);
    this.pending = 0;
  }
}

const clamp = (value: number) => Math.max(-1, Math.min(1, value));
