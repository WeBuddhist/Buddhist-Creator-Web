# Creator cards

A creator card says who a creator is, what they make and where to find it:
a photo, display name, country, whether they create as a monastic, lay
practitioner, organization or teacher, the languages they publish in, the
kinds of content they make, one line about their work, and their links.

Approved cards are public in the directory at `/creators`, most followed
first, thirty to a page, searchable by name and filterable by country.
Both filters live in the URL and the database does the narrowing.

There are two kinds of card:

- **A creator's own card**, made by a signed-in creator and reviewed by an
  admin.
- **A team card**, made by the team for a creator it knows. It has no
  owner (`user_id` is null), is approved as it is made, and can be claimed
  by the creator.

## A creator's own card

| Route | What |
| --- | --- |
| `/creator-card` | The creator's own page. Their card, where the review stands, their place on the leaderboard and what the week did to it, each channel's own figure and place, how creators are spread by audience, and their part in the mission's figure. Also where a claim waits |
| `/creator-card/edit` | The form, with the card drawn beside it as they type |

The form is only for making or changing a card. Sending it ends on
`/creator-card`. The actions (Submit for review, or Save changes, and
Cancel) float at the foot of the screen.

**Every change goes back to review**, even to an approved card, so nothing
is approved unread. A review names the card's `revision` and is refused if
the creator has changed the card since. Follower counts and other ranking
data never send a card back to review; the review verifies the creator.

**The photo** is the picture from the sign-in account unless the creator
uploads one. An upload is cropped square, scaled to 512 px and compressed
in the browser, checked on the server (one WebP or JPEG, at most 512 KB),
and stored as a new object under `creator-cards/<user id>/`. The object it
replaces is deleted.

**On their page** the card is a collectible card like the leaderboard's top
three, drawn in WebGL where the browser can (see
[Architecture](../architecture.md#drawing-in-3d)). Its face is a pale cyan
sky of Tibetan clouds (`lib/card-damask.ts`) that clears to pearl, with the
lion on a small holographic seal in its bottom corner (`lib/card-seal.ts`,
`components/creator-card/card-seal.tsx`) whose colours run as the card
tilts. The leaderboard's top three carry the same seal on the edge of the
photo. A click brings
it forward to the middle of the screen, larger, spinning once round on its
way, so its brand-cyan back is seen as it comes: woven cloth with the same
clouds and the lion in white. A click on it or beside it, Escape or a scroll
sends it back. A card waiting for review, or
sent back, shows its details and figures but no place on any board.

## Sharing a card

An approved card's owner can share it as a picture, from the share drawer
on `/creator-card` (`components/creator-card/share-card.tsx`). The drawer
shows the picture first. On a phone the main button hands the file to the
share sheet; the picture can always be saved.

| Shape | Route | Size |
| --- | --- | --- |
| Story | `/creator-card/share/story` | 1080 × 1920 (9:16) |
| Post | `/creator-card/share/post` | 1080 × 1350 (4:5) |

The picture is drawn on the server with `next/og` in `lib/card-share.tsx`,
from the same data the creator's page shows, so it never says more than the
page. It is `private, max-age=3600`; the page asks for it with a `?v=` that
changes when the card or its counts do.

Satori, which draws it, has no CSS variables, `color-mix`, grid or em
letter-spacing, and cannot read WebP. Colours and tracking are worked out
by hand in that file, and photos are converted with `sharp` before they go
in. A style value that is `undefined` crashes it, so leave such keys out.

## Review

Admins review at `/admin/creator-cards`: approve, or reject with a note the
creator reads on their card page.

| Page | What |
| --- | --- |
| `/admin/creator-cards` | All cards, by status, searchable by name. "Add a creator" |
| `/admin/creator-cards/[id]` | One card: review it, or decide a claim on it |
| `/admin/creator-cards/[id]/edit` | Edit a team card |
| `/admin/creator-cards/new` | Make a team card |
| `/admin/creator-cards/claims` | Claims waiting |
| `/admin/creator-cards/followers` | Links that gave no follower count |

## The team's cards

The first team cards came from the team's shared sheets, through
migrations (`0009`–`0013`, `0017`, `0026`–`0027`). Their pictures are the
creators' public profile pictures, stored under
`creator-cards/profile-pictures/`, or initials when there is none.

From the dashboard, without a migration:

- **Add a creator** makes a card from a name and at least one link.
- **Edit card** on a card nobody owns changes its name, country, line,
  links and photo. The editor never opens a card with an owner; that card
  is the creator's.
- **Remove** (superadmin only, after a confirmation).

Saving keeps the card approved, since the admin is the reviewer, and then:

- reads the follower count of each new or changed link at once
  (`readCardLinks`), so the count is on the card when it opens. YouTube is
  free; Instagram, TikTok and Facebook cost a SocialCrawl credit each and
  Douyin six. A link already read this week (this quarter for Douyin) is
  not read again;
- refuses a link another card already has, since one account is one
  creator;
- gives a card with no photo the profile picture the reading brought
  (`lib/team-card-photo.ts`), fetched only from the hosts such pictures are
  served from.

## Claims

A team card can be claimed. **A claim is a request, never a transfer.**
Signing in proves an email address, not that its owner runs the channel,
so nothing changes hands until an admin approves.

1. **Claim.** "Claim this card" in the directory leads, through sign-in, to
   a screen that shows the card and takes the claim, with an optional
   note. The claim is stored in `creator_card_claims` with a code made on
   the server (`BC-` and eight characters). The card stays unowned and
   listed.
2. **Prove.** The claimant's `/creator-card` page shows the claim waiting
   and the code to put in the bio or description of the channel on the
   card. Only whoever runs the channel can put it there, and the team can
   see it without being sent anything. The claimant can withdraw.
3. **Decide.** Admins see claims at `/admin/creator-cards/claims` and
   decide each on the card's page, beside its links: approve, or reject
   with a note. Approving (`reviewClaim`) makes the claimant the owner,
   keeps the card approved, and rejects every other claim on it. From then
   on edits go to review like any other card.
4. **Undo.** "Undo approval" on the card's admin page
   (`undoClaimApproval`) takes the owner off. The card can be claimed
   again, the claim becomes rejected with a note, and the claims that
   approval turned away go back to waiting. If the person changed the card
   while it was theirs, it goes back to pending and out of the directory
   until reviewed. A card a creator made themselves has no claim to undo.

Several people may claim one card. A person has one claim waiting at a
time, and none while they own a card. Nothing is emailed at any step.

## Layout of a card

Every card is laid out the same way: the photo as a circle top left, then
the name, the country and follower total, the links, and the line about
the creator's work. What a creator adds beyond that (how they create, kinds
of content, languages) follows under a rule. An approved card carries the
verification mark on the edge of its photo
(`components/creator-card/verified-mark.tsx`), which says "Verified by
Buddhist Creators" when pointed at or tapped. In the directory, a card
nobody owns has "Claim this card" in its top right corner.

## Where things are

| Piece | Where |
| --- | --- |
| Option lists, copy, validation, photo rules | `lib/creator-card.ts` |
| Reads, writes, status and claim rules | `lib/creator-cards.ts` |
| The creator's page data | `lib/creator-home.ts` |
| The card | `components/creator-card/creator-card.tsx` |
| The collectible card | `components/creator-card/collectible-card.tsx`, `components/creators/podium/` |
| Photo preparation in the browser | `components/creator-card/photo.ts` |
| The creator's page | `app/(site)/creator-card/page.tsx`, `card-home.tsx` |
| The form | `app/(site)/creator-card/edit/`, `card-form.tsx`, `card-fields.tsx` |
| Claiming | `app/(site)/creator-card/claim-card.tsx` |
| Sharing | `components/creator-card/share-card.tsx`, `lib/card-share.tsx`, `app/(site)/creator-card/share/[format]/route.ts` |
| Review and claims | `app/admin/creator-cards/` |
| The team's cards | `app/admin/creator-cards/card-editor.tsx`, `editor-actions.ts`, `lib/team-card-photo.ts` |
| The directory | `app/(site)/creators/`, `components/creators/` |
