import { expect, Locator, Page } from '@playwright/test';
import { KafkaInstancePage } from '@lib/pom/streams/kafkaInstance';

export class ConsumerGroupsPage extends KafkaInstancePage {
  readonly consumerGroupsMenuButton: Locator;
  readonly consumerGroupIdButton: Locator;
  readonly consumerGroupHeading: Locator;

  constructor(page: Page, instanceName: string) {
    super(page, instanceName);
    this.consumerGroupsMenuButton = page.locator('button', { hasText: 'Consumer groups' });
    this.consumerGroupIdButton = page.locator('button', { hasText: 'Consumer group ID' });
    this.consumerGroupHeading = page.locator('h2', { hasText: 'No consumer groups' });
  }

  async gotoThroughMenu() {
    await expect(this.consumerGroupsMenuButton).toHaveCount(1);
    await this.consumerGroupsMenuButton.click();
    try {
      await expect(this.consumerGroupHeading).toHaveCount(1, { timeout: 5000 });
    } catch {
      await expect(this.consumerGroupIdButton).toHaveCount(1, { timeout: 5000 });
    }
  }
}
