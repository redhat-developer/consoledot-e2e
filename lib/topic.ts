import { expect, Page } from '@playwright/test';
import { waitForKafkaReady } from './kafka';

export const navigateToKafkaTopicsList = async function (page: Page, kafkaName: string) {
  await expect(page.getByText(kafkaName)).toHaveCount(1);
  await waitForKafkaReady(page, kafkaName);
  await page.getByText(kafkaName).click();
  await page.getByText('Topics').click();
};

export const createKafkaTopic = async function (page: Page, name: string, check = true) {
  await page.getByText('Create topic').click();
  await expect(page.getByText('Create topic')).toHaveCount(2);
  // This is default Topic creation
  await page.getByPlaceholder('Enter topic name').fill(name);
  await page.getByText('Next').click();
  await page.getByText('Next').click();
  await page.getByText('Next').click();
  await page.getByText('Finish').click();

  if (check) {
    // check that the instance has been created
    const table = page.locator('[data-ouia-component-id=card-table]');
    expect(table.getByText(name)).toBeTruthy();
  }
};

export const deleteKafkaTopic = async function (page: Page, name: string) {
  const instanceLinkSelector = page.getByText(name);
  const row = page.locator('tr', { has: instanceLinkSelector });

  await row.locator('[aria-label="Actions"]').click();
  await page.getByText('Delete').click();
  await page.getByLabel('Type DELETE to confirm:').click();
  await page.getByLabel('Type DELETE to confirm:').fill('DELETE');
  await page.getByTestId('modalDeleteTopic-buttonDelete').click();
  await page.getByTestId('mk--instance__drawer').getByText('Kafka Instances').click();
  await page.waitForURL('https://console.redhat.com/application-services/streams/kafkas');
};
