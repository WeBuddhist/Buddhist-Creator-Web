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
  /* On a card with a back, the markup of each side. Whichever faces away
     is hidden outright as the card passes edge-on: browsers do not all
     hide a turned-away side for backface-visibility (Safari draws its
     separately composited parts, the photo and the text, mirrored). */
  front: HTMLElement | null;
  back: HTMLElement | null;
  /** The shade drawn over the page behind a card that has come forward. */
  veil: HTMLElement | null;
  /** The foil seal in the card's corner, whose colours run as the card leans. */
  seal: HTMLElement | null;
  /** Where a card that has come forward stands: how far from its place
      its middle is, in pixels, and how much larger it is. */
  near: { dx: number; dy: number; scale: number };
  /** Its markup is laid out at that size, not enlarged to it (see pose). */
  large: boolean;
  /** The elements whose type is held at its own optical size meanwhile. */
  held: HTMLElement[];
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
  /** How far the card has spun on its way forward, in degrees: 0 in its
      place, 360 (once round, so face up again) at the middle of the
      screen; its speed; and where it is going. How far forward it has
      come is the same number: a card half way round is half way there.
      Only a card with a back (CardStage's) ever leaves its place. */
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

/* The spring that spins a card forward and back: slower than the tilt's,
   and a touch under critical damping, so the card arrives a hair past
   flat and settles, as a card tossed onto a table does. */
const TURN_STIFFNESS = 70;
const TURN_DAMPING = 15;
/** How far a spinning card rises toward the eye at the middle of its
    spin, in rem, and how far its top tips away then, in degrees. */
const TURN_LIFT = 2.5;
const TURN_TIP = 5;
/* A card that has come forward stands in the middle of the screen, as
   large as leaves this much of the screen clear round it (in rem), and no
   more than this many times its own size. */
const NEAR_MARGIN = 1;
const NEAR_SCALE = 1.6;

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
  /** How much finer than usual the scene should be drawn: a card that has
      come forward is larger than its canvas was made for. */
  sharpness = 1;
  /** The scene's buffers were just rebuilt: the next frames say nothing
      about how fast this browser draws. */
  hitch = false;

  private listeners = new Set<() => void>();
  private frame = 0;
  private last = 0;
  /** Boxes went unread while a card was away from its place. */
  private stale = false;

  /* Without the scene the store moves the cards itself: a card still
     spins forward and back as markup alone. */
  private run = () => {
    if (this.frame || typeof requestAnimationFrame === "undefined") return;
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  };

  private tick = (now: number) => {
    this.frame = 0;
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    let moving = false;
    for (const card of this.cards) {
      if (this.step(card, dt)) moving = true;
      this.pose(card);
    }
    if (moving) this.frame = requestAnimationFrame(this.tick);
  };

  /** Ask for a frame: the scene's while it is up, the store's own otherwise. */
  wake: () => void = this.run;

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
      veil: given.el.parentElement?.querySelector<HTMLElement>("[data-podium-veil]") ?? null,
      seal: given.body.querySelector<HTMLElement>("[data-podium-seal]"),
      near: { dx: 0, dy: 0, scale: 1 },
      large: false,
      held: [],
      ...{ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0, pr: 0 },
      ...{ rx: 0, ry: 0, lift: 0, vrx: 0, vry: 0, vlift: 0, toRx: 0, toRy: 0, toLift: 0 },
      ...{ turn: 0, toTurn: 0, vturn: 0 },
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
    // Back in its place, if it was away from it.
    card.turn = card.toTurn = card.vturn = 0;
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
    /* A card away from its place is moved by a transform, which its box
       would be read through: the reading waits until it is back. */
    if (this.cards.some((card) => card.turn !== 0 || card.toTurn !== 0)) {
      this.stale = true;
      return;
    }
    this.stale = false;
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
    // A card laid out larger: its element keeps its own size, its markup is the larger.
    const rect = card.el.getBoundingClientRect();
    const size = card.large ? card.near.scale : 1;
    const x = ((clientX - rect.left) / (rect.width * size)) * 2 - 1;
    const y = ((clientY - rect.top) / (rect.height * size)) * 2 - 1;
    card.toRx = -clamp(y) * POINTER_TILT.x;
    card.toRy = clamp(x) * POINTER_TILT.y;
    card.toLift = CARD.hoverLift * this.rem;
    this.wake();
  }

  /** Bring a card forward to the middle of the screen, spinning once
      round on its way, or send it back to its place the same way. */
  bring(element: Element, near: boolean) {
    const card = this.byElement.get(element);
    if (!card) return;
    // From its place: where the middle of the screen is from there, and
    // how large the card can stand in it. On its way back, it knows.
    if (near && card.turn === 0) {
      const rect = card.el.getBoundingClientRect();
      const middle = rect.left + rect.width / 2;
      const margin = NEAR_MARGIN * this.rem * 2;
      const fits = Math.min((window.innerWidth - margin) / rect.width, (window.innerHeight - margin) / rect.height);
      /* The canvas is enlarged with the card and reaches past it: it must
         not pass the screen's right edge, or the page would scroll
         sideways. On a phone, where it is as wide as the screen already,
         that leaves the card its own size. */
      const reach = this.box ? this.box.getBoundingClientRect().right - middle : rect.width / 2;
      const room = window.innerWidth / 2 / reach;
      card.near = {
        dx: window.innerWidth / 2 - middle,
        dy: window.innerHeight / 2 - (rect.top + rect.height / 2),
        scale: Math.max(0.5, Math.min(NEAR_SCALE, fits, Math.max(1, room))),
      };
    }
    card.toTurn = near ? 360 : 0;
    // Asked now, not half way round: the answer costs a measure of the page.
    canLayOutLarger();
    if (near) this.sharpen(Math.max(1, card.near.scale));
    this.wake();
  }

  private sharpen(sharpness: number) {
    if (sharpness === this.sharpness) return;
    this.sharpness = sharpness;
    this.hitch = true;
    this.changed();
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
    const away = card.turn !== 0;
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
      /* Back in its place: the scene can be drawn as coarsely as before,
         and whatever changed size meanwhile is read. Not from inside the
         frame that is being drawn: the canvas would change under it. */
      if (away && card.turn === 0) {
        setTimeout(() => {
          if (this.cards.some((other) => other.turn !== 0 || other.toTurn !== 0)) return;
          this.sharpen(1);
          if (this.stale) this.remeasure();
        }, 0);
      }
    }
    return moving || !still;
  }

  /** How a card stands as a whole: its tilt, and its spin with the rise
      and the tip back that go with it, which are greatest half way round.
      A card that has arrived, once round, stands as one that never left. */
  posed(card: PodiumCard) {
    const spin = card.turn === 360 ? 0 : card.turn;
    const midway = Math.sin((Math.min(Math.max(spin, 0), 360) * Math.PI) / 360);
    return {
      rx: card.rx + midway * TURN_TIP,
      ry: card.ry + spin,
      lift: card.lift + midway * TURN_LIFT * this.rem,
    };
  }

  /** Turn a card's markup as its body is turned, and carry both as far
      forward as the card has come. A card lying flat face up has no
      transform at all, so its text is drawn sharp. */
  pose(card: PodiumCard) {
    const { rx, ry, lift } = this.posed(card);
    const flat = rx === 0 && ry === 0 && lift === 0;
    card.body.style.transform = flat
      ? ""
      : `perspective(${CARD.perspective * this.rem}px) translateZ(${lift.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;
    /* The seal's foil: which way the card leans, -1 to 1 each way, and how
       much of its colour shows, which is all of it for a card the pointer
       has lifted or a scroll has leant right over. Only while the scene
       turns the card; otherwise the seal's own CSS answers the pointer. */
    if (card.seal) {
      const lean = { x: card.ry / POINTER_TILT.y, y: card.rx / POINTER_TILT.x };
      const shine = Math.min(1, Math.max(card.lift / (CARD.hoverLift * this.rem), Math.hypot(lean.x, lean.y) * 1.3, 0));
      for (const [name, value] of [["--tilt-x", lean.x], ["--tilt-y", lean.y], ["--shine", shine]] as const) {
        if (card.live) card.seal.style.setProperty(name, value.toFixed(3));
        else card.seal.style.removeProperty(name);
      }
    }
    if (!card.back) return;
    const showingBack = Math.cos((ry * Math.PI) / 180) < 0;
    if (card.front) card.front.style.visibility = showingBack ? "hidden" : "visible";
    card.back.style.visibility = showingBack ? "visible" : "hidden";

    /* On its way forward the card's element and the canvas its body is
       drawn in are moved and enlarged as one, about the card's middle;
       the page behind is shaded as far as the card has come; and the
       stage stands over the page for as long as the card is off it. */
    // The spin lands a hair past flat and settles; the card's place does not.
    const come = Math.min(card.turn / 360, 1);
    const { dx, dy, scale } = card.near;
    const carried =
      come === 0
        ? ""
        : `translate(${(dx * come).toFixed(2)}px, ${(dy * come).toFixed(2)}px) scale(${(1 + (scale - 1) * come).toFixed(4)})`;
    if (this.box) {
      this.box.style.transformOrigin = `${(card.x + card.w / 2).toFixed(2)}px ${(card.y + card.h / 2).toFixed(2)}px`;
      this.box.style.transform = carried;
    }
    if (card.veil) card.veil.style.opacity = Math.min(Math.max(come, 0), 1).toFixed(3);
    card.el.parentElement?.toggleAttribute("data-raised", come !== 0);

    /* A card that has come forward has its markup laid out at its larger
       size (`zoom`) in place of being enlarged by the transform. A browser
       draws the words of a tilted card once, at their laid-out size, and
       stretches that, so a card enlarged by a transform alone reads soft
       whenever it leans to the pointer.

       Larger type is not the same type stretched: where the typeface has
       an optical size, as this page's has, a browser may let it follow
       the larger size (Firefox does), and the letters then sit closer: a
       line is some 4% shorter, and could break elsewhere, which would
       leave the markup a different height from the body drawn under it.
       So each piece of type is held at the optical size it has in the
       card's place (holdType), and the card forward is the card in its
       place, larger. And the change is made where it cannot be seen, half
       way round, while the card's back is to the eye: on the way forward
       the face comes round already laid out larger, and on the way back
       already as it is in its place. Until the card has arrived, the
       transform makes up the difference between the size the markup is
       laid out at and the size the card has grown to, so the markup and
       the body stay one size.

       The card's element keeps its size and its place in the page; the
       larger markup stands out of it, and out of the page's layout, from
       its top-left corner, which is where the transform then works from. */
    let large = card.large;
    if (showingBack) large = card.toTurn === 360;
    else if (card.turn === 360) large = true;
    else if (come === 0) large = false;
    large = large && canLayOutLarger();
    if (large !== card.large) {
      card.large = large;
      // Before the size changes: it reads the sizes the type has now.
      holdType(card, large);
      card.body.style.setProperty("zoom", large ? String(scale) : "");
      card.body.style.position = large ? "absolute" : "";
      card.body.style.width = large ? `${card.w}px` : "";
      card.el.style.height = large ? `${card.h}px` : "";
      card.el.style.transformOrigin = large ? "0 0" : "";
    }
    if (!large) {
      card.el.style.transform = carried;
      return;
    }
    const grown = 1 + (scale - 1) * come;
    const left = dx * come - ((grown - 1) * card.w) / 2;
    const top = dy * come - ((grown - 1) * card.h) / 2;
    const still = grown === scale ? "" : ` scale(${(grown / scale).toFixed(4)})`;
    card.el.style.transform = `translate(${left.toFixed(2)}px, ${top.toFixed(2)}px)${still}`;
  }

  /** Give a card back to its markup alone, with its own surface. It
      stays where it is: forward, if it had come forward. */
  settle(card: PodiumCard) {
    card.rx = card.ry = card.lift = card.vrx = card.vry = card.vlift = 0;
    card.toRx = card.toRy = card.toLift = 0;
    card.pass = null;
    card.live = false;
    card.arriving = false;
    card.el.removeAttribute("data-live");
    this.pose(card);
  }

  /** The scene is up: `wake` is how it is asked for a frame. Returns the
      way to tell the store it has gone. */
  attachScene(wake: () => void) {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.wake = wake;
    wake();
    return () => this.release();
  }

  /** The scene's objects for a card, or null when they are taken down. */
  setParts(card: PodiumCard, parts: CardParts | null) {
    card.parts = parts;
    this.wake();
  }

  /** The scene is gone (unmounted, or its context lost): the store moves
      the cards itself again. */
  release() {
    this.wake = this.run;
    for (const card of this.cards) this.settle(card);
    this.wake();
  }

  dispose() {
    this.release();
    this.observer?.disconnect();
    this.observer = null;
    clearTimeout(this.scrollRest);
    if (this.pending) cancelAnimationFrame(this.pending);
    this.pending = 0;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }
}

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

/* Hold each piece of type on a card's face at the optical size its own
   size gives it now, or let it go again. Only elements with words of
   their own are touched, and only the one axis: weight and the rest stay
   with their properties. A typeface with no such axis ignores it. */
function holdType(card: PodiumCard, hold: boolean) {
  for (const element of card.held) element.style.fontVariationSettings = "";
  card.held = [];
  if (!hold || !card.front) return;
  for (const element of card.front.querySelectorAll<HTMLElement>("*")) {
    if (!(element instanceof HTMLElement)) continue;
    const worded = Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
    if (worded) card.held.push(element);
  }
  // Read them all, then write them all.
  const sizes = card.held.map((element) => parseFloat(getComputedStyle(element).fontSize));
  card.held.forEach((element, index) => {
    if (sizes[index] > 0) element.style.fontVariationSettings = `"opsz" ${sizes[index]}`;
  });
}

/* Whether a card's markup can be laid out larger with CSS `zoom`
   (see pose). Chrome needs it and does it rightly. Safari does not need
   it (it draws a tilted, enlarged card's words sharp as they are) and
   cannot be given it: its `zoom` enlarges the type but not a length in
   rem, which is every measure on the card. Firefox has had `zoom` only
   since version 126. So it is asked for only where a rem under `zoom` is
   seen to grow. Found out once, the first time a card is asked forward. */
let laysOutLarger: boolean | undefined;
function canLayOutLarger() {
  if (laysOutLarger !== undefined) return laysOutLarger;
  laysOutLarger = false;
  if (typeof CSS === "undefined" || !CSS.supports("zoom", "2")) return false;
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;width:1rem;height:1px;zoom:2";
  const one = document.createElement("div");
  one.style.cssText = "position:absolute;visibility:hidden;width:1rem;height:1px";
  document.body.append(probe, one);
  laysOutLarger = probe.getBoundingClientRect().width > one.getBoundingClientRect().width * 1.5;
  probe.remove();
  one.remove();
  return laysOutLarger;
}
