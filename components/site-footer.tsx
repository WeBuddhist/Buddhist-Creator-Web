import Link from "next/link";
import {
  ArrowUpRightIcon,
  EnvelopeIcon,
  FacebookLogoIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  MapPinIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { label } from "@/components/convention/section-heading";
import { SITE_NAME } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type FooterLink = { label: string; href: string; external?: true };

// A literal, not new Date(): the page is prerendered with Cache Components,
// which rejects values that change between renders.
const COPYRIGHT_YEAR = 2026;

// Mirrors the header's top-level navigation. The Convention menu group is
// flattened to its editions, since /convention itself has no page.
const EXPLORE: FooterLink[] = [
  { label: "Get Involved", href: "/get-involved" },
  { label: "Program", href: "/program" },
  { label: "Convention 2027", href: "/convention/2027" },
  { label: "Convention 2026", href: "/convention/2026" },
  { label: "People", href: "/people" },
];

const SOCIAL = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/buddhist_creators/",
    Icon: InstagramLogoIcon,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@BuddhistCreators",
    Icon: YoutubeLogoIcon,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/people/Buddhist-Creators/61582543556233/",
    Icon: FacebookLogoIcon,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/buddhist-creators/",
    Icon: LinkedinLogoIcon,
  },
];

const linkText =
  "text-paper/80 underline decoration-transparent decoration-1 underline-offset-[5px] transition-[color,text-decoration-color] duration-150 ease-hover hover:text-paper hover:decoration-paper/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper";
const link = `inline-flex min-h-9 items-center text-base ${linkText}`;

const columnTitle = cn(label, "text-gold-soft");

/* The last sheet of the page: the darkest cyan, paper text, and the name
   once more in the serif, large and faint, along the foot. It rises
   1.75rem over the foot of the page above; every page ends with at least
   that much padding or picture. Paper on sky-deep measures 11.2:1, and
   6.4:1 at 70%. */
export function SiteFooter() {
  return (
    <footer data-header-tone="dark" className="relative z-10 -mt-7 overflow-hidden bg-sky-deep text-paper">
      <div className="mx-auto w-full max-w-6xl px-5 pt-16 sm:px-6 lg:pt-24">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1.3fr] md:gap-8">
          {/* Brand: full row on tablet so Explore and Contact pair up below it
              instead of leaving one of them alone in a half-empty row. */}
          <div className="max-w-sm sm:col-span-2 md:col-span-1">
            <p className="text-pretty font-display text-3xl leading-[1.15] sm:text-[2rem]">
              A global sangha of creators bringing the Dharma to the digital age.
            </p>
            <ul className="mt-8 flex items-center gap-2.5">
              {SOCIAL.map(({ label: name, href, Icon }) => (
                <li key={name}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="flex size-11 shrink-0 select-none items-center justify-center rounded-full border border-paper/30 text-paper transition-[background-color,border-color,color,transform] duration-150 ease-hover hover:border-paper hover:bg-paper hover:text-sky-deep active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
                  >
                    <Icon className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <FooterColumn title="Explore" links={EXPLORE} />

          {/* Address */}
          <div>
            <h2 className={columnTitle}>Contact us</h2>
            <address className="mt-5 space-y-3 text-base not-italic leading-[1.6] text-paper/80">
              <p className="flex gap-2.5">
                <MapPinIcon className="mt-1 size-4 shrink-0" />
                <span>
                  Trehan Cottage
                  <br />
                  H. No. 112, Ward No. 3, Near Delek Hospital
                  <br />
                  Khara Danda Road, Dharamshala
                  <br />
                  Distt. Kangra, HP 176215, India
                </span>
              </p>
              <p className="flex gap-2.5">
                <EnvelopeIcon className="mt-1 size-4 shrink-0" />
                <a href="mailto:hello@buddhistcreators.com" className={linkText}>
                  hello@buddhistcreators.com
                </a>
              </p>
            </address>
          </div>
        </div>

        <p className="mt-16 border-t border-paper/15 pt-6 text-sm text-paper/70">
          © {COPYRIGHT_YEAR} {SITE_NAME}. All rights reserved.
        </p>
      </div>

      {/* The name, once more, as wide as the page allows and faint, sunk a
          little below the bottom edge. Decorative; the name is in the
          copyright line. */}
      <p
        aria-hidden
        className="mt-10 -mb-[0.22em] select-none whitespace-nowrap text-center font-display text-[12.6vw] leading-none tracking-[-0.03em] text-paper/[0.09]"
      >
        {SITE_NAME}
      </p>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h2 className={columnTitle}>{title}</h2>
      <ul className="mt-4 flex flex-col">
        {links.map((item) => (
          <li key={item.href}>
            {item.external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${link} gap-1`}
              >
                {item.label}
                <ArrowUpRightIcon aria-hidden className="size-3.5 shrink-0" weight="bold" />
                <span className="sr-only">(opens in new tab)</span>
              </a>
            ) : (
              <Link href={item.href} className={link}>
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
