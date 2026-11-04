import type { Metadata } from "next";
import { ConventionHero } from "@/components/convention/hero";
import { CommunityDays, Program } from "@/components/convention/program";
import { Masterclass } from "@/components/convention/masterclass";
import { Awards } from "@/components/convention/awards";
import { Collaborators, Voices } from "@/components/convention/voices";

export const metadata: Metadata = {
  title: "Buddhist Creators Convention 2026",
  description:
    "Nine days in Bodh Gaya: 110 creators from 10 countries, a masterclass on marketing the Dharma, and the Buddhist Influencer of the Year awards.",
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
      <Voices />
    </main>
  );
}
