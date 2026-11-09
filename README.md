![Buddhist Creators: a global sangha of creators, bringing the Dharma to the digital age](assets/readme-banner.png)

# Buddhist Creators

The website for [Buddhist Creators](https://buddhistcreators.com), a global sangha of monastics, practitioners and storytellers carrying the Dharma to the digital age through a convention, masterclasses, awards and campaigns.

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
| `/people` | The team and the creators |

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
| `lib/people.ts` | Team and creators |
| `lib/navigation.ts` | Site navigation, name, URL and default description |

Events are grouped by hand rather than by date, so move an entry to the right list once it passes.

## Known gaps

The homepage suggestion box doesn't save anything yet. `submitFeedback` in `app/actions.ts` is a placeholder until there's a backend.

## Registration and the admin dashboard

Applicants sign in through Auth0 (Google or email) and fill in the form at
`/convention/2027/register`. They can save a draft, upload a 2-minute intro
video, submit, and keep editing until the committee decides. Admins review at
`/admin`: accept, reject or waitlist each application, with a note and a
history of every change. Superadmins also manage roles at `/admin/users`.

How it fits together:

| Piece | Where |
| --- | --- |
| Auth0 client and sign-in gate | `lib/auth0.ts`, `proxy.ts` |
| Who is calling, roles | `lib/auth.ts`, `lib/auth-roles.ts` |
| Database schema and client | `lib/db/schema.ts`, `lib/db/index.ts`, migrations in `drizzle/` |
| Form copy, option lists, validation | `lib/registration-2027.ts` |
| Reads and writes, status transitions | `lib/applications.ts` |
| S3 (private bucket, presigned playback) | `lib/s3.ts`, upload handler at `app/api/applications/video/route.ts` |
| The form | `app/convention/2027/register/` |
| The dashboard | `app/admin/` |

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

To take the form offline, set `REGISTRATION.open` to `false` in
`lib/convention-2027.ts`; the register button is shown disabled.
