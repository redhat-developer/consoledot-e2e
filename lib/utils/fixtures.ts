import { config } from '@lib/config';
import { test as base } from '@playwright/test';
import blockAnalyticsDomains from '@lib/utils/blocker';

// Extend Playright page to start always at config.startingPage
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto(config.startingPage);
    await blockAnalyticsDomains(page);
    await use(page);
  }
});
