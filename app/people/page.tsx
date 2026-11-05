import type { Metadata } from "next";
import { CreatorCard, TeamCard } from "@/components/people/person-card";
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

export default function PeoplePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* The intro band runs up behind the transparent header and pads its
          top by the header's height, so the header sits on the green and
          takes the brand tone. */}
      <section
        aria-labelledby="people-title"
        className="-mt-(--header-height) bg-brand-forest pt-(--header-height)"
        data-header-tone="brand"
      >
        <div className="mx-auto w-full max-w-6xl px-4 pt-12 pb-12 sm:px-6 lg:pt-20 lg:pb-20">
          {/* Brand golden measures 4.2:1 on forest; a 15% lift reaches 4.5:1 or more. */}
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-[color-mix(in_oklch,var(--color-brand-golden),white_15%)]">
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
          <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4 sm:grid-cols-3 lg:mt-8 lg:grid-cols-4 lg:gap-6">
            {CREATORS.map((creator, index) => (
              <CreatorCard key={`${creator.name}-${index}`} creator={creator} />
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
