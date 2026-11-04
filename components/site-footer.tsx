import Image from "next/image";
import Link from "next/link";
import { MailIcon, MapPinIcon } from "lucide-react";
import { SITE_NAME } from "@/lib/navigation";

type FooterLink = { label: string; href: string };

// A literal, not new Date(): the page is prerendered with Cache Components,
// which rejects values that change between renders.
const COPYRIGHT_YEAR = 2026;

// Placeholder content until the real pages and accounts exist.
const EXPLORE: FooterLink[] = [
  { label: "About", href: "/about" },
  { label: "Get Involved", href: "/get-involved" },
  { label: "Programs", href: "/programs" },
  { label: "Convention", href: "/convention" },
  { label: "Our Creators", href: "/creators" },
];

const RESOURCES: FooterLink[] = [
  { label: "Blog", href: "/blog" },
  { label: "Press Kit", href: "/press" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const SOCIAL = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "YouTube", href: "https://youtube.com", Icon: YouTubeIcon },
  { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon },
  { label: "X", href: "https://x.com", Icon: XIcon },
];

const link =
  "inline-flex min-h-8 items-center text-sm text-muted-foreground transition-colors duration-150 ease-hover hover:text-foreground";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:gap-8">
          {/* Brand */}
          <div className="max-w-xs">
            <Link
              href="/"
              aria-label={`${SITE_NAME} home`}
              className="inline-flex items-center gap-2.5"
            >
              <Image
                src="/logo.jpg"
                alt=""
                width={40}
                height={40}
                className="size-10 mix-blend-multiply dark:invert dark:mix-blend-screen"
              />
              <span className="text-[15px] font-semibold tracking-[-0.01em]">
                {SITE_NAME}
              </span>
            </Link>
            <p className="mt-4 text-pretty text-sm leading-[1.6] text-muted-foreground">
              A community of creators sharing the Dharma through film, writing,
              music and design.
            </p>
            <ul className="mt-6 flex items-center gap-2">
              {SOCIAL.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-[color,border-color,transform] duration-150 ease-hover hover:border-foreground/30 hover:text-foreground active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <FooterColumn title="Explore" links={EXPLORE} />
          <FooterColumn title="Resources" links={RESOURCES} />

          {/* Address */}
          <div>
            <h2 className="text-sm font-semibold">Find us</h2>
            <address className="mt-4 space-y-3 text-sm not-italic leading-[1.6] text-muted-foreground">
              <p className="flex gap-2.5">
                <MapPinIcon className="mt-1 size-4 shrink-0" strokeWidth={1.75} />
                <span>
                  Buddhist Creators
                  <br />
                  Bodh Gaya, Bihar 824231
                  <br />
                  India
                </span>
              </p>
              <p className="flex gap-2.5">
                <MailIcon className="mt-1 size-4 shrink-0" strokeWidth={1.75} />
                <a
                  href="mailto:hello@buddhistcreators.org"
                  className="transition-colors duration-150 ease-hover hover:text-foreground"
                >
                  hello@buddhistcreators.org
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {COPYRIGHT_YEAR} {SITE_NAME}. All rights reserved.
          </p>
          <ul className="flex items-center gap-6">
            <li>
              <Link href="/privacy" className={link}>
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className={link}>
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-3 flex flex-col">
        {links.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={link}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Brand glyphs. Lucide no longer ships brand icons, so these are inline. */

type IconProps = React.SVGProps<SVGSVGElement>;

function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YouTubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M2.5 12c0-2.6.3-4.2.6-5a2.2 2.2 0 0 1 1.5-1.4C6 5.3 9 5.2 12 5.2s6 .1 7.4.4a2.2 2.2 0 0 1 1.5 1.4c.3.8.6 2.4.6 5s-.3 4.2-.6 5a2.2 2.2 0 0 1-1.5 1.4c-1.4.3-4.4.4-7.4.4s-6-.1-7.4-.4a2.2 2.2 0 0 1-1.5-1.4c-.3-.8-.6-2.4-.6-5Z" />
      <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M14 21v-7h2.5l.5-3h-3V9.2c0-.9.3-1.5 1.6-1.5H17V5.1c-.3 0-1.2-.1-2.3-.1-2.3 0-3.7 1.4-3.7 3.9V11H8.5v3H11v7" />
    </svg>
  );
}

function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M4 4l16 16M20 4 4 20" />
    </svg>
  );
}
