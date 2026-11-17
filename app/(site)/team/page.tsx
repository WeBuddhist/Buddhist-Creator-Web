import type { Metadata } from "next";
import { JoinTeam } from "@/components/join-team";
import { PageIntro } from "@/components/page-intro";
import { TeamCard } from "@/components/team/person-card";
import { TEAM, TEAM_PAGE, TEAM_SECTION } from "@/lib/team";
import masterclassWhiteboard from "@/public/photos/masterclass-whiteboard.webp";

export const metadata: Metadata = {
  title: "Team",
  description: TEAM_PAGE.description,
};

const sectionTitle = "font-display text-4xl leading-[1.06] text-foreground sm:text-5xl";
const sectionLede = "mt-4 max-w-[58ch] text-pretty text-lg leading-[1.6] text-muted-foreground";

export default function TeamPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageIntro
        id="team-page-title"
        eyebrow={TEAM_PAGE.eyebrow}
        title={TEAM_PAGE.title}
        description={TEAM_PAGE.description}
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

      <JoinTeam id="join" />
    </main>
  );
}
