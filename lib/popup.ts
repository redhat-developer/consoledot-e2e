import { expect, Page } from '@playwright/test';

export const closePopUp = async function (page: Page) {
  const selector = '[aria-label=close-notification]';
  try {
    await expect(page.locator(selector)).toHaveCount(0);
  } catch (e) {
    await page.locator(selector).nth(0).click({ timeout: 5000 });
    await closePopUp(page);
  }
};
