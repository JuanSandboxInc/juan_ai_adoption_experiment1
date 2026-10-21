# Sandbox Labs · Intro to AI (Webflow)

The Sandbox Labs **"Intro to AI"** page, built in Webflow with Claude for Boaz's *Intro to AI Experiment*.
This repo holds everything that was put into Webflow, a script that rebuilds a local mirror of the page,
and Playwright tests that run against the mirror or the live site.

Live: <https://sb-ai-adoption-page.webflow.io/intro-to-ai>

## Structure

```
webflow/sections/          Round-1 native sections (WHTML): NN-name.html + .css, 00-base.css.
                           Still live: 01 nav, 04 history, 11 CTA, 13 footer.
webflow/sections-v2/       v2 (Boaz-aligned) native sections: 02 hero, 03 what is AI, 05 how it works,
                           06 LLMs, 07 reasoning, 08 risks, 09 public interest, 10 references, 12 glossary,
                           plus 00-base2.css and TYPE_SCALE.md. (*.v2.* files are earlier drafts.)
webflow/sections-v2/js/    Readable v2 section scripts (concatenated into embeds/dist/sections-v2-scripts.html)
webflow/payloads/          Round-1 JSON payloads sent to the Webflow API
embeds/src/                Readable Code Embed sources (timeline, quiz, howitworks; predict and *-video are retired)
embeds/dist/               Embeds exactly as pasted into Webflow (timeline, quiz, sections-v2-scripts)
embeds/page-behaviours.html  Chapter-nav fill / current state, mobile menu (ripple code is inert)
embeds/font.html           Font embed: Switzer from Fontshare, base html/body styles, :focus-visible rules
content/copy_final.json    Approved copy (use the `final` field)
assets/images/             Images referenced by sections (served locally from site/a/)
assets/media/              Animated WebP for the reasoning / agentic slots (served locally from site/media/)
docs/DECISIONS.md          Decision log (round 1 and round 2)
scripts/build_local.py     Builds the local mirror of the live page at site/index.html
scripts/build_payloads_v2.py  Builds WHTML payloads for the v2 sections (webflow/payloads-v2/, not committed)
tests/                     Playwright specs + live-harness.js (console version of the suite)
.github/workflows/tests.yml  CI: runs the suite against the live page on every push
```

## The live page (v2)

Sections in order, with their ids (the chapter nav links to the first nine):

| # | Section | Source | id |
|---|---------|--------|----|
| 01 | Nav (logo mark + wordmark, chapter nav) | `sections/01-nav` | `#top` |
| 02 | Hero ("Why this page", scroll-lit text) | `sections-v2/02-hero` | `#why-this-page` |
| 03 | What is AI (types-of-AI explorer) | `sections-v2/03-what-is-ai` | `#what-is-ai` |
| 04 | History (timeline + quiz embeds) | `sections/04-history` | `#history` |
| 05 | How it works (shell + `howitworks` embed) | `sections-v2/05-how-it-works` | `#how-it-works` |
| 06 | LLMs (strengths / weaknesses tabs + accordions) | `sections-v2/06-llms` | `#llms` |
| 07 | Reasoning models and agentic AI (2 animated WebP) | `sections-v2/07-reasoning` | `#reasoning` |
| 08 | Risks (7 cards, Bias "Read more" sheet; no ripple) | `sections-v2/08-risks` | `#risks` |
| 09 | Public interest | `sections-v2/09-public-interest` | `#public-interest` |
| 10 | References (collapsible, 38 entries, footnotes open it) | `sections-v2/10-references` | `#references` |
| 11 | CTA | `sections/11-cta` | |
| 12 | Glossary (floating `.gl2-fab` opens a side sheet, 20 terms) | `sections-v2/12-glossary` | `#glossary` |
| 13 | Footer | `sections/13-footer` | |

How it is put together in Webflow:

- **Native sections** are real Webflow elements and classes, inserted with the WHTML builder.
  WHTML rejects `:focus-visible`, so those rules are in the font embed.
- **Webflow publishes a native `<button>` as `<a href="#" class="w-button">`.** The v2 scripts guard
  against the jump to `#` and add button semantics. Tests select native controls by class or data
  attribute, never by the `button` tag.
- **Code Embeds** sit in `<div class="embed-slot" data-embed="…">`: `timeline` and `quiz` (History),
  `howitworks` (How it works). The `reason-video` / `agentic-video` slots hold an `<img>` of an animated WebP.
  The timeline loads its 24 photos from Webflow's CDN (`cdn.prod.website-files.com`, ids in `embeds/timeline-asset-ids.json`).
- **Script embeds**: `embeds/page-behaviours.html` (chapter-nav fill and `w--current` / `aria-current`, mobile menu)
  and `embeds/dist/sections-v2-scripts.html` (button guard, fast chapter-nav scroll, hero, explorer, LLMs,
  risks, references, glossary).
- **Font embed** (`embeds/font.html`): Switzer from Fontshare. Page-level custom code was not available (API 404).

To change a script: edit the readable file (`embeds/src/` or `webflow/sections-v2/js/`), rebuild the dist file,
and paste it into the matching Code Embed in the Webflow Designer.

## Running the tests

Requires Node 20+ and Python 3.

```bash
npm ci
npx playwright install --with-deps      # first time only

# local mirror: scripts/build_local.py writes site/, Playwright serves it on :4173 (python http.server)
npm run build
npm test                                # all projects
npm run test:local                      # build + chromium and mobile-chromium only

# live Webflow page
npm run test:live                       # = BASE_URL=https://sb-ai-adoption-page.webflow.io/intro-to-ai playwright test
BASE_URL=https://example.webflow.io/intro-to-ai npx playwright test --project=chromium
```

`BASE_URL` set means "live": no local server, and the live-only checks run. Projects: `chromium`, `firefox`,
`webkit`, `mobile-chromium` (Pixel 7), `mobile-webkit` (iPhone 13). Reports: `npx playwright show-report`.

The local mirror is close to live but not identical: it keeps real `<button>`s (live has `a.w-button`), and
Webflow CDN images (timeline photos) may be unreachable offline.

What is covered (`tests/`):

| Spec | Checks |
|------|--------|
| `page.spec.js` | No uncaught JS errors, all embeds initialise; 10 section ids, no duplicate ids; 9 chapter links; clicking Risks lands it under the header within 1.5 s, sets `aria-current`, fills earlier chapters; hero words light up on scroll (skipped with reduced motion); approved copy; **live only:** every image loads |
| `sections.spec.js` | What is AI explorer (card per control, `aria-pressed`, page does not move); LLM tabs and accordions; reasoning images load; risks (7 cards with shapes, no ripple, Bias sheet + Escape); references (38, footnote 21 opens the list); glossary (FAB, 20 terms, Escape) |
| `embeds.spec.js` | Timeline (24 slides, arrows, keyboard, Lighthill 1973 credit); quiz (10 questions to a result, Escape); How it works (6 steps, Next, "Start over", Restart) |
| `mobile.spec.js` | At 390 px: no horizontal overflow, menu button toggles `.is-menu-open`, quiz dialog is full width |

`tests/live-harness.js` is the same suite as a console snippet: paste it into DevTools on the live page.

### GitHub Actions

`.github/workflows/tests.yml` runs on every push, pull request and manual dispatch: `npm ci`,
`npx playwright install --with-deps`, then `npm run test:live` against the live page on all five projects
(chromium, firefox, webkit, mobile-chromium, mobile-webkit), with 2 retries. The HTML report is uploaded as
the `playwright-report` artifact.

## Known gaps

- **Switzer is loaded from Fontshare** via the font embed, not installed as a Webflow font.
- **LLM accordions animate shut on load.** They are open without JS and close with a 0.32 s transition when
  the script runs, so the page height changes just after load (the chapter-nav test waits for it to settle).
