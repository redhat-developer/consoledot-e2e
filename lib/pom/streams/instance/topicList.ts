import { expect, Locator, Page } from '@playwright/test';
import { KafkaInstancePage } from '@lib/pom/streams/kafkaInstance';
import { resourceStore } from '@lib/resource_store';

export class TopicListPage extends KafkaInstancePage {
  readonly createTopicButton: Locator;
  readonly createTopicHeading: Locator;
  readonly deleteTopicButton: Locator;
  readonly topicNameField: Locator;
  readonly numPartitionsButton: Locator;
  readonly numPartitionsInput: Locator;
  readonly retentionMsField: Locator;
  readonly daysButton: Locator;
  readonly hoursButton: Locator;
  readonly compactButton: Locator;
  readonly bytesButton: Locator;
  readonly kibibytesButton: Locator;
  readonly retentionBytesField: Locator;
  readonly bytesRadioButton: Locator;
  readonly showAllOptions: Locator;
  readonly retentionOptionField: Locator;

  constructor(page: Page, instanceName: string) {
    super(page, instanceName);
    this.createTopicButton = page.locator('button', { hasText: 'Create topic' });
    this.deleteTopicButton = page.locator('button', { hasText: 'Delete topic' });
    this.createTopicHeading = page.locator('h2', { hasText: 'Topic name' });
    this.topicNameField = page.getByPlaceholder('Enter topic name');
    this.numPartitionsButton = page.locator('button[name="num-partitions"]');
    this.numPartitionsInput = page.locator('input[name="num-partitions"]');
    this.retentionMsField = page.locator('input[aria-label="Retention time"]');
    this.retentionBytesField = page.locator('input[aria-label="Retention size"]');
    this.daysButton = page.locator('button', { hasText: 'days' });
    this.hoursButton = page.locator('button', { hasText: 'hours' });
    this.compactButton = page.locator('a', { hasText: 'Compact' });
    this.bytesButton = page.locator('button', { hasText: 'bytes' });
    this.kibibytesButton = page.locator('button', { hasText: 'kibibytes' });
    this.bytesRadioButton = page.locator('input[name="custom-retention-size"]');
    this.showAllOptions = page.locator('label:has-text("Show all available optionsShow all available options") span');
    this.retentionOptionField = page.locator('label:has-text("days") input[type="number"]');
  }

  async gotoThroughMenu() {
    await expect(this.kafkaTabNavTopics).toHaveCount(1);
    // data-testid=pageKafka-tabTopics
    await this.kafkaTabNavTopics.click();
    await expect(this.createTopicButton).toHaveCount(1);
    await expect(this.loadingContent.first()).toBeHidden();
  }

  async createKafkaTopic(name: string, defaultProperties: boolean, partition?: number) {
    await this.createTopicButton.click();
    await expect(this.createTopicHeading).toHaveCount(1);
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
      if (partition) {
        await this.numPartitionsInput.fill(String(partition));
        await expect(this.numPartitionsInput).toHaveValue(String(partition), { timeout: 3000 });
      } else {
        // Increasing twice and decreasing once the num of partitions to test + & -
        for (let i = 0; i < 2; i++) {
          await this.numPartitionsButton.nth(1).click();
        }
        await this.numPartitionsButton.nth(0).click();
      }

      await expect(this.retentionOptionField).toHaveCount(1);
      await this.daysButton.click();
      await this.hoursButton.click();
      await this.retentionMsField.click();
      await this.retentionMsField.fill('666');

      await this.bytesRadioButton.check();
      await this.bytesButton.click();
      await this.kibibytesButton.click();
      await this.retentionBytesField.click();
      await this.retentionBytesField.fill('666');

      // Choosing different CleanUp policy
      await this.deleteButton.click();
      await this.compactButton.first().click();
      // await this.compactButton.click();

      await this.createTopicButton.click();
    }
    await expect(this.page.getByText(name)).toHaveCount(1);
    resourceStore.addKafkaTopic(name);
  }

  async deleteKafkaTopic(name: string) {
    await this.showElementActions(name);
    // data-testid=tableTopics-actionDelete
    await this.deleteTopicButton.click();
    await this.deleteNameInput.click();
    await this.deleteNameInput.fill(name);
    // data-testid=modalDeleteTopic-buttonDelete
    await this.deleteButton.click();
    await expect(this.page.getByText(name)).toHaveCount(0);

    resourceStore.removeKafkaTopic(name);
  }

  async deleteAllKafkaTopics() {
    const kafkaTopicList = resourceStore.getKafkaTopicList;
    await this.gotoThroughMenu();
    for (const topicName of kafkaTopicList) {
      try {
        await this.deleteKafkaTopic(topicName);
      } catch (error) {
        //Ignore exception
      }
    }
    resourceStore.clearKafkaTopicList();
  }
}
