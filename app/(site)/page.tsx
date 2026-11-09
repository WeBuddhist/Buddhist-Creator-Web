import { Hero } from "@/components/hero";
import { Stats } from "@/components/stats";
import { Mission } from "@/components/mission";
import { Partners } from "@/components/home/partners";
import { Programs } from "@/components/home/programs";
import { WhatsOn } from "@/components/home/whats-on";
import { Join } from "@/components/home/join";
import { Feedback } from "@/components/home/feedback";
import { ConventionFlyer } from "@/components/convention-flyer";

/* Who we are, the proof, the mission, who backs it, what we run, what is
   on, how to join, the suggestion box, then the next convention. The flyer
   follows a brand band as it always has, so its spacing stays as designed. */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Stats />
      <Mission />
      <Partners />
      <Programs />
      <WhatsOn />
      <Join />
      <Feedback />
      <ConventionFlyer />
    </main>
  );
}
