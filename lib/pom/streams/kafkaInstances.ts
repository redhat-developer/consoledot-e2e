import { expect, Locator, Page } from '@playwright/test';
import { config } from '@lib/config';
import { BillingOptions } from '@lib/enums/billing';
import { CloudProviders } from '@lib/enums/cloudproviders';
import { resourceStore } from '@lib/resource_store';
import { closePopUp } from '@lib/utils/popup';
import { AbstractPage } from '../AbstractPage';

export class KafkaInstancesPage extends AbstractPage {
  urlPath: string = '/application-services/streams/kafkas';
  readonly productName: string = 'Streams or Apache Kafka';
  readonly productList: string = 'Kafka Instances';
  readonly createKafkaInstanceButton: Locator;
  readonly createKafkaInstanceHeading: Locator;
  readonly kafkaInstanceTable: Locator;
  readonly deleteInstanceButton: Locator;
  readonly connectionButton: Locator;
  readonly bootstrapField: Locator;
  readonly closeDrawerButton: Locator;

  constructor(page: Page) {
    super(page)
    this.createKafkaInstanceButton = page.locator('button', { hasText: 'Create Kafka instance' });
    this.createKafkaInstanceHeading = page.getByText('Create a Kafka instance');
    this.kafkaInstanceTable = page.locator('[data-ouia-component-id=table-kafka-instances]');
    this.deleteInstanceButton = page.locator('button', { hasText: 'Delete instance' });
    this.connectionButton = page.locator('button', { hasText: 'Connection' });
    this.bootstrapField = page.locator('[aria-label="Bootstrap server"]');
    this.closeDrawerButton = page.locator('[aria-label="Close drawer panel"]');
  }

  async goto() {
    await this.page.goto(config.startingPage + this.urlPath);
    // Button for creating Kafka Instance is visible
    await expect(this.createKafkaInstanceButton).toHaveCount(1);
  }

  async gotoThroughMenu() {
    // Navigates to list of Service Registry instances
    await this.navigateToProductList(this.productName, this.productList);
  }

  async createKafkaInstance(
    name: string,
    check = true,
    billingOption = BillingOptions.PREPAID,
    provider = CloudProviders.AWS
  ) {
    await this.createKafkaInstanceButton.click();
    await expect(this.createKafkaInstanceHeading).toHaveCount(1);
    await this.page.waitForSelector(this.progressBarLocatorString, { state: 'detached' });

    resourceStore.addKafka(name);

    // FIXME: workaround for https://github.com/redhat-developer/app-services-ui-components/issues/590
    // https://github.com/microsoft/playwright/issues/15734#issuecomment-1188245775
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.nameForm.click();

    await this.nameForm.fill(name);

    // Choose Cloud provider if different from AWS
    try {
      await this.page.locator('div:text-is("' + provider + '")').click({ timeout: 1000 });
    } catch (err) {
      // Billing option is not available so do nothing
    }

    // Set billing options
    try {
      await this.page.locator('div:text-is("' + billingOption + '")').click({ timeout: 1000 });
    } catch (err) {
      // Billing option is not available so do nothing
    }

    // data-testid=modalCreateKafka-buttonSubmit
    await this.createKafkaInstanceButton.click();

    if (check) {
      // check for the instance to have been created
      const table = await this.kafkaInstanceTable;
      expect(table.getByText(name)).toBeTruthy();
    }
  }

  async deleteKafkaInstance(name: string, awaitDeletion = true) {
    try {
      await this.showElementActions(name);
      await this.deleteInstanceButton.click();
      try {
        await expect(this.deleteNameInput).toHaveCount(1, { timeout: 5000 });

        // FIXME: workaround for https://github.com/redhat-developer/app-services-ui-components/issues/590
        // https://github.com/microsoft/playwright/issues/15734#issuecomment-1188245775
        await new Promise((resolve) => setTimeout(resolve, 500));
        await this.deleteNameInput.click();

        await this.deleteNameInput.fill(name);
      } catch (err) {
        // Removal without confirmation
        // ignore
      }
      // data-testid=modalDeleteKafka-buttonDelete
      await this.deleteButton.click();
      // await for the instance to be deleted
      if (awaitDeletion) {
        await expect(this.page.getByText(`${name}`, { exact: true })).toHaveCount(0, {
          timeout: config.kafkaInstanceDeletionTimeout
        });
      }
      resourceStore.removeKafka(name);
    } catch (err) {
      // Do Nothing as instance is not connected to this acocunt
    }
  };

  async waitForKafkaReady(name: string) {
    // no loading in progress
    await this.page.waitForSelector(this.progressBarLocatorString, {
      state: 'detached',
      timeout: config.kafkaInstanceCreationTimeout
    });

    const instanceLinkSelector = this.page.getByText(name);
    const row = this.page.locator('tr', { has: instanceLinkSelector });
    await expect(row.getByText('Ready', { exact: true })).toHaveCount(1, {
      timeout: config.kafkaInstanceCreationTimeout
    });
  };

  async getBootstrapUrl(name: string) {
    await this.gotoThroughMenu()
    await this.showElementActions(name);

    await this.connectionButton.click();

    await expect(this.bootstrapField).toHaveCount(1);
    const bootstrap = await this.bootstrapField.inputValue();
    await this.closeDrawerButton.click();

    return bootstrap;
  };

  // TODO - we shouldn't use just prefix for topic/group but also complete name
  // TODO - we should click on topic name/prefix when it popups when filling the prefix/name
  grantProducerAccess = async function (page: Page, saId: string, topicName: string) {
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
  grantConsumerAccess = async function (page: Page, saId: string, topicName: string, consumerGroup: string) {
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

  grantManageAccess = async function (page: Page, saId: string) {
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

  findAccessRow = async function (page: Page, account: string, permission: string, resource: string) {
    return page
      .locator('tr')
      .filter({ has: page.getByText(account) })
      .filter({ has: page.getByText(permission) })
      .filter({ has: page.getByText(resource) });
  };

  revokeAccess = async function (
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

  navigateToAccess = async function (page: Page, kafkaName: string) {
    await navigateToKafkaList(page);
    // Close pop-up notifications if present
    await closePopUp(page);
    await expect(page.getByText(kafkaName)).toHaveCount(1);
    await page.getByText(kafkaName).click();
    await page.getByTestId('pageKafka-tabPermissions').click();
  };

  navigateToConsumerGroups = async function (page: Page) {
    await page.click('text=Consumer groups');
  };

  showKafkaDetails = async function (page: Page, instanceName: string) {
    await this.showElementActions(instanceName);
    await this.details.click();
  };

  deleteAllKafkas = async function (page: Page) {
    const kafkaList = resourceStore.getKafkaList;
    await navigateToKafkaList(page);
    for (const kafkaName of kafkaList) {
      try {
        await deleteKafkaInstance(page, kafkaName);
      } catch (error) {
        //Ignore exception
      }
    }
    resourceStore.clearKafkaList();
  };
}
