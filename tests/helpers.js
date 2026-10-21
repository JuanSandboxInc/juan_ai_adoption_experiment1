// Shared helpers. PAGE_URL is set by playwright.config.js (BASE_URL or the local mirror).
//
// Selector rule: Webflow publishes a native <button> as <a href="#" class="w-button">, so tests
// for native sections select by class or data attribute, never by the `button` tag. Code Embeds
// (timeline, quiz, how it works) keep real <button>s.
const PAGE_URL = process.env.PAGE_URL || process.env.BASE_URL || 'http://127.0.0.1:4173/index.html';
const LIVE = !!process.env.BASE_URL;

/** The 9 chapter-nav targets, in order. */
const CHAPTERS = ['why-this-page', 'what-is-ai', 'history', 'how-it-works', 'llms',
  'reasoning', 'risks', 'public-interest', 'references'];
/** Every section id on the page (chapters + the glossary section). */
const SECTIONS = [...CHAPTERS, 'glossary'];

/** Open the page and collect uncaught JS errors. Returns the (live) array of errors. */
async function openPage(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));
  await page.goto(PAGE_URL, { waitUntil: 'load' });
  return errors;
}

/** Jump (no smooth scrolling) so the element's top sits `offset` px below the top of the viewport. */
async function jumpTo(page, selector, offset = 0) {
  await page.evaluate(([sel, off]) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error('missing ' + sel);
    const y = el.getBoundingClientRect().top + window.scrollY - off;
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
  }, [selector, offset]);
}

/** Wait until the page height stops changing (e.g. the LLM accordions animating shut after load). */
async function settle(page) {
  await page.evaluate(async () => {
    const W = (ms) => new Promise((r) => setTimeout(r, ms));
    let h = -1;
    for (let i = 0; i < 20 && h !== document.documentElement.scrollHeight; i++) {
      h = document.documentElement.scrollHeight;
      await W(250);
    }
  });
}

/** Computed `visibility` of the first element matching the locator. */
const visibility = (locator) => locator.evaluate((el) => getComputedStyle(el).visibility);

/** True when the browser context asks for reduced motion. */
const prefersReducedMotion = (page) =>
  page.evaluate(() => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches));

/** Collapse whitespace (incl. nbsp) for text comparisons. */
const norm = (s) => s.replace(/[\s ]+/g, ' ').trim();

/** Regex matching a whole class token. */
const hasClass = (c) => new RegExp(`(^|\\s)${c}(\\s|$)`);

module.exports = { PAGE_URL, LIVE, CHAPTERS, SECTIONS, openPage, jumpTo, settle, visibility, prefersReducedMotion, norm, hasClass };
