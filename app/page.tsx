import { Hero } from "@/components/hero";
import { Stats } from "@/components/stats";
import { Mission } from "@/components/mission";
import { ConventionFlyer } from "@/components/convention-flyer";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Stats />
      <Mission />
      <ConventionFlyer />
    </main>
  );
}
