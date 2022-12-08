import { expect, Page } from '@playwright/test';

export const closePopUp = async function (page: Page, selector: string) {
  if ((await page.locator(selector).count()) !== 0) {
    const popUpLocator = page.locator(selector);
    let count = await popUpLocator.count();
    while (count > 0) {
      await popUpLocator.nth(0).click();
      await expect(popUpLocator).toHaveCount(count - 1);
      count--;
    }
  }
};
