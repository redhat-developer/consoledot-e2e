import { expect, Page } from '@playwright/test';
import { navigateToKafkaList, waitForKafkaReady } from './kafka';

export const navigateToKafkaTopicsList = async function (page: Page, kafkaName: string) {
  await expect(page.getByText(kafkaName)).toHaveCount(1);
  await waitForKafkaReady(page, kafkaName);
  await page.locator('a', { hasText: kafkaName }).click();
  await expect(await page.locator('button[aria-label="Topics"]')).toHaveCount(1);
  // data-testid=pageKafka-tabTopics
  await page.locator('button[aria-label="Topics"]').click();
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

export const navigateToMessages = async function (page: Page, kafkaName: string, topicName: string) {
  await navigateToKafkaList(page);
  await navigateToKafkaTopicsList(page, kafkaName);
  await expect(await page.locator('a', { hasText: topicName })).toHaveCount(1);

  await page.locator('a', { hasText: topicName }).click();

  await expect(await page.locator('button', { hasText: 'Messages' })).toHaveCount(1);

  await page.locator('button', { hasText: 'Messages' }).click();
};

export const refreshMessages = async function (page: Page) {
  try {
    await expect(page.locator('table[aria-label="Messages table"]')).toHaveCount(1);
  } catch (e) {
    await page.locator('button', { hasText: 'Check for new data' }).click({ timeout: 5000 });
    await refreshMessages(page);
  }
};
