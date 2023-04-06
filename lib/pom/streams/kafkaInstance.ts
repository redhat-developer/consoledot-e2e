import { expect, Locator, Page } from '@playwright/test';
import { KafkaInstanceListPage } from '@lib/pom/streams/kafkaInstanceList';
import { AbstractPage } from '@lib/pom/abstractPage';
import { sleep } from '@lib/utils/sleep';
import { retry } from '@lib/utils/common';

export class KafkaInstancePage extends KafkaInstanceListPage {
  readonly instanceName: string;
  readonly connectionButton: Locator;
  readonly detailsButton: Locator;
  readonly actionsDeleteButton: Locator;
  readonly instanceLink: Locator;
  readonly kafkaInstanceHeading: Locator;
  readonly kafkaTabNavDashboard: Locator;
  readonly kafkaTabNavTopics: Locator;
  readonly kafkaTabNavConsumerGroups: Locator;
  readonly kafkaTabNavAccess: Locator;
  readonly kafkaTabNavSettings: Locator;
  readonly nearTopicPartitionsLimit: Locator;
  readonly reachedTopicPartitionsLimit: Locator;
  readonly maxTopicPartitions: Locator;
  maxTopicPartitionsNumber: number;

  constructor(page: Page, instanceName: string) {
    super(page);
    this.instanceName = instanceName;
    this.connectionButton = page.locator('a', { hasText: 'Connection' });
    this.detailsButton = page.locator('a', { hasText: 'Details' });
    this.actionsDeleteButton = page.locator('a', { hasText: 'Delete' });
    this.instanceLink = page.locator('a', { hasText: this.instanceName });
    this.kafkaInstanceHeading = page.locator('h1', { hasText: this.instanceName });

    this.kafkaTabNavDashboard = page.locator('li[data-ouia-component-id="tab-Dashboard"]');
    this.kafkaTabNavTopics = page.locator('li[data-ouia-component-id="tab-Topics"]');
    this.kafkaTabNavConsumerGroups = page.locator('li[data-ouia-component-id="tab-Consumers"]');
    this.kafkaTabNavAccess = page.locator('li[data-ouia-component-id="tab-Permissions"]');
    this.kafkaTabNavSettings = page.locator('li[data-ouia-component-id="tab-Settings"]');

    // Dashboard
    this.maxTopicPartitions = page.getByText(/^Limit \d+ partitions$/);
    this.nearTopicPartitionsLimit = this.warningAlert.getByText(
      'This Kafka instance is close to reaching the partition limit'
    );
    this.reachedTopicPartitionsLimit = this.dangerAlert.getByText('This Kafka instance reached the partition limit');
  }

  async gotoThroughMenu() {
    await expect(this.page.getByText(this.instanceName)).toHaveCount(1);
    await this.instanceLink.click();
  }

  async showInstanceActions() {
    await this.page.locator(AbstractPage.actionsLocatorString).click();
  }

  async showConnection() {
    await this.showInstanceActions();
    await this.connectionButton.click();
  }

  async showDetails() {
    await this.showInstanceActions();
    await this.detailsButton.click();
  }

  async setPartitionLimit() {
    const text = await this.maxTopicPartitions.innerText();
    this.maxTopicPartitionsNumber = parseInt(text.match(/\d+/gm)[0]);
  }

  async deleteInstance(name: string) {
    await this.showInstanceActions();
    await this.actionsDeleteButton.click();

    // Duplicity from parent class, how to solve that because previous part is different
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
  }

  async closeModalWithInfo() {
    await this.closeDrawerButton.click();
  }

  async waitForLoaded() {
    await expect(this.kafkaInstanceHeading).toHaveCount(1);
    await this.page.waitForSelector(AbstractPage.progressBarLocatorString, {
      state: 'detached'
    });
  }

  async dashboardTopicCountRefreshed(expectedTopics: number, retries: number, retryInterval: number) {
    await retry(
      async () => {
        await this.kafkaTabNavTopics.click();
        await this.kafkaTabNavDashboard.click();
        await this.waitForLoaded();
        await expect(this.page.locator(`[aria-valuetext="${expectedTopics} Topics"]`)).toBeVisible({ timeout: 500 });
      },
      retries,
      retryInterval
    );
  }
}
