import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buddhist Creators Convention 2025",
  description:
    "Talks, awards and masterclasses from the 2025 Buddhist Creators Convention.",
};

export default function Convention2025Page() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <p className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">
          Convention
        </p>
        <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-foreground sm:text-5xl">
          Buddhist Creators Convention 2025
        </h1>
        <p className="mt-6 max-w-xl text-pretty text-lg leading-[1.6] text-muted-foreground">
          Placeholder page. Details of the 2025 gathering, its speakers, award
          winners and masterclasses will live here.
        </p>
      </section>
    </main>
  );
}
