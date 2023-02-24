import { expect, Locator, Page } from '@playwright/test';
import { config } from '@lib/config';
import { TopicsPage } from '@lib/pom/streams/instance/topics';

export class TopicPage extends TopicsPage {
  readonly topicName: string;
  readonly topicLink: Locator;

  constructor(page: Page, instanceName: string, topicName: string) {
    super(page, instanceName);
    this.urlPath = this.urlPath + '/' + instanceName + '/topics';
    this.topicName = topicName;
    this.topicLink = page.locator('a', { hasText: this.topicName });
  }

  async goto() {
    await this.page.goto(config.startingPage + this.urlPath);
    // TODO some expect??? a doladit
  }

  async gotoThroughMenu() {
    await expect(this.page.getByText(this.topicName)).toHaveCount(1);
    await this.topicLink.click();
  }
}
