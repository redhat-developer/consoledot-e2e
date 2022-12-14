import { expect, Page } from '@playwright/test';
import { config } from './config';
import { closePopUp } from './popup';

export const navigateToKafkaList = async function (page: Page) {
  if (!(await page.locator('[data-testid=router-link]', { hasText: 'Kafka Instances' }).isVisible())) {
    if (!(await page.locator('button', { hasText: 'Streams for Apache Kafka' }).isVisible())) {
      await page.getByRole('link', { name: 'Application and Data Services' }).click();
    }
    await page.locator('button', { hasText: 'Streams for Apache Kafka' }).click();
  }

  await closePopUp(page);

  await page.locator('[data-testid=router-link]', { hasText: 'Kafka Instances' }).click();
  await expect(await page.locator('h1', { hasText: 'Kafka Instances' })).toHaveCount(1);
};

export const createKafkaInstance = async function (page: Page, name: string, check = true) {
  await page.locator('button', { hasText: 'Create Kafka instance' }).click();
  await expect(page.getByText('Create a Kafka instance')).toHaveCount(1);
  await page.waitForSelector('[role=progressbar]', { state: 'detached' });

  // FIXME: workaround for https://github.com/redhat-developer/app-services-ui-components/issues/590
  // https://github.com/microsoft/playwright/issues/15734#issuecomment-1188245775
  await new Promise((resolve) => setTimeout(resolve, 500));
  await page.getByLabel('Name *').click();

  await page.getByLabel('Name *').fill(name);
  // data-testid=modalCreateKafka-buttonSubmit
  await page.locator('button', { hasText: 'Create instance' }).click();

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
  await page.locator('button', { hasText: 'Delete instance' }).click();
  try {
    await expect(page.locator('input[name="mas-name-input"]')).toHaveCount(1, { timeout: 5000 });

    // FIXME: workaround for https://github.com/redhat-developer/app-services-ui-components/issues/590
    // https://github.com/microsoft/playwright/issues/15734#issuecomment-1188245775
    await new Promise((resolve) => setTimeout(resolve, 500));
    await page.locator('input[name="mas-name-input"]').click();

    await page.locator('input[name="mas-name-input"]').fill(name);
  } catch (err) {
    // Removal without confirmation
    // ignore
  }
  // data-testid=modalDeleteKafka-buttonDelete
  await page.locator('button', { hasText: 'Delete' }).click();
  // await for the instance to be deleted
  if (awaitDeletion) {
    await expect(page.getByText(`${name}`, { exact: true })).toHaveCount(0, {
      timeout: config.kafkaInstanceDeletionTimeout
    });
  }
};

export const waitForKafkaReady = async function (page: Page, name: string) {
  // no loading in progress
  await page.waitForSelector('[role=progressbar]', { state: 'detached', timeout: config.kafkaInstanceCreationTimeout });

  const instanceLinkSelector = page.getByText(name);
  const row = page.locator('tr', { has: instanceLinkSelector });
  await expect(row.getByText('Ready', { exact: true })).toHaveCount(1, {
    timeout: config.kafkaInstanceCreationTimeout
  });
};

export const getBootstrapUrl = async function (page: Page, name: string) {
  await navigateToKafkaList(page);
  const instanceLinkSelector = page.getByText(name);
  const row = page.locator('tr', { has: instanceLinkSelector });
  await row.locator('[aria-label="Actions"]').click();

  await page.locator('button', { hasText: 'Connection' }).click();

  await expect(page.locator('[aria-label="Bootstrap server"]')).toHaveCount(1);
  const bootstrap = await page.locator('[aria-label="Bootstrap server"]').inputValue();
  await page.locator('[aria-label="Close drawer panel"]').click();

  return bootstrap;
};

// TODO - we shouldn't use just prefix for topic/group but also complete name
// TODO - we should click on topic name/prefix when it popups when filling the prefix/name
export const grantProducerAccess = async function (page: Page, saId: string, topicName: string) {
  await page.getByTestId('actionManagePermissions').click();
  await page.getByRole('button', { name: 'Options menu' }).click();
  await page.getByRole('option').filter({ hasText: saId }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByTestId('permissions-dropdown-toggle').click();
  // TODO - This is another option which should be tested
  // await page.getByRole('button', { name: 'Add permission' }).click();

  await page.locator('button', { hasText: 'Produce to a topic' }).click();

  await page.getByPlaceholder('Enter prefix').click();
  await page.getByPlaceholder('Enter prefix').fill(topicName);
  // TODO - This is just a workaround - create issue for `save` button which is disabled even if the prefix is written
  await page.getByPlaceholder('Enter prefix').click();

  await page.getByRole('button').filter({ hasText: 'Save' }).click();
};

// TODO - we shouldn't use just prefix for topic/group but also complete name
// TODO - we should click on topic name/prefix when it popups when filling the prefix/name
export const grantConsumerAccess = async function (page: Page, saId: string, topicName: string, consumerGroup: string) {
  await page.getByTestId('actionManagePermissions').click();
  await page.getByRole('button', { name: 'Options menu' }).click();
  await page.getByRole('option').filter({ hasText: saId }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByTestId('permissions-dropdown-toggle').click();

  await page.locator('button', { hasText: 'Consume from a topic' }).click();

  await page
    .getByRole('row', {
      name: 'T Topic Options menu permission.manage_permissions_dialog.assign_permissions.resource_name_aria Options menu Label group category'
    })
    .getByPlaceholder('Enter prefix')
    .click();

  await page
    .getByRole('row', {
      name: 'T Topic Options menu permission.manage_permissions_dialog.assign_permissions.resource_name_aria Options menu Label group category'
    })
    .getByPlaceholder('Enter prefix')
    .fill(topicName);

  await page
    .getByRole('gridcell', {
      name: 'permission.manage_permissions_dialog.assign_permissions.resource_name_aria Options menu'
    })
    .getByPlaceholder('Enter prefix')
    .click();

  await page
    .getByRole('gridcell', {
      name: 'permission.manage_permissions_dialog.assign_permissions.resource_name_aria Options menu'
    })
    .getByPlaceholder('Enter prefix')
    .fill(consumerGroup);

  await page.getByRole('button').filter({ hasText: 'Save' }).click();
};

export const navigateToAccess = async function (page: Page, kafkaName: string) {
  await navigateToKafkaList(page);
  await expect(page.getByText(kafkaName)).toHaveCount(1);
  await page.getByText(kafkaName).click();
  await page.getByTestId('pageKafka-tabPermissions').click();
};

export const navigateToConsumerGroups = async function (page: Page) {
  await page.getByTestId('pageKafka-tabConsumers').click();
};
