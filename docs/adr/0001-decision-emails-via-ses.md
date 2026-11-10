# ADR-0001: Decision emails via AWS SES, tracked by a send ledger

**Status:** Accepted
**Date:** 2026-11-10
**Deciders:** TenzDelek (engineering), the registration committee (wording and who is mailed), whoever owns the AWS account and Cloudflare DNS

## Context

- Admins record a decision per application; sending the email is a separate, deliberate step.
- Three emails only: accepted, rejected, waitlisted. The wording arrives later.
- Sender is `hello@buddhistcreators.com`, through AWS SES. SES is not set up.
- Admins can change a decision or undo it (back to submitted), so "has this person been told?" must compare what they were last told with what their status is now.
- SES has no idempotency key. If the app sends twice, the applicant gets two mails.
- Scale is small: hundreds to low thousands of applicants, a few admins, bulk runs of tens to a few hundred.
- The app is one long-lived Node service on Render, with Postgres. No queue, no worker, no test framework.
- Today's code clears `notified_at` whenever the status changes (`lib/applications.ts:290`).

## Decision

1. **Track what each applicant was last told.** Add `applications.notified_status`. An applicant is *owed an email* when their status is a decision and differs from `notified_status`.
2. **Record every send in a ledger table**, `application_notifications`. A partial unique index on it allows one in-flight send per application; that index is the lock against double sends.
3. **Never re-send automatically.** A send whose outcome is unknown (crash or timeout mid-call) is parked as "needs review" for an admin to resolve.
4. **Send each mail with SES v2 `SendEmail`**, rendered in the app from template files kept in git.
5. **Run bulk from the browser:** the admin confirms a list, and the page sends it in chunks of 10 through a server action.
6. **Sending is off by default.** Real mail needs `EMAIL_DELIVERY=live` in production and SES credentials separate from the S3 ones.

## Options considered

### A. How to know who is owed an email

| | A1: `notified_at` only (today's column) | A2: add `notified_status` | A3: ledger + `notified_status` (chosen) |
|---|---|---|---|
| Complexity | Low | Low | Medium |
| Waitlist emailed, then accepted | Sends accepted | Sends accepted | Sends accepted |
| Accepted emailed, undo, accepted again | Sends accepted twice | Nothing | Nothing |
| Two admins send at once | Both send | Both send | One sends |
| Record of who sent what, failures | None | None | Full |
| Forced re-send | No place to record it | No place to record it | Recorded |

- **A1** breaks the no-repeat rule after a mis-click and undo, which is one click away in the decision form.
- **A2** gets the rule right but cannot stop two simultaneous sends or record a failure.
- **A3** costs one table and keeps "last told" in two places, written together in one transaction.

### B. How bulk runs

| | B1: one long server action | B2: browser loop over a confirmed list (chosen) | B3: `after()` background work | B4: queue and worker (SQS, pg-boss) |
|---|---|---|---|---|
| Complexity | Low | Low | Medium | High |
| Progress shown | No | Yes, per chunk | Needs polling and a batch table | Needs polling and a batch table |
| Tab closed mid-run | Keeps going, result unseen | Stops; the rest stay owed | Keeps going | Keeps going |
| Deploy mid-run | Stops silently | Stops visibly | Stops silently | Survives |
| New infrastructure | None | None | None | Worker process |

- **B2** sends exactly the list the admin confirmed. A colleague's decision made mid-run is not swept in.
- **B2's cost:** the tab stays open for the run, about a minute for a few hundred mails. Anything unsent stays owed, and the next click resumes.
- **B4** is the answer if volume grows by an order of magnitude or sends must be scheduled.

### C. SES API

| | C1: `SendEmail` per recipient, templates in git (chosen) | C2: SES stored templates + `SendBulkEmail` |
|---|---|---|
| Wording reviewed in pull requests | Yes | No, it lives in the SES console |
| A timeout affects | One recipient | Up to 50 recipients |
| Changing wording | Needs a deploy | No deploy |

### D. When the outcome of a send is unknown

| | D1: retry automatically | D2: park for an admin (chosen) |
|---|---|---|
| Risk | Duplicate decision mail, which cannot be recalled | A mail waits until someone looks |
| Visibility | None | "Needs review" count on the admin list |

## Trade-off analysis

- **Correctness over fewer moving parts.** The ledger is the one new piece of machinery, and it buys the lock, the audit trail, failure records and forced re-sends.
- **No silent duplicates, at the cost of a human step.** Unknown outcomes are rare (a crash in a window of a few hundred milliseconds), and resolving one is two buttons.
- **No background infrastructure, at the cost of an open tab.** Acceptable at this volume.
- **Wording in git, at the cost of a deploy per change.** The committee's copy gets reviewed like code.

## Consequences

**Easier**
- Answering "who was told what, when, by whom" from one table.
- Bulk is safe to click twice, by two people, or again after a failure.
- Adding a fourth email later: one template file and one enum value.

**Harder**
- `setApplicationStatus` must stop clearing `notified_at`; the mailing step owns both notified columns.
- A "needs review" state exists and someone must clear it.
- Dev and preview environments cannot send real mail without deliberate setup.

**Revisit when**
- Bounces and complaints need to show in the admin: add SES event publishing (SNS) to a webhook that updates ledger rows.
- Volume or scheduling outgrows the browser loop: move to a queue.
- The committee wants to edit wording without a deploy.

## Action items

AWS and DNS (can start now; production access has lead time):

1. [ ] Pick the SES region (default: `ap-south-1`, same as the S3 bucket).
2. [ ] Create the domain identity `buddhistcreators.com` with Easy DKIM; add its three CNAME records in Cloudflare as DNS-only.
3. [ ] Set a custom MAIL FROM subdomain (for example `mail.buddhistcreators.com`): one MX and one TXT record. Leave the apex SPF record as it is; it serves Google Workspace.
4. [ ] Add a DMARC record at `_dmarc.buddhistcreators.com`, starting at `p=none` with a report address. None exists today.
5. [ ] Turn on the account-level suppression list for bounces and complaints.
6. [ ] Create a configuration set for these mails.
7. [ ] Create an IAM user for sending only: `ses:SendEmail` limited to the From address, plus `ses:GetAccount`. The policy is in the README.
8. [ ] Request production access. Until granted, SES delivers only to verified addresses, 200 a day, 1 a second.
9. [ ] Confirm `hello@buddhistcreators.com` is a mailbox someone reads; replies go there.

Product:

10. [ ] Committee supplies the three templates (subject, body, which details to include, languages).
11. [ ] Decide what to do with applicants already told by other means before launch (see open questions in the design).

Build: done, following `docs/design/decision-emails.md`. Still to do before the first real send: run the migration, replace the placeholder wording in `lib/emails/`, and set the SES variables with `EMAIL_DELIVERY=live` on the production service.
