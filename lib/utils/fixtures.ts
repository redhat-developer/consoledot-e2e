import { config } from '@lib/config';
import { test as base } from '@playwright/test';

// Extend Playright page to start always at config.startingPage
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto(config.startingPage);
    await use(page);
  }
});
