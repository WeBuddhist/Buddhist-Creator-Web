# Todo: the marketplace (jobs board and finding creators)

**Status:** Proposed
**Date:** 2026-11-12
**Deciders:** TenzDelek (engineering), the project lead (product, moderation policy)
**Sources:** the lead's home page mock ("Grow your reach", "Paid work"), `docs/research/creator-ranking-data-sources.md`
**Depends on:** `docs/todo-creator-card.md`. The card is the creator's side of the marketplace; build it first.

The home page's third question is "what can I do to grow?". The mock answers with four columns: events, courses, tools, paid work. Events, courses and tools are content the team already writes by hand. Paid work is the new system, and it has two sides:

- **Organisations** (monasteries, foundations, publishers, media houses) find creator cards and post jobs.
- **Creators** keep their card current, mark themselves available, and find jobs.

## 1. Requirements

**Functional**
- A public jobs board: open jobs, newest closing date first, with filters.
- A job has a title, an organisation, a description, languages, where the work is done, how it is paid, a closing date, and one way to apply.
- A signed-in person registers an organisation and submits jobs for it.
- An admin approves organisations and jobs before anything is public.
- A job closes on its closing date without anyone acting.
- Creators apply through the organisation's own link or email address.
- Creators switch "available for work" on their card. Organisations filter the creator directory by it, and by country, language, platform and band.
- The home page "Grow your reach" section shows a few open jobs beside the existing events.
- Admins can post a job on an organisation's behalf.

**Not in the first version**
- Applying inside the site, applicant inboxes, messaging.
- Payments, contracts, escrow, fees.
- Several people managing one organisation.
- Reviews or ratings of either side.
- Automatic matching ("you match 4 of 4 criteria" in the mock).

**Non-functional**
- Nothing unreviewed is public. The board is small and the audience trusts the name on it.
- A creator's email address is never shown to organisations.
- No new infrastructure: the same Render service, Postgres, Auth0 and SES.
- A closed job is never shown as open, even if the scheduler is down.

**Constraints**
- Same as the card doc: Next.js 16.4.5 with `cacheComponents`, one 512 MB Node service, no test framework, a public repo.
- `lib/notifications.ts` is tied to applications by its foreign key and status checks. It is not the email layer for this.

**Assumptions**
- Tens of open jobs at a time, not thousands. A few new organisations a month.
- The same admins who review cards review jobs.
- English listings; the work itself can be in any language.

**Decision taken on 2026-11-12:** a curated jobs board. Organisations submit, admins approve, creators apply off-site.

## 2. High-level design

```
 Organisation (signed in)            Next.js server (Render)                    Creator
┌────────────────────────┐   ┌────────────────────────────────────┐   ┌──────────────────────┐
│ /account/organisation   │──▶│ lib/organisations.ts                │   │ /jobs, /jobs/[id]     │
│  register, edit         │   │  status: pending → approved         │◀──│  filters              │
│ /account/jobs           │──▶│ lib/jobs.ts                         │   │  "Apply" → org's link │
│  draft, submit, close   │   │  status: draft → pending → open     │   │  or mailto            │
└────────────────────────┘   │            → closed / rejected       │   ├──────────────────────┤
┌────────────────────────┐   │                                     │   │ /account/card         │
│ Admin                   │──▶│ /admin/organisations, /admin/jobs   │◀──│  available for work   │
│  approve, reject, post  │   │  approve → updateTag('jobs') + mail │   └──────────────────────┘
└────────────────────────┘   │                                     │
┌────────────────────────┐   │ /creators?available=1&language=…    │
│ Organisation browsing   │──▶│  the card directory is the          │
│  "find a creator"       │   │  "find creators" side               │
└────────────────────────┘   │ tick: close jobs past closes_at     │
                              └────────────────────────────────────┘
```

Two ideas carry it:

1. **The card directory is the buyer's catalogue.** There is no second profile for "hireable creators". `/creators` gains filters and the card gains one switch.
2. **Trust sits on the organisation, not on each job.** An approved organisation still has each job reviewed, but the hard check (is this a real organisation, is this person from it?) happens once.

## 3. Data model

Follows the conventions in `lib/db/schema.ts`, as the card doc does.

**Enums**

| Enum | Values |
|---|---|
| `organisation_status` | `pending`, `approved`, `rejected`, `hidden` |
| `job_status` | `draft`, `pending`, `open`, `closed`, `rejected` |
| `job_location_type` | `remote`, `on_site`, `hybrid` |
| `job_pay_type` | `fixed`, `monthly`, `hourly`, `volunteer` |

**`organisations`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text, unique | |
| `name` | text, not null | |
| `kind` | text | `monastery`, `foundation`, `publisher`, `media`, `university`, `brand`, `other` |
| `country` | text | Validated by `isCountry` (`lib/countries.ts`) |
| `website` | text | Shown on the job; the main thing an admin checks |
| `about` | text | Check: 300 characters at most |
| `owner_id` | uuid FK users, set null | One owner in this version |
| `status` | `organisation_status` | Default `pending` |
| `reviewed_by`, `reviewed_at`, `review_note` | | |
| timestamps | | |

Index: `organisations_owner_id_idx`. A user may own more than one organisation.

**`jobs`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Used in the URL |
| `organisation_id` | uuid FK, cascade | |
| `created_by` | uuid FK users, set null | The owner, or an admin posting on their behalf |
| `title` | text, not null | Check: 120 characters at most |
| `description` | text, not null | Plain text, check: 4,000 characters at most |
| `languages` | text[] | Slugs from `AUDIENCE_LANGUAGES` (`lib/registration-2027.ts:64`) |
| `platforms` | text[] | Slugs from `PLATFORMS` (`lib/registration-2027.ts:80`), optional |
| `location_type` | `job_location_type` | |
| `country` | text | Required unless `remote` (check) |
| `pay_type` | `job_pay_type` | |
| `pay_note` | text | Free text, for example a range or "per video". Required unless `volunteer` (check) |
| `closes_at` | date, not null | Check: at most 90 days after submission |
| `apply_url`, `apply_email` | text | Check: exactly one is set |
| `status` | `job_status` | Default `draft` |
| `reviewed_by`, `reviewed_at`, `review_note`, `published_at` | | |
| timestamps | | |

Indexes: `jobs_status_closes_at_idx (status, closes_at)`, `jobs_organisation_id_idx`.

**From the card doc:** `creators.available_for_work`, and an index `creators_available_idx (available_for_work, rank)` where `status = 'published'`.

**`outbound_emails`** (a small send record for this and for card emails)

`id`, `kind` (text: `job_approved`, `job_rejected`, `organisation_approved`, `card_published`, …), `ref_id` (uuid, no foreign key), `recipient_email`, `state` (`sent`, `failed`), `ses_message_id`, `error_code`, `sent_by`, `created_at`. These mails are one-off notices, so the in-flight lock that decision emails need (`lib/notifications.ts:211`) is not required; a failed send is retried by an admin.

**Not built:** `job_applications`, `organisation_members`, messages.

## 4. Flows

**Register an organisation** (`/account/organisation`, signed in)
1. Name, kind, country, website, a short description.
2. Saved as `pending`. An admin checks the website and that the submitter plausibly belongs to it, then approves. Approval sends a mail.
3. The owner can draft jobs while pending. They cannot submit one until the organisation is approved.

**Post a job** (`/account/jobs`)
1. The form saves as `draft`. Server action, zod `safeParse`, typed state, as in `app/(site)/convention/2027/register/actions.ts`.
2. Submit moves it to `pending`.
3. An admin approves (`open`, sets `published_at`) or rejects with a note. Both send a mail. Approval calls `updateTag('jobs')`.
4. The owner can close an open job at any time. Editing an open job sends it back to `pending`.

**Closing.** Two layers, so correctness does not depend on the scheduler:
- Every public read filters `status = 'open' and closes_at >= current_date`.
- The hourly tick from the card doc also sets `status = 'closed'` for jobs past their date and calls `revalidateTag('jobs', 'max')`, so admin lists and counts stay honest.

**Apply.** The job page shows one button. For a link it opens the organisation's page in a new tab. For an email address it is a `mailto:` with the job title as the subject. The site records nothing about who applied.

**Available for work.** A switch on `/account/card`, off by default, only for claimed and published cards. It adds a small mark on the card and a filter on `/creators`. Organisations contact a creator through the channels on the card. We do not hand out email addresses.

**Find a creator.** `/creators` gains filters: country, language, platform, band, available. All are validated against their option lists before reaching a cached read.

**Admin.** `/admin/organisations` and `/admin/jobs` follow the applications list (`lib/applications.ts:230`, `lib/applications-view.ts`, `components/admin/*`): status tabs with counts, a detail page with approve, reject and a note. `/admin/jobs/new` posts for an organisation, creating the organisation as approved if needed.

## 5. Read path and caching

- `lib/jobs.ts` holds the public reads, marked `'use cache'` with `cacheTag('jobs')` and `cacheLife('hours')`.
- `/jobs` awaits `searchParams` inside `<Suspense>`, validates the filters and clamps the page, then calls the cached read. Each distinct filter set is a cache entry, so only values from the option lists are accepted.
- `/jobs/[id]` awaits `params` inside `<Suspense>` and validates it as a uuid. No `generateStaticParams`.
- The home page section reads "three open jobs closing soonest" from the same cached function, behind `await io()` and `<Suspense>` like the leaderboard, so the build still needs no database.
- Invalidation: `updateTag('jobs')` in server actions (approve, reject, close, edit), `revalidateTag('jobs', 'max')` in the tick route. `updateTag` cannot be called from a Route Handler.
- Job descriptions are plain text rendered as text. No HTML or Markdown from organisations.

## 6. The home page "Grow your reach" section

The mock's four columns map to what exists and what is new:

| Column | Source | Work |
|---|---|---|
| Meet: events | `ONGOING_EVENTS`, `UPCOMING_EVENTS` in `lib/events.ts`, already rendered by `components/home/whats-on.tsx` | Restyle only |
| Learn: courses and circles | Static content, new entries in a `lib/` data file like `lib/home.ts` | Copy from the team |
| Create: tools | Static links | Copy from the team |
| Earn: paid work | Open jobs from the database, plus "mark yourself available" and "post a job" links | This doc |

The section replaces `WhatsOn` and `Programs` in `app/(site)/page.tsx`. One new component, `components/home/grow.tsx`.

## 7. Routes and files

**Routes**

| Route | Access |
|---|---|
| `/jobs`, `/jobs/[id]`, `/creators` with filters | Public |
| `/account/organisation`, `/account/jobs`, `/account/jobs/new`, `/account/jobs/[id]` | Signed in. Covered by the `/account` rule added to `proxy.ts:15` in the card work |
| `/admin/organisations`, `/admin/organisations/[id]`, `/admin/jobs`, `/admin/jobs/[id]`, `/admin/jobs/new` | Admin |

**Existing files that change**

| File | Change |
|---|---|
| `lib/db/schema.ts` | Enums and tables above |
| `lib/navigation.ts:15` | "Marketplace" or "Jobs" in `NAV_ITEMS` |
| `app/sitemap.ts:7` | Add `/jobs` |
| `app/(site)/page.tsx` | The Grow section |
| `components/admin/admin-shell.tsx`, `components/admin/status-badge.tsx` | Sidebar entries, job and organisation states |
| The tick route from the card doc | Close jobs past their date |
| `lib/creators.ts`, `/creators` | Filters and the availability mark |

**New files**

`lib/organisations.ts`, `lib/jobs.ts`, `lib/jobs-view.ts`, `lib/job-form.ts` (zod and options), `lib/outbound-emails.ts`, `lib/emails/{job-approved,job-rejected,organisation-approved}.ts`, `components/jobs/job-card.tsx`, `components/home/grow.tsx`.

**Reuse**
- `assertRole`, `requireUser`, `requireRole` (`lib/auth.ts`). Every server action checks ownership itself: `organisations.owner_id = user.id`. The proxy only checks that a session exists.
- `sendEmail` and delivery modes in `lib/ses.ts`; the template shape in `lib/emails/layout.ts`.
- Admin list, pagination and panel components; `components/ui/tabs.tsx`; the `EventCard` layout for the job card.

## 8. Scale, reliability and abuse

- **Size.** Hundreds of rows. Nothing here needs tuning.
- **Spam and fraud.** The main risk. Defences, in order: sign-in required, organisation approval, job approval, a 90-day cap on closing dates, a "report this job" link that writes to the existing `suggestions` table (`lib/suggestions.ts`) with the job id in the body.
- **Email addresses.** `apply_email` is public on the job page and will be harvested. Tell organisations so on the form, and prefer a link.
- **Rate limiting.** None exists on the site. Submitting organisations and jobs needs the same per-client limit as card submission.
- **Testing.** The status transitions in `lib/jobs.ts` (who may move what, from where) are the part worth tests, written as the card doc describes.

## 9. Architecture decisions

### A. How much marketplace

| Option | Build | Moderation | Notes |
|---|---|---|---|
| A1. Curated board: submit, approve, apply off-site (chosen) | Small | One queue | Ships with what exists. Proves demand before more is built |
| A2. Two-sided: organisation teams, in-app applications, inboxes, status tracking | Large | Two queues plus disputes | Needs a notification system and privacy rules for applicant data |
| A3. Team-posted only | Smallest | None | Organisations cannot help themselves; the team becomes the bottleneck |

A1 keeps A3 as a built-in fallback: admins can post for anyone.

### B. How creators apply

| Option | Notes |
|---|---|
| B1. The organisation's link or email (chosen) | No applicant data stored, nothing to secure or delete. We cannot count applications |
| B2. A redirect route that counts clicks | Small addition later, if the lead wants a number per job |
| B3. In-app application with the card attached | The right end state. Needs `job_applications`, an inbox, emails to both sides and a retention rule |

### C. Who acts for an organisation

| Option | Notes |
|---|---|
| C1. One owner per organisation (chosen) | One column. Enough while a single person posts |
| C2. Members table with roles | Needed when an organisation asks for a second login. Adding it later is a new table and a backfill of the owner |

### D. What is reviewed

| Option | Notes |
|---|---|
| D1. Organisation once, then every job (chosen) | Slower for organisations, safest for creators |
| D2. Organisation once, jobs go live at once | Faster. Revisit for organisations with several clean postings |
| D3. Nothing, with reports and takedown | Wrong for an audience that trusts the board |

**Consequences**
- Easier: no private data about applicants, no messaging to moderate, one more admin queue using a pattern the team already has.
- Harder: we cannot tell a creator "you applied", cannot tell an organisation how many applied, and cannot show the mock's "you match 4 of 4".
- Revisit when: organisations ask where their applicants are (B3); an organisation needs a second person (C2); review becomes the delay (D2); the board passes a few hundred open jobs (search instead of filters).

## 10. Where this differs from the mock

| Mock | Here | Why |
|---|---|---|
| "View the brief and apply" inside the site | Apply on the organisation's side | Decision B |
| "You match 4 of 4 criteria", "three things picked for you" | Filters only | Needs applications and a matching rule; later |
| "Organisations browse creator cards to hire; one toggle on your card" | Same | Kept as designed |
| "See all 23 open jobs" | Same, at `/jobs` | Kept |
| Tags "Paid", "Monthly fee" | `pay_type` plus a free-text note | Lets a job say how much without us validating currencies |
| Courses, clubs, tools, campaign kits as products | Static content | They are editorial today; no system behind them yet |

## 11. Todo

**Phase 1: a board the team fills**
1. [ ] Enums and tables in `lib/db/schema.ts`; migration.
2. [ ] `lib/job-form.ts`: option lists and zod schemas.
3. [ ] `lib/organisations.ts`, `lib/jobs.ts`: admin writes, cached public reads with `cacheTag('jobs')`.
4. [ ] `/admin/organisations`, `/admin/jobs`, `/admin/jobs/new`; sidebar entries and status badge states.
5. [ ] `/jobs` and `/jobs/[id]`; job card; filters; the apply button.
6. [ ] Home page Grow section; nav and sitemap.
7. [ ] Close past-date jobs in the tick route, with the read-side filter in place first.

**Phase 2: organisations help themselves**
8. [ ] `/account/organisation`: register and edit, with the ownership check in every action.
9. [ ] `/account/jobs`: draft, submit, close, edit-returns-to-review.
10. [ ] `lib/outbound-emails.ts` and the three templates; send on approve and reject.
11. [ ] Rate limit on submit; "report this job".
12. [ ] Tests for the job status transitions.

**Phase 3: finding creators**
13. [ ] "Available for work" switch on `/account/card`; the mark on the card.
14. [ ] `/creators` filters: country, language, platform, band, available.
15. [ ] A "hire a creator" entry point for organisations from `/jobs` and the home page.

**Later**
16. [ ] Click counting on apply (B2).
17. [ ] In-app applications (B3) and a members table (C2).
18. [ ] Picks for a signed-in creator, matched on language, country and platform.

## 12. Risks and open questions

**For the lead**
- **Who moderates,** and how fast? A job with a closing date loses value every day it waits.
- **Unpaid work.** Is `volunteer` allowed on the board, and how is it labelled? "Exposure" offers will arrive.
- **Which organisations qualify.** Buddhist organisations only, or any brand that wants Buddhist creators?
- **Name.** The mock's nav says "Marketplace" and one page says "Briefs". Pick one word for the nav and the URL.
- **Member organisations.** The mock's "Who we are" section lists member organisations. Is a member the same thing as an approved organisation here, or a separate, invited tier?

**Engineering**
- The card must ship first; phase 3 here is blocked on card phase 2 (claiming).
- Published email addresses will be harvested.
- A hijacked or mistaken organisation approval puts a bad job in front of creators under our name. Keep the admin action log (`reviewed_by`, `reviewed_at`) and make hide a single click.

## 13. What to revisit as this grows

- Applications inside the site, once there is demand on both sides to justify storing applicant data.
- Full-text search over jobs when filters stop being enough.
- Fees or featured listings, if the board needs to pay for its moderation.
- Organisation pages listing their open and past jobs.
