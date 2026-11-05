import Image from "next/image";
import Link from "next/link";
import {
  EnvelopeIcon,
  FacebookLogoIcon,
  InstagramLogoIcon,
  MapPinIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { SITE_NAME } from "@/lib/navigation";

type FooterLink = { label: string; href: string };

// A literal, not new Date(): the page is prerendered with Cache Components,
// which rejects values that change between renders.
const COPYRIGHT_YEAR = 2026;

// Placeholder content until the real pages and accounts exist.
const EXPLORE: FooterLink[] = [
  { label: "About", href: "/about" },
  { label: "Get Involved", href: "/get-involved" },
  { label: "Events", href: "/events" },
  { label: "Convention", href: "/convention" },
  { label: "People", href: "/people" },
];

const RESOURCES: FooterLink[] = [
  { label: "Blog", href: "/blog" },
  { label: "Press Kit", href: "/press" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const SOCIAL = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramLogoIcon },
  { label: "YouTube", href: "https://youtube.com", Icon: YoutubeLogoIcon },
  { label: "Facebook", href: "https://facebook.com", Icon: FacebookLogoIcon },
  { label: "X", href: "https://x.com", Icon: XLogoIcon },
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
                src="/logo.jpg"
                alt=""
                width={40}
                height={40}
                className="size-10 mix-blend-multiply"
              />
              <span className="text-[15px] font-semibold tracking-[-0.01em]">
                {SITE_NAME}
              </span>
            </Link>
            <p className="mt-4 text-pretty text-sm leading-[1.6] text-muted-foreground">
              A community of creators sharing the Dharma through film, writing,
              music and design.
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
          <FooterColumn title="Resources" links={RESOURCES} />

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
                  href="mailto:hello@buddhistcreators.org"
                  className="transition-colors duration-150 ease-hover hover:text-foreground"
                >
                  hello@buddhistcreators.org
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
      <ul className="mt-2 flex flex-col">
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
