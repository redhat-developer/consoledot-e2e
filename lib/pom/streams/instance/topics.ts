import { expect, Locator, Page } from '@playwright/test';
import { config } from '@lib/config';
import { KafkaInstancePage } from '@lib/pom/streams/kafkaInstance';

export class TopicPage extends KafkaInstancePage {
  readonly topicsMenuButton: Locator;
  readonly createTopicButton: Locator;
  readonly createTopicHeading: Locator;
  readonly topicNameField: Locator;
  readonly numPartitionsButton: Locator;
  readonly numPartitionsInput: Locator;
  readonly retentionMsButton: Locator;
  readonly daysButton: Locator;
  readonly hoursButton: Locator;
  readonly compactButton: Locator;
  readonly bytesButton: Locator;
  readonly kibibytesButton: Locator;
  readonly retentionBytesButton: Locator;
  readonly bytesRadioButton: Locator;
  readonly showAllOptions: Locator;
  readonly retentionOptionField: Locator;

  constructor(page: Page, instanceName: string) {
    super(page, instanceName);
    this.urlPath = this.urlPath + '/' + instanceName + '/topics';
    this.topicsMenuButton = page.locator('button[aria-label="Topics"]');
    this.createTopicButton = page.locator('button', { hasText: 'Create topic' });
    this.createTopicHeading = page.locator('h2', { hasText: 'Topic name' });
    this.topicNameField = page.getByPlaceholder('Enter topic name');
    this.numPartitionsButton = page.locator('button[name="num-partitions"]');
    this.numPartitionsInput = page.locator('input[name="num-partitions"]');
    this.retentionMsButton = page.locator('button[name="retention-ms"]');
    this.retentionBytesButton = page.locator('button[name="retention-bytes"]');
    this.daysButton = page.locator('button', { hasText: 'days' });
    this.hoursButton = page.locator('button', { hasText: 'hours' });
    this.compactButton = page.locator('button', { hasText: 'Compact' });
    this.bytesButton = page.locator('button', { hasText: 'bytes' });
    this.kibibytesButton = page.locator('button', { hasText: 'kibibytes' });
    this.bytesRadioButton = page.getByLabel('bytes');
    this.showAllOptions = page.locator('label:has-text("Show all available optionsShow all available options") span');
    this.retentionOptionField = page.locator('label:has-text("days") input[type="number"]');
  }

  // Got to starting page
  async goto() {
    await this.page.goto(config.startingPage + this.urlPath);
    // Expect see button to create topic
    await expect(this.createTopicButton).toHaveCount(1);
  }

  async gotoThroughMenu() {
    await expect(await this.topicsMenuButton).toHaveCount(1);
    // data-testid=pageKafka-tabTopics
    await this.topicsMenuButton.click();
  }

  async createKafkaTopic(name: string, defaultProperties: boolean) {
    await this.createTopicButton.click();
    await expect(this.createTopicHeading).toHaveCount(2);
    await this.topicNameField.fill(name);
    if (defaultProperties) {
      // This is default properties values Topic creation
      for (let i = 0; i < 3; i++) {
        await this.nextButton.click();
      }
      await this.finishButton.click();
    } else {
      // Use different values
      await this.showAllOptions.first().click();

      await expect(this.numPartitionsInput).toHaveValue('1', { timeout: 3000 });
      // Increasing twice and decreasing once the num of partitions to test + & -
      for (let i = 0; i < 2; i++) {
        await this.numPartitionsButton.nth(1).click();
      }
      await this.numPartitionsButton.nth(0).click();

      await expect(this.retentionOptionField).toHaveCount(1);
      // Increasing twice and decreasing once the units for Retention Time to test + & -
      for (let i = 0; i < 2; i++) {
        await this.retentionMsButton.nth(1).click();
      }
      await this.retentionMsButton.nth(0).click();
      await this.daysButton.click();
      await this.hoursButton.click();

      await this.bytesRadioButton.check();
      // Increasing twice and decreasing once the units for Retention Time to test + & -
      for (let i = 0; i < 2; i++) {
        await this.retentionBytesButton.nth(1).click();
      }
      await this.retentionBytesButton.nth(0).click();
      await this.bytesButton.click();
      await this.kibibytesButton.click();

      // Choosing different CleanUp policy
      await this.deleteButton.click();
      await this.compactButton.first().click();
      await this.compactButton.click();

      await this.createTopicButton.click();
    }
    await expect(this.page.getByText(name)).toHaveCount(1);
  }

  async deleteKafkaTopic(name: string) {
    await this.showElementActions(name);
    // data-testid=tableTopics-actionDelete
    await this.deleteButton.click();
    await this.confirmDeleteField.click();
    await this.confirmDeleteField.fill('DELETE');
    // data-testid=modalDeleteTopic-buttonDelete
    await this.deleteButton.click();
    await expect(this.page.getByText(name)).toHaveCount(0);
  }
}
