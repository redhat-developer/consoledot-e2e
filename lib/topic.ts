import { expect, Page } from '@playwright/test';
import { showElementActions } from './kafka';
import { navigateToKafkaList } from './navigation';

export const navigateToKafkaTopicsList = async function (page: Page, kafkaName: string) {
  await expect(page.getByText(`${kafkaName}`)).toHaveCount(1);
  await page.locator('a', { hasText: `${kafkaName}` }).click();
  await expect(page.locator('button[aria-label="Topics"]')).toHaveCount(1, {timeout: 10000});
  // data-testid=pageKafka-tabTopics
  await page.locator('button[aria-label="Topics"]').click({timeout: 10000});
};

export const createKafkaTopic = async function (page: Page, name: string, defaultProperties: boolean) {
  await page.locator('button', { hasText: 'Create topic' }).click();
  await expect(page.getByText('Create topic')).toHaveCount(2);
  await page.getByPlaceholder('Enter topic name').fill(name);
  if (defaultProperties) {
    // This is default properties values Topic creation
    for (let i = 0; i < 3; i++) {
      await page.locator('button', { hasText: 'Next' }).click();
    }
    await page.locator('button', { hasText: 'Finish' }).click();
  } else {
    // Use different values
    await page.locator('label:has-text("Show all available optionsShow all available options") span').first().click();

    await expect(page.locator('input[name="num-partitions"]')).toHaveValue('1', { timeout: 3000 });
    // Increasing twice and decreasing once the num of partitions to test + & -
    for (let i = 0; i < 2; i++) {
      await page.locator('button[name="num-partitions"]').nth(1).click();
    }
    await page.locator('button[name="num-partitions"]').nth(0).click();

    await expect(page.locator('label:has-text("days") input[type="number"]')).toHaveCount(1);
    // Increasing twice and decreasing once the units for Retention Time to test + & -
    for (let i = 0; i < 2; i++) {
      await page.locator('button[name="retention-ms"]').nth(1).click();
    }
    await page.locator('button[name="retention-ms"]').nth(0).click();
    await page.locator('button:has-text("days")').click();
    await page.locator('button', { hasText: 'hours' }).click();

    await page.getByLabel('bytes').check();
    // Increasing twice and decreasing once the units for Retention Time to test + & -
    for (let i = 0; i < 2; i++) {
      await page.locator('button[name="retention-bytes"]').nth(1).click();
    }
    await page.locator('button[name="retention-bytes"]').nth(0).click();
    await page.locator('button:has-text("bytes")').click();
    await page.locator('button', { hasText: 'kibibytes' }).click();

    // Choosing different CleanUp policy
    await page.locator('button:has-text("Delete")').click();
    await page.getByText('Compact').first().click();
    await page.locator('button:has-text("Compact")').click();

    await page.locator('button', { hasText: 'Create topic' }).click();
  }
  await expect(page.getByText(name)).toHaveCount(1);
};

export const deleteKafkaTopic = async function (page: Page, name: string) {
  await showElementActions(page, name);
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
  await expect(page.locator('a', { hasText: topicName })).toHaveCount(1);
  await page.locator('a', { hasText: topicName }).click();
  await expect(page.locator('button', { hasText: 'Messages' })).toHaveCount(1);
  await page.locator('button', { hasText: 'Messages' }).click();
};

export const navigateToProperties = async function (page: Page, kafkaName: string, topicName: string) {
  await navigateToKafkaList(page);
  await navigateToKafkaTopicsList(page, kafkaName);
  await expect(page.locator('a', { hasText: `${topicName}` })).toHaveCount(1, {timeout: 6000});
  await page.locator('a', { hasText: `${topicName}` }).click();
  await expect(page.locator('h1:has-text("' + `${topicName}` + '")')).toHaveCount(1);
  await page.getByTestId('pageTopic-tabProperties').click();
};

export const refreshMessages = async function (page: Page) {
  try {
    await expect(page.locator('table[aria-label="Messages table"]')).toHaveCount(1);
  } catch (e) {
    await page.locator('button', { hasText: 'Check for new data' }).click({ timeout: 5000 });
    await refreshMessages(page);
  }
};
