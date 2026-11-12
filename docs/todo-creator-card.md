# Todo: creator cards and the ranking

**Status:** Proposed
**Date:** 2026-11-12
**Deciders:** TenzDelek (engineering), the project lead (product, platform approvals)
**Sources:** the lead's home page mock (pages A, B, C and Map), `docs/research/creator-ranking-data-sources.md`
**Companion:** `docs/todo-marketplace.md`

The home page should answer three questions for a creator: who are the top Buddhist creators, where do I stand among them, and what can I do to grow. This doc covers the first two. The third is the marketplace doc.

This is a design and a build list. It does not follow the mock one to one; section 12 lists where it differs and why.

## 1. Requirements

**Functional**
- A public card per creator: name, country, creator type, languages, what they make, one line about their work, channels with follower counts, total followers, rank, country rank, band.
- A leaderboard: top three as a podium, then rows, with a full top 100 page and a by-country view.
- Find your card: search by name or handle, results show the rank.
- Claim a card that the team seeded. Submit a card if none exists. Both need sign-in.
- Prove a channel is yours with a code in its bio or description.
- Edit your own card. Mark yourself available for work (used by the marketplace).
- Admins create, edit, review, publish and hide cards, and enter counts by hand.
- Follower counts refresh weekly where a platform gives an official source.
- A remove-me route for anyone listed who does not want to be.

**Non-functional**
- Nothing we store or show breaks a platform's API terms. This is enforced by the data model, not by discipline.
- The home page stays as fast as it is now: prerendered, with ranking data cached.
- No two people can claim one card.
- All of it runs on the current single 512 MB Render service and its Postgres.
- A dead scheduler makes the ranking stale, then unranked. It never makes it wrong.

**Constraints**
- Next.js 16.4.5 with `cacheComponents`; read `node_modules/next/dist/docs/` before writing code (`AGENTS.md`). The facts this design relies on are in the research note, section 10.
- One Node service on Render, Postgres through Drizzle. No cron, queue, worker or test framework today. No server-side `fetch` exists yet.
- Image optimisation is off because of memory (`next.config.ts`).
- The repo is public. No account ids, tokens or keys in docs or code.
- YouTube: counts kept 30 days at most, no derived metrics, attribution required. TikTok, Facebook Pages and personal Instagram have no official count source for us. See the research note.

**Assumptions**
- 1,000 creators in the first year, designed to hold 10,000.
- A handful of admins review cards and claims.
- English only.

**Decisions taken on 2026-11-12**

| Question | Decision |
|---|---|
| Identity | Browsing, search and seeing a rank need no account. Claiming or editing needs the existing Google or Apple sign-in, plus channel proof |
| Count data | Official sources only. YouTube and Instagram professional accounts are automatic. Other counts are entered by the creator, labelled, and checked by an admin |
| Growth features | "Fastest growing" and "places gained" are not built until YouTube grants derived-metrics approval |
| Seeding | Unclaimed cards only for creators with a public Buddhist channel. Convention applicants are invited by email, never published from their application |

## 2. High-level design

```
 Visitor browser                 Next.js server (Render, one process)             Outside
┌───────────────────────┐   ┌──────────────────────────────────────────────┐
│ Home, /creators        │──▶│ Prerendered shell                            │
│  leaderboard, podium   │   │  cached sections, tag "ranking"  ────────┐   │
│  find your card ───────│──▶│ GET /api/creators/search (trigram)       │   │
│  "your card" strip     │──▶│ dynamic island, reads session            │   │
└───────────────────────┘   │                                           ▼   │
┌───────────────────────┐   │ lib/creators.ts   lib/ranking.ts   lib/claims.ts │
│ Signed-in creator      │──▶│ /account/card  server actions + zod       │   │   ┌──────────────┐
│  submit, claim, edit   │   │                                           ▼   │   │ YouTube Data │
└───────────────────────┘   │                Postgres ◀── rank statement    │◀─▶│ API (key)    │
┌───────────────────────┐   │                   ▲                           │   ├──────────────┤
│ Admin                  │──▶│ /admin/creators, /admin/claims            │   │◀─▶│ Instagram    │
└───────────────────────┘   │                   │                           │   │ Business     │
                             │ POST /api/cron/tick ── lib/refresh/* ─────┘   │   │ Discovery    │
 Scheduler (hourly) ────────▶│  purge, refresh a batch, rank, revalidateTag  │   └──────────────┘
                             └──────────────────────────────────────────────┘
```

Three ideas carry the design:

1. **Counts live in one place and are overwritten.** `creator_channels.follower_count` with `count_fetched_at`. No history table exists, so there is nothing to grow stale past 30 days.
2. **Rank is a column, written by one statement.** No snapshot table, no materialised view. The statement only counts fresh numbers.
3. **Refresh runs inside the web process.** The same process that holds the cache is the one that invalidates it.

## 3. Data model

Follows `lib/db/schema.ts`: uuid primary keys with `defaultRandom()`, the `timestamps` spread (`lib/db/schema.ts:44`), `pgEnum` for states, `text[]` of validated slugs for option lists, index names `<table>_<cols>_idx`, `check()` constraints.

**Enums**

| Enum | Values |
|---|---|
| `creator_status` | `draft`, `pending`, `published`, `rejected`, `hidden` |
| `creator_source` | `seeded`, `submitted`, `application` |
| `channel_platform` | `youtube`, `instagram`, `facebook`, `tiktok`, `other` (same slugs as `PLATFORMS`, `lib/registration-2027.ts:80`) |
| `count_source` | `api`, `authorized`, `manual`, `self_reported` |
| `claim_state` | `pending`, `approved`, `rejected`, `expired` |

**`creators`** (the card)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text, unique | From the display name, made unique with a suffix. Public URL |
| `display_name` | text, not null | |
| `country` | text | A name validated by `isCountry` (`lib/countries.ts`), as applications do |
| `creator_type` | text | `monastic`, `lay`, `teacher`, `organisation` |
| `languages` | text[] | Slugs from `AUDIENCE_LANGUAGES` (`lib/registration-2027.ts:64`) |
| `content_topics` | text[] | Slugs from `CONTENT_TOPICS` (`lib/registration-2027.ts:12`) |
| `bio` | text | Check: 120 characters at most |
| `status` | `creator_status` | Default `draft` |
| `source` | `creator_source` | |
| `seed_ref` | text | Partial unique where not null. Makes the seed script safe to re-run |
| `application_id` | uuid FK, set null | Provenance only, set when a creator starts a card from their own application |
| `claimed_by` | uuid FK users, set null | Partial unique where not null: one card per user |
| `claimed_at` | timestamptz | Null together with `claimed_by` (check) |
| `available_for_work` | boolean | Default false. Editable by the claimer only |
| `reviewed_by`, `reviewed_at`, `review_note`, `published_at` | | Same shape as the decision columns on `applications` |
| `search_text` | text | Written by the app: lower-cased name and handles with diacritics stripped. GIN trigram index |
| `total_followers` | integer | Written by the rank statement |
| `rank`, `country_rank` | integer | Null when unranked |
| `ranked_at` | timestamptz | Null together with `rank` (check) |
| timestamps | | |

Indexes: `creators_slug_idx` (unique), `creators_claimed_by_idx` (partial unique), `creators_status_rank_idx (status, rank)`, `creators_country_rank_idx (country, country_rank)`, `creators_search_text_idx` (GIN, `gin_trgm_ops`).

The band is not stored. It is a pure function of `total_followers` in `lib/ranking.ts`.

**`creator_channels`** (one row per channel; also the refresh queue)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `creator_id` | uuid FK, cascade | |
| `platform` | `channel_platform` | |
| `handle` | text, not null | Normalised, without `@` |
| `url` | text, not null | Built from platform and handle; free for `other` |
| `external_id` | text | YouTube channel id, Instagram user id. Resolved once |
| `follower_count` | integer | Check: zero or more |
| `count_source` | `count_source` | |
| `count_fetched_at` | timestamptz | Null together with `follower_count` (check) |
| `verified_at`, `verification_method` | | `bio_code`, `admin`, later `oauth` |
| `next_refresh_at` | timestamptz | Null for platforms we cannot refresh |
| `refresh_attempts` | integer | Default 0 |
| `last_error_code` | text | `not_found`, `hidden`, `quota`, `timeout` |
| timestamps | | |

Indexes: unique `(platform, lower(handle))`, partial unique `(platform, external_id)` where not null, `creator_channels_due_idx (platform, next_refresh_at)`.

The unique index is what stops one channel appearing on two cards. A submission that hits it is sent to the claim flow for the card that already holds the channel.

**`creator_claims`**

| Column | Notes |
|---|---|
| `id`, `creator_id` (cascade), `user_id` (cascade) | |
| `state` | `claim_state`, default `pending` |
| `channel_id` | The channel the code goes on |
| `code` | Random, shown once to that user, for example `BC-7K2M-9QXD` |
| `code_expires_at` | Seven days |
| `method` | `bio_code` or `admin` |
| `decided_by`, `decided_at`, `created_at` | |

Partial unique on `(creator_id, user_id)` where `state = 'pending'`. It is deliberately not unique on `creator_id` alone: a squatter must not be able to block the real owner from starting a claim.

**`creator_requests`** (remove-me and corrections from people who are not signed in)

`id`, `creator_id`, `kind` (`removal`, `correction`), `email`, `note`, `state` (`open`, `done`), `resolved_by`, timestamps. Same length checks as `suggestions` (`lib/db/schema.ts:197`).

**Not built:** a count history table, a rank history table, a separate job-queue table, avatars. See section 12.

## 4. Ranking

**What ranks.** Published cards, summed over channels whose count is `api`, `authorized` or `manual`, and for `api` counts only when fetched in the last 30 days. `self_reported` counts are shown on the card with a label and do not rank until an admin confirms them, which turns them into `manual`.

**Ties.** YouTube rounds to three significant figures, so exact totals would order creators by noise. The statement ranks on the total rounded to three significant figures and uses `rank()`, so ties share a place. Rows inside a tie are shown by name.

**The statement** (sketch; lives in `lib/ranking.ts`, runs in one transaction)

```sql
with totals as (
  select c.id, c.country, sum(ch.follower_count)::int as total
  from creators c
  join creator_channels ch on ch.creator_id = c.id
  where c.status = 'published'
    and ch.follower_count is not null
    and (ch.count_source in ('manual', 'authorized')
         or (ch.count_source = 'api' and ch.count_fetched_at > now() - interval '30 days'))
  group by c.id, c.country
), ranked as (
  select id, total,
         rank() over (order by sig3(total) desc)                      as rank,
         rank() over (partition by country order by sig3(total) desc) as country_rank
  from totals
)
update creators c
set total_followers = r.total, rank = r.rank, country_rank = r.country_rank, ranked_at = now()
from ranked r
where c.id = r.id;
-- same transaction: null rank, country_rank, total_followers and ranked_at for every creator not in `ranked`
```

`sig3(n)` is `round(n, 2 - floor(log(n))::int)` for `n > 0`. At 10,000 rows this is milliseconds.

**Bands** (from the mock)

| Band | Total followers |
|---|---|
| Seed | under 1,000 |
| Sprout | 1,000 to 9,999 |
| Grove | 10,000 to 49,999 |
| Banyan | 50,000 to 249,999 |
| Bodhi | 250,000 and above |

**When it runs.** At the end of every refresh tick, and after any admin action that changes a count, a status or a channel.

## 5. Compliance by construction

| Rule | How the system cannot break it |
|---|---|
| YouTube counts kept 30 days at most | Counts are overwritten in place. Each tick first nulls `api` counts older than 25 days. There is no history table |
| Show current data | Weekly refresh per channel. Cards show "as of" from `count_fetched_at` |
| No derived metrics | No growth, no rank change, no rank history. `ranked_at` follows the same 30-day reading, because a stored rank is itself computed from API data |
| Cached copies | Ranking sections use `cacheLife('hours')` (expires after one day). Never `'max'`, whose one-year expiry would outlive the limit |
| Attribution | Each YouTube count is labelled as YouTube subscribers with the logo per the branding guidelines |
| No scraping | `lib/refresh/` has one adapter per platform with an official source. No adapter, no automatic count |
| Bio text | Read for the code check and discarded. Never stored |

Two points are judgement, not settled rule, and are open questions in section 13: whether a cross-platform total and a community total count as derived metrics, and whether a podium reads as "stoking creator rivalries".

## 6. Flows

**Find your card.** The visitor types a name or handle. `GET /api/creators/search?q=` returns up to eight published cards with rank, total and claim state. Each result links to the card page. "This is me" on a result goes to the claim flow. "Not on the list" goes to submit.

**Remember on this device.** A checkbox stores the card slug in `localStorage` and nothing else. On the next visit the home page shows that card's public summary. It grants no rights; it is the same data anyone can see. Signed-in users get their card from `claimed_by` instead.

**Claim a seeded card** (`/account/claim/[slug]`, signed in)
1. The server creates a `creator_claims` row with a code and asks which channel the creator will put it on.
2. The creator adds the code to that channel's description or bio and presses "Check now".
3. For YouTube and Instagram professional accounts, a server action reads the description through the API and looks for the code. For other platforms the claim waits for an admin, who opens the profile and looks.
4. On success, one statement takes the card:
   `update creators set claimed_by = $user, claimed_at = now() where id = $card and claimed_by is null returning id`
   No row back means someone else got there first. This is the same pattern as the email claim in `lib/notifications.ts:211`: a conditional write backed by a unique index.
5. The channel gets `verified_at`. The creator can remove the code.

**Submit a new card** (`/account/card/new`, signed in)
1. Form fields as in the mock: display name, country, creator type, languages, what you make, one line, channels. Zod schemas beside the option lists, following `lib/registration-2027.ts`.
2. For YouTube and Instagram handles the form shows the count it found. Other platforms take a typed count, stored as `self_reported`.
3. Saving creates the card as `pending` with `claimed_by` set to the submitter. Channels are unverified until the bio code check passes.
4. An admin reviews. Publishing triggers the rank statement.

**Start from my application.** A signed-in convention applicant can press "start my card from my application" on `/account/card/new`. It prefills from their own row and records `application_id`. Nothing is ever copied from `applications` without that click.

**Edit.** The claimer edits profile fields freely. Adding or changing a channel sends the card back through review for that channel only.

**Remove me.** Every unclaimed card shows "Not you, or want this removed?". It opens a short form that writes a `creator_requests` row. An admin hides the card. A claimer can hide their own card directly.

**Admin.** `/admin/creators` is the applications list pattern (`lib/applications.ts:230`, `lib/applications-view.ts`, `components/admin/*`): status tabs with counts, sort, pagination. The detail page edits everything, sets counts as `manual`, publishes, rejects and hides. `/admin/claims` lists pending claims that need a human look.

## 7. Read path and caching

**Home page** (`app/(site)/page.tsx`). New order, mapped to the mock's six sections:

| # | Section | Component | Data |
|---|---|---|---|
| 1 | Hero with find your card | `components/home/find-your-card.tsx` (client) inside the hero | Search route |
| 2 | The top Buddhist creators | `components/home/leaderboard.tsx` | Cached top 10 and by-country rows |
| 3 | Awards | Existing `AWARDS` from `lib/convention-2026.ts` | Static |
| 4 | Grow your reach | See the marketplace doc | Static events, cached jobs |
| 5 | Who we are | Existing `Partners` | Static |
| 6 | Closing band | Existing `ConventionFlyer` | Static |

`components/stats.tsx` has the creator count hard-coded ("110+", line 21). It moves to a cached count of published cards.

**Caching rules**
- Data reads are functions in `lib/creators.ts` marked `'use cache'`, with `cacheTag('ranking')` and `cacheLife('hours')`.
- Each cached section sits behind `await io()` and `<Suspense>`, so the ranking is a runtime-cached hole and `next build` does not need the database. Today no build touches Postgres; keep it that way.
- The leaderboard tabs on the home page are a client toggle over data already rendered (followers, by country). No request per tab.
- `/creators` takes `?country=` and `?page=`. `searchParams` is awaited inside `<Suspense>`, then validated with `isCountry` and clamped before it reaches a cached function. Every distinct argument is a cache entry, so unvalidated input would fill the 50 MB cache.
- `/creators/[slug]` awaits `params` inside `<Suspense>`. No `generateStaticParams`: under Cache Components it must return at least one param, and we have none at build.
- The "your card" strip is a dynamic island in `<Suspense>`, like `UserMenu` (`components/user-menu.tsx:36`). It reads the session, or the remembered slug on the client.
- Invalidation: `updateTag('ranking')` in admin and creator server actions, `revalidateTag('ranking', 'max')` in the tick route. `updateTag` throws in a Route Handler; the one-argument `revalidateTag` is deprecated.

**Search.** A Route Handler, not a Server Action: actions are dispatched one at a time and are meant for mutations. Minimum two characters, limit eight, `ILIKE` on `search_text` with the trigram index. The input is normalised the same way `search_text` is written. Add a small in-memory rate limit per client address; the site has none today and runs as one process, so memory is enough.

## 8. Refresh

**Trigger.** `POST /api/cron/tick` with a bearer secret compared in constant time. Called hourly by a scheduler outside the app. Start with a GitHub Actions schedule; if its timing proves unreliable, a Render Cron Job that only makes the HTTP call costs about a dollar a month. A Render cron script that does the work itself was rejected in section 11.

**One tick**
1. `pg_try_advisory_lock`. If another tick holds it, return.
2. Purge: null `api` counts older than 25 days.
3. Claim due channels (`next_refresh_at <= now()`) with `for update skip locked`, a batch per platform.
4. Call the adapters. No transaction is held across an HTTP call.
5. Write counts, set `next_refresh_at` to seven days on with jitter, or back off on failure.
6. Run the rank statement.
7. `revalidateTag('ranking', 'max')`.
8. Return a summary. The work happens in the request, not in `after()`, so the scheduler sees a failure.

**Limits per tick**

| Platform | Batch | Why |
|---|---|---|
| YouTube | Up to 4 calls of 50 ids | One unit per call; quota is not a concern |
| Instagram | Up to 100 calls, one account each, 8 s timeout | 200 calls an hour per token |

Time budget about 25 seconds. A batch is a few kilobytes of JSON, so memory is not a concern.

**Adapters.** `lib/refresh/index.ts` defines one interface, `fetchChannel(ref) → { externalId, followers, bio }`. `youtube.ts` and `instagram.ts` implement it. Facebook and TikTok have no adapter until a creator-login path is approved.

**Failures.** Not found or hidden count: mark the channel, stop retrying, show "count unavailable". Quota or auth error: stop that platform for this tick. Timeout: back off through `next_refresh_at`. `/admin/refresh` shows the last tick, the number due, and channels in error.

**Load**

| | 1,000 creators | 10,000 creators |
|---|---|---|
| YouTube refresh per week | 20 calls | 200 calls |
| YouTube handle to id, once | 1,000 units | 10,000 units, spread over two days |
| Instagram refresh per week | 1,000 calls, about 6 an hour | 10,000 calls, about 60 an hour |

The hourly drip exists for Instagram: a single weekly run of 10,000 accounts would take about 50 hours at the rate limit.

**New environment variables** (names only): `YOUTUBE_API_KEY`, `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID`, `CRON_SECRET`. Adding one on Render redeploys the service (`docs/setup/domain-and-email-setup.md`).

## 9. Routes and files

**Routes**

| Route | Access |
|---|---|
| `/` , `/creators`, `/creators/[slug]`, `GET /api/creators/search` | Public |
| `/account/card`, `/account/card/new`, `/account/claim/[slug]` | Signed in |
| `/admin/creators`, `/admin/creators/[id]`, `/admin/claims`, `/admin/refresh` | Admin |
| `POST /api/cron/tick` | Secret |

**Existing files that change**

| File | Change |
|---|---|
| `lib/db/schema.ts` | New enums and tables. A hand-written migration enables `pg_trgm` |
| `proxy.ts:15` | Add `/account` to `REQUIRES_SESSION` |
| `lib/navigation.ts:15` | "Top creators" in `NAV_ITEMS`; `/people` keeps the team |
| `app/sitemap.ts:7` | Add `/creators` |
| `app/(site)/page.tsx` | New section order |
| `components/stats.tsx` | Creator count from the database |
| `lib/people.ts`, `app/(site)/people/page.tsx` | The `CREATORS` array becomes seed input, then is removed. The page lists published cards |
| `components/admin/admin-shell.tsx` | Sidebar entries |
| `components/admin/status-badge.tsx` | Card and claim states |
| `components/user-menu.tsx` | "My card" link |
| `README.md` | New routes, env names, the seed step |

**New files**

`lib/creators.ts`, `lib/creators-view.ts`, `lib/creator-form.ts` (zod and options), `lib/ranking.ts`, `lib/claims.ts`, `lib/refresh/{index,youtube,instagram}.ts`, `components/home/{find-your-card,leaderboard,your-card}.tsx`, `components/creators/creator-card.tsx`, `scripts/seed-creators.mjs`.

**Reuse**
- Auth: `getCurrentUser`, `requireUser`, `requireRole`, `assertRole` (`lib/auth.ts`).
- Forms: server action, zod `safeParse`, typed state, `useActionState`, `sonner`, as in `app/(site)/convention/2027/register/actions.ts`.
- Country combobox: `PlaceField`, now inlined in `registration-form.tsx`; extract it.
- Admin list, pagination, status pills, panel: `components/admin/*`.
- Tabs: `components/ui/tabs.tsx`. Card chrome: `components/convention/section-heading.tsx`.
- Email: `sendEmail` in `lib/ses.ts`. Not `lib/notifications.ts`, which is tied to applications by its foreign key and checks.

## 10. Scale, reliability and testing

- **Size.** 10,000 cards and about 25,000 channels. Every query here is indexed and small.
- **Memory.** No image work, no large fetches. The share image in phase 4 is the one risk and is designed separately.
- **Scheduler down.** Counts age. After 25 days YouTube counts are nulled by the next tick that does run; with no ticks at all, the rank statement and card reads still ignore `api` counts past 30 days.
- **Process restart.** The in-memory cache is lost and refills on the next request. `cacheLife('hours')` bounds how long a stale copy can live.
- **Testing.** No test framework exists. Plain Node with a resolve hook against a throwaway Postgres is enough for `lib/` code. Two things deserve real tests: the rank statement (ties, the 30-day cut, unranked cards) and the claim compare-and-set under two concurrent callers.
- **Local runs.** Run the seed script and the refresh against a local database first, never straight against production.

## 11. Architecture decisions

### A. Who may claim and edit a card

| Option | Complexity | Fit |
|---|---|---|
| A1. Existing sign-in plus channel proof (chosen) | Low: reuses Auth0 and `users` | One identity for cards, jobs and the convention form |
| A2. No account: bio code or emailed link, rights in a browser token | Medium | Matches the mock. Losing the device means re-verifying; the marketplace would need a second identity |
| A3. Both | High | Two paths to secure and explain |

Sign-in alone proves an email, not a channel, so the bio code stays. The mock's "no login" promise is kept for the part that matters to a first-time visitor: seeing where they stand.

### B. Where counts come from

| Option | Cost | Risk |
|---|---|---|
| B1. Official APIs where they exist, labelled creator-entered counts elsewhere (chosen) | Two adapters, one review queue | Low |
| B2. Everything in the mock now, with history and growth | More build, unofficial sources for TikTok | The YouTube key can be revoked; scraping breaks three sets of terms |
| B3. Self-reported only | Smallest | Numbers go stale and the ranking is easy to dispute |

### C. How rank is stored

| Option | Notes |
|---|---|
| C1. Columns on `creators`, one update statement (chosen) | Atomic, no swap, nothing extra to purge |
| C2. A weekly snapshot table | Keeps history, which is exactly what we may not keep |
| C3. A materialised view | Blocks readers on refresh unless concurrent; no gain at this size |
| C4. Compute on read with a window function | Simple, but every list and search pays for it, and a card's rank needs the whole set |

### D. How refresh is scheduled

| Option | Notes |
|---|---|
| D1. In-process route called hourly by an outside scheduler (chosen) | Reuses `lib/*`. The process that owns the cache invalidates it |
| D2. Render Cron Job running a Node script | Cannot import `lib/*`: `server-only` throws under plain Node and the code is TypeScript with path aliases. It would duplicate SQL, as `scripts/migrate.mjs` does, and still could not clear the web process's cache |
| D3. Queue and worker (pg-boss, SQS) | A second process for a few hundred calls a week |
| D4. Admin presses a button | No infrastructure. Good for phase 1, not for a promise of weekly numbers |

### E. How cards start

| Option | Notes |
|---|---|
| E1. Seed creators with a public Buddhist channel; invite the rest (chosen) | Shows only what is already public, with claim and removal on every card |
| E2. Seed everyone from the convention list as incomplete | Fastest to 1,000 cards. Publishes people who did not opt in and breaks the form's promise (`lib/registration-2027.ts:158`) |
| E3. Opt-in only | Cleanest on consent, slowest to fill |

**Consequences**
- Easier: one identity, a ranking that cannot drift out of policy, no new infrastructure.
- Harder: TikTok-first and Facebook-first creators depend on admin-checked counts, so review load grows with them.
- Not available: "fastest growing", "places gained", "up N since your last visit".
- Revisit when: YouTube grants derived-metrics approval (add a history table and the growth tab); a Meta business is verified (Facebook adapter); TikTok Login Kit is approved; review load passes what a few admins can do in 48 hours.

## 12. Where this differs from the mock

| Mock | Here | Why |
|---|---|---|
| "No password, no login" claim | Sign-in to claim, none to look | Decision A |
| "Fastest growing" tab, "+7.2K this month", "up 19 places" | Not in v1 | YouTube derived-metrics rule |
| Counts for all four platforms "fetched automatically" | Two automatic, the rest typed and checked | No official source |
| Team adds everyone from the 2026 convention list | Public-channel creators only | Decision E |
| Estimated rank while typing the form | Shown after counts are found, as "about #N" | A live estimate from typed numbers invites gaming |
| Map tab | Phase 4 | Needs a map library and geodata; no memory headroom to guess at |
| Referral count on the share card | Not planned | Out of scope for the three questions |

## 13. Todo

**Phase 1: cards and a ranking from admin-entered counts**
1. [ ] Add enums and tables to `lib/db/schema.ts`; generate the migration; hand-add `create extension if not exists pg_trgm` and the GIN index.
2. [ ] `lib/creator-form.ts`: option lists and zod schemas, reusing `AUDIENCE_LANGUAGES`, `CONTENT_TOPICS`, `PLATFORMS`.
3. [ ] `lib/creators.ts`: admin reads and writes, cached public reads with `cacheTag('ranking')`.
4. [ ] `lib/ranking.ts`: the rank statement, `sig3`, `bandFor`.
5. [ ] `/admin/creators` list and detail, sidebar entry, status badge states.
6. [ ] `scripts/seed-creators.mjs` from the `CREATORS` array (name, country, `seed_ref`), run once on local then production.
7. [ ] Admins add public channel handles and manual counts for seeded cards.
8. [ ] `/creators` and `/creators/[slug]`; the card component; remove-me form and `creator_requests`.
9. [ ] `GET /api/creators/search` with the rate limit.
10. [ ] Home page: find your card, leaderboard, creator count in `Stats`; new section order. Run `next build` with no database reachable to confirm the `io()` plus `'use cache'` sections stay out of the static shell.
11. [ ] `/people` reads published cards; remove `CREATORS` from `lib/people.ts`; nav and sitemap.
12. [ ] Tests for the rank statement.

**Phase 2: submit and claim**
13. [ ] `proxy.ts`: `/account` requires a session.
14. [ ] `/account/card/new` and `/account/card` with server actions; "start from my application".
15. [ ] `lib/claims.ts`: create claim, compare-and-set, expiry; `/account/claim/[slug]`.
16. [ ] `/admin/claims`; review of pending cards and self-reported counts.
17. [ ] Emails for card published, card rejected, claim approved, through `lib/ses.ts`, with a small send record.
18. [ ] "My card" in the user menu; the "your card" strip; remember on this device.
19. [ ] Test the claim under two concurrent callers.

**Phase 3: automatic refresh**
20. [ ] Create the YouTube API key; add env names to `.env.example`.
21. [ ] `lib/refresh/index.ts` and `youtube.ts`; handle to id resolution.
22. [ ] `POST /api/cron/tick`: lock, purge, batch, rank, `revalidateTag('ranking', 'max')`.
23. [ ] Scheduler workflow; `/admin/refresh`.
24. [ ] Bio code check for YouTube. YouTube attribution on counts.
25. [ ] Set up the organisation's Instagram Business account and Page; confirm Business Discovery works without App Review; `instagram.ts`; bio code check for Instagram.

**Phase 4: later**
26. [ ] Share image for a card. Decide between a build-light `ImageResponse` and a client-drawn canvas after measuring memory.
27. [ ] Country pages and the map view.
28. [ ] After YouTube approval: history table, growth tab, places gained.

## 14. Risks and open questions

**For the lead**
- **Ranking framing.** YouTube accepts channels "sorted by subscribers" and rejects "stoking creator rivalries". The design leads with the band and the creator's own position and keeps per-platform counts visible. Is that the tone wanted, given the aim of boosting creators?
- **Totals.** A cross-platform total per creator, and the community total toward 100 million, both sum YouTube data. Either may count as a derived metric or as aggregation across owners. Until YouTube answers, keep the community figure as the hand-set number it is today (`components/stats.tsx:7`).
- **Derived-metrics approval.** Who applies, and when? It gates the growth features.
- **Meta.** Who owns the Instagram Business account and Facebook Page used for Business Discovery? Is there a legal entity that can pass Business Verification later?
- **Legal.** A view on listing people as Buddhist creators without their sign-up, and on Meta Platform Terms 3.a.v for unclaimed cards.
- **Review time.** The mock promises 48 hours. Who reviews, and what happens at 49?

**Engineering**
- No rate limiting exists anywhere on the site; search and submit are the first endpoints that need it.
- Self-reported counts can be inflated; claims can be fraudulent for platforms an admin checks by eye.
- The Instagram token expires and needs a renewal step and an alert.
- Whether the Render build can reach the database is unknown; the design avoids needing it.
- The developer-handoff spec linked from the mock could not be opened. Reconcile this doc against it when it is shared.

## 15. What to revisit as this grows

- A second Render instance: the in-memory cache and rate limit stop being enough; move to a shared cache handler.
- More than a few thousand Instagram accounts: a second token or a longer refresh interval.
- OAuth linking for YouTube (authorised data, longer storage) once Google app verification is worth the work.
- A queue and worker if ticks start missing their budget.
