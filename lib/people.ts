/* People page content. The team roster and its portraits are real. Creators
   are names and countries copied from the shared creators sheet, sorted by
   name. Copy changes there by hand; nothing syncs. */

import type { StaticImageData } from "next/image";
import achal from "@/public/people/achal.webp";
import jenniferYo from "@/public/people/jennifer-yo.webp";
import karmaPhuntsokNamgyal from "@/public/people/karma-phuntsok-namgyal.webp";
import norbuTsering from "@/public/people/norbu-tsering.webp";
import tenzinDelek from "@/public/people/tenzin-delek.webp";
import tenzinNoryang from "@/public/people/tenzin-noryang.webp";
import tenzinTsering from "@/public/people/tenzin-tsering.webp";
import yashDixit from "@/public/people/yash-dixit.webp";

export type Creator = {
  name: string;
  country: string;
};

export type TeamMember = {
  name: string;
  /** Omitted until confirmed; the card then shows the name alone. */
  role?: string;
  image?: { src: StaticImageData; alt: string };
};

export const PEOPLE_PAGE = {
  eyebrow: "People",
  title: "The Sangha behind the Mission",
  description:
    "The team behind Buddhist Creators, and the creators who share the Dharma on their channels.",
} as const;

export const CREATORS_SECTION = {
  id: "creators",
  title: "Our Creators",
  description: "The creators who share the Dharma on their channels.",
} as const;

export const TEAM_SECTION = {
  id: "team",
  title: "Our Team",
  description: "The small group running programs, campaigns and the convention.",
} as const;

export const CREATORS: Creator[] = [
  { name: "Aachen Tenzin (Thupten)", country: "Nepal" },
  { name: "Abhay Shakya", country: "India" },
  { name: "Achal Wasnik", country: "India" },
  { name: "Achesh Kamble", country: "India" },
  { name: "Ajay Shakya", country: "India" },
  { name: "Akshay Khobragade", country: "India" },
  { name: "Aman Kumar Verma", country: "India" },
  { name: "Arun Sonune", country: "India" },
  { name: "Ayye Shakya Dhammadinna", country: "India" },
  { name: "Basant Khatri", country: "Bhutan" },
  { name: "Bharat Nakwal", country: "India" },
  { name: "Bhikkhu Shripad Sthavir", country: "India" },
  { name: "Bhuchung Kata (Kalsang Tashi)", country: "Canada" },
  { name: "Budhi Singh (Trilok)", country: "India" },
  { name: "Catherine Marcelle Vicens", country: "Belgium" },
  { name: "Chhering Angmo", country: "India" },
  { name: "Chhewang Dorjee", country: "India" },
  { name: "Chimi Tshering", country: "Bhutan" },
  { name: "Chow Saching Luhok", country: "Bangladesh" },
  { name: "Chow Tze Jen", country: "Malaysia" },
  { name: "Choying Tenpa", country: "India" },
  { name: "Deepa Thakur", country: "India" },
  { name: "Diki Lhamu Sherpa", country: "India" },
  { name: "Dorje Kalzang", country: "India" },
  { name: "Dorje Lama", country: "Nepal" },
  { name: "Dorjeepa", country: "India" },
  { name: "Dr.Vidyadhar Gaikwad", country: "India" },
  { name: "Gabriel Kobler", country: "Germany" },
  { name: "Ganesh Palshikar (Guhyaprakash)", country: "India" },
  { name: "Gangkar Metok", country: "India" },
  { name: "Garab Dorjee Sherpa", country: "India" },
  { name: "Gaurav Shakya", country: "India" },
  { name: "Gunturi Agni Mithra", country: "India" },
  { name: "Gyalpo Tashi", country: "India" },
  { name: "Ho Vu Dieu Tuyen", country: "Vietnam" },
  { name: "Jigme Dorjee", country: "India" },
  { name: "Kailash Chandra Bauddha", country: "India" },
  { name: "Karan Shakya", country: "India" },
  { name: "Karma Chimmi Wangmo", country: "Bhutan" },
  { name: "Karma Dolma", country: "India" },
  { name: "Karma Yonten", country: "Bhutan" },
  { name: "Karmavajra Dhammachari", country: "India" },
  { name: "Kelzang Wangdi", country: "Bhutan" },
  { name: "Kesang Butit", country: "India" },
  { name: "Kezang Demy Zangpo", country: "Bhutan" },
  { name: "Kunsang Tenzing", country: "India" },
  { name: "Kunzes Dolma", country: "India" },
  { name: "Laxmikanta Sunil Mane", country: "India" },
  { name: "Mahima Banerjee", country: "India" },
  { name: "Mayur Shirke", country: "India" },
  { name: "Mrigendra Pratap", country: "India" },
  { name: "Nawang Dechen Kc", country: "Nepal" },
  { name: "Ngawang Tenzin", country: "India" },
  { name: "Nishchal Pakhrin (Ani Yangchen Drolma)", country: "Nepal" },
  { name: "Nyima Drakpa", country: "Nepal" },
  { name: "Ogyen Tenzin Tamang", country: "India" },
  { name: "Pallavi Deshmukh", country: "India" },
  { name: "Path Of Liberation (Norbu Tsering)", country: "Nepal" },
  { name: "Pathum Ranasinghe Arachchilage", country: "Sri Lanka" },
  { name: "Paudel Dhruba", country: "Nepal" },
  { name: "Pema Lhaden", country: "Bhutan" },
  { name: "Pema Lhendup", country: "India" },
  { name: "Pema Wangyel", country: "India" },
  { name: "Pema Yantan (Yonten)", country: "India" },
  { name: "Penpa Tsering", country: "India" },
  { name: "Prabin Chakma", country: "India" },
  { name: "Pranav Subhash Dandge", country: "India" },
  { name: "Pratibha Patil", country: "India" },
  { name: "Quinthup Pema Bhutia", country: "Nepal" },
  { name: "Rahul Dongre", country: "India" },
  { name: "Rajat Mourya", country: "India" },
  { name: "Rajender Kumar", country: "India" },
  { name: "Ranjeet Shrawan Thool (Dhammachari Aryaketu)", country: "India" },
  { name: "Rigzin Angmo", country: "India" },
  { name: "Robin Chakma (Brahma Dutta)", country: "India" },
  { name: "Sagar Gautam", country: "India" },
  { name: "Sangitkumar Tireshwar Sakhare", country: "India" },
  { name: "Santosh Sakharam Ambhore", country: "India" },
  { name: "Satyajeet Chakma (Ven. Jinananda Thera)", country: "India" },
  { name: "Sherab Wangmo", country: "India" },
  { name: "Siddharth Negi", country: "India" },
  { name: "Sonam Chhomo", country: "India" },
  { name: "Sonam Dolma", country: "India" },
  { name: "Sonam Gyeltshen", country: "India" },
  { name: "Sonam Lhamu Khochilu", country: "India" },
  { name: "Stanzin Lotos", country: "India" },
  { name: "Stanzin Namtol", country: "India" },
  { name: "Suresh Kumar", country: "India" },
  { name: "Tanmay Tayade", country: "India" },
  { name: "Tanzin Dekit", country: "India" },
  { name: "Tashi Chosgon", country: "India" },
  { name: "Tashi Lhamo A", country: "India" },
  { name: "Tashi Lhamo B", country: "India" },
  { name: "Tashi Takpa", country: "India" },
  { name: "Tejdarshan", country: "India" },
  { name: "Tenpun Lama (Tenzin Phuntsok)", country: "Nepal" },
  { name: "Tenzin Chemi", country: "India" },
  { name: "Tenzin Gejed", country: "India" },
  { name: "Tenzin Lekmay", country: "India" },
  { name: "Tenzin Pema", country: "India" },
  { name: "Tenzin Phuljung", country: "India" },
  { name: "Tenzin Rabga", country: "India" },
  { name: "Tenzing Sherpa", country: "India" },
  { name: "Thile Dorje (Bhai Thile)", country: "Nepal" },
  { name: "Thukten Nima", country: "Bhutan" },
  { name: "Thupten Sherab", country: "India" },
  { name: "Tibet Dr Shakya (Karma Gyedun)", country: "India" },
  { name: "Tsering Wangdi", country: "India" },
  { name: "Tshering Penjor", country: "Bhutan" },
  { name: "Uttam Shetty", country: "India" },
  { name: "Ven Godamune Chullanaga Thero", country: "Sri Lanka" },
  { name: "Ven. Dr. Dipananda Bhikkhu", country: "Bangladesh" },
  { name: "Yash Dixit", country: "India" },
  { name: "Yeshi Dorjee (Khoe) Jinsel", country: "India" },
  { name: "Yufan Liao (Jay Liao)", country: "Taiwan" },
];

const portrait = (src: StaticImageData, name: string) => ({
  src,
  alt: `Portrait of ${name}`,
});

export const TEAM: TeamMember[] = [
  {
    name: "Jennifer Yo",
    role: "Lead",
    image: portrait(jenniferYo, "Jennifer Yo"),
  },
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
  {
    name: "Tenzin Delek",
    role: "Sofware Engineer 2",
    image: portrait(tenzinDelek, "Tenzin Delek"),
  },
];
