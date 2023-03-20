import { config } from '@lib/config';
import { test as base, expect } from '@playwright/test';
import { ConsoleDotAuthPage } from '@lib/pom/auth';

// Extend Playwright page to start always at config.startingPage
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const autPage = new ConsoleDotAuthPage(page);

    const errLogs = [];

    // Disable analytics, segment, pendo and other disruptive popups
    await page.addInitScript(() => {
      window.localStorage.setItem('chrome:analytics:disable', String(true));
      window.localStorage.setItem('chrome:segment:disable', String(true));
    });

    if (config.enableErrLogging) {
      page.on('console', (msg) => {
        if (msg.type() === 'error') errLogs.push(`Error: "${msg.text()}"`);
      });

      page.on('pageerror', (err) => {
        errLogs.push(`PageError: ${err.message}`);
      });

      page.on('requestfailed', (request) => {
        errLogs.push(`Request failed: ${request.url()} ${request.failure().errorText}`);
      });
    }
    await page.goto(config.startingPage);
    // check we landed on the right page`
    try {
      await autPage.checkUiIsVisible();
    } catch {
      await autPage.checkLoginPageVisible();
    }
    await expect(page.getByText('Gain increased visibility into your hybrid cloud')).toBeTruthy();
    await autPage.closeCookieBanner();
    await use(page);

    if (testInfo.status == 'failed' || testInfo.status == 'timedOut') {
      for (const logEntry of errLogs) {
        console.error(logEntry);
      }
    }
  }
});
