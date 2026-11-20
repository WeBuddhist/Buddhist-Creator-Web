# Documentation

Docs for the Buddhist Creators website. Start with the page that matches
what you are doing.

| I want to… | Read |
| --- | --- |
| Run the site on my machine | [Getting started](getting-started.md) |
| Understand how the code is put together | [Architecture](architecture.md) |
| Change copy, events, the team or a switch that opens or closes a form | [Editing content](content-editing.md) |
| Deploy, run a migration, make someone an admin, or fix the follower run | [Operations](operations.md) |

## Features

| Feature | Read |
| --- | --- |
| Convention registration, the admin dashboard, decision emails, suggestions | [Registration and the admin dashboard](features/registration-and-admin.md) |
| Creator cards: making, reviewing, claiming, the team's own cards, sharing | [Creator cards](features/creator-cards.md) |
| Follower counts, the leaderboard, the mission's progress bar | [Follower counts and the leaderboard](features/followers-and-leaderboard.md) |
| The 2027 awards and their nominations | [Awards 2027](features/awards-2027.md) |

## Decisions and records

| Document | What it is |
| --- | --- |
| [ADR-0001: Decision emails via SES](adr/0001-decision-emails-via-ses.md) | Why decision emails go through SES with a send ledger |
| [Decision emails system design](design/decision-emails.md) | The full design of the email feature |
| [Domain and email setup](setup/domain-and-email-setup.md) | How the domain and Amazon SES were set up, and what is left before sending goes live |

## Writing these docs

- This repository is public. Leave out account numbers, keys, personal
  email addresses and anything else that belongs to an account.
- Link to the file that does the work rather than copying its code. The
  comments at the top of most files in `lib/` and `app/` explain the
  reasoning; these docs say where things are and how they fit.
- When you change how a feature behaves, change its page here in the same
  commit.
