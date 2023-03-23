import { expect, Locator, Page } from '@playwright/test';
import { config } from '@lib/config';
import { CloudProviders } from '@lib/enums/cloudproviders';
import { resourceStore } from '@lib/resource_store';
import { AbstractPage } from '@lib/pom/abstractPage';
import { sleep } from '@lib/utils/sleep';

export class KafkaInstanceListPage extends AbstractPage {
  urlPath = '/application-services/streams/kafkas';
  readonly productName: string = 'Streams for Apache Kafka';
  readonly productList: string = 'Kafka Instances';
  readonly createKafkaInstanceButton: Locator;
  readonly createKafkaInstanceFormButton: Locator;
  readonly createKafkaInstanceHeading: Locator;
  readonly kafkaInstanceTable: Locator;
  readonly deleteInstanceButton: Locator;
  readonly connectionButton: Locator;
  readonly bootstrapField: Locator;
  readonly closeDrawerButton: Locator;
  readonly noKafkaInstancesText: Locator;

  constructor(page: Page) {
    super(page);
    this.createKafkaInstanceButton = page.locator('button', { hasText: 'Create Kafka instance' });
    this.createKafkaInstanceFormButton = page.locator('button', { hasText: 'Create instance' });
    this.createKafkaInstanceHeading = page.getByText('Create a Kafka instance');
    this.kafkaInstanceTable = page.locator('[data-ouia-component-id=table-kafka-instances]');
    this.deleteInstanceButton = page.locator('button', { hasText: 'Delete instance' });
    this.connectionButton = page.locator('button', { hasText: 'Connection' });
    this.bootstrapField = page.locator('[aria-label="Bootstrap server"]');
    this.closeDrawerButton = page.locator('[aria-label="Close drawer panel"]');
    this.noKafkaInstancesText = page.getByText('No Kafka instances');
  }

  async gotoUrl() {
    await this.page.goto(config.startingPage + this.urlPath);
    // Button for creating Kafka Instance is visible
    await expect(this.createKafkaInstanceButton).toHaveCount(1);
  }

  async gotoThroughMenu() {
    // Navigates to list of Kafka instances
    await this.navigateToProductList(this.productName, this.productList);
    await expect(this.createKafkaInstanceButton).toHaveCount(1);
  }

  async createKafkaInstance(name: string, check = true, provider = CloudProviders.AWS) {
    await this.createKafkaInstanceButton.click();
    await expect(this.createKafkaInstanceHeading).toHaveCount(1);
    await this.page.waitForSelector(AbstractPage.progressBarLocatorString, { state: 'detached' });

    resourceStore.addKafka(name);

    // FIXME: workaround for https://github.com/redhat-developer/app-services-ui-components/issues/590
    // https://github.com/microsoft/playwright/issues/15734#issuecomment-1188245775
    await sleep(500);
    await this.nameForm.click();

    await this.nameForm.fill(name);

    // Choose Cloud provider if different from AWS
    try {
      await this.page.locator('div:text-is("' + provider + '")').click({ timeout: 1000 });
    } catch (err) {
      // Billing option is not available so do nothing
    }

    // data-testid=modalCreateKafka-buttonSubmit
    await this.createKafkaInstanceFormButton.click();

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
        await sleep(500);
        await this.deleteNameInput.click();

        await this.deleteNameInput.fill(name);
      } catch (err) {
        // Removal without confirmation
        // ignore
      }
      // data-testid=modalDeleteKafka-buttonDelete
      await this.actionsDeleteButton.click();
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
  }

  async waitForKafkaReady(name: string) {
    // no loading in progress
    await this.page.waitForSelector(AbstractPage.progressBarLocatorString, {
      state: 'detached',
      timeout: config.kafkaInstanceCreationTimeout
    });

    const instanceLinkSelector = this.page.getByText(name);
    const row = this.page.locator('tr', { has: instanceLinkSelector });
    await expect(row.getByText('Ready', { exact: true })).toHaveCount(1, {
      timeout: config.kafkaInstanceCreationTimeout
    });
  }

  async getBootstrapUrl(name: string) {
    await this.gotoThroughMenu();
    await this.showElementActions(name);

    await this.connectionButton.click();

    await expect(this.bootstrapField).toHaveCount(1);
    const bootstrap = await this.bootstrapField.inputValue();
    await this.closeDrawerButton.click();

    return bootstrap;
  }

  async showKafkaDetails(instanceName: string) {
    await this.showElementActions(instanceName);
    await this.detailsButton.click();
  }

  async deleteAllKafkas() {
    const kafkaList = resourceStore.getKafkaList;
    await this.gotoThroughMenu();
    for (const kafkaName of kafkaList) {
      try {
        await this.deleteKafkaInstance(kafkaName);
      } catch (error) {
        //Ignore exception
      }
    }
    resourceStore.clearKafkaList();
  }
}
