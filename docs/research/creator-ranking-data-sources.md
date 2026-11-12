# Research: data sources and platform rules for creator cards, ranking and the jobs board

**Date:** 2026-11-12
**Feeds:** `docs/todo-creator-card.md`, `docs/todo-marketplace.md`

**How to read this.** Every claim carries the primary source it came from. "Unconfirmed" means it could not be checked against a primary page. "Inference" means it is our reasoning, not a quoted rule. The pages were read by a research agent on the date above; platform policies change, so re-read the linked page before acting on any single line. One access gap: `developers.tiktok.com` would not load directly, so the TikTok points come from search-engine extracts of the linked official pages.

## 1. Summary

| Platform | Follower count without the creator logging in | Ownership proof without login | Review burden | Path we take |
|---|---|---|---|---|
| YouTube | Yes, API key, `channels.list` statistics. Rounded to 3 significant figures | Yes, code in the channel description, readable with the API key | None for an API key | Automatic, weekly. Bio code for claims |
| Instagram, professional account | Yes, Business Discovery from one Business account we own, linked to a Facebook Page | Yes, `biography` is a public field | Possibly none (own-business use). Unconfirmed, test in the App Dashboard | Automatic once the org account exists. Bio code for claims |
| Instagram, personal account | No | No | n/a | Creator-entered count, labelled, admin-checked |
| Facebook Page | Only with Page Public Content Access | Only with the same feature | High: App Review and Business Verification | Creator-entered count for now |
| TikTok | No. Needs the creator's own login | No. Bio needs the creator's token | Medium: Login Kit scope approval and a sandbox demo | Creator-entered count for now. Login Kit later |

Three findings change the product, not only the build:

1. **YouTube limits what we may keep and compute.** Counts fetched without the owner's authorisation may be stored 30 days at most, and "new or derived data or metrics" are not allowed without an audited approval. Growth, "places gained" and any history fall under this.
2. **YouTube's own guide draws a line through ranking.** "Top viewed videos/channels sorted by views, likes/dislikes, subscribers" is listed as acceptable. "Gamify channel performance by ranking or tracking views between different channels, or generally stoking creator rivalries" is listed as not acceptable.
3. **No official source exists for TikTok, Facebook or personal Instagram counts** unless the creator signs in on that platform or we pass a heavy review. Scraping is banned by all three.

## 2. YouTube Data API v3

**Looking up a channel** (https://developers.google.com/youtube/v3/docs/channels/list)
- `channels.list` costs 1 quota unit per call.
- `forHandle` takes one handle per call, with or without `@`. `id` takes a comma-separated list of channel ids. `forUsername` covers old `/user/` URLs. Only one filter per request.
- The maximum number of ids per call is not stated on the page; the usual figure of 50 is unconfirmed.
- Old `/c/customname` URLs have no lookup parameter (inference). Resolve them by hand.

**Quota** (https://developers.google.com/youtube/v3/getting-started, https://developers.google.com/youtube/v3/determine_quota_cost)
- Default 10,000 units per day. `search.list` has its own bucket since 2026-06-01 (https://developers.google.com/youtube/v3/revision_history).
- At 50 ids per call, a refresh of 10,000 channels is about 200 units. Resolving a handle to an id is 1 unit, once.

**API key only.** "Use an API key for requests that only retrieve public data" (https://developers.google.com/youtube/v3/guides/authentication).

**Fields** (https://developers.google.com/youtube/v3/docs/channels)
- `statistics.subscriberCount` is "rounded down to three significant figures".
- `statistics.hiddenSubscriberCount` says whether the count is public. What `subscriberCount` holds when it is hidden is unconfirmed; treat the count as absent.
- `snippet.description` is readable, up to 1,000 characters. This is what a bio code check reads.

**Developer Policies** (https://developers.google.com/youtube/terms/developer-policies)

| Section | Rule | Effect on us |
|---|---|---|
| III.E.4.b, d | Statistics fetched without the owner's authorisation may not be stored more than 30 days; refresh or delete | Counts are overwritten in place. No history table |
| III.E.4.e, f | Stored data must match YouTube; show the most recent data | Weekly refresh, show "as of" date |
| III.E.4.h | No "new or derived data or metrics" from API data | No growth, no rank change. Cross-platform totals are a grey area |
| III.E.2 | Aggregate only across channels of the same content owner | The community total summed across creators is a grey area |
| III.F | Attribute YouTube as the source, per branding guidelines | Label and logo on the count |
| III.E.6 | No scraping | API only |

**Ranking guidance** (https://developers.google.com/youtube/terms/developer-policies-guide): the two quoted examples in section 1.

**Derived-metrics approval** (https://developers.google.com/youtube/terms/derived-metrics-policy, effective 2026-06-01): audited developers with an analytics use case may store statistics up to 36 months and build leaderboards and growth metrics. They must not infer protected attributes, religion included, and must not frame comparisons as a "war" or "battle". This is the gate for "fastest growing".

## 3. Instagram

**Business Discovery** (https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/business_discovery)
- Read-only lookup of another Business or Creator account by username. Uses a Facebook User access token from Instagram API with Facebook Login.
- Permissions: `instagram_basic`, `instagram_manage_insights`, `pages_read_engagement`.
- We must own an Instagram Business or Creator account linked to a Facebook Page (https://developers.facebook.com/docs/instagram-platform/overview).
- Public fields: `followers_count`, `media_count`, `biography`, `username`, `website` (https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user).
- Personal accounts and age-gated accounts are not returned.

**App review** (https://developers.facebook.com/docs/instagram-platform/app-review): for "My app is only for a business I own or manage", review is "Not required". Whether Business Discovery through our own account stays inside that is an inference; unconfirmed.

**Rate limit** (https://developers.facebook.com/docs/graph-api/overview/rate-limiting): 200 calls per hour per user. One user gives about 4,800 calls a day.

**Basic Display API** was shut down on 2024-12-04 (https://developers.facebook.com/blog/post/2024/09/04/update-on-instagram-basic-display-api/). There is no consumer-account API.

**Terms**
- Automated collection needs Meta's permission (https://www.facebook.com/terms.php section 3.2.3, https://www.facebook.com/legal/automated_data_collection_terms).
- Platform Terms 3.a.v ban processing Platform Data "without valid User consent in order to build or augment user profiles" (https://developers.facebook.com/terms/). An unclaimed card that shows an Instagram count sits close to this; keep unclaimed cards to the public handle and count, and get a view from whoever handles legal.

## 4. Facebook Pages

- `followers_count` is the Page follower number; `fan_count` returns the same on New Pages Experience (https://developers.facebook.com/docs/graph-api/reference/page/).
- Reading a Page we do not manage needs Page Public Content Access: App Review and Business Verification (https://developers.facebook.com/docs/features-reference/page-public-content-access).
- Page Public Metadata Access is superseded by it (https://developers.facebook.com/docs/features-reference/page-public-metadata-access).
- Personal profiles: no follower-count API found (unconfirmed).

## 5. TikTok

- `/v2/user/info/` returns `follower_count` only with the `user.info.stats` scope granted by that user; `bio_description` needs `user.info.profile` (https://developers.tiktok.com/docs/en/tiktok-api-v2-get-user-info, https://developers.tiktok.com/docs/en/tiktok-api-scopes).
- The Research API returns counts for any public account but is limited to academic and not-for-profit research with a proposal and ethical review (https://developers.tiktok.com/products/research-api/). A public ranking is not eligible (inference).
- Profile oEmbed has no follower count (https://developers.tiktok.com/docs/en/embed-creator-profiles).
- Login Kit with those scopes needs scope approval and a sandbox demo (https://developers.tiktok.com/docs/en/app-review-guidelines).
- Terms ban automated extraction (https://www.tiktok.com/legal/page/global/terms-of-service/en).

## 6. Proving channel ownership

**Precedents for "put a code where only the owner can"**
- Google Search Console places a token in a file, meta tag or DNS record and re-checks it periodically (https://support.google.com/webmasters/answer/9008080).
- Mastodon `rel="me"` fetches the linked page and looks for a link back (https://docs.joinmastodon.org/user/profile/).
- Keybase has the user post a signed statement on the network (https://book.keybase.io/docs/server).
- No first-party guidance from YouTube, Meta or TikTok recommending a bio code was found (unconfirmed that none exists).

**OAuth alternatives and their cost**

| Path | Burden |
|---|---|
| Google OAuth, `youtube.readonly`, then `channels.list mine=true` | Medium. Google app verification if the scope is sensitive (unconfirmed); unverified apps are capped at 100 users (https://support.google.com/cloud/answer/13464321, https://support.google.com/cloud/answer/15549945) |
| Instagram API with Instagram Login, `instagram_business_basic` | Medium-high. Advanced Access and Business Verification (https://developers.facebook.com/docs/graph-api/overview/access-levels) |
| TikTok Login Kit | Medium |
| Facebook Login for Business, `pages_show_list` | High |

A creator who links by OAuth turns their YouTube data into authorised data with longer storage rules. That is the later upgrade path, not v1.

## 7. Scheduling on Render

- A Render Cron Job is a separate service built from a repo or image, billed per second with a $1 monthly minimum, one run at a time, env vars per service or shared by an environment group (https://render.com/docs/cronjobs, https://render.com/pricing).
- A GitHub Actions `schedule` can call a secret-protected route. It runs in UTC, can be delayed under load, and in a public repo is disabled after 60 days without repository activity (https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
- Render's maximum HTTP request time is unconfirmed. Keep the route short.

## 8. Postgres

- Window functions: `rank()` leaves gaps after ties, `dense_rank()` does not (https://www.postgresql.org/docs/current/functions-window.html). YouTube's rounding makes ties common.
- A materialized view cannot be updated directly and blocks readers on a plain refresh (https://www.postgresql.org/docs/current/sql-refreshmaterializedview.html). Not needed at 10,000 rows.
- `pg_trgm` gives indexed `ILIKE` and similarity search (https://www.postgresql.org/docs/current/pgtrgm.html). Render Postgres supports `pg_trgm` and `unaccent` (https://render.com/docs/postgresql-extensions).
- `FOR UPDATE SKIP LOCKED` is the documented way to read a queue-like table from more than one consumer (https://www.postgresql.org/docs/current/sql-select.html).

## 9. Privacy pointers

Not legal advice. These are the texts to hand to whoever reviews this.

- **GDPR Art. 14**: when data does not come from the person, tell them the source, within a month or at first contact (https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng).
- **GDPR Art. 6(1)(f) and Art. 21**: legitimate interest needs a balancing test and gives the person a right to object (EDPB Guidelines 1/2024, https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2024/guidelines-12024-processing-personal-data-based_en). Hence the remove-me link.
- **GDPR Art. 9**: religious belief is special-category data. Calling someone a "Buddhist creator" may count. The relevant exception is data "manifestly made public" by the person.
- **India DPDP Act 2023 s.3(c)(ii)**: the Act does not apply to personal data the person made public themselves (https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf). A convention attendee list was not made public by the attendees (inference).
- **Our own promise**: the 2027 registration form says "Everything you share here is used only for the selection process" (`lib/registration-2027.ts:158`). Application data cannot seed public cards.

## 10. Next.js 16.4.5 facts used by the designs

Read from the docs bundled with the installed version, as `AGENTS.md` requires. Paths are under `node_modules/next/dist/docs/01-app/`.

| Topic | Fact | Doc |
|---|---|---|
| `'use cache'` | Top of an async function, component or file. Arguments form the cache key. `cookies()`, `headers()` and `searchParams` are forbidden inside it. Not allowed directly in a Route Handler body; extract a helper | `03-api-reference/01-directives/use-cache.md`, `01-getting-started/15-route-handlers.md` |
| Cache storage | In-memory per process when self-hosted; `cacheMaxMemorySize` defaults to 50 MB. Entries do not survive a deploy. Invalidation is local to the process that received the call | `03-api-reference/05-config/01-next-config-js/cacheMaxMemorySize.md`, `02-guides/how-revalidation-works.md` |
| `cacheLife` | Presets (stale / revalidate / expire): `hours` 5 min / 1 h / 1 day, `days` 5 min / 1 day / 1 week, `weeks` 5 min / 1 week / 30 days, `max` 5 min / 30 days / 1 year | `03-api-reference/04-functions/cacheLife.md` |
| `cacheTag` | `cacheTag(...tags)` inside the cached scope | `03-api-reference/04-functions/cacheTag.md` |
| `revalidateTag` | `revalidateTag(tag, profile)`. The one-argument form is deprecated. Allowed in Server Actions and Route Handlers | `03-api-reference/04-functions/revalidateTag.md` |
| `updateTag` | Read-your-own-writes. Server Actions only; not in Route Handlers | `03-api-reference/04-functions/updateTag.md` |
| `searchParams`, `params` | Promises, request-time. Await inside `<Suspense>` and pass plain values to cached functions | `03-api-reference/03-file-conventions/page.md`, `01-getting-started/08-caching.md` |
| `generateStaticParams` | Must return at least one param under Cache Components | `03-api-reference/04-functions/generate-static-params.md` |
| `io()` | From `next/cache`. Suspends prerender so a cached read becomes a runtime-cached hole | `03-api-reference/04-functions/io.md` |
| `connection()` | Waits for a real request. Already used by `components/user-menu.tsx:36` | `03-api-reference/04-functions/connection.md` |
| Server Actions | Dispatched one at a time by the client; meant for mutations. Typeahead search belongs in a Route Handler | `02-guides/server-actions.md` |
| `ImageResponse` | Flexbox only, 500 KB bundle limit including fonts | `03-api-reference/04-functions/image-response.md` |
| `proxy.ts` | Node runtime; the matcher must be a constant. Server Actions post to their host route, so each action checks auth itself | `03-api-reference/03-file-conventions/proxy.md` |

## 11. Still unconfirmed

- The 50-id batch limit on `channels.list`.
- Whether Business Discovery through our own account needs App Review.
- Whether `youtube.readonly` is a sensitive scope, and whether Auth0 can request it alongside sign-in.
- Render's HTTP request timeout, and whether the database is reachable during a Render build.
- TikTok token lifetimes.
- The developer-handoff spec linked from the lead's mock could not be opened; these docs are built from the mock pages.
