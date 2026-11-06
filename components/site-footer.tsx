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
import { NAV_ITEMS, SITE_NAME } from "@/lib/navigation";
import logo from "@/public/logo.jpg";

type FooterLink = { label: string; href: string; external?: true };

// A literal, not new Date(): the page is prerendered with Cache Components,
// which rejects values that change between renders.
const COPYRIGHT_YEAR = 2026;

// Placeholder content until the real pages exist.
const EXPLORE: FooterLink[] = [
  { label: "Get Involved", href: "/get-involved" },
  { label: "Events", href: "/events" },
  // /convention itself has no page; the header treats it as a menu group.
  { label: "Convention", href: "/convention/2026" },
  { label: "People", href: "/people" },
];

// The products column mirrors the Products menu in the header, so the two
// never drift apart.
const PRODUCTS: FooterLink[] =
  NAV_ITEMS.find((item) => item.label === "Products")?.children ?? [];

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
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:gap-8">
          {/* Brand */}
          <div className="max-w-xs">
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
          <FooterColumn title="Products" links={PRODUCTS} />

          {/* Address */}
          <div>
            <h2 className="text-sm font-semibold">Find us</h2>
            <address className="mt-4 space-y-3 text-sm not-italic leading-[1.6] text-muted-foreground">
              <p className="flex gap-2.5">
                <MapPinIcon className="mt-1 size-4 shrink-0" />
                <span>
                  Dharmaduta, Trehan Cottage
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
