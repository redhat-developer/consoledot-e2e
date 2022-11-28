import { expect, Page } from '@playwright/test';
import { waitForKafkaReady } from './kafka';

export const navigateToKafkaTopicsList = async function (page: Page, kafkaName: string) {
  await expect(page.getByText(kafkaName)).toHaveCount(1);
  await waitForKafkaReady(page, kafkaName);
  await page.getByText(kafkaName).click();
  await page.getByText('Topics', { exact: true }).click();
};

export const createKafkaTopic = async function (page: Page, name: string) {
  await page.getByText('Create topic', { exact: true }).click();
  await expect(page.getByText('Create topic')).toHaveCount(2);
  // This is default Topic creation
  await page.getByPlaceholder('Enter topic name').fill(name);
  for (let i = 0; i < 3; i++) {
    await page.getByText('Next').click();
  }
  await page.getByText('Finish').click();
  await expect(page.getByText(name)).toHaveCount(1);
};

export const deleteKafkaTopic = async function (page: Page, name: string) {
  const instanceLinkSelector = page.getByText(name);
  const row = page.locator('tr', { has: instanceLinkSelector });

  await row.locator('[aria-label="Actions"]').click();
  await page.getByText('Delete', { exact: true }).click();
  await page.getByLabel('Type DELETE to confirm:').click();
  await page.getByLabel('Type DELETE to confirm:').fill('DELETE');
  await page.getByTestId('modalDeleteTopic-buttonDelete').click();
  await expect(page.getByText(name)).toHaveCount(0);
};
