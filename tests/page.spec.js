// Page-level checks: load, section ids, chapter nav, hero text fill, approved copy, images (live).
const { test, expect } = require('@playwright/test');
const { LIVE, CHAPTERS, SECTIONS, openPage, settle, prefersReducedMotion, norm, hasClass } = require('./helpers');
const copy = require('../content/copy_final.json');

test('page loads without uncaught JS errors', async ({ page }) => {
  const errors = await openPage(page);
  await expect(page.locator('#why-this-page')).toBeAttached();
  // all three Code Embeds initialise
  await expect(page.locator('.tl-root[data-tl-ready]')).toHaveCount(1);
  await expect(page.locator('.kc-root[data-kc-ready]')).toHaveCount(1);
  await expect(page.locator('.hw-root[data-hw-ready]')).toHaveCount(1);
  // scroll through once so scroll / intersection handlers run
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 900) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 20)));
    }
  });
  expect(errors.map(String)).toEqual([]);
});

test('all 10 section ids are present and no id is duplicated', async ({ page }) => {
  await openPage(page);
  for (const id of SECTIONS) {
    await expect(page.locator(`[id="${id}"]`), `#${id}`).toHaveCount(1);
  }
  const dupes = await page.evaluate(() => {
    const seen = new Map();
    document.querySelectorAll('[id]').forEach((el) => seen.set(el.id, (seen.get(el.id) || 0) + 1));
    return [...seen].filter(([, n]) => n > 1).map(([id]) => id);
  });
  expect(dupes).toEqual([]);
});

test('9 chapter-nav links point to existing sections', async ({ page }) => {
  await openPage(page);
  const hrefs = await page.locator('.chapter-nav-link').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual(CHAPTERS.map((id) => '#' + id));
});

test('clicking the Risks chapter link scrolls fast, marks it current and fills earlier chapters', async ({ page }) => {
  await openPage(page);
  // the LLM accordions animate shut just after load; a click before that lands a few px off
  await settle(page);
  const link = page.locator('.chapter-nav-link[href="#risks"]');
  await link.click();
  // the header is sticky; the nav-scroll script lands the section just under it (~0.4s)
  await expect
    .poll(() => page.evaluate(() => {
      const h = document.querySelector('.site-header').getBoundingClientRect().bottom;
      return Math.abs(document.getElementById('risks').getBoundingClientRect().top - h);
    }), { timeout: 1500, message: '#risks under the header' })
    .toBeLessThanOrEqual(8); // sub-pixel header height + late layout shifts above the target
  await expect(link).toHaveAttribute('aria-current', 'location');
  await expect(link).toHaveClass(hasClass('w--current'));
  await expect(page.locator('.chapter-nav-link[aria-current]')).toHaveCount(1);
  for (const id of CHAPTERS.slice(0, CHAPTERS.indexOf('risks'))) {
    await expect
      .poll(() => page.locator(`.chapter-nav-link[href="#${id}"] .chapter-nav-fill`).evaluate((f) => f.style.width),
        { message: `fill for #${id}` })
      .toBe('100%');
  }
  const after = await page.locator('.chapter-nav-link[href="#public-interest"] .chapter-nav-fill')
    .evaluate((f) => parseFloat(f.style.width || '0'));
  expect(after).toBe(0);
});

test('hero: words are wrapped and light up progressively on scroll', async ({ page }) => {
  await openPage(page);
  test.skip(await prefersReducedMotion(page), 'the text fill is off with reduced motion');
  const words = page.locator('#why-this-page .why3-text > span:not(.why2-pre)');
  expect(await words.count()).toBeGreaterThan(5);
  const word = words.nth(3);
  const bg = () => word.evaluate((w) => w.style.backgroundImage);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(bg).toContain('linear-gradient');
  const atTop = await bg();
  await page.evaluate(() => {
    const p = document.querySelector('#why-this-page .why3-yellow');
    window.scrollTo({ top: p.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
  });
  await expect.poll(bg).not.toBe(atTop);
  // further down, the first stop of the gradient sits further right (more of the word is lit)
  const stop = (s) => parseFloat((s.match(/(-?[\d.]+)px/) || [])[1]);
  expect(stop(await bg())).toBeGreaterThan(stop(atTop));
});

test('approved copy appears as native page text', async ({ page }) => {
  await openPage(page);
  const ids = ['hero-02', 'what-gen-ex', 'llm-s2-title', 'llm-w4-title', 'rsn-1-name',
    'risk-bias-title', 'pi-h3', 'refs-21', 'cta-lead', 'gloss-token'];
  const text = norm(await page.locator('body').evaluate((b) => b.textContent));
  for (const id of ids) {
    const entry = copy.find((c) => c.id === id);
    expect(entry, `copy id ${id}`).toBeTruthy();
    expect(text, `copy ${id}`).toContain(norm(entry.final));
  }
});

test('every image on the page loads (live only)', async ({ page }) => {
  test.skip(!LIVE, 'local mirror cannot reach Webflow CDN images (timeline photos)');
  await openPage(page);
  // lazy images never load while hidden: make them eager, and give timeline slides (data-src) their src
  await page.evaluate(() => document.querySelectorAll('img').forEach((i) => {
    i.loading = 'eager';
    if (i.hasAttribute('data-src') && !i.getAttribute('src')) { i.src = i.getAttribute('data-src'); i.removeAttribute('data-src'); }
  }));
  const broken = await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('img')].filter((i) => i.getAttribute('src'));
    const bad = [];
    await Promise.all(imgs.map(async (img) => {
      try {
        await Promise.race([img.decode(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 20000))]);
        // SVGs without intrinsic size can report 0 in some engines; decode() succeeding is enough for them
        if (!img.naturalWidth && !/\.svg(\?|$)/i.test(img.currentSrc || img.src)) bad.push(img.currentSrc || img.src);
      } catch (e) { bad.push((img.currentSrc || img.src) + ' (' + e.message + ')'); }
    }));
    return bad;
  });
  expect([...new Set(broken)]).toEqual([]);
});
