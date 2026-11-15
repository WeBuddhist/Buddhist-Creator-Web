import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { label } from "@/components/convention/section-heading";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import notFoundArt from "@/public/404.png";

export const metadata: Metadata = {
  title: "Page not found",
};

/* Stays at the app root so it catches every unmatched URL, which puts it
   outside the (site) group's layout; it draws that layout's chrome itself. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 pt-12 pb-24 text-center sm:px-6 lg:pt-16 lg:pb-28">
        {/* The art is drawn on white; multiply drops that white into the
            paper so no pale box shows around it. */}
        <div className="w-full max-w-[20rem] md:max-w-[28.75rem]">
          <Image
            src={notFoundArt}
            alt="A monk in saffron robes turning the Dharma wheel"
            priority
            sizes="(min-width: 768px) 460px, 320px"
            className="h-auto w-full object-contain mix-blend-multiply"
          />
        </div>

        <div className="mt-8 max-w-2xl">
          <p className={`${label} text-brand-cyan`}>Page not found</p>
          <h1 className="mt-4 text-balance font-display text-4xl leading-[1.06] text-foreground sm:text-6xl">
            The wheel has turned past this page.
          </h1>
          <p className="mx-auto mt-5 max-w-[52ch] text-pretty text-base leading-[1.6] text-muted-foreground sm:text-lg">
            Like everything that arises, the page you were looking for served
            its purpose and has moved on. The path continues from the beginning.
          </p>
        </div>

        <Button
          size="pill"
          nativeButton={false}
          className="mt-8"
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
