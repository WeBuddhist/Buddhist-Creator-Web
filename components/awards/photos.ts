import type { StaticImageData } from "next/image";
import type { AwardSlug } from "@/lib/awards-2027";
import awardQuinthupPemaBhutia from "@/public/convention/2026/award-quinthup-pema-bhutia.webp";
import awardTashiChosgon from "@/public/convention/2026/award-tashi-chosgon.webp";
import awardTenzinChime from "@/public/convention/2026/award-tenzin-chime.webp";
import mahabodhiGathering from "@/public/photos/mahabodhi-gathering.webp";
import artCollageBuddha from "@/public/awards/art-collage-buddha.webp";
import musicSingingBowl from "@/public/awards/music-singing-bowl.webp";
import poemMilarepa from "@/public/awards/poem-milarepa.webp";
import workshopCamera from "@/public/photos/workshop-camera.webp";

/* The photograph behind each award's card (lib/awards-2027.ts). An award
   the convention gave in 2026 shows that year's winner receiving it; a new
   one shows the kind of work it is for (Best Music: hands playing a singing
   bowl engraved with Om Mani Padme Hum; Best Painting: a seated Buddha made of a collage of stickers;
   Best Poem: a painting of Milarepa, the yogi remembered for his songs;
   all three pictures the team chose; Best Photography: pilgrims at
   prayer before the Mahabodhi Temple, the homepage's photograph).
   `position` keeps the subject in frame when the photo is cut to the
   card's portrait. */
export type AwardPhoto = { src: StaticImageData; alt: string; position: string };

export const AWARD_PHOTOS: Record<AwardSlug, AwardPhoto> = {
  "influencer-of-the-year": {
    src: awardQuinthupPemaBhutia,
    alt: "Venerable Quinthup Pema Bhutia receiving the Buddhist Influencer of the Year award on stage in 2026.",
    position: "40% 50%",
  },
  "audience-choice": {
    src: awardTashiChosgon,
    alt: "Tashi Chosgon raising the Audience Choice award between the two hosts in 2026.",
    position: "50% 50%",
  },
  "most-creative-video": {
    src: awardTenzinChime,
    alt: "Tenzin Chime holding the Most Creative Video award with a presenter in 2026.",
    position: "46% 50%",
  },
  "most-viral-content": {
    src: workshopCamera,
    alt: "A young monk and a lay creator laughing over a tablet at a workshop table, a camera on a tripod between them.",
    position: "42% 50%",
  },
  "best-music": {
    src: musicSingingBowl,
    alt: "Hands playing a Tibetan singing bowl engraved with the mantra Om Mani Padme Hum, the wooden striker held against its rim.",
    position: "50% 60%",
  },
  "best-painting": {
    src: artCollageBuddha,
    alt: "A seated Buddha built from a dense collage of colourful stickers, a pale halo behind him, against a pencil-drawn backdrop of speech bubbles and city scenes.",
    position: "50% 35%",
  },
  "best-poem": {
    src: poemMilarepa,
    alt: "A Tibetan painting of Milarepa in white cotton robes, seated on an antelope skin, among green hills, trees and scenes from his life.",
    position: "50% 40%",
  },
  "best-photography": {
    src: mahabodhiGathering,
    alt: "Pilgrims, monks and creators seated before the Mahabodhi Temple in Bodh Gaya, many with hands joined in prayer and malas in hand.",
    position: "58% 50%",
  },
};
