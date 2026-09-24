# HANDOFF: EMSA site → full-stack (Angular + C++/Drogon + PostgreSQL)

Written 2026-09-23 from a Claude chat session, for a fresh Claude Code session in the terminal.
Put this file in the root of `emsa-website/` and start Claude Code with the kickoff prompt at the bottom.

## 1. Where things stand

- `emsa-website/` holds a finished **static** site: 10 plain-HTML pages + `css/style.css`, built to `docs/BRIEF.md` (v5) and `CLAUDE.md`, reviewed (see `MORNING-REVIEW.md`). No JS, no backend. Forms and the calendar are placeholder iframes waiting on Google Form/Calendar URLs.
- **Decision (John, 2026-09-23):** rebuild it on the same architecture as KnottSoDirtyCo (knottsodirty.co): **Angular frontend, C++ Drogon backend, PostgreSQL**, deployed to AWS EC2. Build a working frontend + backend + database first; making content officer-editable (admin dashboard) is phase 2.
- Nothing from the chat session was saved to this repo. Start from scratch following this file.

## 2. Conflicts you must resolve first

1. **`CLAUDE.md` forbids this stack.** It says: "Plain HTML… No frameworks, no npm, no build step", "Interactive pieces are embeds, never custom", and "Ask Max before… adding JS beyond trivial." `docs/BRIEF.md` §9 rates a developer-built site as *High handoff risk* and recommends Squarespace. Claude Code will follow `CLAUDE.md` unless it's updated. **Max owns the repo, so get his OK, then replace the "Build rules" section** (suggested text in §7). Leave the "Non-negotiables" section exactly as it is.
2. **Don't overwrite the static site.** Work on a `fullstack` branch, in a new `app/` folder. The static pages stay the source of truth for copy until the Angular port matches them.
3. **Match KnottSoDirty's layout.** The chat session couldn't reach that repo. Find it on disk (look for `knottsodirty` / `talbot`), read its folder structure, build config, JWT/auth code, Drogon controller style, and deploy scripts, and mirror them. Where this file and KnottSoDirty disagree on structure, follow KnottSoDirty. Where they disagree on EMSA content or privacy, follow this file and the brief.

## 3. Target layout (adjust to match KnottSoDirty)

```
app/
  frontend/        Angular (standalone components, router, reactive forms)
  backend/         Drogon (CMake), controllers/, filters/ (JWT), config.json
  db/              schema.sql, seed.sql
  README.md        run locally, create an officer account, deploy to EC2
```

In production, one EC2 box: Drogon serves the Angular build as static files plus `/api/*`, with Postgres on the same box or on RDS. Use HTTPS (Let's Encrypt/Caddy/nginx in front).

Verified in a sandbox (Ubuntu 24.04): `apt install libdrogon-dev drogon postgresql-16 libjsoncpp-dev libpq-dev libssl-dev` works (Drogon 1.8.7). Angular CLI latest was 22.2.0. **Confirm that Drogon was built with PostgreSQL support** (a tiny DbClient test) before writing the controllers.

## 4. Database (PostgreSQL)

Seed only facts from the brief. Never invent class dates, events, or officers.

| Table | Columns (all have id + created_at) | Notes |
|---|---|---|
| `join_submissions` | name, miami_email, year, major, emt_certified bool, heard_from | Brief §6 fields exactly. Email must end `@miamioh.edu` |
| `classes` | course (`BLS` / `Heartsaver` / `Stop the Bleed`), starts_at, ends_at, location, capacity, is_open | Empty seed. Replaces the formLimiter Sheet |
| `class_registrations` | class_id FK, name, miami_email | unique(class_id, email). Reject when count ≥ capacity; do it in a transaction |
| `group_class_requests` | group_name, contact_name, contact_email, preferred_dates text, course, headcount | Brief §5 CPR Classes |
| `naloxone_requests` | requesting_for (`self` / `chapter_house`), chapter_house null, items text[], pickup (`distribution_night` / `arranged`), contact_method null, fulfilled bool | **No name column. Don't log IPs or user agents for this route.** Officer-only access. Consider auto-deleting fulfilled rows after N days |
| `events` | title, starts_at, ends_at, location, description | Replaces the Google Calendar embed. Empty seed |
| `impact_stats` | key PK, value int, suffix, label, sort | Seed from brief §7 below. Rendered on Home, About, What We Do, Naloxone from ONE source |
| `site_settings` | key PK, value | e.g. `next_meeting` (Join page) |
| `officers` | email unique, name, password_hash, created_at | PBKDF2-SHA256 or argon2, never plaintext. Create accounts from a CLI command, not a public signup route |

`impact_stats` seed (brief §7; display strings must not change):
- cpr_certified 76 "+" "students certified in CPR"
- stop_the_bleed 30 "" "trained in Stop the Bleed"
- narcan_kits 200 "" "Narcan kits"
- test_strips 2000 "" "fentanyl test strips"
- condoms 500 "" "condoms" (Harm Reduction page only, not the Home strip)
- frat_houses 25 "" "fraternity houses"
- members 60 "+" "members" (never say "active")

## 5. API

Public:
- `GET /api/health`
- `GET /api/impact`, `GET /api/classes` (upcoming, open, with seats left), `GET /api/events` (upcoming), `GET /api/settings/next-meeting`
- `POST /api/join`, `POST /api/classes/{id}/register`, `POST /api/group-class-requests`, `POST /api/naloxone-requests`
- Every POST: server-side validation, length limits, per-IP rate limit (except that the naloxone route must not *store* the IP), JSON errors the form can show next to the field.

Officers (JWT, HS256, short expiry, same pattern as KnottSoDirty):
- `POST /api/auth/login`
- `GET /api/admin/{join|registrations|group-requests|naloxone}` (read-only in phase 1, plus CSV export). Without this the form data goes nowhere.
- Phase 2: CRUD for classes, events, impact_stats, site_settings, and marking naloxone requests fulfilled. That's the "editable" work.

## 6. Frontend (Angular)

- Port all 10 pages (index→`/`, what-we-do, join, cpr-classes, naloxone, emergency, events, about, faq, contact). **Copy every sentence verbatim from the static HTML**, since it was fact-checked against the brief. Reuse `css/style.css` as the global stylesheet. Keep the markup classes so the styles still apply.
- Shared `HeaderComponent` / `FooterComponent` (this replaces "duplicate header/footer on every page"). The footer must keep, verbatim: the recognition strip, the Miami independence line, the medical/911 line, and the AHA disclaimer (see `CLAUDE.md` Non-negotiables).
- Replace the 5 placeholder iframes with real reactive forms that post to the API, with labeled fields, inline errors, `aria-live` success messages, and the §6 confirmation copy (next meeting + GroupMe link). The naloxone form has no name field and keeps the line "We do not share the information you submit."
- Impact numbers, class schedule, events, and next meeting come from the API. Keep the brief values as fallback text if the API is down.
- Keep: mobile-first, WCAG 2.1 AA, one h1 per page, `aria-current` on nav, visible focus, a persistent Join button, per-route `<title>` + meta description (Angular `Title`/`Meta`), and `emergency` opening with `<h1>Call 911.</h1>`. The phone menu can now use a toggle button with `aria-expanded` instead of the `:target` trick.
- Photos: same files, same alt text, same CSS crops. Photo E stays unused. Faces stay behind the consent TODOs.
- Admin UI (`/admin`, login + submissions tables) is phase 1 read-only only if time allows. Otherwise phase 2.

## 7. Suggested replacement for CLAUDE.md "Build rules" (needs Max's OK)

```
- Stack: Angular frontend (app/frontend), C++ Drogon backend (app/backend), PostgreSQL (app/db), same architecture as KnottSoDirtyCo. Deployed to AWS EC2 under an EMSA-owned AWS account (entity email), never a personal account.
- Forms and the calendar are served by our own API and database, not Google embeds. Collect only the fields in brief §6/§5; the naloxone form never collects a name and never stores IPs.
- Header/footer live in shared Angular components; page copy stays verbatim from the fact-checked static pages unless the brief changes.
- Mobile-first, WCAG 2.1 AA (unchanged).
- Every officer-facing feature needs README docs written for a non-developer successor.
```

## 8. Risks John accepted (so the next session doesn't re-argue them)

- Ongoing EC2 cost (a few $/month and up) for an org with no dues. The static-site option was about $0.
- Someone has to patch the server and keep the C++ build working after John leaves. Mitigation: README with runbook, officer training, and a `docker-compose.yml` so the stack rebuilds with one command.
- Sensitive naloxone data now sits on a server EMSA runs instead of in an officer-only Google Sheet. Mitigation: minimal fields, no IPs, restricted admin, and a retention policy.

## 9. Still owed by Max (unchanged by the new stack)

Photo consent and originals, class dates, logo files, the EMSA entity email, the domain (no "Miami"), and now also **an EMSA-owned AWS account**. Full list: `MORNING-REVIEW.md` → Remaining TODOs.

## Kickoff prompt for Claude Code

> Read HANDOFF-fullstack.md first, then CLAUDE.md, docs/BRIEF.md, docs/PHOTO-DIRECTIONS.md, and MORNING-REVIEW.md. HANDOFF §2 lists conflicts; I've gotten Max's OK, so update CLAUDE.md's Build rules per HANDOFF §7 (don't touch the Non-negotiables). Then find my KnottSoDirtyCo repo on this machine and mirror its structure. On a `fullstack` branch, build app/db, then app/backend (Drogon), then app/frontend (Angular) per HANDOFF §4–6, porting page copy verbatim. Commit after each piece, get it all running locally end to end, and show me Home and Join working with a real submission before building the admin UI.
