"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/* Watches every element marked data-header-tone="dark" (a photograph, a
   cyan sheet, a sky-deep band, the footer) and writes data-tone on the
   header: "dark" while one sits under the header's midline, "light"
   otherwise. The band's colour becomes --header-bg, so the frosted bar
   takes the colour of whatever it floats over: data-header-bg names it
   where the computed background would be wrong (a photograph), otherwise
   the element's own background is read.

   The observer's root is shrunk to a one-pixel strip at the midline, so
   the swap happens as a band's edge crosses it. Where bands nest (the
   figures inside the mission), the innermost wins: it is the last of the
   intersecting bands in document order. Re-attaches on navigation and on
   resize, since both change which bands exist or where the midline falls.
   Renders nothing. */
export function HeaderTone() {
  const pathname = usePathname();

  React.useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;

    let observer: IntersectionObserver | null = null;
    const under = new Set<HTMLElement>();
    let frame = 0;

    const apply = () => {
      const bands = [...under].sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );
      const band = bands.at(-1);
      header.dataset.tone = band ? "dark" : "light";
      if (band) {
        header.style.setProperty(
          "--header-bg",
          band.dataset.headerBg ?? getComputedStyle(band).backgroundColor,
        );
      } else {
        header.style.removeProperty("--header-bg");
      }
    };

    const connect = () => {
      observer?.disconnect();
      under.clear();
      const bar = header.firstElementChild ?? header;
      const rect = bar.getBoundingClientRect();
      const midline = Math.round(rect.top + rect.height / 2);
      // Clamped: a viewport shorter than the midline (headless before
      // layout, some embedded webviews) would otherwise format as "--Npx"
      // and throw.
      const below = Math.max(window.innerHeight - midline - 1, 0);
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const target = entry.target as HTMLElement;
            if (entry.isIntersecting) under.add(target);
            else under.delete(target);
          }
          apply();
        },
        { rootMargin: `-${midline}px 0px -${below}px 0px`, threshold: 0 },
      );
      for (const band of document.querySelectorAll('[data-header-tone="dark"]')) {
        observer.observe(band);
      }
    };

    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(connect);
    };

    connect();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
      observer?.disconnect();
      delete header.dataset.tone;
      header.style.removeProperty("--header-bg");
    };
  }, [pathname]);

  return null;
}
