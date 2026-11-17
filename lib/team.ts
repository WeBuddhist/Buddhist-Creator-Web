/* Team page content. The roster and its portraits are real. The page ends
   with the invitation to join the team, which the Get Involved page also
   carries (components/join-team.tsx). */

import type { StaticImageData } from "next/image";
import achal from "@/public/team/achal.webp";
import karmaPhuntsokNamgyal from "@/public/team/karma-phuntsok-namgyal.webp";
import norbuTsering from "@/public/team/norbu-tsering.webp";
import tenzinNoryang from "@/public/team/tenzin-noryang.webp";
import tenzinTsering from "@/public/team/tenzin-tsering.webp";
import yashDixit from "@/public/team/yash-dixit.webp";

export type TeamMember = {
  name: string;
  /** Omitted until confirmed; the card then shows the name alone. */
  role?: string;
  image?: { src: StaticImageData; alt: string };
};

export const TEAM_PAGE = {
  eyebrow: "Team",
  title: "The sangha behind the mission",
  description: "The team behind Buddhist Creators, and how to join it.",
} as const;

export const TEAM_SECTION = {
  id: "team",
  title: "Our team",
  description: "The small group running programs, campaigns and the convention.",
} as const;

const portrait = (src: StaticImageData, name: string) => ({
  src,
  alt: `Portrait of ${name}`,
});

export const TEAM: TeamMember[] = [
  {
    name: "Tenzin Noryang",
    role: "Finance and Admin",
    image: portrait(tenzinNoryang, "Tenzin Noryang"),
  },
  {
    name: "Tenzin Tsering",
    role: "HR, People Strategist",
    image: portrait(tenzinTsering, "Tenzin Tsering"),
  },
  {
    name: "Karma Phuntsok Namgyal",
    role: "Creator Convention Manager",
    image: portrait(karmaPhuntsokNamgyal, "Karma Phuntsok Namgyal"),
  },
  {
    name: "Yash Dixit",
    role: "Community Engagement Manager",
    image: portrait(yashDixit, "Yash Dixit"),
  },
  {
    name: "Achal Wasnik",
    role: "Community Engagement Assistant",
    image: portrait(achal, "Achal"),
  },
  {
    name: "Norbu Tsering",
    role: "Social Media & Communication Associate",
    image: portrait(norbuTsering, "Norbu Tsering"),
  },
];
