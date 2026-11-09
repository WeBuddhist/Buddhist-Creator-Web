import type { Metadata, Viewport } from "next";
import { TeamCard } from "@/components/people/person-card";
import { WaveCorner } from "@/components/mission";
import {
  CREATORS,
  CREATORS_SECTION,
  PEOPLE_PAGE,
  TEAM,
  TEAM_SECTION,
} from "@/lib/people";

export const metadata: Metadata = {
  title: "People",
  description: PEOPLE_PAGE.description,
};

// The page opens on a brand-cyan band, so the browser chrome matches it.
export const viewport: Viewport = {
  themeColor: "#136986",
};

export default function PeoplePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* The intro band runs up behind the transparent header and pads its
          top by the header's height, so the header sits on the cyan and
          takes the brand tone. */}
      <section
        aria-labelledby="people-title"
        className="relative isolate -mt-(--header-height) overflow-hidden bg-brand-cyan pt-(--header-height)"
        data-header-tone="brand"
      >
        <WaveCorner className="-top-16 -right-16 -scale-x-100" />

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-12 pb-12 sm:px-6 lg:pt-20 lg:pb-20">
          {/* White at 80% measures 4.6:1 on brand cyan; brand golden only 3:1. */}
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-white/80">
            {PEOPLE_PAGE.eyebrow}
          </p>
          <h1
            id="people-title"
            className="mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl"
          >
            {PEOPLE_PAGE.title}
          </h1>
          <p className="mt-5 max-w-[58ch] text-pretty text-lg leading-[1.6] text-white/80">
            {PEOPLE_PAGE.description}
          </p>
        </div>
      </section>

      <section id={TEAM_SECTION.id} aria-labelledby="team-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 pt-14 sm:px-6 lg:pt-20">
          <h2
            id="team-title"
            className="text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground sm:text-3xl"
          >
            {TEAM_SECTION.title}
          </h2>
          <p className="mt-2 max-w-[58ch] text-pretty text-base leading-[1.6] text-muted-foreground">
            {TEAM_SECTION.description}
          </p>
          <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4 sm:grid-cols-3 lg:mt-8 lg:grid-cols-4 lg:gap-6">
            {TEAM.map((member, index) => (
              <TeamCard key={`${member.name}-${index}`} member={member} />
            ))}
          </ul>
        </div>
      </section>

      <section
        id={CREATORS_SECTION.id}
        aria-labelledby="creators-title"
        className="bg-background"
      >
        <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-16 sm:px-6 lg:pt-20 lg:pb-24">
          <h2
            id="creators-title"
            className="text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground sm:text-3xl"
          >
            {CREATORS_SECTION.title}
          </h2>
          <p className="mt-2 max-w-[58ch] text-pretty text-base leading-[1.6] text-muted-foreground">
            {CREATORS_SECTION.description}
          </p>
          {/* A long directory, so plain text rather than cards: name over country,
              grouped by space, on the same columns as the team above. */}
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:mt-8 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-8">
            {CREATORS.map(({ name, country }) => (
              <li key={name} className="min-w-0">
                <p className="text-pretty text-sm font-medium leading-[1.4] text-foreground sm:text-base sm:leading-[1.3]">
                  {name}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{country}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
