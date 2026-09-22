# Morning review: EMSA website build

Built overnight on September 22, 2026 by Claude Code from `CLAUDE.md`, `docs/BRIEF.md` (v5), and `docs/PHOTO-DIRECTIONS.md`, following your kickoff prompt. All ten pages are done, and the self-review found nothing still failing. Nothing was deployed, no accounts were created, nothing was installed, and nothing was fetched from the internet. `CLAUDE.md`, everything in `docs/`, all six photos, `README.md`, and `.gitignore` are byte-for-byte unchanged (checked with `git diff` against the first commit).

## Preview it

From the repo root:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. To look on your phone, keep that running and open `http://<your Mac's local IP>:8000` on the same Wi-Fi. Test at phone width first (CLAUDE.md).

## Before anything goes public

Everything else in this file can wait. These can't.

1. **Don't publish the repo root.** The site's pages sit at the repo root, next to `docs/BRIEF.md` (which includes the internal "about 15 consistently active" figure), `CLAUDE.md`, this file, and all six photos, including the unused G and E. Free GitHub Pages also needs a public repo, which would expose `docs/` on github.com even if Pages skipped it. Two safe options:
   - Keep this repo private and deploy with Cloudflare Pages, pointing the output directory at a folder that holds only the ten pages, `css/`, and cleared photos.
   - Or publish from a separate site-only repo.

   Either way it's your call. I didn't restructure anything, because CLAUDE.md sets up the pages at the root.
2. **Photo consent.** Photo A (Home hero, Join) shows four identifiable students, and consent is pending in PHOTO-DIRECTIONS. Photo B now shows only hands and a manikin on screen, but its file still contains faces. Confirm consent or swap the photos.
3. **Placeholders.** There are 24 amber "Placeholder" blocks, including the notes above the 5 placeholder iframes (4 Google Forms and the Google Calendar). The full list with file:line is under [Remaining TODOs](#remaining-todos).
4. **Medical review.** Please check `emergency.html` and the general health sentences in [judgment call 13](#judgment-calls) against current AHA guidance. They follow standard lay-rescuer guidance, and a second reviewer checked them too, but you're the AHA instructor.
5. **Things I couldn't verify offline:**
   - the two Ohio Department of Health links on `naloxone.html` (from brief §15)
   - whether Miami publishes an AED map (brief §5 marks it VERIFY)
   - what exactly is in a Narcan kit
   - the Ohio-requirements FAQ answer
   - what the Heart Club does
6. **Stop the Bleed.** Brief §11 allows the name only for courses taught by a registered Stop the Bleed instructor. Please confirm that's true for EMSA's sessions, and check the trademark line against ACS's wording. The reviewer thought the mark may belong to the U.S. Department of Defense and be administered through ACS.
7. **Miami marks in photos.** D shows small Miami Ms on about eight kit cards, F shows the Miami University wordmark and M on the trophy, and A shows a Miami shirt. D and F are marked "Ready," so they're shown unaltered. §11 says Miami marks need Trademarks and Licensing approval, so a quick OK is worth getting. E is held back entirely (see below).
8. **Strip resolved TODO comments.** They're visible in the page source (for example, "consent is still pending"). Remove each one as you resolve it.
9. **Deploy only from EMSA-owned accounts** (entity email, custom domain with no Miami marks), per CLAUDE.md.

## Second review pass

After building, I had a separate Claude agent audit every page against the brief with read-only instructions. It independently confirmed:

- the non-negotiables
- every number, name, and date
- all alt text
- the §5 coverage
- the CPR, AED, and dispatcher steps

It also raised findings. What I did about each:

| Finding | What I did |
|---|---|
| Photo E's CSS crop still served the uncleared Miami M (reader view, the image's own URL) | **Fixed.** E is no longer used; it's a visible placeholder whose TODO holds the alt text for the original |
| Faces with consent pending are in the markup (A, B) | **Partly changed.** B is now cropped on screen to hands, mask, and manikin. A stays on Home and Join because you asked for the photos per the directions, and a local build isn't publishing. Consent is blocker 2 |
| Deploying the repo root would publish `docs/`, `CLAUDE.md`, and unused photos | **Documented** as blocker 1 (a hosting decision for you) |
| "Who it's for: EMSA members" (Heart Club) isn't in the brief | **Fixed:** now a visible placeholder |
| Kit contents weren't in the brief | **Fixed:** kept only "Each Narcan kit contains Narcan, a naloxone nasal spray"; the full list is a placeholder |
| FAQ Q15 didn't really answer the question | **Fixed:** kept the factual sentence and added a visible placeholder |
| "Anyone who wants naloxone" widened the audience | **Fixed:** "Anyone on campus…" (the brief's "distribution on campus") |
| Hands-only CPR should say "doesn't respond… or is only gasping" | **Fixed** |
| Overdose steps: CPR first, naloxone doesn't replace CPR, second dose, recovery position | **Fixed** |
| Fentanyl test strips need "a negative result doesn't mean a drug is safe" | **Fixed** |
| "Certified instruction" could read as the AHA certifying EMSA | **Fixed:** heading is now "Our instructors" |
| The About meta description reworded the award | **Fixed:** "Miami University's 2024–25 New Student Organization of the Year" |
| The mission dropped the first response unit clause | **Fixed:** added, with "not operating or approved" in the same sentence |
| FAQ Q16 didn't say the unit isn't operating or approved | **Fixed** (per brief §11) |
| The Outreach Team was implied to be part of community outreach | **Fixed:** removed the inference |
| "(brand name Narcan)" implied it's the only brand | **Fixed:** "often sold under the brand name Narcan" |
| Photo B shows "ANTHONY WAYNE GENERALS" (a school name) | **Fixed** by the new B crop |
| Home recognition line lacks "Miami University's" | **Kept.** It's §5's exact quoted line; §3 says to use the official wording. The brief contradicts itself here, so it's your call. The footer strip stays exactly as CLAUDE.md says |
| "EMTs help teach and staff classes and events" could read as standby coverage | **Kept:** it's the brief's own wording. Consider rewording |
| Privacy line: Project DAWN sites usually report totals | **Kept** the §11 wording ("We do not share the information you submit."). Consider "We never share who made a request." Also confirm the next distribution night is open to individual students |
| Photo A is 536 KB (over ~300 KB) | **Kept:** photo files are off limits to me (judgment call 6) |
| Optional extra emergency tips; spelling out Project DAWN's acronym | **Skipped:** the page is already over its 150-word target, and the acronym isn't in the brief |

## What was built

| File | What's on it |
|---|---|
| `index.html` | Home: one-sentence pitch, Join EMSA button above the fold, quick facts (any Miami student, no requirements, no dues, about 1 hour a week), buttons for CPR sign-up and naloxone, photo A, impact band over photo D, recognition line, three program tiles, partner names in text |
| `what-we-do.html` | Training, Harm Reduction, and Community Outreach per §5; each program has what and why, who it's for, and an action link, and each group ends with a join prompt. No mention of the first response unit |
| `join.html` | Benefits, who can join, time commitment, a typical semester, interest form embed, what happens next (with the GroupMe link), already-a-member section (GroupMe plus next-meeting placeholder), Miami Central signup, For EMTs, open officer roles |
| `cpr-classes.html` | BLS, Heartsaver CPR/First Aid, and Stop the Bleed; class details (free, on campus, usually Sundays, eCard via Therapeutic Professionals, valid two years through the end of the issue month); schedule placeholder; registration and group-request form embeds; AHA disclaimer verbatim in the page body |
| `naloxone.html` | Project DAWN explained, what's in a kit (with placeholders), supplies and fraternity-house numbers (photo D), Ohio law with ODH links, pickup options, low-identification request form embed with the §11 privacy notes |
| `emergency.html` | Opens with "Call 911." and "EMS Alliance does not respond to emergencies." Then what to tell the dispatcher, what to do until help arrives, hands-only CPR, AED steps, suspected overdose steps, and a "Learn CPR with EMSA" button |
| `events.html` | Google Calendar embed (placeholder) and the typical semester |
| `about.html` | Founding, full mission, leadership with headshot placeholders, the web-officer role placeholder (§7), our instructors, affiliations in text, recognition beside photo F, impact numbers, and "Where we're headed" (first response unit: goal only, not operating, not approved, EMSA does not respond) |
| `faq.html` | All 16 §5 questions, grouped by audience, with jump links |
| `contact.html` | Email and social placeholders, GroupMe, Miami Central, a 911 notice, and links to every form |
| `css/style.css` | The one shared stylesheet, commented section by section for whoever edits it next |

Every page has the same header (EMSA wordmark, Menu on phones, and a sticky **Join EMSA** button) and the same footer: a Join EMSA button, the GroupMe link, a site map, the recognition strip, then the Miami independence line, the medical/911 line, and the AHA disclaimer.

## Design decisions

**Palette.** Navy for trust, red for the Join button and the emergency panel, teal as the public-health accent, and amber only for placeholders. Every pair was measured before any CSS was written:

| Use | Colors | Contrast | Needed |
|---|---|---|---|
| Body text | `#1B2631` on white | 15.35:1 | 4.5 |
| Headings | `#0B2A45` on white | 14.67:1 | 4.5 |
| Links | `#1C5D99` on white / on `#F1F5F9` | 6.83 / 6.23:1 | 4.5 |
| Join EMSA button, emergency panel | white on `#B3261E` (hover `#8E1F18`) | 6.54 (8.90):1 | 4.5 |
| Secondary buttons | `#14406B` on white | 10.63:1 | 4.5 |
| Stop the Bleed text tile | white on `#0F6B64` | 6.35:1 | 4.5 |
| Muted text | `#4A5663` on white / on `#F1F5F9` | 7.49 / 6.84:1 | 4.5 |
| Footer text / disclaimers | `#E3EAF1` / `#C3CFDB` on `#0B2A45` | 12.09 / 9.27:1 | 4.5 |
| Impact numbers over photo D | white on 88% navy overlay (worst case: whitest pixel) | 10.15:1 | 4.5 |
| Placeholder text / tag | `#1B2631` on `#FFF6DB` / white on `#7A5200` | 14.22 / 6.92:1 | 4.5 |
| Focus ring | `#0B2A45` on light, `#FFD166` on dark and red | 14.67 / 10.18 / 4.53:1 | 3.0 |
| Iframe borders | `#7B8794` on white | 3.66:1 | 3.0 |

**Type.** The system font stack (San Francisco, Segoe UI, Roboto, and so on), with no web fonts: nothing to host, no font requests to Google, and fast on phones. Body text is 17px with 1.6 line height. The heading scale grows with the screen: h1 32 to 48px, h2 26 to 34px, h3 19 to 22px, lead text 19 to 21px. Paragraphs are capped at 42rem, about 75 to 80 characters per line.

**Layout.** Mobile-first. Base styles are single-column phone layouts, with breakpoints at 48em (768px, tablets: two- and three-up grids) and 64em (1024px: full nav, side-by-side hero and program groups). Two small-phone rules: under 30em only the EMSA badge shows in the header, and under 22.5em buttons lose a little side padding so the header stays one row down to 320px. The header is sticky only when the window is at least 28em tall, so landscape phones and zoomed screens don't lose a third of the screen to it.

**Wordmark.** A navy "EMSA" badge plus "EMS Alliance" in bold (the badge alone on small phones). No cross or Star of Life symbol: the red cross is legally protected, and the Star of Life would suggest an EMS response service. Each header has a `TODO: logo` comment for when the logo files arrive.

**Navigation without JavaScript.** The site has no JavaScript at all. On phones, "Menu" links to `#site-nav`; the CSS `:target` rule shows the menu, and "Close" links back to `#main`. The trade-off: opening the menu jumps to the top of the page, where the menu is. Wide screens always show the nav. The current page is marked with `aria-current` and a thick red underline, so it isn't shown by color alone.

**Embeds.** Each form and the calendar is a real `<iframe>` with a descriptive `title`, `src="about:blank"` (so it makes no requests), a visible amber note, and a TODO with go-live steps. CSS forces embeds to full width, so pasting Google's `width="640"` can't break the phone layout.

**Photos.** Placement follows PHOTO-DIRECTIONS, with its alt text character for character:

- A: Home, Join
- B: Home, What We Do, CPR Classes
- D: Home tile and impact background, What We Do, Naloxone
- F: About
- E: held back (judgment call 4)
- G: not used; it's named only as the fallback in the consent TODO

The Stop the Bleed spot is a teal text tile with words only. No photo file was edited; crops are done in CSS and documented in `css/style.css`.

## Judgment calls

You asked me not to stop and ask, so here is every ambiguous call I made, the conservative choice I took, and why.

1. **AHA disclaimer on every page.** CLAUDE.md requires it "anywhere classes are promoted." Classes are promoted on Home, What We Do, CPR Classes, Emergency ("Learn CPR with EMSA"), Events, FAQ, Join, and About, so the disclaimer is in the shared footer. That way no future class mention can end up without it. It's also in the CPR Classes page body, so it appears twice there by design.
2. **Photo A stays in place, with consent pending.** A local, unpublished build isn't publishing, and you asked for the photos per the directions. Both A spots have a `TODO: consent`. The reviewer would have used placeholders instead; that's still an option.
3. **Photo B is cropped on screen** to the hands, bag-valve mask, and manikin (the shot list's "hands on a manikin"). The earlier crop showed "ANTHONY WAYNE GENERALS VOLLEYBALL" on the front student's shirt. PHOTO-DIRECTIONS says to never show school names and, if a crop is close, to cut more. The tighter crop also drops faces and a Miami shirt. It departs slightly from "keep the front student" (his hands and arms stay). The full file is still served, so export the original at this crop.
4. **Photo E isn't used.** A CSS crop can't satisfy "do not embed Miami's logo," since reader view or the image's own URL would still show the uncleared M card. Its spot is a placeholder, and the TODO holds the alt text.
5. **Miami marks in D and F are kept** because you marked both "Ready" (blocker 7).
6. **Photo A is 536 KB,** over the ~300 KB target. I didn't re-export it because you said not to modify photos. When the originals come in, something like `sips -s format jpeg -s formatOptions 70 A.jpg --out A-web.jpg` should get it under the target. The Home page loads about 1 MB in total.
7. **Logo:** a clean text wordmark, as you asked, with a `TODO: logo` comment in each header instead of a visible placeholder box, which would contradict "clean wordmark."
8. **GroupMe link placement.** It's in the three places CLAUDE.md names (join confirmation copy, the already-a-member section, the footer) and also in the Contact page body, because brief §4 lists it for Contact and the footer already puts it on that page. The Miami Central link is on Join and Contact only.
9. **The Home partner list** names the Butler County General Health District, Miami's Office of Student Wellness, Project DAWN / ODH, and NCEMSF. The AHA and Therapeutic Professionals appear only on About and FAQ, with context, so the homepage never reads as if the AHA sponsors EMSA. The reviewer suggests giving Student Wellness and the health district a heads-up before they're named publicly.
10. **Course descriptions are minimal.** The brief gives only audiences. I expanded BLS to "Basic Life Support" and described Heartsaver as "CPR and first aid." eCard claims are limited to BLS and Heartsaver; nothing about Stop the Bleed certificates.
11. **The Stop the Bleed trademark line** uses brief §11's own words (blocker 6).
12. **Unanswered questions became visible placeholders:** FAQ Q15 (Ohio requirements), what the Heart Club does and who it's for, and the full contents of a kit.
13. **General health statements** (not EMSA facts) were added where §5 asks for a "why" or a plain explanation. They need your review (blocker 4):
    - "You learn to help in the minutes before emergency responders arrive" (what-we-do)
    - "so you know what to do when someone is badly bleeding" (what-we-do)
    - "Naloxone can reverse an opioid overdose, so having it on hand can save a life" (what-we-do)
    - "so younger students learn safety basics early" (what-we-do)
    - "Naloxone, often sold under the brand name Narcan, is a medication that can reverse an opioid overdose" (naloxone)
    - "Each Narcan kit contains Narcan, a naloxone nasal spray" (naloxone)
    - "Fentanyl test strips check a drug sample for fentanyl. A negative result does not mean a drug is safe." (naloxone)
    - every step on `emergency.html`
14. **The emergency page** runs about 355 words against the 150-word target. §5 requires dispatcher, CPR, AED, and naloxone guidance, and the review added safety detail. It has no `tel:911` link (a tap target that dials 911 invites accidental calls) and no campus phone numbers (brief §17).
15. **What We Do** is about 470 words against the 500 to 700 target. I didn't pad it beyond the brief's facts.
16. **Membership numbers.** "60+ members" appears on About only. "About 15 active" appears nowhere, and "active" is never used for a member count.
17. **WhatsApp isn't mentioned.** No link was supplied, and §10 says "if still active."
18. **Left out:** analytics, favicon, Open Graph tags, and a privacy page. They need accounts, a domain, or logo files. They're listed under [Later](#later-not-blocking).
19. **Git author.** Commits use your global git identity (Maxwell Ilecki, your miamioh.edu address). If the public repo should show only the EMSA entity identity, set a repo-local `user.email` and rewrite history before the first push.

## Self-review checklist

Every result below comes from a fresh run on the final code.

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Every internal link resolves, including `#fragment` targets | PASS | All links on 10/10 pages; all 51 `aria-labelledby` targets exist too |
| 2 | Both footer lines on every page, verbatim | PASS | 10/10 pages each, compared against the strings in CLAUDE.md |
| 3 | Recognition strip on every page, text only, above the disclaimers | PASS | 10/10 pages; byte-for-byte identical footers |
| 4 | Full AHA disclaimer on `cpr-classes.html` | PASS | In the page body and the footer; also in the footer of all 10 pages |
| 5 | Every image has its PHOTO-DIRECTIONS alt text | PASS | 9/9 `<img>` tags match exactly (A ×2, B ×3, D ×3, F ×1); E and G are not used |
| 6 | One h1 per page | PASS | 10/10 |
| 7 | Heading order never skips a level | PASS | 10/10 |
| 8 | 375px layout and CSS breakpoints | PASS | No sideways scrolling in 33/33 scenarios: all 10 pages plus the open menu, at 375px, 320px, and 375px with 200% text. The header is one row from 320 to 375px. The breakpoint review is under Layout above |
| 9 | Header and footer identical on every page | PASS | Only `aria-current` differs between headers |
| 10 | Well-formed HTML | PASS | Balanced tags, unique ids, one header/main/footer, labeled navs, `lang`, viewport, unique titles |
| 11 | Every embed is a titled iframe with `about:blank` and a TODO | PASS | 5/5 |
| 12 | Every visible placeholder has a TODO | PASS | 24/24 |
| 13 | Visible keyboard focus | PASS | 8/8 control types show a 3px ring (navy on light, yellow on dark); no `outline: none` |
| 14 | Contrast at least 4.5:1 for text, 3:1 for UI | PASS | 31/31 measured pairs |
| 15 | No JavaScript, web fonts, or external scripts or images | PASS | 0 `<script>`; the only external links are GroupMe, Miami Central, and two ODH pages |
| 16 | `emergency.html` opens with "Call 911." | PASS | The first element in `<main>` is `<h1>Call 911.</h1>` |
| 17 | First response unit presented as a goal only, and never on What We Do | PASS | Scripted check plus the second review |
| 18 | No ONEbox, "click here", "learn more", active-member counts, torch, or Eventbrite | PASS | Scanned all visible text |
| 19 | `CLAUDE.md`, `docs/`, photos, and README untouched | PASS | Empty `git diff` against the first commit |
| 20 | The checker can actually fail | PASS | Run against a scratch copy with 9 planted defects, it caught all 9 |

**Found and fixed during the self-review** (before the second pass):

- Photo placeholders overflowed a 375px screen (an `aspect-ratio` quirk in grids). Fixed with `min-width: 0` on grid children.
- With the menu open at 320px, "Close menu" pushed Join EMSA 38px off-screen. It now shows "Close" (the screen reader name stays "Close menu"), and the header may wrap at very large text sizes.
- That wrapping made the header two rows at 320px. Slightly tighter button padding under 360px keeps it to one row.
- An undefined CSS class sat on the Join-page photo.
- The three headshot placeholders shared one TODO; each now has its own.
- TODO comments were labeled inconsistently; they now all follow `TODO: <kind>. <what's needed>`.
- At 200% text, the "Placeholder" tag and a few buttons overflowed. They can now wrap.

## Remaining TODOs

Every item below is also a `<!-- TODO: ... -->` comment at that line, so `grep -n "TODO:" *.html` finds them all.

| File:line | Kind | What is needed |
|---|---|---|
| `index.html:58` | consent | Photo A shows four identifiable students and their consent is still pending (PHOTO-DIRECTIONS). |
| `index.html:86` | photo | Photo B is a placeholder screenshot. The .photo-b-frame rule in css/style.css shows only the hands-on-manikin close-up, which keeps faces (consent pending), a high school name, and a Miami shirt off screen, but the full file is still served. |
| `index.html:109` | photo | Tabling or Heart Club shot (coming from Max). No children and no school names. |
| `what-we-do.html:60` | photo | Photo B is a placeholder screenshot. The .photo-b-frame rule in css/style.css shows only the hands-on-manikin close-up, which keeps faces (consent pending), a high school name, and a Miami shirt off screen, but the full file is still served. |
| `what-we-do.html:64` | photo | This text tile stands in for a Stop the Bleed photo until the reshoot (practice on a trainer or the supplies table, projector off or out of frame). |
| `what-we-do.html:127` | photo | Tabling or Heart Club shot (coming from Max). |
| `what-we-do.html:131` | photo | K–6 Outreach: supplies or an empty classroom only. Never children, never school names. |
| `what-we-do.html:146` | content | Add what the Heart Club does and who it's for; the brief gives no detail on either. |
| `join.html:61` | consent | Photo A shows four identifiable students and their consent is still pending (PHOTO-DIRECTIONS). |
| `join.html:98` | real form URL | Join interest form: a Google Form under the EMSA entity account, responses to a Sheet under the same account. |
| `join.html:123` | next meeting date | Add the next general body meeting (date, time, place) and update it each time. |
| `join.html:140` | officer roles | When elections approach, list each open role here in one line (brief section 5). |
| `cpr-classes.html:56` | photo | Photo B is a placeholder screenshot. The .photo-b-frame rule in css/style.css shows only the hands-on-manikin close-up, which keeps faces (consent pending), a high school name, and a Miami shirt off screen, but the full file is still served. |
| `cpr-classes.html:60` | photo | This text tile stands in for a Stop the Bleed photo until the reshoot (practice on a trainer or the supplies table, projector off or out of frame). |
| `cpr-classes.html:122` | class dates | Add this semester's classes here (date, time, course, and on-campus location) once Max sets them. |
| `cpr-classes.html:135` | real form URL | Class registration: a Google Form under the EMSA entity account (one form per class, or one form with a date dropdown), responses to a Sheet under the same account that tracks capacity. |
| `cpr-classes.html:153` | real form URL | Group class request: a Google Form under the EMSA entity account, responses to a Sheet under the same account. |
| `naloxone.html:65` | content | Confirm exactly what goes in each kit; brief section 5 asks for "what's in a Narcan kit" but gives no list. |
| `naloxone.html:72` | photo | Photo E (inside a kit) is held back. Its left half shows a card with the Miami M, which Max has not cleared, and cropping it with CSS would still serve the logo (in reader view or through the image's own URL). |
| `naloxone.html:128` | real form URL | Naloxone and supply request: a Google Form under the EMSA entity account, responses to a Sheet that only officers can open (brief section 11). |
| `emergency.html:49` | medical review | Max (AHA instructor) should check the CPR, AED, and naloxone steps below against current AHA guidance before this page is published. |
| `emergency.html:102` | verify | Find out whether Miami publishes an AED map (brief section 5 marks this VERIFY). |
| `events.html:50` | calendar embed | Create the EMSA calendar under the entity account and make it public. In Google Calendar: Settings > this calendar > Integrate calendar > Embed code. |
| `about.html:54` | photo | Group photo of members (landscape), coming from Max. Confirm consent before publishing. |
| `about.html:68` | photo | Headshot of Max Ilecki. |
| `about.html:76` | photo | Headshot of Jordan Vandeventer. |
| `about.html:84` | photo | Headshot of Leslie Haxby-McNeill. |
| `about.html:93` | officer role | Brief section 7 asks for a named officer role that owns the website, social media, and the weekly update (Georgetown's squad calls theirs "Director of Electronic Systems"). |
| `about.html:132` | photo | One photo from the NCEMSF national conference, coming from Max. Confirm consent before publishing. |
| `faq.html:109` | content | Confirm or expand this answer before publishing. Brief section 5 poses the question without an answer, so the answer below uses only facts from the brief. |
| `contact.html:55` | entity email | Add the EMSA entity email address here as a mailto: link. Never a personal address. |
| `contact.html:62` | social handles | Add links to EMSA's social media accounts (brief section 10 lists the handles as pending). |
| `index.html:18`, `what-we-do.html:18`, `join.html:18`, `cpr-classes.html:18`, `naloxone.html:18`, `emergency.html:18`, `events.html:18`, `about.html:18`, `faq.html:18`, `contact.html:18` | logo | Replace the text wordmark with the EMSA logo files (vector + PNG) in the header on all ten pages. |

<!-- 42 TODO comments total (32 content/photo/form TODOs + 10 logo TODOs in the shared header) -->

## Suggested text for things outside the site

**Join form confirmation message** (Google Forms > Settings > Presentation > Confirmation message). Fill in the brackets each time:

> Thanks for your interest in EMS Alliance! Our next general body meeting is [day, date, time, place]. Join the EMSA GroupMe to get our weekly update: https://groupme.com/join_group/117642476/zucoqhJi. An officer will add you if you haven't joined yet. See you there!

## Going live with a form or the calendar

1. Create it under the EMSA entity Google account, with responses going to a Sheet under the same account. For the naloxone form, only officers get access, there's no name field, and it has the "for myself / for my chapter house" choice.
2. Forms: Send > `<>` Embed. Calendar: make it public, then Settings > Integrate calendar > Embed code.
3. In the page, paste **only the `src` URL** into the existing iframe. Keep its `title` attribute (screen readers use it), set `height` to the value Google suggests, and delete the amber placeholder `<div>` just above it.
4. Once the page shows the real form, delete that TODO comment.

## Updating common things

- **Impact numbers** are in `index.html`, `about.html`, `what-we-do.html`, and `naloxone.html`, each marked with a comment. Update all four from the tracking sheet.
- **Header or footer:** change all ten pages in the same commit (CLAUDE.md). Only `aria-current="page"` differs between headers.
- **Class dates:** the schedule placeholder in `cpr-classes.html`, plus the calendar.
- **Officers:** `about.html` (Leadership) and `faq.html` (the Partners question on leadership).
- **Photo originals:** export at the crop the directions ask for, then delete the matching CSS crop rule (section 9 of `css/style.css`) and use a plain `<img>` with the same alt text.

## Later (not blocking)

Privacy-respecting analytics (brief §11), a favicon and social-share image once the logo exists, a privacy statement page (§17), and a new Stop the Bleed photo, K–6 supplies photo, and tabling/Heart Club photo.

## How this was checked

- `python3` scripts (standard library only) parsed every page. The strings under test were read from `CLAUDE.md` and the alt text from `PHOTO-DIRECTIONS.md`, not retyped.
- Layout, focus, and overflow were measured in the locally installed Chrome, run headless on `file://` pages with every DNS lookup blocked, so no request could leave the machine. Pages were loaded in exact-width iframes because Chrome windows can't be narrower than about 500px.
- A second Claude agent reviewed all the copy against the brief with read-only instructions (above).
- Scratch tools and screenshots stayed outside the repo. Nothing was added to the project except the site files and this review.

## Commits

- `9466c87` Add project brief, photo directions, and photos
- `0fec2e5` Add shared stylesheet: palette, type scale, layout, components
- `cdeb19b` Add Home page (index.html)
- `145afc3` Fix grid overflow of photo placeholders on phones
- `e5103fd` Add What We Do page (what-we-do.html)
- `f3967fb` Add Join page (join.html)
- `b5b37cc` Add CPR Classes page (cpr-classes.html)
- `341709d` Add Naloxone & Harm Reduction page (naloxone.html)
- `cde95d6` Add In an Emergency page (emergency.html)
- `c101101` Add Events page (events.html)
- `270e5d2` Add About page (about.html)
- `ce9360d` Add FAQ page (faq.html)
- `9861544` Add Contact page (contact.html)
- `3ea5185` Fix phone header overflow when the menu is open at 320px
- `53fe54f` Normalize TODO comments to 'TODO: <kind>. <what is needed>'
- `0657ede` Apply fixes from the independent fact-check review
- and a final commit that adds this review
