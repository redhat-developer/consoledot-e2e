import { config } from '@lib/config';
import { test as base, expect } from '@playwright/test';
import blockAnalyticsDomains from '@lib/utils/blocker';

// Extend Playright page to start always at config.startingPage
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const errLogs = [];
    await blockAnalyticsDomains(page);

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
    await expect(page).toHaveTitle(/(Home.*|console.redhat.com|Hello.*|Log In.*)/, { timeout: 10000 }); //page can be differend depends if test is already logged in
    await expect(page.getByText('Gain increased visibility into your hybrid cloud')).toBeTruthy();
    await use(page);

    if (testInfo.status == 'failed' || testInfo.status == 'timedOut') {
      for (const logEntry of errLogs) {
        console.error(logEntry);
      }
    }
  }
});
