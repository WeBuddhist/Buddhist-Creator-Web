import { Hero } from "@/components/hero";
import { Stats } from "@/components/stats";
import { ConventionFlyer } from "@/components/convention-flyer";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Stats />
      <ConventionFlyer />
    </main>
  );
}
