import Image from "next/image";
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
import { SITE_NAME } from "@/lib/navigation";
import logo from "@/public/logo.jpg";

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

const link =
  "inline-flex min-h-8 items-center text-sm text-muted-foreground transition-colors duration-150 ease-hover hover:text-foreground";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1.3fr] md:gap-8">
          {/* Brand: full row on tablet so Explore and Contact pair up below it
              instead of leaving one of them alone in a half-empty row. */}
          <div className="max-w-xs sm:col-span-2 md:col-span-1">
            <Link
              href="/"
              aria-label={`${SITE_NAME} home`}
              className="inline-flex items-center gap-2.5"
            >
              <Image
                src={logo}
                alt=""
                width={40}
                height={40}
                placeholder="blur"
                className="size-10 mix-blend-multiply"
              />
              <span className="text-[15px] font-semibold tracking-[-0.01em]">
                {SITE_NAME}
              </span>
            </Link>
            <p className="mt-4 text-pretty text-sm leading-[1.6] text-muted-foreground">
              A global sangha of creators bringing the Dharma to the digital age.
            </p>
            <ul className="mt-5 flex items-center gap-3">
              {SOCIAL.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="group/social flex shrink-0 items-center justify-center rounded-[8px] border border-transparent bg-muted p-0.5 shadow-ring transition-transform duration-150 ease-hover active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="flex size-10 shrink-0 select-none items-center justify-center overflow-hidden rounded-[5px] border border-transparent bg-card text-muted-foreground shadow-border transition-colors duration-150 ease-hover group-hover/social:text-foreground">
                      <Icon className="size-5" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <FooterColumn title="Explore" links={EXPLORE} />

          {/* Address */}
          <div>
            <h2 className="text-sm font-semibold">Contact us</h2>
            <address className="mt-4 space-y-3 text-sm not-italic leading-[1.6] text-muted-foreground">
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
                <a
                  href="mailto:hello@buddhistcreators.com"
                  className="transition-colors duration-150 ease-hover hover:text-foreground"
                >
                  hello@buddhistcreators.com
                </a>
              </p>
            </address>
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          © {COPYRIGHT_YEAR} {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-2 flex flex-col">
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
