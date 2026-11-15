import type { Metadata } from "next";
import { TeamCard } from "@/components/people/person-card";
import { CreatorDirectory } from "@/components/people/creator-directory";
import { PageIntro } from "@/components/page-intro";
import {
  CREATORS,
  CREATORS_SECTION,
  PEOPLE_PAGE,
  TEAM,
  TEAM_SECTION,
} from "@/lib/people";
import masterclassWhiteboard from "@/public/photos/masterclass-whiteboard.webp";

export const metadata: Metadata = {
  title: "People",
  description: PEOPLE_PAGE.description,
};

const sectionTitle = "font-display text-4xl leading-[1.06] text-foreground sm:text-5xl";
const sectionLede = "mt-4 max-w-[58ch] text-pretty text-lg leading-[1.6] text-muted-foreground";

export default function PeoplePage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageIntro
        id="people-title"
        eyebrow={PEOPLE_PAGE.eyebrow}
        title={PEOPLE_PAGE.title}
        description={PEOPLE_PAGE.description}
        photo={{
          src: masterclassWhiteboard,
          alt: "A masterclass coach speaking in front of a whiteboard and a board of coloured sticky notes, participants listening around a long table.",
          position: "55% 40%",
        }}
      />

      <section id={TEAM_SECTION.id} aria-labelledby="team-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 pt-20 sm:px-6 lg:pt-28">
          <h2 id="team-title" className={sectionTitle}>
            {TEAM_SECTION.title}
          </h2>
          <p className={sectionLede}>{TEAM_SECTION.description}</p>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:mt-12 lg:gap-x-8 lg:gap-y-12">
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
        <div className="mx-auto w-full max-w-6xl px-5 pt-20 pb-24 sm:px-6 lg:pt-28 lg:pb-32">
          <h2 id="creators-title" className={sectionTitle}>
            {CREATORS_SECTION.title}
          </h2>
          <p className={sectionLede}>{CREATORS_SECTION.description}</p>
          <CreatorDirectory creators={CREATORS} />
        </div>
      </section>
    </main>
  );
}
