import { expect, Locator, Page } from '@playwright/test';
import { config } from '@lib/config';
import { KafkaInstancePage } from '@lib/pom/streams/kafkaInstance';

export class AccessPage extends KafkaInstancePage {

  constructor(page: Page, name: string) {
    super(page, name);
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
}
