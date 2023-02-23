import { expect, Locator, Page } from '@playwright/test';
import { TopicPage } from '../topics';

export class MessagesPage extends TopicPage {
  readonly topicName: string;
  readonly messageMenuButton: Locator;
  readonly messageTable: Locator;
  readonly checkForNewDataButton: Locator;

  constructor(page: Page, instanceName: string, topicName: string) {
    super(page, instanceName);
    this.topicName = topicName;
    this.messageMenuButton = page.locator('button', { hasText: 'Messages' });
    this.messageTable = page.locator('table[aria-label="Messages table"]');
    this.checkForNewDataButton = page.locator('button', { hasText: 'Check for new data' });
  }

  async goto() {
    await expect(this.messageMenuButton).toHaveCount(1);
    await this.messageMenuButton.click();
    try {
      await expect(this.checkForNewDataButton).toHaveCount(1);
    } catch (e) {
      await expect(this.messageTable).toHaveCount(1);
    }
  }

  async refreshMessages() {
    try {
      await expect(this.messageTable).toHaveCount(1);
    } catch (e) {
      await this.checkForNewDataButton.click({ timeout: 5000 });
      await this.refreshMessages();
    }
  }
}
