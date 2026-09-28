# CLAUDE.md — EMSA Website

This repo is the website for EMS Alliance (EMSA), a registered student organization at Miami University in Oxford, Ohio. The full specification is `docs/BRIEF.md` (v5, no open questions). Photo usage is `docs/PHOTO-DIRECTIONS.md`. Read both before building or editing anything. Facts about EMSA come only from the brief; do not invent programs, numbers, names, or dates.

## Build rules

- Stack: Angular frontend (app/frontend), C++ Drogon backend (app/backend), PostgreSQL (app/database), same architecture as KnottSoDirtyCo. Deployed to AWS EC2 under an EMSA-owned AWS account (entity email), never a personal account.
- Forms and the calendar are served by our own API and database, not Google embeds. Collect only the fields in brief §6/§5; the naloxone form never collects a name and never stores IPs.
- Header/footer live in shared Angular components; page copy stays verbatim from the fact-checked static pages unless the brief changes.
- Ten pages per brief §4: Home (`/`), what-we-do, join, cpr-classes, naloxone, emergency, events, about, faq, contact.
- Mobile-first, WCAG 2.1 AA (unchanged): semantic landmarks, one h1 per page, labeled form fields, alt text from PHOTO-DIRECTIONS, visible focus states, contrast ≥ 4.5:1, no "click here" links.
- Persistent "Join EMSA" button in the header on every page.
- Every officer-facing feature needs README docs written for a non-developer successor.
- The static pages at the repo root stay as the copy reference until the Angular port matches them.
- Links that go live now: GroupMe join https://groupme.com/join_group/117642476/zucoqhJi (join confirmation copy, "already a member" section, footer) and Miami Central signup https://miamicentral.miamioh.edu/EMSA/club_signup (Join page, Contact page).

## Non-negotiables (never remove or reword; brief §11 has full context)

1. AHA disclaimer, verbatim, on the CPR Classes page and anywhere classes are promoted:
   "The American Heart Association strongly promotes knowledge and proficiency in all AHA courses and has developed instructional materials for this purpose. Use of these materials in an educational course does not represent course sponsorship by the AHA. Any fees charged for such a course, except for a portion of fees needed for AHA course materials, do not represent income to the AHA."
2. No AHA Heart-and-Torch logo, no images of AHA course/provider cards, nothing implying AHA sponsorship. No Stop the Bleed or ACS logos.
3. Footer on every page: "EMS Alliance is a registered student organization at Miami University. The views and information on this site are those of EMS Alliance and do not represent Miami University." and "Content on this site is educational and is not medical advice. In an emergency, call 911."
4. The student EMT first response unit is a long-term goal only: not operating, not approved, EMSA does not respond to emergencies. The In an Emergency page opens with "Call 911."
5. No Miami trademarks in the domain; do not embed or alter Miami's logo. Partner names in text only, no partner logos. No ONEbox mentions. No school names or photos of children in K–6 content.
6. Footer recognition strip, text only: "2024–25 New Student Organization of the Year · NCEMSF member · New Group Initiative grant recipient".

## Photos

Six files in `photos/`, named per PHOTO-DIRECTIONS. Two are marked PLACEHOLDER (screenshots) awaiting originals from Max. The Stop the Bleed photo is intentionally absent: the only shot shows licensed logos and cannot be used; use a text tile until a reshoot. Do not publish identifiable faces until Max confirms consent (tracked in PHOTO-DIRECTIONS). Export page images ≤ ~300 KB; hero ≤ 1600 px wide.

## Workflow

- Run locally per `app/README.md` (Docker Compose); test at phone width first.
- Phases per brief §12. Phase 1 = working frontend + backend + database; phase 2 = officer-editable content (admin CRUD).
- Deploy target: AWS EC2 under an EMSA-owned account (entity email), custom domain with no Miami marks. Never deploy from or to a personal account.
- Ask Max before: changing any non-negotiable text or publishing any face-bearing photo.
