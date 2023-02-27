import { expect, Locator, Page } from '@playwright/test';
import { config } from '@lib/config';
import { KafkaInstancePage } from '@lib/pom/streams/kafkaInstance';

export class ConsumerGroupsPage extends KafkaInstancePage {
  readonly consumerGroupsMenuButton: Locator;

  constructor(page: Page, instanceName: string) {
    super(page, instanceName);
    this.urlPath = this.urlPath + '/' + instanceName + '/consumer-groups';
    this.consumerGroupsMenuButton = page.locator('button[aria-label="Consumer groups"]');
  }

  // Got to starting page
  async goto() {
    await this.page.goto(config.startingPage + this.urlPath);
    await expect(this.kafkaInstanceHeading).toHaveCount(1);
  }

  async gotoThroughMenu() {
    await expect(this.consumerGroupsMenuButton).toHaveCount(1);
    await this.consumerGroupsMenuButton.click();
    await expect(this.kafkaInstanceHeading).toHaveCount(1);
  }
}
