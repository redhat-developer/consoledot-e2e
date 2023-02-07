import { test, expect, Page } from '@playwright/test';
import { config } from './config';
import { BillingOptions } from './billing';
import { CloudProviders } from './cloudproviders';
import { navigateToKafkaList } from './navigation';

export const createKafkaInstance = async function (
  page: Page,
  name: string,
  check = true,
  billingOption = BillingOptions.PREPAID,
  provider = CloudProviders.AWS
) {
  await page.locator('button', { hasText: 'Create Kafka instance' }).click();
  await expect(page.getByText('Create a Kafka instance')).toHaveCount(1);
  await page.waitForSelector('[role=progressbar]', { state: 'detached' });

  // FIXME: workaround for https://github.com/redhat-developer/app-services-ui-components/issues/590
  // https://github.com/microsoft/playwright/issues/15734#issuecomment-1188245775
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check whether we run out of quota
  const outOfQuota: boolean = await page.getByText(
    'All regions in the selected cloud provider are temporarily unavailable. Select a'
  ).isVisible();
  console.log('outOfQuota: ' + outOfQuota);
  if (outOfQuota) {
    console.log('OUT OF QUOTA: All regions in the selected cloud provider are temporarily unavailable. => SKIP TEST');
    test.skip();
  }
  await page.getByLabel('Name *').click();

  await page.getByLabel('Name *').fill(name);

  // Choose Cloud provider if different from AWS
  try {
    await page.locator('div:text-is("' + provider + '")').click({ timeout: 1000 });
  } catch (err) {
    // Billing option is not available so do nothing
  }

  // Set billing options
  try {
    await page.locator('div:text-is("' + billingOption + '")').click({ timeout: 1000 });
  } catch (err) {
    // Billing option is not available so do nothing
  }

  // data-testid=modalCreateKafka-buttonSubmit
  await page.locator('button', { hasText: 'Create instance' }).click();

  if (check) {
    // check for the instance to have been created
    const table = await page.locator('[data-ouia-component-id=table-kafka-instances]');
    await expect(table.getByText(name)).toBeTruthy();
  }
};

export const deleteKafkaInstance = async function (page: Page, name: string, awaitDeletion = true) {
  try {
    await showElementActions(page, name);
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
  } catch (err) {
    // Do Nothing as instance is not connected to this acocunt
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
  await showElementActions(page, name);

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
  // TODO - This is just a workaround - `save` button is disabled even if the prefix is written but not confirmed by another action
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

export const grantManageAccess = async function (page: Page, saId: string) {
  await page.getByTestId('actionManagePermissions').click();
  await page.getByRole('button', { name: 'Options menu' }).click();
  await page.getByRole('option').filter({ hasText: saId }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByTestId('permissions-dropdown-toggle').click();

  await page
    .getByRole('menuitem', {
      name: 'Manage access Provides access to add and remove permissions on this Kafka instance'
    })
    .click();

  await page.getByRole('button').filter({ hasText: 'Save' }).click();
};

export const findAccessRow = async function (page: Page, account: string, permission: string, resource: string) {
  return page
    .locator('tr')
    .filter({ has: page.getByText(account) })
    .filter({ has: page.getByText(permission) })
    .filter({ has: page.getByText(resource) });
};

export const revokeAccess = async function (
  page: Page,
  account: string,
  permission: string,
  resource: string,
  awaitDeletion: boolean
) {
  const row = await findAccessRow(page, account, permission, resource);
  if ((await row.count()) == 1) {
    // GetByRole sometimes works, sometimes it does not.
    // await row.getByRole('button', { name: 'Actions' }).click();
    await row.locator('button').click();
    await page.locator('button', { hasText: 'Delete' }).click();

    // await for the permission to be revoked
    if (awaitDeletion) {
      await expect(row).toHaveCount(0);
    }
  }
};

export const navigateToAccess = async function (page: Page, kafkaName: string) {
  await navigateToKafkaList(page);
  await expect(page.getByText(kafkaName)).toHaveCount(1);
  await page.getByText(kafkaName).click();
  await page.getByTestId('pageKafka-tabPermissions').click();
};

export const navigateToConsumerGroups = async function (page: Page) {
  await page.click('text=Consumer groups');
};

export const showElementActions = async function (page: Page, instanceName: string) {
  const instanceLinkSelector = page.getByText(instanceName);
  const row = page.locator('tr', { has: instanceLinkSelector });

  await row.locator('[aria-label="Actions"]').click();
};

export const showKafkaDetails = async function (page: Page, instanceName: string) {
  await showElementActions(page, instanceName);
  await page.locator('button', { hasText: 'Details' }).click();
};
