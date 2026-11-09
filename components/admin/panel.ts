/* The dashboard's surface: one white card on the hairline ring with a soft
   lift, flatter than the site's double-ring frame so a page of tables and
   tiles reads as chrome rather than as a row of feature cards. The
   transparent border is what forced-colors mode paints in place of the
   shadow. */
export const panel = "rounded-xl border border-transparent bg-card shadow-border";

/* A panel that is a link: the ring firms up under the pointer. */
export const panelLink =
  "rounded-xl border border-transparent bg-card shadow-border transition-[box-shadow,transform] duration-150 ease-hover hover:shadow-border-hover active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
