import { expect, Page } from '@playwright/test';
import { waitForKafkaReady } from './kafka';

export const navigateToKafkaTopicsList = async function (page: Page, kafkaName: string) {
  await expect(page.getByText(kafkaName)).toHaveCount(1);
  await waitForKafkaReady(page, kafkaName);
  await page.locator('a', { hasText: kafkaName }).click();
  expect(await page.locator('button', { hasText: 'Topics' }).count() == 1);
  // data-testid=pageKafka-tabTopics
  await page.locator('button', { hasText: 'Topics' }).click();
};

export const createKafkaTopic = async function (page: Page, name: string) {
  await page.locator('button', { hasText: 'Create topic' }).click();
  await expect(page.getByText('Create topic')).toHaveCount(2);
  // This is default Topic creation
  await page.getByPlaceholder('Enter topic name').fill(name);
  for (let i = 0; i < 3; i++) {
    await page.locator('button', { hasText: 'Next' }).click();
  }
  await page.locator('button', { hasText: 'Finish' }).click();
  await expect(page.getByText(name)).toHaveCount(1);
};

export const deleteKafkaTopic = async function (page: Page, name: string) {
  const instanceLinkSelector = page.getByText(name);
  const row = page.locator('tr', { has: instanceLinkSelector });

  await row.locator('[aria-label="Actions"]').click();
  // data-testid=tableTopics-actionDelete
  await page.locator('button', { hasText: 'Delete' }).click();
  await page.getByLabel('Type DELETE to confirm:').click();
  await page.getByLabel('Type DELETE to confirm:').fill('DELETE');
  // data-testid=modalDeleteTopic-buttonDelete
  await page.locator('button', { hasText: 'Delete' }).click();
  await expect(page.getByText(name)).toHaveCount(0);
};
