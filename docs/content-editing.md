# Editing content

Most copy lives in typed data files in `lib/`, so it can be changed
without touching the components. TypeScript checks the shape, so `npm run
build` catches a missing field.

| File | Content |
| --- | --- |
| `lib/home.ts` | Home page copy |
| `lib/mission.ts` | The mission's goal (200 million) and year, used by the progress bar |
| `lib/get-involved.ts` | Get Involved page |
| `lib/events.ts` | Events listing |
| `lib/convention-2026.ts` | Convention 2026 page |
| `lib/convention-2027.ts` | Convention 2027 page, including the registration switch |
| `lib/registration-2027.ts` | Registration form copy, option lists and validation |
| `lib/awards-2027.ts` | The 2027 awards, their page and the nomination form, including the nominations switch |
| `lib/team.ts` | The team |
| `lib/creators.ts` | Creators page and leaderboard copy, and the search and country in the URL |
| `lib/creator-card.ts` | Creator card form copy, option lists and validation, and the share drawer's copy |
| `lib/emails/*.ts` | The three decision emails (see below) |
| `lib/navigation.ts` | Site navigation, name, URL and default description |

Events are grouped by hand rather than by date, so move an entry to the
right list once it passes.

## Switches

| To | Change | Effect |
| --- | --- | --- |
| Close convention registration | `REGISTRATION.open = false` in `lib/convention-2027.ts` | The register button shows disabled |
| Close award nominations | `AWARDS_2027.open = false` in `lib/awards-2027.ts` | The form turns read-only, the server refuses changes, the pages say nominations are closed |
| Stop one decision email being sent | `approved: false` in its file in `lib/emails/` | The live site will not send that email |

## Decision emails

One file per email in `lib/emails/`: `accepted.ts`, `rejected.ts`,
`waitlisted.ts`. To change one, edit its subject or paragraphs **and
change its `version`**. The version is stored with every send, so the
ledger shows which wording each person got.

## Awards

An award's name, description, the fields its form asks for and last year's
winner are all in `AWARD_GROUPS` in `lib/awards-2027.ts`. Its photographs
are in `components/awards/photos.ts`, kept apart so the server action can
import the awards without pulling in images.

An award's `slug` is what nominations are stored under. Do not rename the
slug of an award that already has nominations; change its `title` instead.

## Adding a page

1. Add the route under `app/(site)/` for a public page.
2. Add it to `ROUTES` in `app/sitemap.ts`.
3. Give it an `opengraph-image.tsx` with `ogCard()` from `lib/og-card.tsx`
   if it should have its own social card.
4. Add it to `lib/navigation.ts` if it belongs in the menu.
