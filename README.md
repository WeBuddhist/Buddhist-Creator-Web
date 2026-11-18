![Buddhist Creators: a global network of creators, bringing the Dharma to the digital age](assets/readme-banner.png)

# Buddhist Creators

The website for [Buddhist Creators](https://buddhistcreators.com), a global network of monastics, practitioners and storytellers carrying the Dharma to the digital age through a convention, awards and campaigns.

## Pages

| Route | What's there |
| --- | --- |
| `/` | Mission, programs, what's on, partners and the suggestion box |
| `/get-involved` | Ways to take part as a creator, partner or supporter |
| `/program` | Ongoing, upcoming and past programs |
| `/convention/2026` | Buddhist Creators Convention 2026 in Bodh Gaya |
| `/convention/2027` | Buddhist Creators Convention 2027 in Nagpur |
| `/convention/2027/register` | The convention application form (sign-in required) |
| `/admin` | The selection committee's dashboard (admin role required) |
| `/creators` | The creators directory: every approved creator card, searchable and paged |
| `/creator-card` | A creator's own card: make it, edit it, or claim one the team made (sign-in required) |
| `/team` | The team, and the invitation to join it |

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) with React 19 and TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [Base UI](https://base-ui.com) and [shadcn/ui](https://ui.shadcn.com) components
- [Phosphor Icons](https://phosphoricons.com)
- [Auth0](https://auth0.com) for sign-in, [Drizzle](https://orm.drizzle.team) on Postgres (Render) for applications, S3 for intro videos

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables are needed.

## Scripts

- `npm run dev` starts the dev server
- `npm run build` builds for production
- `npm run start` serves the production build
- `npm run lint` runs ESLint
- `npm run db:migrate` applies the migrations in `drizzle/` that the database
  has not had yet. It runs against `DATABASE_URL`, read from `.env.local`
  when that file exists, so check which database that is before running it
- `npm run db:generate` writes a new migration after a change to
  `lib/db/schema.ts`
- `npm run db:studio` opens Drizzle Studio on the same database

## Project structure

```text
app/         Routes, metadata, social cards, sitemap and robots.txt
components/  Page sections, grouped by page, with shared UI in components/ui
lib/         Page content, navigation and site constants
public/      Images served by the site
assets/      Fonts and images used at build time, plus this README's banner
```

## Editing content

Most copy lives in typed data files in `lib/`, so it can be changed without touching the components:

| File | Content |
| --- | --- |
| `lib/home.ts` | Homepage copy |
| `lib/get-involved.ts` | Get Involved page |
| `lib/events.ts` | Events listing |
| `lib/convention-2026.ts` | Convention 2026 page |
| `lib/convention-2027.ts` | Convention 2027 page, including the registration switch |
| `lib/team.ts` | The team |
| `lib/creators.ts` | Creators page: copy, and the search and country in the URL |
| `lib/creator-card.ts` | Creator card form: copy and option lists |
| `lib/navigation.ts` | Site navigation, name, URL and default description |

Events are grouped by hand rather than by date, so move an entry to the right list once it passes.

## Suggestion box

The homepage suggestion box saves each suggestion to the `suggestions` table (`lib/suggestions.ts`, called from `submitFeedback` in `app/actions.ts`), and admins read them at `/admin/suggestions`, newest first; a superadmin can remove one. The send button shows the save in progress and its outcome, and a toast confirms it.

## Creator cards

A creator card says who a creator is, what they make and where to find it:
a photo, display name, country, whether they create as a monastic, lay
practitioner, organization or teacher, the languages they publish in, the
kinds of content they make, one line about their work, and their links.

The photo is the picture from the creator's sign-in account unless they
upload their own. An upload is cropped square, scaled to 512 pixels and
compressed in the browser, sent with the form, checked on the server (one
WebP or JPEG, at most 512 KB) and stored in the private S3 bucket under
`creator-cards/<user id>/`, a new object for each upload; the card's
`photo_key` names it and pages load it through a presigned URL. A new photo
is a change to the card like any other, so it goes back for review, and the
object it replaces is deleted.

A signed-in creator fills theirs in at `/creator-card`, with the card drawn
beside the form as they type, and submits it for review. The form then
behaves as the registration form does: it is read-only behind an Edit card
button, editing offers Save changes and Cancel, and the actions float at the
foot of the screen. Admins and superadmins review at `/admin/creator-cards`:
approve, or reject with a note the creator reads on their card page. A
creator can edit their card at any time, and every change, even to an
approved card, goes back to pending, so nothing is approved unread. A review names the version of the card it read
and is refused if the creator has changed the card since.

| Piece | Where |
| --- | --- |
| Option lists, copy, validation | `lib/creator-card.ts` |
| Reads and writes, status rules | `lib/creator-cards.ts` |
| The card itself | `components/creator-card/creator-card.tsx` |
| Preparing an uploaded photo in the browser | `components/creator-card/photo.ts` |
| The form | `app/(site)/creator-card/` |
| Review | `app/admin/creator-cards/` |
| The public directory | `app/(site)/creators/`, `components/creators/` |
| Claiming a card | `app/(site)/creator-card/claim-card.tsx` |
| Deciding claims | `app/admin/creator-cards/claims/`, `app/admin/creator-cards/[id]/claim-review.tsx` |

Approved cards are public at `/creators`, the most followed first, thirty to
a page, with a search by name and a filter by country. Both live in the URL
and the database does the narrowing, since the list is paged.

One table, `creator_cards`. Only `display_name` is required and `user_id`
may be null: the team also makes cards itself, for creators it knows, from
details it only partly has. Migration `0009` holds the first of them, taken
from the team's shared sheet, and `0017` the team's final sheet of November
2026, 353 creators (a few have been taken off since). Such a card is approved as it
is made, has no owner, and shows its creator's public profile picture
(stored under `creator-cards/profile-pictures/`) or, without one, their
initials.

Every card is laid out the same way: the photo as a circle top left, then
the name, the country and follower total, the links, and the line about
the creator's work; what a creator adds beyond that (how they create, what
kinds of content, which languages) follows under a rule. An approved card
carries the verification mark on the edge of its photo, a cyan seal with a
tick (`components/creator-card/verified-mark.tsx`); pointing at it, or
tapping it, says "Verified by Buddhist Creators". In the directory a card
nobody owns has "Claim this card" in its top right corner.

A card with no owner can be claimed, and a claim is a request, never a
transfer. Signing in proves an email address, not that its owner runs the
channel on the card, so nothing changes hands until an admin has approved:

1. The card's claim link in the directory leads, through sign-in, to a
   screen that shows the card and takes the claim, with an optional note.
   The claim is stored in `creator_card_claims` with a code made on the
   server (`BC-` and eight characters). The card stays unowned and listed.
2. The claimant's `/creator-card` page then shows the claim waiting, with
   the code to put in the bio or description of the channel the card links
   to. That is the proof: only whoever runs the channel can put text on
   it, and the team can see it there without being sent anything. The
   claimant can withdraw the claim.
3. Admins see waiting claims at `/admin/creator-cards/claims` and decide
   each on the card's own page, beside the card's links: approve, or
   reject with a note the claimant reads. Approving (`reviewClaim`) makes
   the claimant the card's owner, leaves the card approved, and rejects
   every other claim waiting on it. From then on it is their card, and
   whatever they change goes to review like any other edit.

4. An approval that was a mistake can be taken back: the approved claim
   on the card's admin page has "Undo approval" (`undoClaimApproval`). The
   card loses that owner and can be claimed again, the claim becomes a
   rejected one with a note the person reads, and the claims that approval
   turned away go back to waiting. If the person changed the card while it
   was theirs, it also goes back to pending, out of the directory, until an
   admin has reviewed it. A card a creator made themselves has no claim to
   undo and cannot be taken from them this way.

Several people may claim one card; a person has one claim waiting at a
time and none while they have a card. Nothing is emailed at any step.

### Follower counts

Follower counts are kept for YouTube, Instagram, TikTok and Facebook and
added up by the database (`total_followers`); they order the directory and
are never part of a review. Nobody types them. Each counted link is read
from the place itself once a month: YouTube from its own Data API v3,
the other three through [SocialCrawl](https://www.socialcrawl.dev)'s
profile endpoints (one credit per account read).

| Piece | Where |
| --- | --- |
| What is due, and the run | `lib/follower-refresh.ts` |
| The two services | `lib/youtube.ts`, `lib/socialcrawl.ts` |
| The address the schedule calls | `app/api/cron/follower-refresh/route.ts` |
| The schedule | `.github/workflows/follower-refresh.yml` |
| Links that gave no count | `/admin/creator-cards/followers` |

- **One row per card, place and month** in `creator_follower_checks`: the
  figure, what came of the attempt, and the account's own id and handle.
  It is the history a ranking by growth is worked out from. The card's
  `*_followers` column holds the latest figure. November 2026 is the first
  month: its rows are the counts on the team's sheet (migration `0017`),
  not readings of ours.
- **The schedule runs every day.** On the first of the month (UTC) every
  link is due; on the other days only links added since and attempts that
  failed. One call
  works for about a minute and says how many links are left; the workflow
  calls again until none are.
- **A reading belongs to a link.** Rows carry the link in the form links
  are compared in (`socialLinkKey`), and a card whose link changes loses
  that place's count until the new account is read, within a day.
- **A link that cannot be read keeps the count it had** and shows on the
  admin page above: an account that is gone, a hidden count, a personal
  Facebook profile.
- **YouTube rounds** the subscriber count it gives out to three figures
  (2,970,000; 24,900), so a large channel's count moves in steps.

It needs `YOUTUBE_API_KEY`, `SOCIALCRAWL_API_KEY` and `CRON_SECRET` on the
site, and two secrets on the GitHub repository: `CRON_SECRET` (the same
value) and `FOLLOWER_REFRESH_URL` (the full address of
`/api/cron/follower-refresh`). The workflow's logs are public, so the
address answers with totals only.

## Registration and the admin dashboard

Applicants sign in through Auth0 (Google or Apple) and fill in the form at
`/convention/2027/register`. They can save a draft, upload a 2-minute intro
video, submit, and keep editing until the committee decides. Admins review at
`/admin`: accept, reject or waitlist each application, with a note and a
history of every change, then email the decision, one applicant at a time or
everyone waiting in a tab. Admins read the suggestion box at
`/admin/suggestions`. Superadmins can also remove a suggestion there, and
manage roles at `/admin/users`.

How it fits together:

| Piece | Where |
| --- | --- |
| Auth0 client and sign-in gate | `lib/auth0.ts`, `proxy.ts` |
| Who is calling, roles | `lib/auth.ts`, `lib/auth-roles.ts` |
| Database schema and client | `lib/db/schema.ts`, `lib/db/index.ts`, migrations in `drizzle/` |
| Client-side writes (React Query) | `components/query-provider.tsx`, `components/form/form-helpers.ts`, `lib/session-ended.ts` |
| Form copy, option lists, validation | `lib/registration-2027.ts` |
| Reads and writes, status transitions | `lib/applications.ts` |
| S3 (private bucket, presigned reads) | `lib/s3.ts`; intro videos through `app/api/applications/video/route.ts`, card photos through the card's save action |
| Decision emails: who is owed one, sending, the send ledger | `lib/notifications.ts`, `lib/ses.ts` |
| Wording of the three emails | `lib/emails/accepted.ts`, `rejected.ts`, `waitlisted.ts` |
| The form | `app/convention/2027/register/` |
| The dashboard | `app/admin/` |

### How client code talks to the server

Pages read their data in server components. Client components that write
(every form here, the video upload, the bulk send) run their server action
or request as a [React Query](https://tanstack.com/query) mutation
(`useMutation`), which supplies the pending state, the result and the
failure; what happens on a result is in the mutation's callbacks, not in an
effect. Forms send themselves from `onSubmit` with their own `FormData`
rather than through the form's `action`, because React resets a form after
its action and that unticks checkboxes ticked since the page loaded.
Mutations are tried once and at once, online or not. A request that fails
outright is checked against `/auth/profile` to tell an ended session from a
lost connection (`lib/session-ended.ts`).

### Data model

Six tables, defined in `lib/db/schema.ts`. The diagram shows the five
behind registration; `creator_cards` is described under Creator cards
above. `suggestions` stands alone: a suggestion is never tied to a user.

```mermaid
erDiagram
    users ||--o| applications : "applies with (user_id)"
    users |o--o{ applications : "decides (decided_by)"
    applications ||--o{ application_events : "has history (application_id)"
    users |o--o{ application_events : "acts in (actor_id)"
    applications ||--o{ application_notifications : "is mailed (application_id)"
    users |o--o{ application_notifications : "sends (sent_by)"
    users |o--o{ application_notifications : "settles (resolved_by)"

    users {
        uuid id PK
        text auth0_sub UK "Auth0 sub"
        text email UK "lower-cased, verified"
        text name
        text picture
        user_role role "default member"
        timestamptz created_at
        timestamptz updated_at
    }

    applications {
        uuid id PK
        uuid user_id FK, UK "one application per person"
        integer convention_year "default 2027"
        application_status status "default draft"
        text full_name
        text organization
        text country
        text state
        text[] content_topics
        text content_topics_other
        text[] target_audience
        text target_audience_other
        text[] audience_region
        text audience_region_other
        text[] audience_language
        text audience_language_other
        text[] platforms
        text platforms_other
        jsonb platform_links "profile link per platform"
        text video_key "private S3 object"
        integer video_size_bytes
        text video_mime
        timestamptz video_uploaded_at
        text review_note
        uuid decided_by FK
        timestamptz decided_at
        application_status notified_status "decision last emailed"
        timestamptz notified_at
        timestamptz submitted_at
        timestamptz created_at
        timestamptz updated_at
    }

    application_events {
        uuid id PK
        uuid application_id FK
        uuid actor_id FK
        application_status from_status
        application_status to_status
        text note
        timestamptz created_at
    }

    application_notifications {
        uuid id PK
        uuid application_id FK "one unsettled attempt at a time"
        application_status status "the decision announced"
        notification_kind kind "default decision"
        notification_state state "default sending"
        text recipient_email
        text recipient_name
        text template_version
        text subject
        text ses_message_id
        text error_code
        text error_message
        uuid sent_by FK
        uuid batch_id "groups one bulk run"
        uuid resolved_by FK
        timestamptz resolved_at
        timestamptz created_at
        timestamptz sent_at
    }

    suggestions {
        uuid id PK
        text body "1 to 2000 characters"
        text email "only if a reply was asked for"
        timestamptz created_at
    }
```

Deleting a user deletes their application, and deleting an application
deletes its events and notifications. The other links to `users`
(`decided_by`, `actor_id`, `sent_by`, `resolved_by`) are set to null instead,
so the history outlives the admin who made it.

| Enum | Values |
| --- | --- |
| `user_role` | `member`, `admin`, `superadmin` |
| `application_status` | `draft`, `submitted`, `accepted`, `rejected`, `waitlisted`, `withdrawn` |
| `notification_state` | `sending`, `sent`, `failed`, `uncertain` |
| `notification_kind` | `decision`, `resend` |
| `creator_card_status` | `pending`, `approved`, `rejected` |
| `card_claim_status` | `pending`, `approved`, `rejected` |
| `follower_check_status` | `ok`, `not_found`, `unreadable`, `error` |

### Setting it up

1. Copy `.env.example` to `.env.local` and fill it in.
2. **Auth0**: create a *Regular Web Application*. Allowed Callback URLs
   `{APP_BASE_URL}/auth/callback`, Allowed Logout URLs `{APP_BASE_URL}`.
   Enable the `google-oauth2` connection on it.
3. **Database**: create a Postgres on Render, put its external URL in
   `DATABASE_URL`, then run the migrations:

   ```bash
   npm run db:migrate
   ```

   After changing `lib/db/schema.ts`, run `npm run db:generate` to write a
   new migration, then `npm run db:migrate`.
4. **S3**: create a private bucket (block all public access, no CORS
   needed) and an IAM user with `s3:PutObject`, `s3:GetObject`,
   `s3:DeleteObject` and `s3:AbortMultipartUpload` on it.
5. **First superadmin**: sign in once on the site, then in the database:

   ```sql
   update users set role = 'superadmin' where email = 'you@example.com';
   ```

   From then on roles are managed at `/admin/users`.

### Decision emails

Saving a decision never emails anyone. An applicant is owed an email while
their status is accepted, rejected or waitlisted and differs from the decision
they were last emailed, so a changed decision is owed again and nobody is
written to twice for the same one. Design and reasoning:
`docs/design/decision-emails.md` and `docs/adr/0001-decision-emails-via-ses.md`.

- **Wording.** One file per email in `lib/emails/`. To change one, edit its
  subject or paragraphs and change `version`, which is stored with every
  send. Setting `approved: false` stops the live site sending that email.
- **`EMAIL_DELIVERY`.** `off` (the default) sends nothing. `simulate` runs
  everything with a fake transport and only against a local database; an
  address starting `fail+` is refused and one starting `timeout+` never
  answers. `live` sends real mail: to applicants only from the production
  site, and anywhere else only the "Send me a test" link in the bulk dialog.
- **A send that never confirmed** (a timeout, a crash) shows as "needs
  review" and blocks that applicant until an admin records whether it
  arrived. Nothing is retried automatically.

The SES account, the DNS records, the IAM permissions and the move to
`buddhistcreators.com` are written up in
[`docs/setup/domain-and-email-setup.md`](docs/setup/domain-and-email-setup.md):
what was set up, the exact records and policies, what is still to do before
sending goes live, and the error messages met along the way.

To take the form offline, set `REGISTRATION.open` to `false` in
`lib/convention-2027.ts`; the register button is shown disabled.
