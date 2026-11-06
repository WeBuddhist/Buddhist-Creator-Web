"use client";

/* Pointer-driven motion for hairline figures, on two clocks:

   - A continuous input (where the pointer is) drives a spring, k 100,
     c 18, m 1, because its target moves every frame and a timed ease would
     always be chasing it.
   - A discrete change (which part the pointer chose) gets a 700ms ease-out
     on the drawer curve, applied as a CSS transition on opacity or stroke.

   The spring loop runs only while something is still moving and sleeps
   once every value has settled, so an idle figure costs nothing. Under a
   reduced-motion preference the springs land at once and only the
   cross-fades remain. */

import * as React from "react";

/* The default spring. k 100, c 18 is just under critical damping, so it
   settles fast with a hint of follow-through. A heavier part passes a
   lower k and c: slower to answer, never overshooting. */
export type Spring = { k: number; c: number };
const DEFAULT_SPRING: Spring = { k: 100, c: 18 };
const M = 1;

/* The integrator, outside React: it owns position, velocity and target,
   and reports each frame's positions through onFrame. */
function makeEngine(initial: readonly number[], { k, c }: Spring) {
  const pos = [...initial];
  const vel = initial.map(() => 0);
  let target = [...initial];
  let frame: number | null = null;
  let last = 0;
  let onFrame: (values: number[]) => void = () => {};

  const step = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    let moving = false;
    for (let i = 0; i < pos.length; i++) {
      const a = (k * (target[i] - pos[i]) - c * vel[i]) / M;
      vel[i] += a * dt;
      pos[i] += vel[i] * dt;
      if (Math.abs(target[i] - pos[i]) > 0.02 || Math.abs(vel[i]) > 0.2) {
        moving = true;
      } else {
        pos[i] = target[i];
        vel[i] = 0;
      }
    }
    onFrame([...pos]);
    frame = moving ? requestAnimationFrame(step) : null;
  };

  return {
    listen(fn: (values: number[]) => void) {
      onFrame = fn;
    },
    set(next: readonly number[]) {
      target = [...next];
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        for (let i = 0; i < pos.length; i++) {
          pos[i] = target[i];
          vel[i] = 0;
        }
        onFrame([...pos]);
        return;
      }
      if (frame === null) {
        last = performance.now();
        frame = requestAnimationFrame(step);
      }
    },
    stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    },
  };
}

export function useSprings(initial: readonly number[], spring: Spring = DEFAULT_SPRING) {
  const [values, setValues] = React.useState<number[]>(() => [...initial]);
  const [engine] = React.useState(() => makeEngine(initial, spring));
  React.useEffect(() => {
    engine.listen(setValues);
    return () => engine.stop();
  }, [engine]);
  const set = React.useCallback((next: readonly number[]) => engine.set(next), [engine]);
  return { values, set };
}

/* Reports the pointer in the svg's viewBox units while it is over the
   figure's host (the card), and null once it leaves. Touch is ignored: a
   tap would latch a pose with no way to let go. */
export function usePointer(
  ref: React.RefObject<SVGSVGElement | null>,
  box: readonly [number, number],
  onPointer: (p: [number, number] | null) => void,
) {
  const handler = React.useRef(onPointer);
  React.useEffect(() => {
    handler.current = onPointer;
  });

  React.useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const host = svg.closest(".art-host") ?? svg;
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = svg.getBoundingClientRect();
      handler.current([
        ((e.clientX - r.left) / r.width) * box[0],
        ((e.clientY - r.top) / r.height) * box[1],
      ]);
    };
    const leave = () => handler.current(null);
    host.addEventListener("pointermove", move as EventListener);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move as EventListener);
      host.removeEventListener("pointerleave", leave);
    };
  }, [ref, box]);
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
