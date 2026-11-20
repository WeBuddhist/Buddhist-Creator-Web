import "server-only";
import { countryCode } from "@/lib/countries";
import {
  AUDIENCE_BANDS,
  CARD_SOCIALS,
  audienceBand,
  type CardContent,
  type CardSocial,
} from "@/lib/creator-card";
import {
  audienceSpread,
  cardFollowers,
  cardLinkChecks,
  countryStanding,
  creatorLeaderboard,
  networkAudience,
} from "@/lib/creator-cards";
import { cardPhotoUrl } from "@/lib/creator-leaderboard";
import type { CreatorCard, CreatorCardStatus, FollowerCheckStatus } from "@/lib/db/schema";
import { forLog } from "@/lib/log-error";

/* The creator's own page, as it is handed over to be drawn
   (app/(site)/creator-card): the card, where it stands, each channel's
   own figure and place, how the creators are spread around it, and what
   it adds to the network's audience. It is made for the card's owner from
   their session and goes to nobody else, so it may describe a card that
   is not public yet.

   Only an approved card stands anywhere: a card that is with our team, or
   was sent back, is on no board, so it has its details and its figures
   and no place. */

/** A place on a board, and what the month did to it. */
export type HomeStanding = {
  rank: number;
  outOf: number;
  /** Places gained since last month's reading; null with nothing to compare. */
  climbed: number | null;
  /** On the board for the first time this month. */
  fresh: boolean;
};

/** One of the card's links. A counted one has its figure and, once the
    card is approved, its place on that channel's board. */
export type HomeChannel = {
  place: CardSocial;
  label: string;
  link: string;
  /** What the place calls its audience, "Subscribers"; null where no count is kept. */
  audience: string | null;
  followers: number | null;
  gain: number | null;
  standing: HomeStanding | null;
  /** Where the latest reading of this link stands; null before the first. */
  check: { status: FollowerCheckStatus; checkedAt: string } | null;
};

/** Everybody the network's creators reach, for the mission's meter. */
export type HomeNetwork = { followers: number; creators: number };

export type CardHome = {
  status: CreatorCardStatus;
  /** Written for a rejection; null otherwise. */
  reviewNote: string | null;
  submittedAt: string | null;
  card: CardContent & { countryCode: string | null };
  /** The followers of all counted channels together. */
  followers: number;
  /** Since last month's reading, on all channels; null with nothing to compare. */
  gain: number | null;
  /** On the board of all channels. */
  standing: HomeStanding | null;
  /** Among the creators of the card's own country, when there is more than one. */
  inCountry: { rank: number; outOf: number } | null;
  channels: HomeChannel[];
  /** The band the card's audience is in, and how many creators each band
      holds; null for a card with no place. */
  bands: { own: number; counts: number[]; creators: number } | null;
  network: HomeNetwork | null;
  /** When the counts were last read. */
  readAt: string | null;
  /** Changes whenever the shared picture of the card would: the card was
      edited, or the counts were read again. */
  shareVersion: string;
};

/** The network's audience for the mission's meter, or null when it cannot
    be read: the page stands without it. */
export async function homeNetwork(): Promise<HomeNetwork | null> {
  try {
    const { followers, creators } = await networkAudience();
    return followers > 0 ? { followers, creators } : null;
  } catch (error) {
    console.error("[creator-card] could not read the network's audience", forLog(error));
    return null;
  }
}

export async function cardHome(row: CreatorCard, user: { picture: string | null }): Promise<CardHome> {
  const approved = row.status === "approved";
  const [photoUrl, checks, board, inCountry, spread, network] = await Promise.all([
    cardPhotoUrl({ photoKey: row.photoKey, ownerPicture: user.picture }),
    cardLinkChecks(row),
    // No rows of the boards themselves: only where this card stands on them.
    approved ? creatorLeaderboard({ limit: 0, standingOf: row.id }) : null,
    countryStanding(row),
    approved ? audienceSpread() : null,
    homeNetwork(),
  ]);

  const figures = cardFollowers(row);
  const standings = board?.standings ?? {};
  const overall = standings.all;
  const followers = Number(row.totalFollowers);
  const creators = spread?.reduce((sum, count) => sum + count, 0) ?? 0;

  return {
    status: row.status,
    reviewNote: row.status === "rejected" ? row.reviewNote : null,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    card: {
      photoUrl,
      displayName: row.displayName,
      country: row.country,
      countryCode: countryCode(row.country),
      creatorType: row.creatorType,
      languages: row.languages,
      languagesOther: row.languagesOther,
      contentTypes: row.contentTypes,
      contentTypesOther: row.contentTypesOther,
      tagline: row.tagline,
      socials: row.socials,
      totalFollowers: followers,
    },
    followers,
    gain: overall?.row.gain ?? null,
    standing: overall
      ? { rank: overall.rank, outOf: overall.outOf, climbed: overall.row.climbed, fresh: overall.row.fresh }
      : null,
    // "First of one" says nothing.
    inCountry: inCountry && inCountry.outOf > 1 ? inCountry : null,
    channels: CARD_SOCIALS.flatMap((social): HomeChannel[] => {
      const link = row.socials[social.value]?.trim();
      if (!link) return [];
      const counted = "audience" in social ? social.value : null;
      const standing = counted ? standings[counted] : undefined;
      const check = counted ? checks[counted] : undefined;
      return [
        {
          place: social.value,
          label: social.label,
          link,
          audience: "audience" in social ? social.audience : null,
          followers: counted ? figures[counted] : null,
          gain: standing?.row.gain ?? null,
          standing: standing
            ? {
                rank: standing.rank,
                outOf: standing.outOf,
                climbed: standing.row.climbed,
                fresh: standing.row.fresh,
              }
            : null,
          check: check ? { status: check.status, checkedAt: check.checkedAt.toISOString() } : null,
        },
      ];
    }),
    bands:
      overall && spread && creators > 0
        ? { own: audienceBand(followers), counts: spread, creators }
        : null,
    network,
    readAt: board?.readAt?.toISOString() ?? null,
    shareVersion: `${row.updatedAt.getTime().toString(36)}.${(board?.readAt?.getTime() ?? 0).toString(36)}`,
  };
}

/** How many more followers take an audience into the next band, and where
    that band starts; null in the last one. */
export function nextBand(followers: number) {
  const next = AUDIENCE_BANDS[audienceBand(followers) + 1];
  return next ? { toGo: next.from - followers, from: next.from } : null;
}
