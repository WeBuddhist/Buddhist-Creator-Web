import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/navigation";
import heroImage from "@/public/hero.png";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="bg-background">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">
            A Global Sangha of Creators
          </p>

          <h1
            id="hero-title"
            className="mt-4 text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-6xl lg:text-7xl"
          >
            {SITE_NAME}
          </h1>

          <p className="mt-6 max-w-lg text-pretty text-lg leading-[1.6] text-muted-foreground">
            A worldwide community of monastics, practitioners, and storytellers
            using digital media to carry the Dharma further than ever before.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="pill"
              nativeButton={false}
              className="border-transparent bg-clip-border bg-linear-to-b from-[color-mix(in_oklch,var(--color-brand-cyan),white_14%)] to-brand-cyan text-white shadow-[0_0_1px_1px_--alpha(var(--color-white)/8%)_inset,0_1.5px_2px_0_--alpha(var(--color-black)/12%),0_0_0_1px_color-mix(in_oklch,var(--color-brand-cyan),black_10%)] transition-[filter,translate] hover:brightness-[1.06]"
              render={<Link href="/get-involved" />}
            >
              Get Involved
              <ArrowUpRightIcon data-icon="inline-end" weight="bold" />
            </Button>
            <Button
              variant="outline"
              size="pill"
              nativeButton={false}
              render={<Link href="/people" />}
            >
              Meet our creators
            </Button>
          </div>
        </div>

        {/* The PNG is cream line art on transparency; brightness-0 turns the
            strokes to ink so it matches the lion mark. No blur placeholder:
            the filter applies to it too, and thin strokes average out to a
            grey box. */}
        <Image
          src={heroImage}
          alt="Single-line drawing of the Buddha's face, eyes lowered in meditation"
          preload
          sizes="(min-width: 1024px) 40vw, 20rem"
          className="mx-auto h-auto w-full max-w-xs brightness-0 lg:max-w-none"
        />
      </div>
    </section>
  );
}
