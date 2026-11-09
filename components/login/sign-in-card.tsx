import Image from "next/image";
import Link from "next/link";
import { AppleLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { card, cardInner } from "@/components/convention/section-heading";
import { authLoginUrl, CONNECTIONS } from "@/lib/auth0";
import { SITE_NAME } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import logoMark from "@/public/logo-mark.png";

/* The sign-in card. Each button is a plain navigation to the SDK's
   /auth/login with a `connection`, so Google and Apple open the provider
   straight away and Auth0's own chooser never shows. Google and Apple are
   the only ways in: a first sign-in creates the account, so there is no
   separate sign-up, and every account carries a verified email.

   Plain anchors, not <Link>: /auth/login is served by the proxy, and a
   prefetch of it would start a login transaction nobody asked for. */

const provider = cn(
  "h-11 w-full gap-2.5 rounded-full text-[0.9375rem]",
  // The site's pill, but static: a sign-in button that scales under the
  // pointer while a redirect starts reads as jittery.
  "active:translate-y-0",
);

function GoogleMark({ className }: { className?: string }) {
  // Google's four-colour G, the one form the brand guidelines allow.
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3.01h3.88c2.27-2.09 3.58-5.17 3.58-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.11A11.99 11.99 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28V6.61H1.28A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l4.01-3.11Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.61l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77Z" />
    </svg>
  );
}

export function SignInCard({ returnTo }: { returnTo: string }) {
  return (
    <div className={cn(card, "w-full")}>
      <div className={cn(cardInner, "p-6 sm:p-8")}>
        {/* On a phone the brand band is gone, so the mark sits here and is
            the way back home. From lg the band carries it. */}
        <Link
          href="/"
          aria-label={`${SITE_NAME} home`}
          className="mb-6 -ml-1 inline-flex rounded-full p-1 transition-transform duration-[160ms] ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
        >
          <Image src={logoMark} alt="" width={80} height={80} className="size-12" />
        </Link>
        <p className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">Sign in</p>
        <h1
          id="login-title"
          className="mt-3 text-balance text-2xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-3xl"
        >
          Welcome to {SITE_NAME}
        </h1>
        <p className="mt-3 text-pretty text-base leading-[1.6] text-muted-foreground">
          Sign in with your Google or Apple account to continue.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            variant="outline"
            size="pill"
            nativeButton={false}
            className={provider}
            render={<a href={authLoginUrl(returnTo, CONNECTIONS.google)} />}
          >
            <GoogleMark className="size-5" />
            Continue with Google
          </Button>
          <Button
            variant="outline"
            size="pill"
            nativeButton={false}
            className={provider}
            render={<a href={authLoginUrl(returnTo, CONNECTIONS.apple)} />}
          >
            <AppleLogoIcon className="size-5 text-foreground" weight="fill" />
            Continue with Apple
          </Button>
        </div>

      </div>
    </div>
  );
}
