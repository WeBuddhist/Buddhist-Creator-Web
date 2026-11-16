"use client";

import * as React from "react";

/* Reports once that it has scrolled into view, by setting data-visible. The
   entrances inside start from that attribute (see .art in globals.css). Each
   illustration watches for itself, so in the single column on a phone each
   one plays when it is reached rather than all at once.

   The watching hangs on the element's own ref: it starts when the element
   arrives and the ref's cleanup ends it, so there is no effect to keep in
   step with the element. */
export function InView({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = React.useState(false);

  const watch = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-100px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={watch} data-visible={visible || undefined} className={className}>
      {children}
    </div>
  );
}
