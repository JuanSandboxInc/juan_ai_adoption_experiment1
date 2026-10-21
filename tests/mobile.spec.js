// Small screens (390px wide): layout overflow, mobile menu, full-width quiz dialog.
const { test, expect } = require('@playwright/test');
const { openPage, hasClass } = require('./helpers');

test.describe('mobile (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('no horizontal overflow', async ({ page }) => {
    await openPage(page);
    // scroll through so lazy content and observers settle
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 800) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 30));
      }
    });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
      .toBeLessThanOrEqual(0);
  });

  test('menu button toggles .is-menu-open on the header', async ({ page }) => {
    await openPage(page);
    const header = page.locator('.site-header');
    const btn = page.locator('.menu-button');
    await expect(btn).toBeVisible();
    await expect(page.locator('.main-nav-links')).toBeHidden();
    await btn.click();
    await expect(header).toHaveClass(hasClass('is-menu-open'));
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.main-nav-links')).toBeVisible();
    await btn.click();
    await expect(header).not.toHaveClass(hasClass('is-menu-open'));
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('quiz dialog fills the screen width', async ({ page }) => {
    await openPage(page);
    const sheet = page.locator('dialog.kc-sheet');
    await page.locator('.kc-root [data-kc-open]').click();
    await expect(sheet).toHaveAttribute('open', '');
    await expect
      .poll(async () => {
        const box = await sheet.boundingBox();
        const vw = await page.evaluate(() => window.innerWidth);
        return box ? Math.round(box.x) === 0 && Math.abs(box.width - vw) <= 1 : false;
      }, { message: 'dialog is full width' })
      .toBe(true);
  });
});
