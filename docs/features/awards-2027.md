# Awards 2027

The Buddhist Creators Convention Awards 2027: eight awards in two groups,
and a form anyone signed in can use to nominate.

| Route | What |
| --- | --- |
| `/convention/2027/awards` | The awards page: the turning medal, the awards and the invitation to nominate |
| `/convention/2027/awards/nominate` | The nomination form (sign-in required) |
| `/admin/nominations` | Every nomination, award by award (admin) |

## The awards

| Group | Award | The form asks for |
| --- | --- | --- |
| A. Best Social Content | Influencer of the Year 2027 | Name, profile link, reason |
| | Audience Choice Award | Name, profile link, a video link, reason |
| | Most Creative Video Award | Name, their social media, the video, reason |
| | Most Viral Content Award (new) | Name, their social media, the content, reason |
| B. Best Art (all new this year) | Best Music | Name, their social media, the music, reason |
| | Best Painting / Visual Art | Name, their social media, a link **or a picture** (or both), reason |
| | Best Poem | Name, their social media, the content, reason |
| | Best Photography | Name, their social media, a link **or a picture** (or both), reason |

The exact fields, wording and last year's winners are in `AWARD_GROUPS` in
`lib/awards-2027.ts`.

## Nominating

The rule is **one person per award**: a nominator may nominate in as many
awards as they like, one person in each, and leave the rest blank.

- A nominator has one **ballot** a year (`nomination_ballots`): their name
  and country. Their email is the account's.
- Each award they fill in is one row in `nominations`. A unique index on
  (ballot, award) enforces the rule. An award left blank has no row.
- The first save is the submission. After that the form locks and can be
  edited (Edit, Save changes, Cancel), like the registration form. A save
  stores the whole ballot: an award emptied on an edit loses its
  nomination.
- Nominations can be changed until `AWARDS_2027.open` is set to `false`.
  Then the form is read-only and the server refuses changes.

**Pictures** (Best Painting and Best Photography) are scaled in the browser
to a long side of 1600 px and at most 800 KB, checked on the server by
their bytes, and stored privately at
`award-nominations/2027/<user id>/<uuid>.<ext>`. A new picture is uploaded
before the save and deleted if the save fails; pictures nothing points to
any more are deleted after it succeeds.

## The dashboard

`/admin/nominations` lists every nomination, award by award. Nominations
of the same name, typed the same way (ignoring case and spacing), are
grouped, with how many people put that name forward. Anything subtler is
for the jury.

## The medal

The awards page opens on a gold medal struck with a walking lion, after
the 1st-century coin from Tillya Tepe, turning slowly on white. The back
shows the Buddha turning the Dharma wheel.

- The server sends a still picture (`public/awards/medal-still.webp`).
  Where the browser can afford it, the three.js scene
  (`components/awards/medal/`) is fetched once the page settles and fades
  in from the same pose. It turns only while on screen and the tab is
  visible.
- The relief comes from photographs of the medal
  (`assets/awards/medal-lion.webp`, `medal-buddha.webp`).
  `node scripts/medal-textures.mjs` turns them into normal and
  occlusion/roughness/metalness maps in `public/awards/`. Re-run it after
  changing a photograph.

## Where things are

| Piece | Where |
| --- | --- |
| Awards, page and form copy, validation, limits | `lib/awards-2027.ts` |
| Award photographs | `components/awards/photos.ts` |
| Reads and writes | `lib/nominations.ts` |
| The form and its action | `app/(site)/convention/2027/awards/nominate/` |
| Award cards, medal | `components/awards/` |
| Dashboard list | `app/admin/nominations/page.tsx` |
| Tables | `nomination_ballots`, `nominations` in `lib/db/schema.ts`; migrations `0025`, `0028`, `0029` |
