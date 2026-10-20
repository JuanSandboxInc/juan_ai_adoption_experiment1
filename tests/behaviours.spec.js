// Page behaviours embed: risk ripple reveal + mobile menu + mobile layout.
const { test, expect } = require('@playwright/test');
const { openPage } = require('./helpers');

test('risk ripple gets .is-in when scrolled into view', async ({ page }) => {
  await openPage(page);
  const svgs = page.locator('.ripple-svg');
  expect(await svgs.count()).toBeGreaterThan(0);
  // the first visible ripple (desktop and mobile variants may both exist)
  const visible = svgs.locator('visible=true').first();
  await expect(visible).not.toHaveClass(/(^|\s)is-in(\s|$)/);
  await visible.scrollIntoViewIfNeeded();
  await expect(visible).toHaveClass(/(^|\s)is-in(\s|$)/);
  expect(await visible.locator('[data-rp]').count()).toBeGreaterThan(0);
});

test.describe('mobile (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('menu button toggles .is-menu-open on the header', async ({ page }) => {
    await openPage(page);
    const header = page.locator('.site-header');
    const btn = page.locator('.menu-button');
    await expect(btn).toBeVisible();
    await expect(page.locator('.main-nav-links')).toBeHidden();
    await btn.click();
    await expect(header).toHaveClass(/(^|\s)is-menu-open(\s|$)/);
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.main-nav-links')).toBeVisible();
    await btn.click();
    await expect(header).not.toHaveClass(/(^|\s)is-menu-open(\s|$)/);
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('no horizontal overflow', async ({ page }) => {
    await openPage(page);
    // scroll through so lazy content and observers settle
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 800) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 30));
      }
    });
    const { sw, iw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, iw: window.innerWidth,
    }));
    expect(sw).toBeLessThanOrEqual(iw);
  });
});
