// Code Embeds: timeline slideshow, knowledge-check quiz, how it works slideshow.
// Embeds keep real <button>s (Webflow does not rewrite Code Embed markup).
const { test, expect } = require('@playwright/test');
const { openPage, norm } = require('./helpers');

test.describe('timeline slideshow', () => {
  test('renders 24 slides; arrows and ArrowRight move the counter', async ({ page }) => {
    await openPage(page);
    const root = page.locator('.tl-root[data-tl]');
    await root.scrollIntoViewIfNeeded();
    await expect(root.locator('.tl-slide')).toHaveCount(24);
    await expect(root.locator('.tl-seg')).toHaveCount(24);
    const count = root.locator('[data-tl-count]');
    const prev = root.locator('.tl-arrow--prev');
    const next = root.locator('.tl-arrow--next');

    await expect(count).toHaveText(/^\s*01\s*\/\s*24\s*$/);
    await expect(prev).toBeDisabled();
    await expect(root.locator('.tl-slide.is-on')).toHaveCount(1);

    await next.click();
    await expect(count).toHaveText(/^\s*02\s*\/\s*24\s*$/);
    await expect(prev).toBeEnabled();

    await prev.click();
    await expect(count).toHaveText(/^\s*01\s*\/\s*24\s*$/);
    await expect(prev).toBeDisabled();

    await root.locator('[data-tl-show]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(count).toHaveText(/^\s*02\s*\/\s*24\s*$/);
    await page.keyboard.press('End');
    await expect(count).toHaveText(/^\s*24\s*\/\s*24\s*$/);
    await expect(next).toBeDisabled();
  });

  test('Lighthill (1973) slide credits the Science Research Council', async ({ page }) => {
    await openPage(page);
    const slide = page.locator('.tl-slide', { has: page.locator('.tl-year', { hasText: /^1973$/ }) });
    await expect(slide).toHaveCount(1);
    expect(norm(await slide.evaluate((s) => s.textContent))).toContain('Science Research Council');
  });
});

test.describe('knowledge-check quiz', () => {
  test('opens a dialog, gives feedback, reaches a result after 10 questions, Escape closes', async ({ page }) => {
    await openPage(page);
    const root = page.locator('.kc-root[data-kc]');
    const sheet = root.locator('dialog.kc-sheet');
    await root.locator('[data-kc-open]').click();
    await expect(sheet).toHaveAttribute('open', '');
    await expect(sheet).toBeVisible();

    for (let i = 1; i <= 10; i++) {
      await expect(sheet.locator('.kc-count')).toHaveText(`Question ${i} of 10`);
      await sheet.locator('.kc-ans').first().click();
      await expect(sheet.locator('.kc-res')).toBeVisible();
      await expect(sheet.locator('.kc-ans.is-right')).toHaveCount(1);
      const nextBtn = sheet.locator('[data-next]');
      await expect(nextBtn).toHaveText(i < 10 ? /Next question/ : /See my result/);
      await nextBtn.click();
    }
    await expect(sheet.locator('.kc-count')).toHaveText('Your result');
    await expect(sheet.locator('.kc-score')).toContainText(/\d+\/10/);

    await page.keyboard.press('Escape');
    await expect(sheet).not.toHaveAttribute('open', '');
    await expect(sheet).toBeHidden();
  });
});

test.describe('how it works slideshow', () => {
  test('6 numbered steps; Next advances, the end offers Start over, Restart returns to step 1', async ({ page }) => {
    await openPage(page);
    const root = page.locator('#how-it-works .hw-root[data-hw-ready]');
    await expect(root).toHaveCount(1);
    await expect(root.locator('.hw-rail .hw-seg')).toHaveCount(6);
    const status = root.locator('.hw-status');
    const next = root.locator('.hw-next');
    const label = next.locator('[data-next-label]');
    const restart = root.locator('.hw-rst');

    // take the controls (stops any autoplay) and start from a known state
    await restart.click();
    await expect(status).toHaveText('Step 1 of 6');
    await expect(label).toHaveText('Next step');
    await expect(root.locator('.hw-seg[aria-current="step"]')).toHaveAttribute('data-go', '0');

    await next.click();
    await expect(status).toHaveText('Step 2 of 6');
    await expect(root.locator('.hw-seg[aria-current="step"]')).toHaveAttribute('data-go', '1');

    // walk to the end: the label turns into "Start over"
    for (let i = 0; i < 40 && (await label.textContent()) !== 'Start over'; i++) await next.click();
    await expect(label).toHaveText('Start over');
    await expect(next).toHaveAttribute('aria-label', 'Start over');
    await expect(status).toHaveText(/^Step 6 of 6/);

    await restart.click();
    await expect(status).toHaveText('Step 1 of 6');
    await expect(label).toHaveText('Next step');
  });
});
