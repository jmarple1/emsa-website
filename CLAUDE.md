# CLAUDE.md — EMSA Website

This repo is the website for EMS Alliance (EMSA), a registered student organization at Miami University in Oxford, Ohio. The full specification is `docs/BRIEF.md` (v5, no open questions). Photo usage is `docs/PHOTO-DIRECTIONS.md`. Read both before building or editing anything. Facts about EMSA come only from the brief; do not invent programs, numbers, names, or dates.

## Build rules

- Plain HTML, one shared `css/style.css`, minimal vanilla JS only where unavoidable. No frameworks, no npm, no build step. The site must be editable by a stranger in five years.
- Ten pages per brief §4: index (Home), what-we-do, join, cpr-classes, naloxone, emergency, events, about, faq, contact. Kebab-case filenames, `.html`.
- Mobile-first, WCAG 2.1 AA: semantic landmarks, one h1 per page, labeled form embeds, alt text from PHOTO-DIRECTIONS, visible focus states, contrast ≥ 4.5:1, no "click here" links.
- Interactive pieces are embeds, never custom: Google Forms (join, class registration, group class request, naloxone request) and Google Calendar. Use clearly marked placeholder iframes (`<!-- TODO: real form URL -->`) until Max supplies live URLs.
- Header/footer are duplicated across pages. When changing either, change it on every page in the same commit.
- Persistent "Join EMSA" button in the header on every page.
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

- Preview with `python3 -m http.server 8000` from the repo root; test at phone width first.
- Phases per brief §12. Phase 1 = Home, What We Do, Join, About, Contact with footer disclaimers.
- Deploy target: GitHub Pages or Cloudflare Pages under an EMSA-owned account (entity email), custom domain with no Miami marks. Never deploy from or to a personal account.
- Ask Max before: adding pages, adding JS beyond trivial, changing any non-negotiable text, or publishing any face-bearing photo.
