import { expect, Locator, Page } from '@playwright/test';
import { KafkaInstancePage } from '@lib/pom/streams/kafkaInstance';

export class ConsumerGroupsPage extends KafkaInstancePage {
  readonly consumerGroupIdButton: Locator;
  readonly consumerGroupHeading: Locator;

  constructor(page: Page, instanceName: string) {
    super(page, instanceName);
    this.consumerGroupIdButton = page.locator('button', { hasText: 'Consumer group ID' });
    this.consumerGroupHeading = page.locator('h1', { hasText: 'No consumer groups' });
  }

  async gotoThroughMenu() {
    await expect(this.kafkaTabNavConsumerGroups).toHaveCount(1);
    await this.kafkaTabNavConsumerGroups.click();
  }

  async waitForEmptyConsumerGroupsTable() {
    await expect(this.consumerGroupHeading).toHaveCount(1);
  }

  async waitForFilledConsumerGroupsTable() {
    await expect(this.consumerGroupIdButton).toHaveCount(1);
  }
}
