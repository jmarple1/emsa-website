# EMSA Website

Source for the EMS Alliance website (Miami University, Oxford, Ohio). Spec: `docs/BRIEF.md`. Photos: `docs/PHOTO-DIRECTIONS.md`. Standing build rules for Claude Code: `CLAUDE.md`.

## Start here (Max)

1. Unzip this folder somewhere permanent, `cd` into it, run `git init`.
2. Open Claude Code in this folder and paste the kickoff prompt below.
3. Preview: `python3 -m http.server 8000` then open http://localhost:8000 on your phone and laptop.
4. Before deploying: create an EMSA GitHub account under the entity email, push the repo there (never your personal account), enable GitHub Pages or Cloudflare Pages, then buy the domain (no "Miami" in it) under the entity email.

## Kickoff prompt for Claude Code

Read CLAUDE.md, docs/BRIEF.md, and docs/PHOTO-DIRECTIONS.md. Build Phase 1 of the site: index.html (Home), what-we-do.html, join.html, about.html, contact.html, plus css/style.css, exactly to brief §4, §5, and §11 and the rules in CLAUDE.md. Plain HTML, one CSS file, no framework, mobile-first, WCAG 2.1 AA. Use the photos in photos/ per the directions, with placeholder iframes where Google Form and Calendar URLs go. Show me Home and Join before building the rest.

## Still owed by Max (site can launch Phase 1 without these)

- Live Google Form URLs (join, class registration, group class request, naloxone request) and the Google Calendar embed, all created under the entity account
- Original files for the two PLACEHOLDER photos; consent confirmations for face-bearing photos
- Group photo, headshots (Max, Jordan, Leslie), NCEMSF conference photo, tabling photo, Stop the Bleed reshoot, K–6 supplies shot
- EMSA logo files (vector + PNG)
- This semester's class dates
- Domain choice and the EMSA GitHub account
