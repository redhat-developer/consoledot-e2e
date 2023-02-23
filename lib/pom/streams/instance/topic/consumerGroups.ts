import { expect, Locator, Page } from '@playwright/test';
import { TopicPage } from '@lib/pom/streams/instance/topics';

export class ConsumerGroupsPage extends TopicPage {
  readonly topicName: string;
  readonly consumerGroupsMenuButton: Locator;

  constructor(page: Page, instanceName: string, topicName: string) {
    super(page, instanceName);
    this.topicName = topicName;
    this.consumerGroupsMenuButton = page.locator('button', { hasText: 'Consumer groups' });
  }

  async goto() {
    await expect(this.consumerGroupsMenuButton).toHaveCount(1);
    await this.consumerGroupsMenuButton.click();
  }
}
