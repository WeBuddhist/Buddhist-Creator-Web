/* Content for the Buddhist Creators Convention 2026 page. Sourced from the
   BCC 2026 report and the previous buddhistcreators.com convention page. */

import collaboratorShechen from "@/public/collaborator/collaborator-shechen.png";
import collaboratorKhyentseFoundation from "@/public/collaborator/collaborator-khyentse-foundation.png";
import collaboratorIndrajala from "@/public/collaborator/collaborator-indrajala.png";
import collaboratorPartner from "@/public/collaborator/collaborator-partner.png";
import awardQuinthupPemaBhutia from "@/public/convention/2026/award-quinthup-pema-bhutia.webp";
import awardChhewangDorjee from "@/public/convention/2026/award-chhewang-dorjee.webp";
import awardTashiChosgon from "@/public/convention/2026/award-tashi-chosgon.webp";
import awardTenzinChime from "@/public/convention/2026/award-tenzin-chime.webp";
import awardSonamDolma from "@/public/convention/2026/award-sonam-dolma.webp";

export const CONVENTION = {
  year: 2026,
  title: "Buddhist Creators Convention 2026",
  shortTitle: "BCC 2026",
  location: "Bodh Gaya, India",
  dates: "29 January – 6 February 2026",
  reportHref: "/convention/2026/bcc-2026-report.pdf",
  documentary: {
    youtubeId: "vOStd3Dolg0",
    href: "https://www.youtube.com/watch?v=vOStd3Dolg0",
    title: "The Buddhist Creators Convention 2026 · The Documentary",
    runtime: "20 min",
  },
} as const;

export const HERO_STATS = [
  { value: "110", label: "Creators" },
  { value: "10", label: "Countries" },
] as const;

export const PROGRAM = {
  eyebrow: "The Program",
  title: "Nine Days, Three Phases",
  description:
    "In January 2026, over a hundred Buddhist creators from more than a dozen countries gathered in Bodh Gaya — the first global sangha of its kind.",
} as const;

export const COMMUNITY_DAYS = {
  opening: {
    title: "The Opening Ceremony",
    body: "The stage came alive with a traditional scarf presentation offering, followed by the lighting of butter lamps in front of the Buddha statue. Mrs. Deepa Thakur led the assembly in chanting the Heart Sutra in Pali, grounding the gathering in the spiritual essence of the retreat.",
  },
  keynotes: [
    {
      name: "Shri Abhijit Halder",
      role: "Director General, International Buddhist Confederation",
      videoHref: null,
      body: "Spoke on the intersection of social media and social responsibility, urging creators to adopt mindfulness as their core operating principle and to use their borderless platforms for the benefit of global society.",
    },
    {
      name: "Dzongsar Jamyang Khyentse Rinpoche",
      role: "Video message",
      videoHref: "https://www.instagram.com/reel/DULZBoBjMRM/",
      body: "Reflected on the paradox of influence — we resist being influenced while wanting to influence others — and expressed hope that creators use their influence with good intentions and meaningful content.",
    },
    {
      name: "Shechen Rabjam Rinpoche",
      role: "Video message",
      videoHref: "https://www.instagram.com/reel/DUHvhy5Av0c/",
      body: "Underscored the importance of Buddhist content creation in an era of rapid change, and encouraged attendees to make teachings accessible while preserving their authentic message.",
    },
    {
      name: "Kyabje Trulshik Yangsi Rinpoche",
      role: "Video message",
      videoHref: "https://www.instagram.com/reel/DUWZiepjsx5/",
      body: "In his first-ever address of this kind, Rinpoche shared that if even one viewer is inspired to cause a little less harm and do a little more good, the work is worthwhile — and asked participants to hold a pure motivation.",
    },
  ],
  panel: {
    title: "Future of Buddhism in the Digital Age",
    moderator: "Rahul Dongre",
    videoHref: "https://www.instagram.com/reel/DULJFfGARPx/",
    panelists: ["Aachen Tenzin Thupten", "Ayye Shakya Dhammadinna", "Quinthup Pema Bhutia"],
    body: "The panel examined authenticity, accessibility, and the digital divide — how creators maintain the integrity of Buddhist teachings while adapting them for digital formats and diverse, less-connected audiences.",
  },
  lightningTalks: {
    title: "Lightning Talks",
    subtitle: "27 creators, four rooms",
    rooms: ["Lumbini", "Bodh Gaya", "Sarnath", "Kushinagar"],
    body: "27 presenters rotated across four concurrent rooms named for sites in the Buddha’s life — each allotted 15 minutes (7 for their talk, 5 for Q&A, 2 to transition) so attendees could move freely between spaces based on their interests.",
  },
  why: {
    title: "The Why Behind the What",
    speaker: "Ngawang Trinley",
    role: "Founder, OpenPecha Trust",
    body: "A session on why the convention exists, opening with a video message from Yongey Mingyur Rinpoche on conveying timeless Buddhist wisdom to the modern world, followed by a presentation on the path to reaching 100 million people by 2030.",
  },
  circles: {
    title: "Community Circles",
    subtitle: "Seven themes",
    themes: [
      {
        title: "Digital Bodhisattva",
        question: "How can we use platforms designed for ‘ego-promotion’ and ‘distraction’ to cultivate genuine selflessness and presence for our followers?",
      },
      {
        title: "World’s Needs",
        question: "How do we bridge the gap between the truth people need to hear and the content they want to click on, without compromising the Dharma?",
      },
      {
        title: "Storytelling",
        question: "The Dharma is timeless, but attention spans are shrinking — how do we turn a profound teaching into a story a distracted teenager would find unforgettable?",
      },
      {
        title: "AI as Assistant",
        question: "If AI can generate a perfect Dharma talk, what is the unique human or spiritual element only a practitioner can provide?",
      },
      {
        title: "Virality & Consistency",
        question: "How do we maintain a consistent daily posting rhythm without burning out or losing our meditative peace?",
      },
      {
        title: "Sustainability",
        question: "How can we redefine financial support as a form of Dana that sustains the wheel of Dharma, rather than contradicting non-attachment?",
      },
      {
        title: "On-Camera Presence",
        question: "How can we transform the camera into a window of compassion rather than a mirror of the ego?",
      },
    ],
  },
} as const;

export const MASTERCLASS = {
  eyebrow: "Phase 2 · 31 January – 5 February",
  title: "Masterclass: Marketing the Dharma",
  description:
    "Six intensive days with two senior marketers who are also long-time practitioners, taking creators from platform fundamentals to a sustainable practice.",
  coaches: [
    {
      name: "Mr. Milan Amin",
      title: "Senior Brand Strategist",
      bio: "With over 15 years in marketing and a decade in C-level leadership, Milan has led global brand and strategy for multi-billion-dollar companies, spearheading landmark Web3 partnerships with Cristiano Ronaldo, Lionel Messi, Formula 1, The GRAMMYs, and the Cannes Film Festival. A Buddhist practitioner for eight years, he has trained under Theravāda masters in Thailand and studied with Vajrayāna and Dzogchen teachers from Tibet and Nepal.",
    },
    {
      name: "Dr. Jaimin Shukla",
      title: "Global Chief Marketing Officer",
      bio: "Dr. Jaimin Shukla is a Global Chief Marketing Officer with 14 years of experience driving business growth through multi-channel marketing and technology. A Shell-sponsored PhD from University College London, he is the founder of The School of Insights and author of Transform Every Moment. A Buddhist practitioner for eight years, he has studied with teachers across Thailand, Japan, and Tibet.",
    },
  ],
  modules: [
    {
      title: "Digital Marketing Foundations",
      body: "How digital platforms and algorithms function, content strategy aligned with Dharma principles, audience personas, and analytics that matter for spiritual teachers.",
    },
    {
      title: "Content Creation Excellence",
      body: "Storytelling for the digital age, video production basics, podcast and audio quality, engaging captions, and visual design for social media.",
    },
    {
      title: "Platform-Specific Strategies",
      body: "YouTube SEO and playlists, Instagram engagement, Facebook community building, podcast distribution, blog SEO, and evaluating emerging platforms like TikTok and Threads.",
    },
    {
      title: "Ethical Marketing of Dharma",
      body: "Growing an audience without compromising authenticity, avoiding commercialisation pitfalls, respecting lineage and tradition, and cultural sensitivity across global audiences.",
    },
    {
      title: "Community Engagement",
      body: "Building online sanghas that support genuine practice, handling questions and criticism with grace, interactive experiences, and converting followers into committed practitioners.",
    },
    {
      title: "Sustainable Creator Practice",
      body: "Time management and content planning, avoiding burnout, ethical approaches to monetisation and Dana, partnerships, and long-term strategy as a Dharma teacher.",
    },
  ],
  format: [
    "A balanced mix of theory and hands-on practice",
    "Daily one-hour doubt-clearing sessions at the end of each day",
    "Interactive engagement through Mentimeter and open-mic Q&A",
    "Daily workbooks shared via Sherab.org in English, Hindi, Nepali, and Tibetan",
    "Community sharing and networking each evening",
  ],
  specialSession: {
    title: "Special Session with Chokyong Palga Rinpoche",
    body: "On the final day of the masterclass, Rinpoche shared his life story and delivered accessible, relevant teachings, followed by an interactive question-and-answer segment.",
  },
  effectiveness: [
    { value: 82, label: "Rated it very effective" },
    { value: 12, label: "Rated it somewhat effective" },
  ],
} as const;

export const AWARDS = {
  eyebrow: "Phase 3 · 6 February",
  title: "Award Ceremony & Closing",
  description:
    "The final day gathered the week into one evening: a recap, five awards, certificates, a prayer meet at the Mahabodhi Temple, and a gala dinner.",
  presentedBy: "Mr. Milan Amin & Dr. Jaimin Shukla",
  date: "6 February 2026",
  venue: "Shechen Monastery, Bodh Gaya",
  witness: "Chokyong Palga Rinpoche",
  featured: {
    category: "Buddhist Influencer of the Year 2026",
    honorific: "Venerable",
    name: "Quinthup Pema Bhutia",
    affiliation: "Namdroling Monastery",
    photo: awardQuinthupPemaBhutia,
    citation:
      "A creator whose content is dedicated entirely to the teachings of the Buddha, reaching over a million people across social media.",
    story:
      "After an extensive and challenging deliberation, the committee and coaches presented the ceremony’s most prestigious award to a creator who has built a following of over 1.2 million across social media. His posts have collectively garnered over 100 million engagements.",
    stats: [
      { value: "1.2M+", label: "Followers" },
      { value: "100M+", label: "Engagements" },
      { value: "8", label: "Nominees shortlisted" },
    ],
  },
  winners: [
    {
      category: "Rising Star",
      name: "Chhewang Dorjee",
      affiliation: "Dehradun",
      photo: awardChhewangDorjee,
      citation: "For his video Why Everybody Should Create Content.",
    },
    {
      category: "Audience Choice",
      name: "Tashi Chosgon",
      affiliation: "Ladakh",
      photo: awardTashiChosgon,
      citation: "Voted the community’s favourite, with 33% of all participant votes.",
    },
    {
      category: "Most Creative Video",
      name: "Tenzin Chime",
      affiliation: "Arunachal Pradesh",
      photo: awardTenzinChime,
      citation: "For a collaborative reel built on the message ‘Smile wherever possible, it is always possible.’",
    },
    {
      category: "Most Followers Gained",
      name: "Sonam Dolma",
      affiliation: "Spiti",
      photo: awardSonamDolma,
      citation: "For growing her following by over 16% in just eight days.",
    },
  ],
  closing: [
    {
      title: "Masterclass Recap",
      body: "A holistic review of the six-day masterclass, giving participants a chance to see how each session linked together and to raise any lingering questions before the closing ceremony.",
    },
    {
      title: "Certificate Distribution",
      body: "All participants received Masterclass Certificates from the coaches, and members of the organising team were honoured with Certificates of Acknowledgement.",
    },
    {
      title: "Closing Ceremony & Prayer Meet",
      body: "Dignitaries from Shechen Monastery, the Mahabodhi Society, and a Tibetan Member of Parliament joined the closing ceremony, followed by a prayer ceremony at the Mahabodhi Temple led by Palga Rinpoche and a group photo for the record.",
    },
    {
      title: "The Gala Dinner",
      body: "An evening of singing, dance, and poetry from participants, with performances from Ladakh Phuntsok and a Tara performance by Deepa Ji — a bittersweet, joyous close to the convention.",
    },
  ],
} as const;

export const TESTIMONIALS = [
  {
    quote: "I came for the skills, I stayed for the sangha. This place melted my doubt.",
    name: "Thinle Dorjee",
    location: "Nepal",
  },
  {
    quote: "The Convention connected me with creators worldwide. Together we learned to share the Dharma better.",
    name: "Rahul Dongre",
    location: "India",
  },
  {
    quote: "This community taught me that sharing the Dharma online is real, meaningful, and deeply needed.",
    name: "Noah",
    location: "Germany",
  },
] as const;

export const COLLABORATORS = [
  { name: "Shechen Monastery", logo: collaboratorShechen, href: null },
  { name: "Khyentse Foundation", logo: collaboratorKhyentseFoundation, href: null },
  { name: "Indrajala", logo: collaboratorIndrajala, href: null },
  { name: "Sherab", logo: collaboratorPartner, href: "https://www.sherab.org" },
  { name: "Dharmaduta Services", logo: null, href: "https://dharmaduta.in/" },
] as const;
