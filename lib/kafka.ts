import { expect, Page } from "@playwright/test";
import { config } from "./config";

export const navigateToKafkaList = async function (page: Page) {
  await page.getByRole('link', { name: 'Application and Data Services' }).click();
  // }
  await page.getByRole('button', { name: 'Streams for Apache Kafka' }).click();
  await page.getByRole('link', { name: 'Kafka Instances' }).click();
  await expect(page.getByRole('heading', { name: 'Kafka Instances' })).toHaveCount(1);
};

export const createKafkaInstance = async function (page: Page, name: string, check = true) {
  await page.getByText('Create Kafka instance').click();

  await expect(page.getByText('Create a Kafka instance')).toHaveCount(1);
  await page.getByLabel('Name *').fill(name);

  await page.waitForSelector('[role=progressbar]', { state: 'detached' });

  await page.getByTestId('modalCreateKafka-buttonSubmit').click();

  if (check) {
    // check for the instance to have been created
    const table = await page.locator('[data-ouia-component-id=table-kafka-instances]');
    await expect(table.getByText(name)).toBeTruthy();
  }
};

export const deleteKafkaInstance = async function (page: Page, name: string, awaitDeletion = true) {
  const instanceLinkSelector = page.getByText(name);
  const row = page.locator('tr', { has: instanceLinkSelector });

  await row.locator('[aria-label="Actions"]').click();

  await page.getByText('Delete instance').click();

  try {
    await expect(page.locator('input[name="mas-name-input"]')).toHaveCount(1, {
      timeout: 1000
    });
    await page.locator('input[name="mas-name-input"]').fill(name);
  } catch (err) {
    // Removal without confirmation
    // ignore
  }
  await page.getByTestId('modalDeleteKafka-buttonDelete').click();

  // await for the instance to be deleted
  if (awaitDeletion) {
    await expect(page.getByText(`${name}`, { exact: true })).toHaveCount(0, {
      timeout: config.kafkaInstanceDeletionTimeout
    });
  }
};

export const waitForKafkaReady = async function (page: Page, name: string) {
  const instanceLinkSelector = page.getByText(name);
  const row = page.locator('tr', { has: instanceLinkSelector });
  await expect(row.getByText('Ready')).toHaveCount(1, {
    timeout: config.kafkaInstanceCreationTimeout
  });
};
