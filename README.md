# Sandbox Labs · Intro to AI (Webflow)

The Sandbox Labs **"Intro to AI"** page, built in Webflow with Claude for Boaz's *Intro to AI Experiment*.
This repo holds everything that was put into Webflow, a script that rebuilds a local mirror of the page,
and Playwright tests that run against the mirror or the live site.

Live: <https://sb-ai-adoption-page.webflow.io/intro-to-ai>

## Structure

```
webflow/sections/      Native sections as inserted into Webflow (WHTML): NN-name.html + NN-name.css, 00-base.css
webflow/payloads/      The JSON payloads sent to the Webflow API per section
embeds/src/            Readable sources of the 3 Code Embeds (timeline, quiz, predict)
embeds/dist/           Minified versions, exactly as pasted into Webflow
embeds/page-behaviours.html   Behaviour embed (chapter-nav progress, ripple reveal, mobile menu)
embeds/font.html       Font embed (Switzer from Fontshare + base html/body styles)
content/copy_final.json  Approved copy (use the `final` field)
assets/images/         Images referenced by sections and the timeline (not yet in Webflow assets)
docs/DECISIONS.md      Short decision log
scripts/build_local.py Builds the local mirror at site/index.html
tests/                 Playwright Test specs
.github/workflows/tests.yml  CI: runs the suite against the live page on all browsers
```

## How the Webflow mapping works

- **Native sections (01 nav … 13 footer)** are real Webflow elements and classes, inserted with
  Webflow's WHTML builder from `webflow/sections/*.html` + `.css`. Section ids (`#why-this-page`,
  `#history`, `#risks`, …) are the chapter anchors.
- **3 Code Embeds** sit where the sections have `<div class="embed-slot" data-embed="…">`:
  - `timeline` (04 History): full-bleed slideshow of 24 milestones. Reads its image base from the
    closest `[data-img-base]` ancestor, falling back to the Webflow CDN placeholder.
  - `quiz` (04 History, `#knowledge-check`): "Test your knowledge" dialog, 10 questions.
  - `predict` (05 How it works): prediction machine, 4 steps per round.
- **1 behaviour embed** (`embeds/page-behaviours.html`): chapter-nav fill and `w--current`,
  ripple reveal (`.ripple-svg` → `.is-in`), mobile menu (`.menu-button` toggles `.is-menu-open` on `.site-header`).
- **1 font embed** (`embeds/font.html`): Switzer from Fontshare.

Page-level custom code was not available (API 404), so font and behaviours live in Code Embeds.
Edit the readable file in `embeds/src/`, re-minify into `embeds/dist/`, and paste the dist file into the
matching Code Embed in the Webflow Designer.

## Running the tests

Requires Node 20+ and Python 3.

```bash
npm ci
npx playwright install --with-deps      # first time only

# local mirror (builds site/ then serves it on :4173 via python http.server)
npm run build
npm test                                # all projects
npm run test:local                      # build + chromium and mobile-chromium only

# live Webflow page
npm run test:live                       # = BASE_URL=https://sb-ai-adoption-page.webflow.io/intro-to-ai playwright test
BASE_URL=https://example.webflow.io/intro-to-ai npx playwright test --project=chromium
```

Projects: `chromium`, `firefox`, `webkit`, `mobile-chromium` (Pixel 7), `mobile-webkit` (iPhone 13).
Reports: `npx playwright show-report`. CI uploads the HTML report as the `playwright-report` artifact.

What is covered: no uncaught JS errors; chapter-nav links match section ids; scrolling to `#risks` sets
Risks current and fills earlier chapters; timeline (24 slides, arrows, keyboard); quiz (dialog, feedback,
10 questions to a result, Escape closes); prediction machine (toggle, 4 steps); ripple reveal; mobile menu
and no horizontal overflow at 390px; glossary (20 terms); references (38); approved copy strings present.

## Known gaps

- **Images not yet uploaded to Webflow assets.** They live in `assets/images/` (used by the local mirror).
  Section markup uses `ASSET:` placeholders and the timeline falls back to a `REPLACE_WITH_SITE_ID` CDN base
  until the files are uploaded and the URLs / `data-img-base` are set in Webflow.
- **Switzer is loaded from Fontshare** via the font embed, not installed as a Webflow font.
- **Text wordmark placeholder** in the nav instead of the Sandbox logo SVG.
