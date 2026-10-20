// Page-level checks: load, chapter nav, glossary, references, approved copy.
const { test, expect } = require('@playwright/test');
const { openPage, jumpTo, norm } = require('./helpers');
const copy = require('../content/copy_final.json');

const CHAPTERS = ['why-this-page', 'what-is-ai', 'history', 'how-it-works', 'llms',
  'reasoning', 'risks', 'public-interest', 'references'];

test('page loads without uncaught JS errors', async ({ page }) => {
  const errors = await openPage(page);
  await expect(page.locator('#why-this-page')).toBeAttached();
  // give the embeds a moment to initialise and observers to fire
  await page.waitForTimeout(1000);
  expect(errors.map(String)).toEqual([]);
});

test('all 9 chapter-nav links point to existing sections', async ({ page }) => {
  await openPage(page);
  const hrefs = await page.locator('.chapter-nav-link').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual(CHAPTERS.map((id) => '#' + id));
  for (const id of CHAPTERS) {
    await expect(page.locator(`[id="${id}"]`), `section #${id}`).toHaveCount(1);
  }
});

test('scrolling to #risks marks Risks current and fills earlier chapters', async ({ page }) => {
  await openPage(page);
  await jumpTo(page, '#risks');
  const risks = page.locator('.chapter-nav-link[href="#risks"]');
  await expect(risks).toHaveClass(/(^|\s)w--current(\s|$)/);
  await expect(risks).toHaveAttribute('aria-current', 'location');
  // only our behaviour script sets aria-current; Webflow's own link highlighter may also add w--current
  await expect(page.locator('.chapter-nav-link[aria-current]')).toHaveCount(1);
  const before = CHAPTERS.slice(0, CHAPTERS.indexOf('risks'));
  for (const id of before) {
    await expect
      .poll(() => page.locator(`.chapter-nav-link[href="#${id}"] .chapter-nav-fill`)
        .evaluate((f) => f.style.width), { message: `fill for #${id}` })
      .toBe('100%');
  }
  const after = await page.locator('.chapter-nav-link[href="#public-interest"] .chapter-nav-fill')
    .evaluate((f) => parseFloat(f.style.width || '0'));
  expect(after).toBe(0);
});

test('glossary has 20 terms', async ({ page }) => {
  await openPage(page);
  await expect(page.locator('.glossary-term')).toHaveCount(20);
  await expect(page.locator('.glossary-definition')).toHaveCount(20);
});

test('references list has 38 items with ref-N anchors', async ({ page }) => {
  await openPage(page);
  await expect(page.locator('#references .ref-item')).toHaveCount(38);
  await expect(page.locator('#ref-1')).toHaveCount(1);
  await expect(page.locator('#ref-38')).toHaveCount(1);
});

test('approved copy appears as native page text', async ({ page }) => {
  await openPage(page);
  const ids = ['hero-02', 'what-gen-ex', 'llm-s2-title', 'llm-w4-title', 'pi-h3'];
  const text = norm(await page.locator('body').evaluate((b) => b.textContent));
  for (const id of ids) {
    const entry = copy.find((c) => c.id === id);
    expect(entry, `copy id ${id}`).toBeTruthy();
    expect(text, `copy ${id}`).toContain(norm(entry.final));
  }
});

test('Lighthill timeline entry credits the Science Research Council', async ({ page }) => {
  await openPage(page);
  const slide = page.locator('.tl-slide', { has: page.locator('.tl-year', { hasText: /^1973$/ }) });
  await expect(slide).toHaveCount(1);
  expect(norm(await slide.evaluate((s) => s.textContent))).toContain('Science Research Council');
});
