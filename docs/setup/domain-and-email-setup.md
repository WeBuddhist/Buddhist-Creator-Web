# Domain and email setup record

How `buddhistcreators.com` was pointed at this app and how Amazon SES was set
up to send the decision emails, as done on 10 November 2026. It records what
exists, why, and how to check or redo each part.

This repository is public, so the AWS account number, access keys and
personal email addresses are left out on purpose. Where one is needed, the
text says where to find it.

For how the email feature itself works, see
[`docs/design/decision-emails.md`](../design/decision-emails.md) and
[`docs/adr/0001-decision-emails-via-ses.md`](../adr/0001-decision-emails-via-ses.md).

## Status on 10 November 2026

| Part | State |
| --- | --- |
| Site served at `https://buddhistcreators.com` | Done |
| Old `buddhist-creator.onrender.com` address | Switched off (returns 404) |
| SES domain identity and DKIM | Verified |
| SES custom MAIL FROM (`mail.buddhistcreators.com`) | DNS records live; SES still showed "Pending" when last looked at |
| Sending-only IAM user and access key | Created |
| Test email from a laptop | Received, from "Buddhist Creators <hello@buddhistcreators.com>" |
| SES production access | Requested; AWS asked for details and they were sent. **Waiting for AWS.** |
| `EMAIL_DELIVERY` on Render | `off` until AWS approves |

What is left is in [Going live](#going-live).

## 1. The domain

The domain is registered elsewhere and its DNS is managed in **Cloudflare**.
Before this change it pointed at a GitHub Pages site; mail for the domain is
Google Workspace and was not touched.

### DNS records for the website (Cloudflare)

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| CNAME | `buddhistcreators.com` (root) | `buddhist-creator.onrender.com` | Proxied |
| CNAME | `www` | `buddhist-creator.onrender.com` | DNS only |

- The four old `A` records (`185.199.108–111.153`, GitHub Pages) were deleted.
- `www` redirects to the root; Render does that.
- The root record works with the Cloudflare proxy on. If Render ever fails to
  issue or renew the certificate, or pages start redirecting in a loop, switch
  that record to "DNS only", or set Cloudflare's SSL/TLS mode to "Full".

### Render

- Service: `Buddhist-Creator` (web service).
- **Settings → Custom Domains**: `buddhistcreators.com` and `www` added and verified.
  The workspace's custom-domain allowance was full at the time, so a slot has
  to be free before a domain can be added.
- **Settings → Custom Domains → Render Subdomain**: disabled, so the site is
  served only from the custom domain.
- Saving an environment variable redeploys the service. During one such
  redeploy the site returned intermittent 502 errors for about three minutes,
  then recovered on its own.

### Auth0

In the application's **URLs** tab:

| Field | Value added |
| --- | --- |
| Allowed Callback URLs | `https://buddhistcreators.com/auth/callback` |
| Allowed Logout URLs | `https://buddhistcreators.com` |
| Allowed Web Origins | `https://buddhistcreators.com` |

The `http://localhost:3000` entries stay for development. `www` needs no
entries because it redirects to the root.

### Environment variables for the domain

| Variable | Value on Render | What reads it |
| --- | --- | --- |
| `APP_BASE_URL` | `https://buddhistcreators.com` | Sign-in: the callback and logout addresses sent to Auth0 |
| `NEXT_PUBLIC_SITE_URL` | `https://buddhistcreators.com` | Sitemap, robots.txt, canonical URLs, social cards |

`NEXT_PUBLIC_SITE_URL` is read at build time and is **required**: there is no
fallback, and a build without it stops with "NEXT_PUBLIC_SITE_URL is not set"
(`lib/navigation.ts`). A failed build on Render leaves the previous deploy
running.

### How to check the domain

```bash
# Sign-in should send the callback to the new domain.
curl -s -o /dev/null -w '%{redirect_url}\n' https://buddhistcreators.com/auth/login

# The sitemap should list https://buddhistcreators.com.
curl -s https://buddhistcreators.com/sitemap.xml

# www should answer 301 to the root; the old address should answer 404.
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://www.buddhistcreators.com
curl -s -o /dev/null -w '%{http_code}\n' https://buddhist-creator.onrender.com/
```

## 2. Amazon SES

Everything in SES is per region. All of this is in **Asia Pacific (Singapore),
`ap-southeast-1`**; keep the console's region selector there.

### Domain identity

**SES → Configuration → Identities → `buddhistcreators.com`**, created with:

| Setting | Value |
| --- | --- |
| Identity type | Domain |
| Domain | `buddhistcreators.com` |
| Assign a default configuration set | No |
| Assign to a tenant | No |
| Use a custom MAIL FROM domain | Yes: `mail` (so `mail.buddhistcreators.com`) |
| Behavior on MX failure | Use default MAIL FROM domain |
| DKIM | Easy DKIM, `RSA_2048_BIT`, signatures enabled |
| Publish DNS records to Route53 | No, both boxes (DNS is in Cloudflare) |

Verifying the domain covers every address on it, so `hello@buddhistcreators.com`
is not registered separately. The MAIL FROM domain is a return path for bounce
notices that only mail servers see; recipients see `hello@buddhistcreators.com`.

### DNS records for email (Cloudflare)

Six records, all "DNS only". The values come from the identity's
**Authentication** tab, under each "Publish DNS records".

| Type | Name | Content | For |
| --- | --- | --- | --- |
| CNAME | `bsyjmhgl2ciksgobdmrrdg6v6mbedidt._domainkey` | `bsyjmhgl2ciksgobdmrrdg6v6mbedidt.dkim.amazonses.com` | DKIM |
| CNAME | `j3u2tgzczni2snjdgnp5h253xlpgwzyc._domainkey` | `j3u2tgzczni2snjdgnp5h253xlpgwzyc.dkim.amazonses.com` | DKIM |
| CNAME | `xaeo4nbnzcy4c6nc555nkinem4q3tgeu._domainkey` | `xaeo4nbnzcy4c6nc555nkinem4q3tgeu.dkim.amazonses.com` | DKIM |
| MX | `mail` | `feedback-smtp.ap-southeast-1.amazonses.com`, priority 10 | MAIL FROM |
| TXT | `mail` | `v=spf1 include:amazonses.com ~all` | MAIL FROM (SPF) |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | DMARC |

Left as they were, and needed for the Google Workspace inbox:

- The five `MX` records on the root (`aspmx.l.google.com` and its alternates).
- The root `TXT` record `v=spf1 include:_spf.google.com -all`.

Notes:

- The DKIM records must not be proxied, or they will not verify.
- SES lists the MX value as `10 feedback-smtp…`; in Cloudflare the `10` goes in
  the Priority box.
- `p=none` means DMARC blocks nothing; it only publishes a policy, which Gmail
  and Yahoo expect from senders. A `rua=mailto:…` part was left out because it
  would send daily XML reports to the mailbox it names.

Check them at any time:

```bash
dig +short MX  mail.buddhistcreators.com
dig +short TXT mail.buddhistcreators.com
dig +short TXT _dmarc.buddhistcreators.com
dig +short CNAME bsyjmhgl2ciksgobdmrrdg6v6mbedidt._domainkey.buddhistcreators.com
```

### Suppression list

**SES → Configuration → Suppression list → Account-level settings**: enabled,
reason "Bounces and complaints". An address that bounces or complains is not
sent to again. The app still records such a send as "sent", because SES
accepts the request and drops the message itself.

### Sandbox and production access

A new SES account is in the **sandbox**: it delivers only to verified
addresses, at most 200 a day and one a second. Production access removes all
three limits; recipients never need verifying after that.

- For testing in the sandbox, the admin's own sign-in address was added as an
  **email address identity** (Identities → Create identity → Email address,
  then the link in the email AWS sends). It can be deleted once production
  access is granted.
- Production access was requested on 10 November 2026 from
  **SES → Account dashboard → Request production access**, with mail type
  **Transactional** and website `https://buddhistcreators.com`.
- AWS handles the request as a **support case** and replied asking for more
  detail. The answers sent are in [the appendix](#appendix-answers-sent-to-aws).

To see whether it has been granted: the Account dashboard stops showing the
sandbox notice, and the app's "Send emails" dialog stops showing its "still in
the sandbox" warning.

## 3. IAM permissions

Two different identities are involved. They need different things.

### The person doing the setup (console access)

An ordinary IAM user has no SES access, so the account admin attached a policy
to the user doing this work. Replace `<ACCOUNT_ID>` with the 12-digit account
number shown at the top right of the AWS console.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SesFullAccess",
      "Effect": "Allow",
      "Action": "ses:*",
      "Resource": "*"
    },
    {
      "Sid": "IamReadOnlyForConsole",
      "Effect": "Allow",
      "Action": ["iam:Get*", "iam:List*"],
      "Resource": "*"
    },
    {
      "Sid": "CreateSendingPolicy",
      "Effect": "Allow",
      "Action": "iam:CreatePolicy",
      "Resource": "arn:aws:iam::<ACCOUNT_ID>:policy/BuddhistCreatorsSesSend"
    },
    {
      "Sid": "CreateSendingUserAndKey",
      "Effect": "Allow",
      "Action": ["iam:CreateUser", "iam:CreateAccessKey"],
      "Resource": "arn:aws:iam::<ACCOUNT_ID>:user/buddhist-creators-ses"
    },
    {
      "Sid": "AttachOnlyThatPolicyToThatUser",
      "Effect": "Allow",
      "Action": "iam:AttachUserPolicy",
      "Resource": "arn:aws:iam::<ACCOUNT_ID>:user/buddhist-creators-ses",
      "Condition": {
        "ArnEquals": {
          "iam:PolicyARN": "arn:aws:iam::<ACCOUNT_ID>:policy/BuddhistCreatorsSesSend"
        }
      }
    }
  ]
}
```

| Statement | What it allows |
| --- | --- |
| `SesFullAccess` | Everything in the SES console. Same as the managed policy `AmazonSESFullAccess`. |
| `IamReadOnlyForConsole` | Viewing users and policies, so the IAM pages load. Changes nothing. |
| The last three | Creating one policy and one user with exactly those names, an access key for that user, and attaching only that policy to it. |

Two more permissions came up:

- **`AWSSupportAccess`** (managed policy): needed to open and answer the
  support case AWS creates for the production access request. Without it the
  case page says "Failed to load case details".
- **`access-analyzer:ValidatePolicy`**: optional. Without it the IAM policy
  editor shows a red "Unexpected error" box; the policy can still be created.

Once setup is finished this policy can be removed from the person's user. The
app does not use it.

### The app (sending only)

| | |
| --- | --- |
| IAM user | `buddhist-creators-ses`, no console access, no tags |
| Policy attached | `BuddhistCreatorsSesSend` (customer managed) |
| Access key | Created under Security credentials, use case "Application running outside AWS" |

The policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ses:SendEmail",
      "Resource": "*",
      "Condition": { "StringEquals": { "ses:FromAddress": "hello@buddhistcreators.com" } }
    },
    { "Effect": "Allow", "Action": "ses:GetAccount", "Resource": "*" }
  ]
}
```

- `ses:SendEmail` is limited to mail from `hello@buddhistcreators.com`.
- `ses:GetAccount` lets the app read the sending rate and whether the account
  is still in the sandbox, which the bulk dialog shows.
- The key is an IAM access key, not the "SMTP credentials" the SES console
  offers. The app calls the SES API.
- It is a separate user from the S3 one on purpose. The S3 keys are in every
  developer's `.env.local`; these are not meant to be.

**Rotating the key:** create a second access key on the user, put it in Render
and in any `.env.local` that has the old one, confirm a test email sends, then
delete the old key.

## 4. App configuration

| Variable | Value | Notes |
| --- | --- | --- |
| `EMAIL_DELIVERY` | `off`, `simulate` or `live` | The master switch. See below. |
| `SENDER_EMAIL` | `hello@buddhistcreators.com` | The From address. Must match the IAM policy's condition. |
| `SENDER_NAME` | `Buddhist Creators` | The name shown beside it. |
| `SES_REGION` | `ap-southeast-1` | Must be the region the identity is verified in. |
| `SES_ACCESS_KEY` | the sending user's access key ID | Secret. Render and `.env.local` only. |
| `SES_SECRET_KEY` | the sending user's secret access key | Secret. Shown once, when the key is created. |
| `SES_CONFIGURATION_SET` | not set | Optional; none was created. |

What `EMAIL_DELIVERY` does:

| Value | On a laptop | On Render (production) |
| --- | --- | --- |
| not set, or `off` | Nothing is sent | Nothing is sent |
| `simulate` | Runs the whole pipeline with a fake transport, only against a local database | Refused; sending stays off |
| `live` | Only "Send me a test" works, and it mails only the signed-in admin | Real sending to applicants |

It exists so that having the keys in place is not enough to email applicants;
someone has to switch sending on deliberately. The name starts with an `E`:
`MAIL_DELIVERY` would be ignored.

Where things stood on 10 November 2026:

- **Render**: the five SES values set, `EMAIL_DELIVERY=off`.
- **The developer's `.env.local`**: all six set, `EMAIL_DELIVERY=live`, which
  from a laptop only allows tests.

The three emails are in `lib/emails/accepted.ts`, `rejected.ts` and
`waitlisted.ts`, in the organising team's wording, each with `approved: true`
and version `2026-11-10`.

## Going live

1. Wait for AWS to grant production access (the support case, and an email).
2. On Render, change `EMAIL_DELIVERY` to `live` and let it redeploy.
3. On the live site open `/admin` → **Send emails**. The dialog should show no
   "switched off" or "sandbox" notice, and the button should read "Send N emails".
4. Send to a small tab first, for example the test applications, and check
   the emails arrive.
5. In SES, confirm the custom MAIL FROM shows as verified. If it is still
   "Pending" a day after the DNS records went in, compare the `MX` record on
   `mail` with the value on the identity page.
6. Optional tidying: delete the email address identity used for sandbox
   testing, and remove the setup policy from the person's IAM user.

Turning `live` on before step 1 does no harm but does not work: SES refuses
every unverified recipient, and a bulk run stops at the first one.

## Testing

**From a laptop.** With the six variables in `.env.local` and
`EMAIL_DELIVERY=live`, restart `npm run dev`, open `/admin` → **Send emails**
and click **Send me a test** beside a group. It mails only the signed-in
admin and records nothing. While the account is in the sandbox that address
has to be a verified identity.

**Checking authentication.** In Gmail, open the test email's three-dot menu →
**Show original**. SPF, DKIM and DMARC should each say PASS.

**Without AWS at all.** `EMAIL_DELIVERY=simulate` against a local Postgres. An
address starting `fail+` is refused and one starting `timeout+` never answers,
which exercises the failure paths.

## Messages we ran into

| Message | Where | Meaning and fix |
| --- | --- | --- |
| "not authorized to perform: ses:GetAccount" | SES console | The console user has no SES permissions. Attach the setup policy above. |
| "not authorized to perform: access-analyzer:ValidatePolicy" | IAM policy editor | Only the editor's checker is unavailable. Click Next and create the policy. |
| "Failed to load case details" | Support Center | The console user lacks `AWSSupportAccess`. |
| "Email address is not verified. The following identities failed the check in region AP-SOUTHEAST-1: …" | App, on a test or a send | The account is in the sandbox and that recipient is not verified. Keys and sender are fine. Verify the address, or wait for production access. |
| "Email sending is switched off in this environment." | App, send dialog | `EMAIL_DELIVERY` is not `live` (or is misspelt). |
| "Decision emails only go out from the production site…" | App, send dialog on a laptop | Expected. Only "Send me a test" works outside production. |
| "SES is not configured: set SES_REGION, SES_ACCESS_KEY and SES_SECRET_KEY." | App | One of the three is missing where the app is running. |
| "Action required … update the DNS settings using the MX record provided" | SES identity page | SES has not yet seen the MAIL FROM record. If `dig` shows it, wait; sending works meanwhile with SES's default MAIL FROM. |
| "NEXT_PUBLIC_SITE_URL is not set" | `npm run build` | The variable is required. Set it in the environment the build runs in. |
| Intermittent 502 on the live site | Browser, for a few minutes | Seen once during a Render redeploy after an environment change. It cleared on its own. |

## Appendix: answers sent to AWS

AWS's automated reply to the production access request asked for six things.
These are the answers that were posted to the support case on 10 November 2026.

1. **Website or application URL.** `https://buddhistcreators.com`, the website
   of the Buddhist Creators Convention. The 2027 convention is described at
   `https://buddhistcreators.com/convention/2027`; applicants sign in from
   that page and submit an application.
2. **Email type.** Transactional only. Each applicant gets one email with the
   selection committee's decision: accepted, waitlisted or not selected. If a
   decision later changes, that applicant gets one further email. No
   newsletters or promotions.
3. **Volume.** About 500 applicants. Decisions are sent in bulk once the
   committee has finished, so the largest single day is about 500 to 600
   emails. After that only occasional emails, when a decision changes or one
   has to be sent again. Under 1,000 in total for this convention, and no more
   than about 1,000 in any month.
4. **Recipient source.** Every recipient applied through the website, signing
   in with a Google or Apple account. Mail goes only to the address they
   signed in with, about their own application. No purchased, rented or
   scraped lists.
5. **Bounce and complaint handling.** The account-level suppression list is on
   for bounces and complaints. The app records every send attempt with its SES
   message ID, sends each decision once per applicant and never retries a
   failed send automatically. Replies go to a monitored mailbox,
   `hello@buddhistcreators.com`, and the SES reputation metrics are watched.
6. **A sample email.** The waitlist email, as in `lib/emails/waitlisted.ts`,
   with a note that the other two follow the same format.

It also stated the verified identity: the domain `buddhistcreators.com` in
`ap-southeast-1`, with Easy DKIM (2048-bit), a custom MAIL FROM domain and a
published DMARC record.
