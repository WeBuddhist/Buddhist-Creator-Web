# Follower counts and the leaderboard

Follower counts are kept for YouTube, Instagram, TikTok, Facebook and
Douyin. Nobody types them: each link is read from the platform. They rank
the directory and the leaderboard and feed the mission's progress bar.
They are never part of a card's review.

## Where the counts come from

| Platform | Source | Cost | How often |
| --- | --- | --- | --- |
| YouTube | YouTube Data API v3 (`lib/youtube.ts`) | Free | Every week |
| Instagram, TikTok, Facebook | [SocialCrawl](https://www.socialcrawl.dev) profile endpoints (`lib/socialcrawl.ts`) | 1 credit per account | Every week |
| Douyin | SocialCrawl | 6 credits per account | Every three months: December, March, June, September |

YouTube rounds subscriber counts to three figures (2,970,000; 24,900), so a
large channel moves in steps.

## The daily run

`.github/workflows/follower-refresh.yml` runs every day at 01:17 UTC and
POSTs to `/api/cron/follower-refresh` with `CRON_SECRET` as a bearer
token. The work is in `lib/follower-refresh.ts`.

- **The first run of a week** (Monday, UTC) makes every YouTube, Instagram,
  TikTok and Facebook link due. **The first run of December, March, June
  and September** makes every Douyin link due.
- **Other days** read only links added since and attempts that failed.
- **One call works for about a minute** and replies with how many links are
  left. The workflow calls again, up to ten times, until none are.
- **Only approved cards are read**, since a reading costs a credit. A newly
  approved card's links are read within a day.
- **A link that cannot be read keeps the count it had** and shows at
  `/admin/creator-cards/followers`: an account that is gone, a hidden
  count, a personal Facebook profile.
- **A reading belongs to a link.** Rows store the link in the form links
  are compared in (`socialLinkKey`). A card whose link changes loses that
  platform's count until the card is approved again and the new account is
  read.

The workflow's logs are public, so the endpoint answers with totals only.

### A full reading by hand

"Run workflow" on the Actions tab, with its box ticked, reads every link
again now except Douyin's, and writes over the week's rows. It costs a
SocialCrawl credit for each Instagram, TikTok and Facebook link. See
[Operations](../operations.md#follower-refresh).

## How readings are stored

One row per card, platform and week in `creator_follower_checks`, the week
named by its Monday (UTC): the figure, the outcome (`ok`, `not_found`,
`unreadable`, `error`), and the account's own id and handle. This is the
history week-on-week change is worked out from. The card's `*_followers`
column holds the latest figure, and the database adds them up in
`total_followers`.

Douyin has no row in the weeks it is not read; its figure then is its
latest. The first readings, of November 2026, were kept by month and moved
to the week they were taken in, 16 November (migration `0030`).

## The leaderboard

The leaderboard is the first thing under the home page's opening
photograph and the first thing on `/creators`
(`components/creators/leaderboard-section.tsx`). It has a board for all
platforms together and one per platform, and says when counts were last
read.

- **The first three** stand as collectible podium cards
  (`components/creators/podium/`), drawn in WebGL where the browser can.
  On the all-platforms board they also show each platform's share.
- **The rest are rows.** A page carries each board's first ten
  (`LEADERBOARD_OPENING`). Scrolling the list brings in more from
  `GET /api/creators/leaderboard?place=youtube&offset=10`, up to a hundred
  (`LEADERBOARD_SIZE`).
- **Every figure names its channels.** A row shows the icon of each
  platform its figure was read from, and each icon links to the creator
  there.
- **Your place.** A row is pinned at the foot of every board's list. For a
  creator with an approved card it is their rank; for a card in review, a
  claim waiting, or a card with no figure on that board, it says where
  they are on the way to one; for anyone else it invites them to make a
  card. A card not yet approved shows only to its owner.
- **Change** appears once two weeks of readings exist. Beside a count: the
  figure now less the figure at the end of last week, for the same account
  (`figuresAsOf`), so Douyin moves only in the week it is read. Beside a
  rank: places gained or lost against last week (`ranksBefore`), or "New".
  Up is green, down is red, each with its sign.

## The mission's progress bar

On the home page (`components/mission.tsx`): the same counts added up
(`networkAudience`) against the mission's goal of 200 million by 2030
(`lib/mission.ts`). It counts followers, so someone who follows two
creators is counted twice.

## Setup

On the site: `YOUTUBE_API_KEY` (a Google Cloud key with the YouTube Data
API v3 enabled), `SOCIALCRAWL_API_KEY`, `CRON_SECRET`.

On the GitHub repository, as secrets: `CRON_SECRET` (same value) and
`FOLLOWER_REFRESH_URL` (the full address of `/api/cron/follower-refresh`).

## Where things are

| Piece | Where |
| --- | --- |
| What is due, and the run | `lib/follower-refresh.ts`, `lib/follower-reading.ts` |
| The two services | `lib/youtube.ts`, `lib/socialcrawl.ts` |
| The endpoint the schedule calls | `app/api/cron/follower-refresh/route.ts` |
| The schedule | `.github/workflows/follower-refresh.yml` |
| Ranking and week-on-week change | `creatorLeaderboard` in `lib/creator-cards.ts` |
| Boards with photos, for a page | `lib/creator-leaderboard.ts` |
| Tabs, podium, rows, your place | `components/creators/leaderboard.tsx`, `components/creators/podium/` |
| More rows, for the browser | `app/api/creators/leaderboard/route.ts` |
| Links that gave no count | `app/admin/creator-cards/followers/page.tsx` |
