# Registration and the admin dashboard

Applicants sign in (Google or Apple) and fill in the form at
`/convention/2027/register`. They can save a draft, upload a two-minute
intro video, submit, and keep editing until the committee decides. Admins
review at `/admin`.

## The applicant's side

- The form saves as a draft until submitted. After submitting it locks;
  **Edit** reopens it, and **Save changes** / **Cancel** float in a bar at
  the foot of the screen. Other submit-for-review forms on the site follow
  the same pattern.
- The intro video streams to S3 through `app/api/applications/video/route.ts`.
  The proxy skips that route so it does not buffer the body; the route
  checks the session itself.
- The applicant can keep editing until a decision is made.

## The dashboard

| Page | Who | What |
| --- | --- | --- |
| `/admin` | admin | Applications by status tab, sortable, with a filter by email status. Export the current tab as CSV (`/admin/export?status=…`) |
| `/admin/applications/[id]` | admin | One application: answers, video, history. Accept, reject or waitlist with a note; send or resend the decision email |
| `/admin/creator-cards` and below | admin | See [Creator cards](creator-cards.md) |
| `/admin/nominations` | admin | See [Awards 2027](awards-2027.md) |
| `/admin/suggestions` | admin (removing: superadmin) | The home page suggestion box, newest first |
| `/admin/users` | superadmin | Roles |

The sidebar and breadcrumbs are in `components/admin/admin-shell.tsx`.

The CSV export (`lib/applications-csv.ts`) holds exactly the rows of the
tab the admin is on (everything but drafts by default), with labels as the
detail page shows them, one column per platform link, and dates in the
convention's time zone.

## Decision emails

Saving a decision never emails anyone. An applicant is **owed** an email
while their status is accepted, rejected or waitlisted and differs from the
decision they were last emailed (`notified_status`). So a changed decision
is owed again, and nobody gets the same decision twice from a bulk send.

- **One applicant**: from their detail page. A resend of the same decision
  is possible there after a confirmation.
- **In bulk**: "Send emails" on the list sends to everyone owed in the
  current tab, in chunks of ten, with progress. Bulk never resends.
- **A send that never confirmed** (a timeout, a crash) shows as "needs
  review" and blocks that applicant until an admin records whether it
  arrived. Nothing is retried automatically.

`EMAIL_DELIVERY` controls what really goes out:

| Value | Effect |
| --- | --- |
| `off` (default) | Nothing is sent |
| `simulate` | Runs everything with a fake transport, only against a local database. An address starting `fail+` is refused, one starting `timeout+` never answers |
| `live` | Real mail. To applicants only from the production site; elsewhere only the "Send me a test" link in the bulk dialog |

Design and reasoning: [ADR-0001](../adr/0001-decision-emails-via-ses.md),
[the system design](../design/decision-emails.md), and
[the domain and SES setup](../setup/domain-and-email-setup.md).

## Suggestion box

The home page suggestion box saves each suggestion to `suggestions`
(`lib/suggestions.ts`, called from `submitFeedback` in `app/actions.ts`).
An email is stored only if the sender asked for a reply.

## Where things are

| Piece | Where |
| --- | --- |
| Form copy, option lists, validation | `lib/registration-2027.ts` |
| Reads, writes, status transitions | `lib/applications.ts` |
| The form | `app/(site)/convention/2027/register/` |
| The dashboard | `app/admin/`, `components/admin/` |
| Who is owed an email, sending, the ledger | `lib/notifications.ts`, `lib/ses.ts` |
| Email wording | `lib/emails/` |
| CSV export | `app/admin/export/route.ts`, `lib/applications-csv.ts` |
