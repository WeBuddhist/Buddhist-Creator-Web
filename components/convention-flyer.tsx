import Image from "next/image";

export function ConventionFlyer() {
  return (
    <section
      aria-labelledby="convention-title"
      className="overflow-hidden bg-background"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-24 text-center sm:px-6 sm:pt-28 lg:pt-36">
        <Image
          src="/logo.jpg"
          alt=""
          width={112}
          height={112}
          className="size-20 mix-blend-multiply sm:size-24"
        />

        <p className="mt-6 text-lg text-foreground sm:text-xl lg:text-2xl">
          <time dateTime="2027-02-18">
            18<sup className="text-[0.6em]">th</sup>
          </time>
          {" – "}
          <time dateTime="2027-02-21">
            21<sup className="text-[0.6em]">st</sup> Feb
          </time>
          <span
            aria-hidden
            className="mx-3 inline-block h-[1.1em] w-px translate-y-[0.2em] bg-foreground/40"
          />
          <span>Nagaloka, Nagpur, India</span>
        </p>

        <h2
          id="convention-title"
          className="mt-3 text-balance text-4xl font-extrabold uppercase leading-[1.1] tracking-[0.02em] text-brand-cyan sm:text-5xl lg:text-6xl"
        >
          Buddhist Creators Convention 2027
        </h2>
      </div>

      {/* Full-bleed illustration, bottom-aligned so the ground meets the footer.
          Flattened from nagaloka-footer.svg: the crayon filters in the SVG are
          too expensive for browsers to re-render on scroll. */}
      <div className="mt-6 flex justify-center sm:mt-8 lg:mt-10">
        <Image
          src="/nagaloka-footer.webp"
          alt="Crayon illustration of the Walking Buddha at Nagaloka, Nagpur"
          width={3000}
          height={1025}
          sizes="100vw"
          className="h-auto w-full min-w-[48rem] max-w-none"
        />
      </div>
    </section>
  );
}
