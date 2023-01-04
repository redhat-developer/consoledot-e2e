import { expect, Page } from '@playwright/test';

export enum Limit {
  ten = 10,
  twenty = 20,
  fifty = 50
}

export enum FilterGroup {
  offset = 'Offset',
  timestamp = 'Timestamp',
  epoch = 'Epoch timestamp',
  latest = 'Latest messages'
}

export const setPartition = async function (page: Page, partition: string) {
  await page.locator('[aria-label="Specify partition value"]').click();
  await page.locator('[aria-label="Specify partition value"]').fill(partition);
};

export const pickFilterOption = async function (page: Page, option: FilterGroup) {
  await page.locator('[data-testid="filter-group"]').click();
  switch (option) {
    case FilterGroup.offset: {
      await page.locator('a:text-is("' + FilterGroup.offset + '")').click();
      break;
    }
    case FilterGroup.timestamp: {
      await page.locator('a:text-is("' + FilterGroup.timestamp + '")').click();
      break;
    }
    case FilterGroup.epoch: {
      await page.locator('a:text-is("' + FilterGroup.epoch + '")').click();
      break;
    }
    case FilterGroup.latest: {
      await page.locator('a:text-is("' + FilterGroup.latest + '")').click();
      break;
    }
  }
};

export const setOffeset = async function (page: Page, offset: string) {
  await page.locator('[aria-label="Specify offset"]').click();
  await page.locator('[aria-label="Specify offset"]').fill(offset);
};

export const setTimestamp = async function (page: Page, timestamp: string) {
  await page.locator('[aria-label="Date picker"]').click();
  await page.locator('[aria-label="Date picker"]').fill(timestamp);
};

export const setEpoch = async function (page: Page, epochTimestamp: number) {
  await page.locator('[aria-label="Specify epoch timestamp"]').click();
  await page.locator('[aria-label="Specify epoch timestamp"]').fill(epochTimestamp.toString());
};

export const setLimit = async function (page: Page, limit: Limit) {
  // TODO change 10 to number regex
  await page.locator('button:has-text("10 messages")').click();
  await page.locator('li >> button:has-text("' + limit + ' messages")').click();
};

export const filterMessagesByOffset = async function (page: Page, partition: string, offset: string, limit: Limit) {
  await setPartition(page, partition);
  await setOffeset(page, offset);
  await setLimit(page, limit);

  await applyFilter(page);
};

export const applyFilter = async function (page: Page) {
  await page.locator('button[aria-label="Search"]').click();
};

export const expectMessageTableIsNotEmpty = async function (page: Page) {
  const messageTable = await page.locator('table[aria-label="Messages table"] >> tbody >> tr');
  await expect(await messageTable.count()).toBeGreaterThan(0);
};

export const expectMessageTableIsEmpty = async function (page: Page) {
  const messageTable = await page.locator('table[aria-label="Messages table"] >> tbody >> tr');
  await expect(await messageTable.count()).toBe(1);
};
