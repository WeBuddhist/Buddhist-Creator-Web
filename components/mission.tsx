export function Mission() {
  return (
    <section
      aria-labelledby="mission-title"
      className="bg-linear-to-b from-brand-light-cyan/15 via-brand-cyan/6 to-background"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:py-28">
        <p className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">
          Our mission
        </p>
        <h2
          id="mission-title"
          className="mt-4 text-balance text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-4xl lg:text-5xl"
        >
          Let’s spread Buddhist wisdom and compassion to{" "}
          <span className="text-brand-cyan">100 million people by 2030</span>
        </h2>
        <p className="mt-6 max-w-xl text-pretty text-lg leading-[1.6] text-muted-foreground">
          Every gathering, award, and masterclass we run is one step toward
          that goal — helping creators turn practice into content the world can
          find.
        </p>
      </div>
    </section>
  );
}
