import { expect, Locator, Page } from '@playwright/test';
import { TopicsPage } from '@lib/pom/streams/instance/topics';

export class PropertiesPage extends TopicsPage {
  readonly topicName: string;
  readonly propertiesMenuButton: Locator;
  readonly editPropertiesButton: Locator;

  constructor(page: Page, instanceName: string, topicName: string) {
    super(page, instanceName);
    this.topicName = topicName;
    this.propertiesMenuButton = page.locator('button', { hasText: 'Properties' });
    this.editPropertiesButton = page.locator('button', { hasText: 'Edit properties' });
  }

  async gotoThroughMenu() {
    await expect(this.propertiesMenuButton).toHaveCount(1);
    await this.propertiesMenuButton.click();
    await expect(this.editPropertiesButton).toHaveCount(1);
  }
}
