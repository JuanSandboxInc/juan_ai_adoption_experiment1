// The three Code Embeds: timeline slideshow, knowledge-check quiz, prediction machine.
const { test, expect } = require('@playwright/test');
const { openPage } = require('./helpers');

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

test.describe('prediction machine', () => {
  test('toggle opens it; Next step advances caption and status through 4 steps', async ({ page }) => {
    await openPage(page);
    const root = page.locator('.pm-root[data-pm]');
    const toggle = root.locator('[data-pm-toggle]');
    const machine = root.locator('[data-pm-machine]');
    await toggle.scrollIntoViewIfNeeded();
    await expect(machine).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(machine).toBeVisible();

    // take the controls (stops autoplay) and start from a known state
    await machine.locator('[data-restart]').click();
    const caption = machine.locator('[data-caption]');
    const status = machine.locator('[data-status]');
    const current = machine.locator('.pm-steps li[aria-current="step"]');
    const expected = [
      /sent to the model/,
      /scores every possible next word/,
      /most likely token is chosen/,
      /joins the sentence|One token at a time/,
    ];
    for (let step = 1; step <= 4; step++) {
      if (step > 1) await machine.locator('.pm-next[data-next]').click();
      await expect(current).toHaveAttribute('data-step', String(step));
      await expect(caption).toHaveText(expected[step - 1]);
      await expect(status).toHaveText(/^Round 1 of \d+$/);
      await expect(machine.locator(`.pm-slide[data-slide="${step}"]`)).toHaveClass(/is-on/);
    }
    await expect(machine.locator('.pm-steps li.is-done')).toHaveCount(3);
    await machine.locator('.pm-next[data-next]').click();
    await expect(status).toHaveText(/^Round 2 of \d+$/);
    await expect(current).toHaveAttribute('data-step', '1');
  });
});
