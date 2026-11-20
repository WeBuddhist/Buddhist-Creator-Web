# Getting started

## Run the public site

```bash
npm install
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" > .env.local
npm run dev
```

Open <http://localhost:3000>. `NEXT_PUBLIC_SITE_URL` is the one variable
the site cannot start without: there is no fallback, so a sitemap or
social card never points at the wrong host. Without Auth0 set, the proxy logs one warning and everything
that needs a session (registration, nominations, creator cards, the
dashboard) is off. Without a database, pages that read it (the
leaderboard, the directory) cannot load their data.

## Run everything

1. Copy `.env.example` to `.env.local` and fill it in. Every variable is
   explained in that file; the groups are below.
2. Use a **local or throwaway Postgres**, not production. Put its URL in
   `DATABASE_URL` and set `DATABASE_SSL=false` for a local one. Then:

   ```bash
   npm run db:migrate
   ```

   `db:migrate` runs against whatever `DATABASE_URL` says, read from
   `.env.local` when that file exists. Check which database that is before
   running it.
3. Sign in once on the site, then make yourself a superadmin in the
   database:

   ```sql
   update users set role = 'superadmin' where email = 'you@example.com';
   ```

   From then on roles are managed at `/admin/users`.

### Environment variables

| Group | Variables | Needed for |
| --- | --- | --- |
| Database | `DATABASE_URL`, `DATABASE_SSL` | Anything stored: applications, cards, nominations, suggestions, users |
| Auth0 | `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `APP_BASE_URL` | Sign-in |
| S3 | `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`, `AWS_BUCKET_OWNER`, `PRESIGNED_URL_EXPIRY_SECONDS` | Intro videos, card photos, nomination pictures |
| Email | `EMAIL_DELIVERY`, `SENDER_EMAIL`, `SENDER_NAME`, `SES_REGION`, `SES_ACCESS_KEY`, `SES_SECRET_KEY`, `SES_CONFIGURATION_SET` | Decision emails. Leave `EMAIL_DELIVERY=off` locally |
| Site | `NEXT_PUBLIC_SITE_URL` | Always. Absolute links, social cards, sitemap. Read at build time |
| Follower counts | `YOUTUBE_API_KEY`, `SOCIALCRAWL_API_KEY`, `CRON_SECRET` | Reading follower counts. SocialCrawl spends paid credits, so leave its key empty locally unless you mean to spend them |

S3 and email variable names match the WeBuddhist backend on purpose; keep
them that way.

### Auth0

Create a *Regular Web Application*:

- Allowed Callback URLs: `{APP_BASE_URL}/auth/callback`
- Allowed Logout URLs: `{APP_BASE_URL}`
- Enable the `google-oauth2` and `apple` connections on it.

The site's own `/login` page sends each button straight to its
connection, so Auth0's hosted chooser never shows. A first sign-in
creates the user (role `member`); there is no separate sign-up.

### S3

A private bucket (block all public access, no CORS needed) and an IAM user
with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` and
`s3:AbortMultipartUpload` on it. Uploads pass through the app and reads
use presigned URLs.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serves the production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Writes a new migration in `drizzle/` after a change to `lib/db/schema.ts` |
| `npm run db:migrate` | Applies the migrations the database has not had yet |
| `npm run db:studio` | Drizzle Studio on the same database |
| `node scripts/medal-textures.mjs` | Rebuilds the awards medal's relief maps from its photographs (see [Awards 2027](features/awards-2027.md)) |

## Before you change code

- **Next.js here is 16.4.** APIs and conventions differ from older
  versions. Read the guide in `node_modules/next/dist/docs/` for anything
  you touch (this is also the rule in `AGENTS.md`).
- **Cache Components is on** (`cacheComponents: true`). The session is
  request data, so anything that reads it sits inside a `<Suspense>`
  boundary or is an action or route handler. See the comment at the top of
  `lib/auth.ts`.
- **There is no test runner.** Check a change by running it: `npm run
  build`, `npm run lint`, and the page itself. When `next dev` serves stale
  markup, a `build` then `start` shows the truth.
- **Sizes are in rem.** Above 1920 px wide the root font size grows with
  the viewport, so a size in px would not scale with the rest.
- **Read `.agents/skills/` before changing public pages.** They hold the
  design rules the site follows.
