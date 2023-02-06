import { Page } from '@playwright/test';

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

export const pickFilterOption = async function (page: Page, option: FilterGroup) {
  await page.locator('[data-testid="filter-group"]').click();
  await page.locator('a:text-is("' + option + '")').click();
};

const setField = async function (page: Page, locator: string, value: string) {
  await page.locator(locator).click();
  await page.locator(locator).fill(value);
};

export const setPartition = async function (page: Page, partition: string) {
  await setField(page, '[aria-label="Specify partition value"]', partition);
};

export const setOffset = async function (page: Page, offset: string) {
  await setField(page, '[aria-label="Specify offset"]', offset);
};

export const setTimestamp = async function (page: Page, timestamp: string) {
  await setField(page, '[aria-label="Date picker"]', timestamp);
};

export const setEpoch = async function (page: Page, epochTimestamp: number) {
  await setField(page, '[aria-label="Specify epoch timestamp"]', epochTimestamp.toString());
};

export const setLimit = async function (page: Page, limit: Limit) {
  await page.locator('button >> text=/\\d+ messages/i').click();
  await page.locator('li >> button:has-text("' + limit + ' messages")').click();
};

export const filterMessagesByOffset = async function (page: Page, partition: string, offset: string, limit: Limit) {
  await setPartition(page, partition);
  await setOffset(page, offset);
  await setLimit(page, limit);

  await applyFilter(page);
};

export const applyFilter = async function (page: Page) {
  await page.locator('button[aria-label="Search"]').click();
};
