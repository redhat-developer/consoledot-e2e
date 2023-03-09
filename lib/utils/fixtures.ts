import { config } from '@lib/config';
import { test as base, expect } from '@playwright/test';
import blockAnalyticsDomains from '@lib/utils/blocker';

// Extend Playright page to start always at config.startingPage
export const test = base.extend({
  page: async ({ page }, use) => {
    await blockAnalyticsDomains(page);
    await page.goto(config.startingPage);
    // check we landed on the right page`
    await expect(page).toHaveTitle(/Home/, { timeout: 10000 });
    await expect(page.getByText('Gain increased visibility into your hybrid cloud')).toBeTruthy();
    await use(page);
  }
});
