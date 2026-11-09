import type { Metadata, Viewport } from "next";
import { ConventionHero } from "@/components/convention/hero";
import { CommunityDays, Program } from "@/components/convention/program";
import { Masterclass } from "@/components/convention/masterclass";
import { Awards } from "@/components/convention/awards";
import { Documentary } from "@/components/convention/documentary";
import { Collaborators, Voices } from "@/components/convention/voices";

export const metadata: Metadata = {
  title: "Buddhist Creators Convention 2026",
  description:
    "Nine days in Bodh Gaya: 110 creators from 10 countries, a masterclass on marketing the Dharma, and the Buddhist Influencer of the Year awards.",
};

// The page opens on a brand-cyan band, so the browser chrome matches it.
export const viewport: Viewport = {
  themeColor: "#136986",
};

export default function Convention2026Page() {
  return (
    <main className="flex flex-1 flex-col">
      <ConventionHero />
      <Collaborators />
      <Program />
      <CommunityDays />
      <Masterclass />
      <Awards />
      <Documentary />
      <Voices />
    </main>
  );
}
