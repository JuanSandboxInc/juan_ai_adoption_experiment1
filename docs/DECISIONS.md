# Decision log

| # | Decision | Notes |
|---|----------|-------|
| 1 | **Source of truth: Boaz's artifact v4.** | Structure, content order and visual language follow v4 of the Intro to AI artifact. |
| 2 | **Native Webflow first; scripts only where needed.** | Everything is native elements/classes (inserted via WHTML) except: timeline slideshow, knowledge-check quiz dialog, prediction-machine slides, chapter-nav progress, risk ripple reveal, mobile menu toggle. |
| 3 | **Motion: option B (chapter nav) + option C (risk ripple).** | B: sticky chapter nav with per-chapter fill and `w--current`. C: risk ripple reveals centre, then individual (orange), then systemic (purple) rings. Both respect `prefers-reduced-motion`. |
| 4 | **Copy: 65 edits approved.** | Final strings in `content/copy_final.json` (`final` field). Serial (Oxford) commas removed throughout. Factual fixes: Lighthill report attributed to the UK Science Research Council; Dutch childcare-benefits scandal wording corrected. |
| 5 | **Timeline redesigned as a full-bleed slideshow.** | 24 milestones, arrows/keyboard/swipe, segment bar, lazy-loaded neighbour images. Replaces the original horizontal scroller. |
| 6 | **Prediction machine as slides.** | Four steps (input, scores, chosen token, repeat) shown as slides; autoplay while on screen with `STEP_MS = 2200`, stops when the reader takes the controls. |
| 7 | **Font + behaviours in Code Embeds, not page custom code.** | The page-level custom code API returned 404, so the Switzer font link (`embeds/font.html`) and the behaviour script (`embeds/page-behaviours.html`) were placed as Code Embeds on the page. |
