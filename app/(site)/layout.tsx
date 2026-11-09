import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/* Every page of the site proper: the sticky header above, the footer
   below. Routes outside this group, such as /login, render on the bare
   shell from app/layout.tsx. The 404 page lives at app/not-found.tsx so it
   still catches unmatched URLs, and draws the same chrome itself. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
