# Redesign type scale (from Boaz's computed styles) — `00-base2.css`

Boaz uses **weight 400 everywhere** (only small uppercase captions are 500). Font: `Switzer, Arial, sans-serif`.
Breakpoint mapping: Boaz 1023 -> 991, Boaz 767 -> 767, Boaz 599 -> 479. Values in px.

| Class | Use (Boaz equivalent) | >991 | <=991 | <=767 | <=479 |
|---|---|---|---|---|---|
| `x-display` | big statement text (`.why__text`) | 70 / 1.08 / -0.03em | 48 | 40 | 32 / 1.12 / -0.02em |
| `x-h2` | section lead-in sentence (`.pi__lead`, `.lead-xl`), mb 32 | 44 / 1.2 / -1px | 24 / 1.15 / -0.01em, mb 24 | 24 | 28 / 1.15 / -0.02em |
| `x-label` | section label, left column (`.label`) 70% white, max-w 220, pt 8 | 19 / 1.3 / -0.01em | 18, pt 2, no max | pt 0 | 16 |
| `x-label-ink` | same, on light/grey bg (navy 70%) | as x-label | | | |
| `x-lead` | large paragraph (`.p-l`, `.why__bridge`, card taglines) | 22 / 1.45 | 19 / 1.4 | 19 | 19 |
| `x-body` | body paragraph (`.p-m`) 70% white, mb 15 | 18 / 1.5 | 16 / 1.45, mb 10 | 16 | 16 |
| `x-body-ink` | body on light/grey bg (navy 82%) | as x-body | | | |
| `x-small` | small text / captions | 16 / 1.4 | 16 | 16 | 15 |
| `x-caps` | uppercase micro-label, weight 500 | 13 / 1.5 / 0.06em | | | |

Layout:
- `x-section`: navy `#13181d`, white text, padding 80/80 (991: 60/60, 479: 30/30) — Boaz's section gap ~158 / 120 / 60.
- `x-wrap`: max-width 1444 incl. 20px gutters (content column 1404, like Boaz); 479: 16px gutters.
- `x-split` + `x-split-body`: label | text grid, `minmax(180px,1fr) minmax(0,977px)`, gap 48. 991: `203px 1fr`, gap 24. 767: one column, row-gap 10.

Colours used by Boaz: navy `#13181d`, grey panel `#d1d1d1`, yellow `#f7ff88`, ink on grey `rgba(19,24,29,.7–.85)`, white 70% for secondary text.

Notes for Webflow (Agent A):
- Webflow turns a second class on the same element into a *combo class* (`.a.b`), so a plain `.b {}` rule may not land as expected. Safest is one class per element; where a section needs a variant of a base style, give it its own prefixed class with the full declarations (as `why2-*` / `wai-*` do).
- Classes that exist only in CSS (e.g. a script-added `.is-on`) are never created in Webflow unless some element carries them. For JS-driven states, either keep the class on an element in the markup, or set the state as inline styles from the script (what `js/02-hero.js` and `js/03-what-is-ai.js` do).
- `sr-only`, `fn`, `fn-link` are reused unchanged from `sections/00-base.css`.
