import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import notFoundArt from "@/public/404.png";

export const metadata: Metadata = {
  title: "Page not found",
};

/* The primary button, in the homepage hero's recipe. */
const primaryButton =
  "border-0 forced-colors:border bg-linear-to-b from-[color-mix(in_oklch,var(--color-brand-cyan),white_14%)] to-brand-cyan text-white shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--color-brand-cyan),white_30%),0_1.5px_2px_0_--alpha(var(--color-black)/12%),0_0_0_1px_color-mix(in_oklch,var(--color-brand-cyan),black_10%)] transition-[filter,translate] hover:brightness-[1.06]";

/* Stays at the app root so it catches every unmatched URL, which puts it
   outside the (site) group's layout; it draws that layout's chrome itself. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:py-20">
        <div className="w-full max-w-[20rem] md:max-w-[28.75rem]">
          <Image
            src={notFoundArt}
            alt="A monk in saffron robes turning the Dharma wheel"
            priority
            sizes="(min-width: 768px) 460px, 320px"
            className="h-auto w-full object-contain"
          />
        </div>

        <div className="mt-8 max-w-2xl">
          <h1 className="mt-3 text-balance text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-4xl">
            The wheel has turned past this page.
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-pretty text-base leading-[1.6] text-muted-foreground sm:text-lg">
            Like everything that arises, the page you were looking for served
            its purpose and has moved on. The path continues from the beginning.
          </p>
        </div>

        <Button
          size="pill"
          nativeButton={false}
          className={`mt-8 ${primaryButton}`}
          render={<Link href="/" />}
        >
          <ArrowLeftIcon data-icon="inline-start" weight="bold" />
          Return home
        </Button>
      </main>
      <SiteFooter />
    </>
  );
}
