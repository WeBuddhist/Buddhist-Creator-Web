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
| `/convention/2027/awards` | The 2027 awards: the categories and the invitation to nominate |
| `/convention/2027/awards/nominate` | The nomination form (sign-in required) |
| `/creators` | The leaderboard of the most followed creators (also on the home page), and the creators directory: every approved creator card, searchable and paged |
| `/creator-card` | A creator's own page: their card, their place on the leaderboard and their part in the mission; also where a card the team made is claimed (sign-in required) |
| `/creator-card/edit` | The form a creator card is made and changed with (sign-in required) |
| `/creator-card/share/story`, `/share/post` | A picture of the creator's approved card to post (sign-in required) |
| `/team` | The team, and the invitation to join it |
| `/admin` | The dashboard: applications and decision emails, creator cards and claims, award nominations, suggestions, users (admin role required) |

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, Cache Components) with React 19 and TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4, [Base UI](https://base-ui.com) and [shadcn/ui](https://ui.shadcn.com), [Phosphor Icons](https://phosphoricons.com)
- [TanStack Query](https://tanstack.com/query) for client-side writes, [Zod](https://zod.dev) for validation
- [Auth0](https://auth0.com) for sign-in (Google and Apple), [Drizzle](https://orm.drizzle.team) on Postgres (Render)
- AWS S3 for uploads (intro videos, card photos, nomination pictures) and SES for decision emails
- [React Three Fiber](https://r3f.docs.pmnd.rs) for the podium cards and the awards medal, `next/og` for social cards and share images
- YouTube Data API v3 and [SocialCrawl](https://www.socialcrawl.dev) for follower counts, read daily by a GitHub Actions schedule

## Quick start

```bash
npm install
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" > .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That is enough for the
public pages. For sign-in, the database, uploads and the dashboard, copy
`.env.example` to `.env.local` and follow
[Getting started](docs/getting-started.md).

> `npm run db:migrate` runs against whatever `DATABASE_URL` says. Check
> which database that is before running it.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm run start` | Production build, and serving it |
| `npm run lint` | ESLint |
| `npm run db:generate` | A new migration after a change to `lib/db/schema.ts` |
| `npm run db:migrate` | Applies the migrations in `drizzle/` the database has not had yet |
| `npm run db:studio` | Drizzle Studio on the same database |

## Project structure

```text
app/          Routes: public pages in (site)/, the dashboard in admin/, route handlers in api/
components/   Page sections, grouped by page, with shared UI in components/ui
lib/          Page content, data access, rules and outside services
drizzle/      SQL migrations
scripts/      The migration runner and the medal texture builder
docs/         Project documentation
public/       Files served by the site
assets/       Fonts and images used at build time, plus this README's banner
```

## Documentation

Everything else is in [`docs/`](docs/README.md):

- [Getting started](docs/getting-started.md): environment variables, Auth0, S3, local database
- [Architecture](docs/architecture.md): how the app fits together, identity and roles, uploads, the data model
- [Editing content](docs/content-editing.md): where the copy lives, and the switches that open and close forms
- [Operations](docs/operations.md): deploying, migrations, roles, the follower run
- Features: [registration and the admin dashboard](docs/features/registration-and-admin.md),
  [creator cards](docs/features/creator-cards.md),
  [follower counts and the leaderboard](docs/features/followers-and-leaderboard.md),
  [awards 2027](docs/features/awards-2027.md)
- Decisions: [ADR-0001, decision emails via SES](docs/adr/0001-decision-emails-via-ses.md)

Next.js here is version 16, which differs from older versions. Read the
guide in `node_modules/next/dist/docs/` before changing code (see
`AGENTS.md`).
