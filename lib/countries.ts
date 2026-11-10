import { allCountries } from "country-region-data";

/* Countries and their states for the registration form, from the
   country-region-data package (ISO 3166-1 countries, each with its ISO
   3166-2 states, provinces or regions). Both answers are picked from these
   lists, and a state only counts with the country it belongs to: the form
   offers nothing else and the server checks the pair again.

   The package is the source; two small layers sit on top, both keyed by
   ISO country code so a package update cannot orphan them: everyday names
   for the countries it lists formally, and the other names people type. */

const NAMES: Record<string, string> = {
  BN: "Brunei",
  CD: "Democratic Republic of the Congo",
  CG: "Republic of the Congo",
  CI: "Côte d'Ivoire",
  FK: "Falkland Islands",
  FM: "Micronesia",
  GM: "Gambia",
  IR: "Iran",
  KP: "North Korea",
  KR: "South Korea",
  MK: "North Macedonia",
  RU: "Russia",
  SX: "Sint Maarten",
  SY: "Syria",
  TZ: "Tanzania",
  VA: "Vatican City",
  VE: "Venezuela",
  VG: "British Virgin Islands",
  VI: "U.S. Virgin Islands",
};

const ALIASES: Record<string, readonly string[]> = {
  AE: ["uae"],
  CD: ["drc", "dr congo", "congo kinshasa"],
  CG: ["congo brazzaville"],
  CI: ["ivory coast"],
  CV: ["cabo verde"],
  CZ: ["czechia"],
  GB: ["uk", "great britain", "britain", "england", "scotland", "wales", "northern ireland"],
  MM: ["burma"],
  NL: ["holland"],
  SZ: ["swaziland"],
  TL: ["east timor"],
  TR: ["turkiye"],
  US: ["usa", "us", "america"],
};

type Place = { name: string; key: string; aliases: readonly string[] };

/** Lower case, without accents or punctuation: "Côte d'Ivoire" → "cote d ivoire". */
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const byName = new Intl.Collator("en").compare;
const place = (name: string, aliases: readonly string[] = []): Place => ({ name, key: fold(name), aliases });

const COUNTRY_INDEX: Place[] = [];
const STATE_INDEX = new Map<string, Place[]>();
for (const [listed, code, regions] of allCountries) {
  const name = NAMES[code] ?? listed;
  COUNTRY_INDEX.push(place(name, ALIASES[code]));
  STATE_INDEX.set(
    name,
    regions.map(([region]) => place(region)).sort((a, b) => byName(a.name, b.name)),
  );
}
COUNTRY_INDEX.sort((a, b) => byName(a.name, b.name));

export const COUNTRIES: readonly string[] = COUNTRY_INDEX.map(({ name }) => name);

const NO_STATES: readonly string[] = [];
const STATES = new Map<string, readonly string[]>(
  [...STATE_INDEX].map(([country, states]) => [country, states.map(({ name }) => name)]),
);

/** The states of a listed country, A to Z; none for anything else. */
export function statesOf(country: string): readonly string[] {
  return STATES.get(country) ?? NO_STATES;
}

export function isCountry(country: string) {
  return STATES.has(country);
}

export function isStateOf(country: string, state: string) {
  return statesOf(country).includes(state);
}

/* The places a half-typed name could be, best first: names that start
   with it ("ind" → India, Indonesia), then names with a later word or
   another name that starts with it, then names that merely contain it.
   Nothing typed means the whole list. */
function matching(places: readonly Place[], query: string): string[] {
  const q = fold(query);
  if (!q) return places.map(({ name }) => name);
  const ranked: { name: string; rank: number }[] = [];
  for (const { name, key, aliases } of places) {
    const rank = key.startsWith(q)
      ? 0
      : key.includes(` ${q}`) || aliases.some((alias) => alias.startsWith(q))
        ? 1
        : key.includes(q)
          ? 2
          : 3;
    if (rank < 3) ranked.push({ name, rank });
  }
  // The lists are alphabetical and the sort is stable, so each rank stays so.
  return ranked.sort((a, b) => a.rank - b.rank).map(({ name }) => name);
}

export function suggestCountries(query: string): string[] {
  return matching(COUNTRY_INDEX, query);
}

export function suggestStates(country: string, query: string): string[] {
  return matching(STATE_INDEX.get(country) ?? [], query);
}
