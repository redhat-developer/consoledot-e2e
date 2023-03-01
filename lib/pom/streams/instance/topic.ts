import { expect, Locator, Page } from '@playwright/test';
import { TopicListPage } from '@lib/pom/streams/instance/topicList';

export class TopicPage extends TopicListPage {
  readonly topicName: string;
  readonly topicLink: Locator;
  readonly topicHeading: Locator;

  constructor(page: Page, instanceName: string, topicName: string) {
    super(page, instanceName);
    this.topicName = topicName;
    this.topicLink = page.locator('a', { hasText: this.topicName });
    this.topicHeading = page.locator('h1', { hasText: this.topicName });
  }

  async gotoThroughMenu() {
    await expect(this.page.getByText(this.topicName)).toHaveCount(1);
    await this.topicLink.click();
    await expect(this.topicHeading).toHaveCount(1);
  }
}
