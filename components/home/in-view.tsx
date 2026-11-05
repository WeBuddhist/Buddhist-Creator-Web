"use client";

import * as React from "react";

/* Reports once that it has scrolled into view, by setting data-visible. The
   entrances inside start from that attribute (see .art in globals.css). Each
   illustration watches for itself, so in the single column on a phone each
   one plays when it is reached rather than all at once. */
export function InView({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
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
    <div ref={ref} data-visible={visible || undefined} className={className}>
      {children}
    </div>
  );
}
