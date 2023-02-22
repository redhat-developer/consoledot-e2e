import { expect, Locator, Page } from '@playwright/test';
import { config } from '@lib/config';
import { KafkaInstancePage } from '@lib/pom/streams/kafkaInstance';
import { TopicPage } from '../topics';

export class MessagesPage extends TopicPage {

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

  export const navigateToMessages = async function (page: Page, kafkaName: string, topicName: string) {
    await navigateToKafkaList(page);
    await navigateToKafkaTopicsList(page, kafkaName);
    await expect(await page.locator('a', { hasText: topicName })).toHaveCount(1);
    await page.locator('a', { hasText: topicName }).click();
    await expect(await page.locator('button', { hasText: 'Messages' })).toHaveCount(1);
    await page.locator('button', { hasText: 'Messages' }).click();
  };
   
  export const refreshMessages = async function (page: Page) {
    try {
      await expect(page.locator('table[aria-label="Messages table"]')).toHaveCount(1);
    } catch (e) {
      await page.locator('button', { hasText: 'Check for new data' }).click({ timeout: 5000 });
      await refreshMessages(page);
    }
  };
}
