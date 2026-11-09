import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { AsanohaCorner } from "@/components/asanoha-corner";
import { SignInCard } from "@/components/login/sign-in-card";
import { DEFAULT_RETURN_TO, safeReturnTo } from "@/lib/auth0";
import { SITE_NAME } from "@/lib/navigation";
import heroImage from "@/public/hero.png";
import logoMark from "@/public/logo-mark.png";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${SITE_NAME} with your Google or Apple account.`,
  robots: { index: false },
};

/* Our own sign-in page, in place of Auth0's hosted one. A brand band with
   the Buddha line art on the left and the card on the right; on a phone
   the band is dropped and the card stands alone.

   The card needs ?returnTo, which is request data, so it streams in
   behind a boundary whose fallback is the same card pointed at the
   default destination: nothing moves when the real one arrives. The
   proxy has already sent anyone who is signed in to their returnTo. */
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 flex-col bg-muted/30">
      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section
          aria-label={`About ${SITE_NAME}`}
          className="relative isolate hidden overflow-hidden bg-brand-cyan text-white lg:flex lg:flex-col lg:justify-between"
        >
          <AsanohaCorner className="-top-16 -left-16" />
          <div className="relative px-10 pt-10 xl:px-16 xl:pt-12">
            {/* The header's brand link, in white on the band: the lion mark
                is black line art, so every opaque pixel is inverted. */}
            <Link
              href="/"
              aria-label={`${SITE_NAME} home`}
              className="group -ml-1 inline-flex select-none items-center gap-2.5 rounded-full py-1 pr-2 pl-1 transition-transform duration-[160ms] ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Image src={logoMark} alt="" width={80} height={80} preload className="size-10 brightness-0 invert" />
              <span className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-white">{SITE_NAME}</span>
            </Link>
            <p className="mt-14 text-xs font-medium uppercase tracking-[0.05em] text-white/80 xl:mt-20">
              A Global Sangha of Creators
            </p>
            <p className="mt-4 max-w-md text-balance text-3xl font-semibold leading-[1.15] tracking-[-0.02em] xl:text-4xl">
              A worldwide community of monastics, practitioners and storytellers carrying the Dharma further
              than ever before.
            </p>
          </div>
          {/* The line art is cream on transparency, left as drawn on the
              band. It fills the room under the text and no more, sized by
              height so it never climbs into the headline, and the right
              edge crops it on purpose, the way a statue sits at the side
              of a frame. */}
          <div className="relative mt-10 min-h-[22rem] flex-1 overflow-hidden">
            <Image
              src={heroImage}
              alt=""
              sizes="(min-width: 1280px) 40rem, 50vw"
              className="absolute right-[-14%] bottom-[-8%] h-[108%] w-auto max-w-none opacity-90"
            />
          </div>
        </section>

        <section
          aria-labelledby="login-title"
          className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-10 lg:py-16 xl:px-16"
        >
          <div className="w-full max-w-md">
            <Suspense fallback={<SignInCard returnTo={DEFAULT_RETURN_TO} />}>
              <SignInFromParams searchParams={searchParams} />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}

async function SignInFromParams({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { returnTo } = await searchParams;
  return <SignInCard returnTo={safeReturnTo(returnTo)} />;
}
