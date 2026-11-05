"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/* Watches every section marked data-header-tone="brand" and writes
   data-tone on the header: "brand" while such a section sits under the
   header's midline, "light" otherwise. The observer's root is shrunk to a
   one-pixel strip at that midline, so the swap happens as a section's edge
   crosses it. Re-attaches on navigation and on resize, since both change
   which sections exist or where the midline falls. Renders nothing. */
export function HeaderTone() {
  const pathname = usePathname();

  React.useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;

    let observer: IntersectionObserver | null = null;
    const under = new Set<Element>();
    let frame = 0;

    const connect = () => {
      observer?.disconnect();
      under.clear();
      const midline = header.getBoundingClientRect().height / 2;
      // Clamped: a viewport shorter than the midline (headless before layout,
      // some embedded webviews) would otherwise format as "--Npx" and throw.
      const below = Math.max(window.innerHeight - midline - 1, 0);
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) under.add(entry.target);
            else under.delete(entry.target);
          }
          header.dataset.tone = under.size > 0 ? "brand" : "light";
        },
        {
          rootMargin: `-${midline}px 0px -${below}px 0px`,
          threshold: 0,
        },
      );
      for (const section of document.querySelectorAll('[data-header-tone="brand"]')) {
        observer.observe(section);
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
    };
  }, [pathname]);

  return null;
}
