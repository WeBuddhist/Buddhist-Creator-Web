# System design: decision emails for the admin route

## 1. Requirements

**Functional**
- Three emails: accepted, rejected, waitlisted (the stored status value is `waitlisted`).
- From `hello@buddhistcreators.com`, through AWS SES.
- Send to one applicant from their detail page.
- Send in bulk from the list, scoped by the status tab. On "All", everyone owed any of the three gets their own mail.
- An applicant whose decision changed after being emailed gets the mail for the new decision on the next send.
- Bulk never mails someone already emailed for their current status.
- A single applicant can be re-sent the same mail after a confirm. Bulk cannot do this.
- Sending is manual. Saving a decision never sends.

**Non-functional**
- No duplicate mail from double clicks, two admins, retries or crashes.
- Every send attempt is recorded: who, to which address, which decision, result.
- A dev or preview environment cannot mail real applicants by accident.
- A bulk run of a few hundred finishes in about a minute and shows progress.

**Constraints**
- Next.js 16.4.5 with `cacheComponents`; read `node_modules/next/dist/docs/` before writing code (project rule in `AGENTS.md`).
- One Node service on Render, Postgres through Drizzle. No queue or worker.
- No test framework in the repo.
- Templates are not written yet.

**Assumptions**
- Hundreds to low thousands of applicants; one to a handful of admins.
- The `admin` role may send, the same role that decides.
- English only until the committee says otherwise.

## 2. High-level design

```
 Admin browser                    Next.js server (Render)                 AWS
┌──────────────────────┐   ┌────────────────────────────────────┐   ┌──────────┐
│ List: "Send emails"  │──▶│ app/admin/actions.ts               │   │          │
│  confirm dialog      │   │  previewBulkSendAction             │   │          │
│  chunk loop (10 ids) │──▶│  sendBulkChunkAction               │   │          │
│                      │   │            │                       │   │          │
│ Detail: "Send" /     │──▶│ app/admin/applications/[id]/       │   │          │
│  "Send again" /      │   │  actions.ts  send / resend /       │   │          │
│  resolve             │   │              resolve               │   │          │
└──────────────────────┘   │            ▼                       │   │          │
                           │ lib/notifications.ts               │   │          │
                           │  claim → render → send → record    │   │          │
                           │    │           │          │        │   │          │
                           │    ▼           ▼          ▼        │   │          │
                           │ Postgres   lib/emails/  lib/ses.ts │──▶│ SES v2   │
                           │ (ledger +  templates    SendEmail  │   │ SendEmail│
                           │ notified_status)                   │   └──────────┘
                           └────────────────────────────────────┘
```

**Data flow for one send**
1. **Claim.** Insert a ledger row in state `sending`, only if the applicant is still owed this decision and has no in-flight row.
2. **Render.** Build subject, text and HTML from the claimed decision and the name and address captured at claim time.
3. **Send.** One SES `SendEmail` call, no SDK retries.
4. **Record.** In one transaction, mark the ledger row `sent` and set `notified_status` and `notified_at` on the application to what was actually sent.

Bulk is the same path once per applicant. Individual and bulk share one function.

## 3. Data model

**`applications`: one new column**

| Column | Type | Meaning |
|---|---|---|
| `notified_status` | `application_status`, nullable | The decision last emailed. Written only by the mailing step. |
| `notified_at` (exists) | timestamp | When `notified_status` was emailed. |

Owed an email: `status IN ('accepted','rejected','waitlisted') AND notified_status IS DISTINCT FROM status`.

`setApplicationStatus` stops clearing `notified_at` (remove `lib/applications.ts:289-290`).

**`application_notifications`: new ledger table**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, pk | Also sent to SES as a message tag |
| `application_id` | uuid, fk, cascade | |
| `status` | `application_status` | The decision this mail announces |
| `kind` | enum `decision` \| `resend` | `resend` is the forced re-send |
| `state` | enum `sending` \| `sent` \| `failed` \| `uncertain` | |
| `recipient_email`, `recipient_name` | text | Captured at claim time; `users.email` can change on sign-in |
| `template_version`, `subject` | text | What was sent |
| `ses_message_id` | text | |
| `error_code`, `error_message` | text | |
| `sent_by` | uuid, fk users, set null | |
| `batch_id` | uuid, nullable | Groups one bulk run; no batch table |
| `resolved_by`, `resolved_at` | | Who cleared an `uncertain` row |
| `created_at`, `sent_at` | timestamptz | `created_at` is the claim time |

**Indexes**
- Partial unique on `(application_id) WHERE state IN ('sending','uncertain')`. This is the lock: one in-flight send per application.
- `(application_id, created_at)` for the detail page's send log.

**Checks (hand-added to the migration)**
- `notified_status` is null or one of the three decisions.
- `notified_status` and `notified_at` are both null or both set.
- Ledger `status` is one of the three decisions.

Migration is `drizzle/0003_decision_emails.sql`: additions only, so `npm run db:generate` runs without prompts. No backfill is needed, since nothing has ever written `notified_at`.

**What gets sent, by sequence**

| Sequence | Result |
|---|---|
| Waitlisted (emailed), then accepted | Accepted mail is owed |
| Waitlisted (emailed), accepted (not emailed), back to waitlisted | Nothing; they were last told waitlisted |
| Accepted (emailed), waitlisted (emailed), accepted | Accepted mail is owed again |
| Accepted (emailed), undo to submitted | Nothing is sent; the admin UI warns they were told accepted |
| Accepted (emailed), undo, rejected | Rejected mail is owed; the UI flags "previously told accepted" |
| Status changes while a send is in flight | The mail in flight is recorded as sent; the new decision is owed |
| 10 accepted and emailed, an 11th accepted later | Bulk reaches only the 11th |

## 4. Send algorithm

1. **Sweep.** Rows in `sending` older than 5 minutes become `uncertain`.
2. **Claim.** One statement, no transaction held across the network call:

```sql
WITH target AS (
  SELECT a.id, a.status, u.email,
         coalesce(nullif(btrim(a.full_name), ''), u.name) AS name
  FROM applications a JOIN users u ON u.id = a.user_id
  WHERE a.id = $1
    AND a.status = $2                                -- the status the admin saw
    AND a.status IN ('accepted','rejected','waitlisted')
    AND a.notified_status IS DISTINCT FROM a.status  -- resend: "= a.status" and notified_at matches the page
  FOR UPDATE OF a
)
INSERT INTO application_notifications
  (application_id, status, kind, state, recipient_email, recipient_name, sent_by, batch_id)
SELECT id, status, $3, 'sending', email, name, $4, $5 FROM target
ON CONFLICT (application_id) WHERE state IN ('sending','uncertain') DO NOTHING
RETURNING id, status, recipient_email, recipient_name;
```

3. **No row returned.** Read once to say why (status changed, already sent, being sent, needs review). Outcome: `skipped`.
4. **Render** from the claimed status. On the live site a template still marked `approved: false` is refused before the claim, so no ledger row is written; the bulk dialog leaves that group out of the run.
5. **Send** with `maxAttempts: 1` and a 10 second timeout.
6. **Record the outcome.**

| SES result | Ledger state | Applicant |
|---|---|---|
| Accepted | `sent`, plus `notified_status` and `notified_at` in the same transaction | Up to date |
| Definite rejection (bad address, throttled, quota) | `failed` | Still owed; retried only when an admin sends again |
| Timeout, 5xx, or crash | `uncertain` | Blocked until an admin picks "Mark as sent" or "Not sent, allow retry" |

Account-level errors (sending paused, daily quota, sandbox recipient, access denied) also stop the batch with a clear message. So does an unknown outcome: one is a person's job to check before more mail goes out.

**Duplicate prevention**

| Case | What stops it |
|---|---|
| Double click | Server actions run one at a time per client; the second finds nothing owed |
| Two admins or two tabs | The partial unique index; the loser inserts nothing |
| Crash after SES accepted | Row parks as `uncertain`; never retried automatically |
| Forced re-send clicked twice | The claim requires the `notified_at` the page showed |

## 5. Server actions

All call `assertRole("admin")` and validate with zod, like `setStatusAction`.

| Action | File | Input | Returns |
|---|---|---|---|
| `sendDecisionEmailAction` | `app/admin/applications/[id]/actions.ts` | `applicationId`, `expectedStatus` | `sent` \| `skipped` \| `failed` \| `uncertain` \| `off`, with a message |
| `resendDecisionEmailAction` | same | plus `expectedNotifiedAt` | same |
| `resolveNotificationAction` | same | `notificationId`, `sent` \| `not_sent` | ok or message |
| `previewBulkSendAction` | `app/admin/actions.ts` (new) | the tab's filter | `batchId`, delivery mode, recipients grouped by decision with a "previously told" flag, blocked rows, SES quota |
| `sendBulkChunkAction` | same | `batchId`, up to 10 `{ id, status }` | per-id outcome, and an optional halt reason |
| `sendTestEmailAction` | same | which template | Mails the signed-in admin; writes no ledger row |

- The bulk action has no force option and only makes `decision` claims, so a re-send cannot reach the bulk path.
- No `revalidatePath` per chunk; the page refreshes once when the run ends.
- If a deploy lands mid-run, the next chunk call fails; the page reports "stopped after X of N, reload to continue".

## 6. Admin UI

**List (`app/admin/page.tsx`)**
- A strip above the table: "15 decision emails waiting: 12 accepted, 3 waitlisted. 2 need review."
- A "Send emails" button, scoped to the active tab. On "All" it covers all three decisions.
- An Email column before Status, an icon and a word: "Sent", "Not sent", "Sending…" or "Needs review"; a dash when there is no decision to send. The date, or the decision they were told before, is the cell's tooltip.
- Confirm drawer, from the right edge: delivery mode, counts per decision, the recipient list with "previously told a different decision" flagged, a quota warning if the run exceeds what SES allows today. Then a progress bar, a cancel button, and a summary.

**Detail (`components/admin/application-detail.tsx`)**
- A new "Email" section replaces the "Notified … / Not notified yet." text at line 126.
- Contents: the state line, "Send accepted email" (or rejected, waitlist), a quiet "Send again…" with a confirm when already up to date, the two resolve buttons for an `uncertain` row, and the send log.
- In the Decision card, when the applicant was already told something: "They were told Accepted on 4 Nov. Saving does not email them."

**CSV export:** an "Emailed decision" column beside the date, which is now headed "Emailed at".

**New UI pieces:** a drawer for the bulk send (`components/ui/drawer.tsx`, on Base UI `drawer`, moving like the mobile nav), a dialog for the single "Send again" confirm (`components/ui/dialog.tsx`, styled like the popup in `export-menu.tsx`), and a progress bar (Base UI `progress`).

## 7. Configuration and safety

| Env var | Purpose |
|---|---|
| `EMAIL_DELIVERY` | `off` (default), `simulate`, or `live` |
| `SENDER_EMAIL`, `SENDER_NAME` | `hello@buddhistcreators.com` and the display name. Same names as the WeBuddhist backend's config. |
| `SES_REGION`, `SES_ACCESS_KEY`, `SES_SECRET_KEY` | A sending-only IAM user. No fallback to the S3 keys, which sit in every developer's `.env.local`. |
| `SES_CONFIGURATION_SET` | Optional |

- `live` also requires `NODE_ENV=production` and not being a pull-request preview. Anywhere else it becomes test-only: real SES, but only "Send me a test" to the signed-in admin, so the SES setup can be checked from a laptop without touching applicants.
- `simulate` runs the whole pipeline with a fake transport and is refused unless the database is local, so a laptop pointed at the production database cannot mark people as notified.
- Templates live in `lib/emails/{accepted,rejected,waitlisted}.ts` with a shared layout that escapes values. Each ships as a placeholder with `approved: false` and cannot be sent until real wording replaces it.
- `review_note` is never put into a mail; it is the committee's internal note.

## 8. Files (for the build pass)

| File | Change |
|---|---|
| `lib/db/schema.ts`, `drizzle/0003_decision_emails.sql` | New column, two enums, ledger table, indexes, checks |
| `lib/ses.ts` (new) | Lazy SES v2 client in the style of `lib/s3.ts`; `sendEmail`, error classification, quota lookup, delivery mode |
| `lib/emails/*` (new) | Three templates, layout, index |
| `lib/notifications.ts` (new) | Owed counts and list, claim, send, resend, resolve, history |
| `lib/applications.ts` | Stop clearing `notified_at`; add notified fields to the list row; load the send log in `getApplication`; remove the unused `applicationsIn` |
| `lib/applications-csv.ts` | "Emailed decision" column |
| `app/admin/actions.ts` (new), `app/admin/applications/[id]/actions.ts` | The actions in section 5 |
| `app/admin/applications/[id]/email-actions.tsx` (new) | Client form for the Email section |
| `components/admin/bulk-send-dialog.tsx`, `components/admin/notification-status.tsx`, `components/ui/dialog.tsx` (new) | List strip, dialog, per-row state |
| `package.json` | `@aws-sdk/client-sesv2`, same version line as `client-s3` |
| `.env.example`, `README.md` | New variables and the SES setup steps |

## 9. Scale, reliability and testing

**Load**
- A few hundred mails per bulk run; SES sandbox allows 1 a second and 200 a day, production typically 14 a second.
- Chunks of 10, sent one after another and paced to the account's send rate, keep each request under about 8 seconds.
- Cost is about $0.10 per 1,000 mails.

**Monitoring**
- The "needs review" count on the admin list.
- Server logs carry the ledger id and SES message id for every send.
- SES console reputation metrics; keep the bounce rate under 5% and the complaint rate under 0.1%.

**Test plan for the build**
- With `EMAIL_DELIVERY=simulate` on a local database, walk every row of the sequence table in section 3 and check what the list and the ledger show.
- A script that fires two claims for the same application at once against local Postgres and expects one ledger row.
- In the SES sandbox, send each template to a verified address and to the SES mailbox simulator's bounce address.
- Kill the server between claim and record, and check that the row becomes "needs review" and both resolve buttons work.
- Visual check of the dialog and the Email section at phone and desktop widths.

## 10. Open questions

- **Changed decisions.** Someone told "accepted" and then rejected receives the ordinary rejection wording. Is that acceptable, or do changed decisions need their own wording or a personal note? The dialog flags these people either way.
- **Undo after emailing.** No mail exists for "your decision is back under review". The applicant keeps believing the last mail until a new decision is sent.
- **Launch day.** Every already-decided applicant will show as owed. Has anyone been told by other means? If so, they need marking as told before the first bulk run.
- **Decision visible before the mail (closed in the build).** The register page used to pass the application's raw status to the browser. It now sends "decided" for all three outcomes, so the page cannot reveal a decision before the email does.
- **Templates.** Which details go in (name, convention dates, next steps, links), HTML or plain text, and whether a Hindi version is needed.
- **Links in mails.** The site URL currently defaults to the Render address, not `buddhistcreators.com`.
- **Bounces.** Until SES events are wired to a webhook, an address on the suppression list still shows as `sent`.

## 11. What to revisit as this grows

- SES event publishing (delivered, bounced, complained) written back onto ledger rows.
- A queue and worker if runs reach thousands or need scheduling.
- Wording editable without a deploy.
- Tightening DMARC from `p=none` once reports look clean.
