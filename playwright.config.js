// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * BASE_URL set   -> test the live Webflow page (e.g. https://sb-ai-adoption-page.webflow.io/intro-to-ai)
 * BASE_URL unset -> serve the local mirror (site/, built by scripts/build_local.py) on :4173
 */
const LIVE = !!process.env.BASE_URL;
const LOCAL_PORT = 4173;
const PAGE_URL = process.env.BASE_URL || `http://127.0.0.1:${LOCAL_PORT}/index.html`;
process.env.PAGE_URL = PAGE_URL;

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: PAGE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
  ],
  webServer: LIVE
    ? undefined
    : {
        command: `python3 -m http.server ${LOCAL_PORT} --bind 127.0.0.1 --directory site`,
        url: PAGE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
        stdout: 'ignore',
        stderr: 'ignore',
      },
});
