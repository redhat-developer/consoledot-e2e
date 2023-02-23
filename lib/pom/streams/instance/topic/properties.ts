import { expect, Locator, Page } from '@playwright/test';
import { TopicPage } from '@lib/pom/streams/instance/topics';

export class PropertiesPage extends TopicPage {
  readonly topicName: string;
  readonly propertiesMenuButton: Locator;
  readonly editPropertiesButton: Locator;

  constructor(page: Page, instanceName: string, topicName: string) {
    super(page, instanceName);
    this.topicName = topicName;
    this.propertiesMenuButton = page.locator('button', { hasText: 'Properties' });
    this.editPropertiesButton = page.locator('button', { hasText: 'Edit properties' });
  }

  async goto() {
    await expect(this.propertiesMenuButton).toHaveCount(1);
    await this.propertiesMenuButton.click();
    await expect(this.editPropertiesButton).toHaveCount(1);
  }
}
