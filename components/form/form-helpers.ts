import type * as React from "react";
import { flushSync } from "react-dom";

/* Small pieces of browser work the site's long forms share: the
   registration form (app/(site)/convention/2027/register) and the creator
   card (app/(site)/creator-card). Each is called from an event handler, a
   mutation callback or a ref, so neither form needs an effect for them. */

/** Smooth, unless the reader has asked for less motion. */
export const scrolling = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

/** Takes the reader to the answer that needs fixing: the field `selector`
    names is brought to the middle of the screen and given focus. A field
    inside a group (a set of checkboxes, the links) brings its whole group
    into view. */
export function goToField(form: HTMLFormElement | null, selector: string | undefined) {
  const target = selector ? form?.querySelector<HTMLElement>(selector) : null;
  (target?.closest("fieldset") ?? target)?.scrollIntoView({ behavior: scrolling(), block: "center" });
  target?.focus({ preventScroll: true });
}

/** Takes the reader to the banner that says where things stand now. */
export function goToBanner(banner: HTMLElement | null) {
  banner?.scrollIntoView({ behavior: scrolling(), block: "start" });
  banner?.focus({ preventScroll: true });
}

/* A ref for a floating action bar: while the bar is on the page it
   publishes its height, which is how far the toaster lifts itself to clear
   it (see globals.css), and takes the figure back when it leaves. */
export function publishBarHeight(bar: HTMLElement | null) {
  if (!bar) return;
  const root = document.documentElement.style;
  const observer = new ResizeObserver(() => {
    root.setProperty("--action-bar-height", `${Math.ceil(bar.offsetHeight)}px`);
  });
  observer.observe(bar);
  return () => {
    observer.disconnect();
    root.removeProperty("--action-bar-height");
  };
}

/* For a press on a bar button that replaces the bar's buttons, as Edit and
   Cancel do. The change is flushed so the new buttons are on the page
   before the handler ends, and keyboard focus goes to the first of them,
   the one now standing where the pressed one was, instead of dropping
   onto the page.

   The click's default action is stopped as well: without that, and keys
   on the bar's faces, the browser would run it on the node that replaced
   the button, a submit button, and send the form. */
export function swapBarButtons(event: React.MouseEvent<HTMLElement>, change: () => void) {
  event.preventDefault();
  const bar = event.currentTarget.closest("[data-action-bar]");
  flushSync(change);
  bar?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
}
