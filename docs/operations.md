# Operations

How to run the live site. Production is one Render web service with a
Render Postgres, served at `https://buddhistcreators.com` through
Cloudflare. How the domain, Auth0 URLs and SES were set up is in
[Domain and email setup](setup/domain-and-email-setup.md).

This repository is public. Keep account numbers, keys and personal
addresses out of commits, issues and workflow logs.

## Deploying

Render builds and serves the app from this repository (the service is
named in the setup record).

- `NEXT_PUBLIC_SITE_URL` is read at **build** time and has no fallback. A
  build without it fails, and a failed build leaves the previous deploy
  running.
- Saving an environment variable on Render redeploys the service. Expect a
  few minutes of intermittent 502s.
- The instance has 512 MB of memory. Image optimisation is off on purpose
  (`next.config.ts`); resize images before adding them. To see real memory
  use, watch the process with `top`, not `ps`.

## Running a migration on production

1. Write the migration (`npm run db:generate` after a schema change, or a
   hand-written SQL file for data) and commit it.
2. Check where `DATABASE_URL` points. **`.env.local` may point at
   production.**
3. `npm run db:migrate`. It applies only what the database has not had and
   prints the tables it finds.

Add creators from a new sheet as a new migration; never edit one that has
already run.

## Roles

The first superadmin is set in the database once:

```sql
update users set role = 'superadmin' where email = 'person@example.com';
```

The person must have signed in once first. After that, superadmins manage
roles at `/admin/users`.

## Opening and closing forms

| To | Change, then deploy |
| --- | --- |
| Close registration | `REGISTRATION.open = false` in `lib/convention-2027.ts` |
| Close nominations | `AWARDS_2027.open = false` in `lib/awards-2027.ts` |

## Decision emails

Sending is controlled by `EMAIL_DELIVERY` on Render (`off`, `simulate`,
`live`). Steps to go live and how to check a send are in
[Domain and email setup → Going live](setup/domain-and-email-setup.md#going-live).

A send that never confirmed shows as "needs review" on the applicant's
page. Check whether it arrived (SES, or ask the applicant), then record the
outcome there. Nothing retries on its own.

## Follower refresh

The daily run is `.github/workflows/follower-refresh.yml` (01:17 UTC). How
it decides what to read is in
[Follower counts and the leaderboard](features/followers-and-leaderboard.md).

**Checking it.** Actions tab → Follower refresh. Each call prints a line of
totals and `remaining`. The run succeeds when `remaining` reaches 0.

**Links that gave no figure** are listed at
`/admin/creator-cards/followers`. Fix the link on the card (team cards in
the card editor), or leave it if the account is gone or hides its count.

**Reading everything again now.** Actions → Follower refresh → Run
workflow, tick the box. This reads every link except Douyin's and costs a
SocialCrawl credit per Instagram, TikTok and Facebook link, so do it only
when needed.

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| The run fails with 401 `UNAUTHORIZED` | `CRON_SECRET` differs between Render and the GitHub secret | Set the same value in both |
| 503 `NOT_CONFIGURED` | `CRON_SECRET` is not set on Render | Set it |
| 409 `ALREADY_RUNNING` | Another call is still reading | Wait; the next run carries on |
| 503 with `stopped` in the reply | A service stopped: SocialCrawl out of credits, YouTube quota used up, or a key refused | Check the key, quota or credits named, then run the workflow again |
| The run cannot connect | `FOLLOWER_REFRESH_URL` is wrong | It must be the full address of `/api/cron/follower-refresh` on the live domain |
| "Still N to read after 10 calls" | More links due than ten calls could read | Run it again; it picks up where it stopped |

## Debugging a signed-in page locally

Never point a local experiment at production. To reproduce something
behind sign-in, use an isolated copy of the repo with its own throwaway
database and a test `AUTH0_SECRET`, and make the session cookie yourself.
Check a sign-in redirect chain with `curl` rather than a browser.
