import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { label } from "@/components/convention/section-heading";
import { SignInCard } from "@/components/login/sign-in-card";
import { DEFAULT_RETURN_TO, safeReturnTo } from "@/lib/auth0";
import { SITE_NAME } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import heroImage from "@/public/hero.png";
import logoMark from "@/public/logo-mark.png";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${SITE_NAME} with your Google or Apple account.`,
  robots: { index: false },
};

/* Our own sign-in page, in place of Auth0's hosted one. A sheet of brand
   cyan with the introduction in the serif and the Buddha line art on the left,
   and the card on the right; on a phone the sheet is dropped and the card
   stands alone.

   The card needs ?returnTo, which is request data, so it streams in
   behind a boundary whose fallback is the same card pointed at the
   default destination: nothing moves when the real one arrives. The
   proxy has already sent anyone who is signed in to their returnTo. */
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section
          aria-label={`About ${SITE_NAME}`}
          className="m-3 hidden overflow-hidden rounded-[2rem] bg-brand-cyan text-white lg:flex lg:flex-col lg:justify-between"
        >
          <div className="relative px-10 pt-10 xl:px-14 xl:pt-12">
            {/* The header's brand link, in paper on the sheet: the lion mark
                is black line art, so every opaque pixel is inverted. */}
            <Link
              href="/"
              aria-label={`${SITE_NAME} home`}
              className="group -ml-1 inline-flex select-none items-center gap-2 rounded-full py-1 pr-3 pl-1 transition-transform duration-[160ms] ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Image src={logoMark} alt="" width={80} height={80} preload className="size-10 brightness-0 invert" />
              <span className="font-display text-[1.375rem] leading-none">{SITE_NAME}</span>
            </Link>
            <p className={cn(label, "mt-14 text-gold-soft xl:mt-20")}>A global sangha of creators</p>
            <p className="mt-5 max-w-lg text-balance font-display text-4xl leading-[1.1] xl:text-5xl">
              A worldwide community of monastics, practitioners and storytellers carrying the Dharma further
              than ever before.
            </p>
          </div>
          {/* The line art is cream on transparency, left as drawn on the
              sheet. It fills the room under the text and no more, sized by
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
