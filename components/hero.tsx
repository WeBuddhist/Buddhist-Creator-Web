import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/navigation";

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
              size="lg"
              nativeButton={false}
              className="h-11 rounded-full bg-linear-to-br from-brand-light-cyan via-brand-cyan via-55% to-brand-cyan ps-5 pe-4 text-sm text-white shadow-[inset_0_1px_0_0_--alpha(var(--color-white)/20%)] transition-[filter,translate] hover:brightness-110"
              render={<Link href="/get-involved" />}
            >
              Get Involved
              <ArrowUpRightIcon data-icon="inline-end" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              className="h-11 rounded-full px-5 text-sm"
              render={<Link href="/creators" />}
            >
              Meet our creators
            </Button>
          </div>
        </div>

        {/* The PNG is cream line art on transparency; brightness-0 turns the
            strokes to ink so it matches the lion mark. */}
        <Image
          src="/hero.png"
          alt="Single-line drawing of the Buddha's face, eyes lowered in meditation"
          width={2000}
          height={2366}
          preload
          sizes="(min-width: 1024px) 40vw, 20rem"
          className="mx-auto h-auto w-full max-w-xs brightness-0 lg:max-w-none dark:invert"
        />
      </div>
    </section>
  );
}
