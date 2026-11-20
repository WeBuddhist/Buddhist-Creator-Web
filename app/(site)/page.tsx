import { Hero } from "@/components/hero";
import { Mission } from "@/components/mission";
import { Gallery } from "@/components/home/gallery";
import { Partners } from "@/components/home/partners";
import { Programs } from "@/components/home/programs";
import { WhatsOn } from "@/components/home/whats-on";
import { Join } from "@/components/home/join";
import { Feedback } from "@/components/home/feedback";
import { ConventionFlyer } from "@/components/convention-flyer";
import { LeaderboardSection } from "@/components/creators/leaderboard-section";
import { AwardsPointer } from "@/components/awards/awards-pointer";

/* The name over the cohort, then the leaderboard of the most followed
   creators, which is what brings most visitors here and so comes first.
   Under it the awards, the next thing a visitor who came for the creators
   can do: nominate one. After it the mission and its numbers, the people in pictures, what we
   run, what is on, who backs it, how to join, the suggestion box, then
   the next convention's flyer, whose ground the footer rises from. */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <LeaderboardSection invite className="pt-20 lg:pt-28" />
      {/* Close under the leaderboard's invitation, as its pair, in the
          same column. */}
      <div className="mx-auto w-full max-w-6xl px-5 pt-6 pb-20 sm:px-6 lg:pt-8 lg:pb-28">
        <AwardsPointer id="home-awards-title" />
      </div>
      <Mission />
      <Gallery />
      <Programs />
      <WhatsOn />
      <Partners />
      <Join />
      <Feedback />
      <ConventionFlyer />
    </main>
  );
}
