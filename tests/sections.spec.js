// Native v2 sections: what is AI explorer, LLMs, reasoning, risks, references, glossary.
// Native <button>s are published by Webflow as <a class="w-button">: select by class / data attribute only.
const { test, expect } = require('@playwright/test');
const { openPage, jumpTo, visibility } = require('./helpers');

test('what is AI: each explorer control shows its card without moving the page', async ({ page }) => {
  await openPage(page);
  const sec = page.locator('#what-is-ai');
  const controls = sec.locator('.wai-nav [data-t][aria-controls]');
  await expect(controls).toHaveCount(4);
  const cards = sec.locator('[data-item]');
  await expect(cards).toHaveCount(4);
  await jumpTo(page, '#what-is-ai .wai-nav', 120);
  for (const t of ['ml', 'gen', 'llm', 'sym']) {
    const ctl = sec.locator(`.wai-nav [data-t="${t}"][aria-controls]`);
    await ctl.scrollIntoViewIfNeeded();
    const y0 = await page.evaluate(() => window.scrollY);
    await ctl.click();
    await expect(ctl).toHaveAttribute('aria-pressed', 'true');
    await expect(sec.locator('.wai-nav [aria-pressed="true"]')).toHaveCount(1);
    await expect.poll(() => visibility(sec.locator(`[data-item="${t}"]`)), { message: `card ${t}` }).toBe('visible');
    for (const other of ['sym', 'ml', 'gen', 'llm'].filter((x) => x !== t)) {
      expect(await visibility(sec.locator(`[data-item="${other}"]`)), `card ${other} hidden`).toBe('hidden');
    }
    const y1 = await page.evaluate(() => window.scrollY);
    expect(Math.abs(y1 - y0), 'scrollY unchanged').toBeLessThanOrEqual(1);
  }
});

test('LLMs: tabs switch lists and rows expand', async ({ page }) => {
  await openPage(page);
  const sec = page.locator('#llms');
  const strengths = sec.locator('#llm2-strengths');
  const weaknesses = sec.locator('#llm2-weaknesses');
  await expect(strengths).toBeVisible();
  await expect(weaknesses).toBeHidden();
  await sec.locator('.llm2-tab-w').click();
  await expect(sec.locator('.llm2-tab-w')).toHaveAttribute('aria-selected', 'true');
  await expect(weaknesses).toBeVisible();
  await expect(strengths).toBeHidden();
  const row = weaknesses.locator('.llm2-row').first();
  await expect(row).toHaveAttribute('aria-expanded', 'false');
  await row.click();
  await expect(row).toHaveAttribute('aria-expanded', 'true');
  await sec.locator('.llm2-tab-s').click();
  await expect(strengths).toBeVisible();
  await expect(weaknesses).toBeHidden();
});

test('reasoning: both animation images are present and load', async ({ page }) => {
  await openPage(page);
  const imgs = page.locator('#reasoning .rsn2-frame img');
  await expect(imgs).toHaveCount(2);
  await jumpTo(page, '#reasoning .rsn2-frame', 100);
  for (let i = 0; i < 2; i++) {
    const img = imgs.nth(i);
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth), { timeout: 20_000 }).toBeGreaterThan(0);
  }
});

test('risks: 7 cards with shapes, no ripple, Bias sheet opens and Escape closes it', async ({ page }) => {
  await openPage(page);
  const sec = page.locator('#risks');
  await expect(sec.locator('.rsk2-card')).toHaveCount(7);
  await expect(sec.locator('.rsk2-card .risk-shape img')).toHaveCount(7);
  await expect(page.locator('[class*="ripple"]')).toHaveCount(0);

  const sheet = page.locator('#risk-sheet-bias');
  await expect(sheet).toHaveAttribute('aria-hidden', 'true');
  expect(await visibility(sheet)).toBe('hidden');
  await sec.locator('[data-rsk2-open="risk-sheet-bias"]').click();
  await expect(sheet).toHaveAttribute('aria-hidden', 'false');
  await expect.poll(() => visibility(sheet)).toBe('visible');
  await expect(sheet.locator('.rsk2-sheet-title')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveAttribute('aria-hidden', 'true');
  await expect.poll(() => visibility(sheet)).toBe('hidden');
});

test('references: 38 entries; a footnote link opens the list and shows its entry', async ({ page }) => {
  await openPage(page);
  const btn = page.locator('#references .refs2-btn');
  await expect(page.locator('#references .ref-item')).toHaveCount(38);
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#ref-21')).toBeHidden();
  // footnote 21 sits in the first timeline slide (Turing, 1950)
  const fn = page.locator('a[href="#ref-21"]').locator('visible=true').first();
  await fn.scrollIntoViewIfNeeded();
  await fn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#ref-21')).toBeVisible();
  await expect(page.locator('#ref-21')).toBeInViewport();
  // the toggle closes the list again
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#ref-21')).toBeHidden();
});

test('glossary: floating button opens the side sheet with 20 terms, Escape closes', async ({ page }) => {
  await openPage(page);
  const sheet = page.locator('#glossary-sheet');
  await expect(page.locator('#glossary .glossary-term')).toHaveCount(20);
  await expect(sheet).toHaveAttribute('aria-hidden', 'true');
  const fab = page.locator('.gl2-fab');
  await expect(fab).toBeVisible();
  await fab.click();
  await expect(sheet).toHaveAttribute('aria-hidden', 'false');
  await expect(sheet.locator('.gl2-panel')).toBeInViewport();
  await expect(sheet.locator('.glossary-term').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveAttribute('aria-hidden', 'true');
  await expect.poll(() => visibility(sheet)).toBe('hidden');
});
