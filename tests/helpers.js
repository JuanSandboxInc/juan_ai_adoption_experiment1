// Shared helpers. PAGE_URL is set by playwright.config.js (BASE_URL or the local mirror).
const PAGE_URL = process.env.PAGE_URL || process.env.BASE_URL || 'http://127.0.0.1:4173/index.html';

/** Open the page and collect uncaught JS errors. Returns the array of errors (live). */
async function openPage(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err));
  await page.goto(PAGE_URL, { waitUntil: 'load' });
  return errors;
}

/** Jump (no smooth scrolling) so the element's top sits at the top of the viewport. */
async function jumpTo(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error('missing ' + sel);
    const y = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
  }, selector);
}

/** Collapse whitespace (incl. nbsp) for text comparisons. */
const norm = (s) => s.replace(/[\s ]+/g, ' ').trim();

module.exports = { PAGE_URL, openPage, jumpTo, norm };
